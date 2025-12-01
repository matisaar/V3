import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ExpensesDetailView } from './components/ExpensesDetailView';
import { RecommendationsView } from './components/RecommendationsView';
import { categorizeTransactions, generateRecommendations, identifyRecurringTransactions, parseTransactions, explainTransaction, analyzeMinorRecurringTransactions } from './services/geminiService';
import { Transaction, PeriodSummary, ProcessedData, Recommendation, RecurringExpense, TransactionExplanation } from './types';
import { FileUp, Loader, AlertCircle } from 'lucide-react';
// FIX: Corrected typo in MOCK_RECOMMENDATIONS import.
import { MOCK_DATA, MOCK_TRANSACTIONS, MOCK_RECOMMENDATIONS, MOCK_RECURRING_EXPENSES } from './constants';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { RecurringExpenseDetailModal } from './components/RecurringExpenseDetailModal';
import { upsertTransactions } from './services/supabaseClient';
import { SupabaseAuth } from './components/SupabaseAuth';
import { getSupabaseClient } from './services/supabaseClient';
import SpeedInsightsWrapper from './components/SpeedInsightsWrapper';

type View = 'dashboard' | 'expenses' | 'recommendations';

const parseFileContent = async (text: string, fileName: string): Promise<Omit<Transaction, 'category'>[]> => {
    try {
        const parsed = await parseTransactions(text, fileName);
        return parsed;
    } catch(err) {
        console.error(`Failed to parse file ${fileName}:`, err);
        // Let the error propagate to be caught by the main handler
        throw err;
    }
};

const App: React.FC = () => {
  const [user, setUser] = useState<{ id: string | null; email?: string | null; firstName?: string | null } | null>(null);

  // Helper to clear all user-specific in-memory state when signing out
  const clearUserData = () => {
    setProcessedData(null);
    setAllTransactions([]);
    setRecurringExpenses(null);
    setMinorRecurringTransactions(null);
    setRecommendations(null);
    setTransactionExplanation(null);
    setIsExplanationModalOpen(false);
    setIsRecurringExpenseModalOpen(false);
    setError(null);
    setProgress(null);
    setIsLoading(false);
    setLoadingMessage('');
    setIsGeneratingRecs(false);
    setRecsError(null);
    setView('dashboard');
  };

  // Called from SupabaseAuth (and elsewhere) when the auth state changes.
  // If the user signs out or a different user signs in, clear app state and load persisted data for the new user.
  const handleAuthChange = async (u: { id: string | null; email?: string | null; firstName?: string | null }) => {
    const newUser = u && u.id ? u : null;
    // If signing out or switching accounts, clear previous user's data
    if (!newUser || (user && newUser && user.id !== newUser.id)) {
      clearUserData();
    }
    setUser(newUser);

    // If we have a signed-in user, try to fetch their persisted transactions
    if (newUser && newUser.id) {
      try {
        setIsLoading(true);
        setLoadingMessage('Loading saved transactions...');
        const persisted = await (await import('./services/supabaseClient')).fetchTransactionsByUser(newUser.id);
        if (persisted && persisted.length > 0) {
          // Ensure dates are proper Date objects
          const mapped = persisted.map((tx: any) => ({ ...tx, date: tx.date ? new Date(tx.date) : new Date() }));
          setAllTransactions(mapped);
          // processAndSetData will run via the allTransactions effect
        } else {
          // No persisted data for this user
          setAllTransactions([]);
          setProcessedData(null);
        }
      } catch (e) {
        console.warn('Failed to load persisted transactions for user:', e);
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  };

  const handleSignOut = async () => {
    console.log('Sign out button clicked');
    const supabase = getSupabaseClient();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Error signing out:', e);
    }
    // Ensure local state is cleared right away
    clearUserData();
    setUser(null);
  };
  const [processedData, setProcessedData] = useState<ProcessedData | null>(MOCK_DATA);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[] | null>(MOCK_RECURRING_EXPENSES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Analyzing Transactions...');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [progress, setProgress] = useState<{ value: number; total: number } | null>(null);

  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(MOCK_RECOMMENDATIONS);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState<boolean>(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState<boolean>(false);
  const [transactionExplanation, setTransactionExplanation] = useState<TransactionExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const [isRecurringExpenseModalOpen, setIsRecurringExpenseModalOpen] = useState<boolean>(false);
  const [selectedRecurringExpense, setSelectedRecurringExpense] = useState<RecurringExpense | null>(null);

  const [minorRecurringTransactions, setMinorRecurringTransactions] = useState<Transaction[] | null>(null);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  
  const processAndSetData = useCallback((transactions: Transaction[]) => {
    const getStartOfMonth = (d: Date): Date => {
        const date = new Date(d.getFullYear(), d.getMonth(), 1);
        date.setHours(0, 0, 0, 0);
        return date;
    };

    const getPeriodLabel = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    const periodData: { [key: string]: PeriodSummary } = {};
    
    transactions.forEach(t => {
      const startDate = getStartOfMonth(t.date);
      const key = startDate.toISOString().split('T')[0];
      
      if (!periodData[key]) {
        periodData[key] = {
          periodLabel: getPeriodLabel(startDate),
          year: startDate.getFullYear(),
          startDate: startDate,
          income: 0,
          expenses: 0,
          incomeBreakdown: {},
          expenseBreakdown: {},
        };
      }

      if (t.type === 'Income') {
        periodData[key].income += t.amount;
        periodData[key].incomeBreakdown[t.category] = (periodData[key].incomeBreakdown[t.category] || 0) + t.amount;
      } else {
        periodData[key].expenses += t.amount;
        periodData[key].expenseBreakdown[t.category] = (periodData[key].expenseBreakdown[t.category] || 0) + t.amount;
      }
    });

    const sortedPeriodSummaries = Object.values(periodData).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const totalIncome = sortedPeriodSummaries.reduce((acc, m) => acc + m.income, 0);
    const totalExpenses = sortedPeriodSummaries.reduce((acc, m) => acc + m.expenses, 0);

    const aggregatedIncomeBreakdown = sortedPeriodSummaries.reduce((acc, m) => {
        Object.entries(m.incomeBreakdown).forEach(([category, amount]) => {
            acc[category] = (acc[category] || 0) + amount;
        });
        return acc;
    }, {} as {[key: string]: number});

    const aggregatedExpenseBreakdown = sortedPeriodSummaries.reduce((acc, m) => {
        Object.entries(m.expenseBreakdown).forEach(([category, amount]) => {
            acc[category] = (acc[category] || 0) + amount;
        });
        return acc;
    }, {} as {[key: string]: number});
    
    const finalData = {
      periodSummaries: sortedPeriodSummaries,
      totalIncome,
      totalExpenses,
      incomeBreakdown: aggregatedIncomeBreakdown,
      expenseBreakdown: aggregatedExpenseBreakdown
    };
    setProcessedData(finalData);
    setRecommendations(null);
  }, []);

  useEffect(() => {
    if (allTransactions && allTransactions.length > 0) {
        processAndSetData(allTransactions);
    }
  }, [allTransactions, processAndSetData]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setLoadingMessage('Parsing transaction files...');
    setError(null);
    setProcessedData(null);
    setAllTransactions([]);
    setRecurringExpenses(null);
    setMinorRecurringTransactions(null);
    setProgress(null);

    try {
        const fileReadPromises = Array.from(files).map(file => 
            file.text().then(content => ({ content, name: file.name }))
        );
        const fileResults = await Promise.all(fileReadPromises);
        
        const parsingPromises = fileResults.map(fileResult => 
            parseFileContent(fileResult.content, fileResult.name)
        );
        
        const parsedTransactionArrays = await Promise.all(parsingPromises);
        const allParsedTransactions = parsedTransactionArrays.flat();

      if (allParsedTransactions.length === 0) {
        throw new Error('Could not parse any transactions from the file(s). Please check the file format, content, or your Gemini API Key.');
      }
      
      setLoadingMessage('Categorizing transactions...');
      setProgress({ value: 0, total: 1 });
      
      const onProgress = (completed: number, total: number) => {
          setProgress({ value: completed, total });
      };
      const categorized = await categorizeTransactions(allParsedTransactions, onProgress);
      setAllTransactions(categorized);
      
      // Try to persist transactions to Supabase (optional). This is best-effort and will not block the flow.
      (async () => {
        try {
          // Use logged-in user's id if available, otherwise 'anonymous'
          const uid = user?.id || 'anonymous';
          // Prefer firstName from auth metadata; fallback to email if firstName not available
          const displayName = user?.firstName || user?.email || null;
          await upsertTransactions(uid, categorized.map(t => ({ ...t, date: t.date.toISOString() })), displayName);
        } catch (e) {
          console.warn('Supabase upsert failed (non-fatal):', e);
        }
      })();

      setLoadingMessage('Identifying major recurring expenses...');
      setProgress(null);
      try {
        const { majorRecurringExpenses, minorRecurringTransactions } = await identifyRecurringTransactions(categorized);
        setRecurringExpenses(majorRecurringExpenses);
        if (minorRecurringTransactions.length > 0) {
          setMinorRecurringTransactions(minorRecurringTransactions);
        } else {
          setMinorRecurringTransactions(null);
        }
      } catch (recErr) {
        console.warn("Could not identify recurring expenses:", recErr);
        setRecurringExpenses([]); 
        setMinorRecurringTransactions(null);
      }
        
    } catch (err) {
      console.error("File processing failed:", err);
      let errorMessage = 'Failed to process files. Please ensure they are a compatible format and try again.';
      
      let errorContent = 'An unknown error occurred.';
      if (err instanceof Error) {
        errorContent = err.message;
      } else if (typeof err === 'string') {
        errorContent = err;
      } else if (err && typeof err === 'object') {
        // FIX: Safely access properties on an unknown error object to handle various error shapes from the API or file processing.
        const errorObject = err as Record<string, unknown>;
        if (typeof errorObject.message === 'string') {
          errorContent = errorObject.message;
        } else if (typeof errorObject.text === 'string') {
          errorContent = errorObject.text;
        } else if (typeof errorObject.name === 'string') {
          errorContent = errorObject.name;
        } else {
          try {
            errorContent = JSON.stringify(err);
          } catch {
            // Fallback is already set
          }
        }
      }

      const lowerCaseMessage = errorContent.toLowerCase();
      if (lowerCaseMessage.includes('api key') || lowerCaseMessage.includes('api_key')) {
          errorMessage = 'Could not process files. Please check if your Gemini API Key is configured correctly.';
      } else if (lowerCaseMessage.includes('xhr error') || lowerCaseMessage.includes('network')) {
          errorMessage = 'A network error occurred while processing files. Please check your internet connection and try again.';
      } else if (lowerCaseMessage.includes('parse') || lowerCaseMessage.includes('format')) {
          errorMessage = errorContent; // Use the specific error from the parser
      }
      
      setError(errorMessage);
      setProcessedData(MOCK_DATA); // Revert to mock data on error
      setAllTransactions(MOCK_TRANSACTIONS);
      setRecurringExpenses(MOCK_RECURRING_EXPENSES);
      setMinorRecurringTransactions(null);
    } finally {
      setIsLoading(false);
      setProgress(null);
      event.target.value = '';
    }
  };

  const handleInvestigateMinorExpenses = async () => {
    if (!minorRecurringTransactions) return;
    setIsInvestigating(true);
    try {
      const minorExpenses = await analyzeMinorRecurringTransactions(minorRecurringTransactions);
      setRecurringExpenses(prev => [...(prev || []), ...minorExpenses].sort((a,b) => b.averageAmount - a.averageAmount));
      setMinorRecurringTransactions(null);
    } catch (err) {
      console.error("Could not analyze minor recurring expenses:", err);
      setError("Failed to analyze smaller recurring expenses. Please try again later.");
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleTransactionUpdate = (transactionId: string, updates: { category?: string }) => {
    const updatedTransactions = allTransactions.map(t => {
      if (t.id === transactionId) {
        return { ...t, ...updates };
      }
      return t;
    });
    setAllTransactions(updatedTransactions);
    // Data will be re-processed by useEffect
  };

  const handleGenerateRecommendations = async () => {
    if (!processedData || !allTransactions) return;
    setIsGeneratingRecs(true);
    setRecsError(null);
    try {
      const recs = await generateRecommendations(processedData, allTransactions);
      setRecommendations(recs);
    } catch(err) {
      console.error(err);
      setRecsError('Could not generate recommendations. The API may be unavailable or the API key is invalid.');
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  const handleExplainTransaction = async (transactionId: string) => {
    const transaction = allTransactions.find(t => t.id === transactionId);
    if (!transaction) return;

    setIsExplanationModalOpen(true);
    setIsExplaining(true);
    setExplanationError(null);
    setTransactionExplanation(null);

    try {
        const explanation = await explainTransaction(transaction, allTransactions);
        setTransactionExplanation(explanation);
    } catch (err) {
        console.error("Failed to explain transaction:", err);
        setExplanationError("Sorry, we couldn't get more details about this transaction. Please try again later.");
    } finally {
        setIsExplaining(false);
    }
  };

  const handleCloseExplanationModal = () => {
      setIsExplanationModalOpen(false);
  };

  const handleRecurringExpenseClick = (expense: RecurringExpense) => {
    setSelectedRecurringExpense(expense);
    setIsRecurringExpenseModalOpen(true);
  };

  const handleCloseRecurringExpenseModal = () => {
    setIsRecurringExpenseModalOpen(false);
    setTimeout(() => setSelectedRecurringExpense(null), 300);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
  {!user?.id && <SupabaseAuth onAuth={handleAuthChange} />}
  <Header onFileChange={handleFileChange} isLoading={isLoading} user={user} onSignOut={handleSignOut} />

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative my-4 flex items-center" role="alert">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        
        <div className="mt-6 mb-2 flex items-center justify-between flex-wrap gap-y-4">
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg self-start w-auto overflow-x-auto">
                <button
                    onClick={() => setView('dashboard')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 flex-shrink-0 ${
                        view === 'dashboard' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    Dashboard
                </button>
                <button
                    onClick={() => setView('expenses')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 flex-shrink-0 ${
                        view === 'expenses' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    Expenses
                </button>
                <button
                    onClick={() => setView('recommendations')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 flex-shrink-0 ${
                        view === 'recommendations' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    Recommendations
                </button>
            </div>
        </div>


        {!processedData && !isLoading && (
          <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mt-4">
            <FileUp className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600">Upload Your Transaction Files</h2>
            <p className="text-gray-500 mt-2">Start by uploading one or more CSV files to see your financial dashboard.</p>
            <p className="text-sm text-gray-400 mt-1">Upload your bank statement files (.csv).</p>
          </div>
        )}

        {isLoading && (
             <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)] mt-4">
                <Loader className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                <h2 className="text-2xl font-semibold text-gray-600">{loadingMessage}</h2>
                <p className="text-gray-500 mt-2">Our AI is working on your data. This may take a moment.</p>
                {progress && progress.total > 1 && (
                    <div className="w-full max-w-md mt-4">
                         <div className="bg-gray-200 rounded-full h-2.5">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                                style={{ width: `${(progress.value / progress.total) * 100}%` }}>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 font-medium">{progress.value} of {progress.total} chunks processed</p>
                    </div>
                )}
             </div>
        )}
        
        <main className="mt-6">
          {view === 'dashboard' && processedData && (
            <Dashboard
              processedData={processedData}
              recurringExpenses={recurringExpenses}
              onRecurringExpenseClick={handleRecurringExpenseClick}
              onInvestigateMinorExpenses={handleInvestigateMinorExpenses}
              isInvestigatingMinorExpenses={isInvestigating}
              minorRecurringTransactions={minorRecurringTransactions}
            />
          )}

          {view === 'expenses' && (
            <ExpensesDetailView
              transactions={allTransactions}
              onUpdateTransaction={handleTransactionUpdate}
              onExplainTransaction={handleExplainTransaction}
            />
          )}
          
          {view === 'recommendations' && (
            <RecommendationsView 
              processedData={processedData}
              onGenerate={handleGenerateRecommendations}
              recommendations={recommendations}
              isLoading={isGeneratingRecs}
              error={recsError}
              hasData={allTransactions.length > 0 && allTransactions !== MOCK_TRANSACTIONS}
              allTransactions={allTransactions}
            />
          )}
        </main>

        <TransactionDetailModal
            isOpen={isExplanationModalOpen}
            onClose={handleCloseExplanationModal}
            isLoading={isExplaining}
            error={explanationError}
            explanationResult={transactionExplanation}
        />

        <RecurringExpenseDetailModal
            isOpen={isRecurringExpenseModalOpen}
            onClose={handleCloseRecurringExpenseModal}
            expense={selectedRecurringExpense}
            allTransactions={allTransactions}
        />
        <div className="speedinsights-root" style={{ minHeight: 60 }}>
          <SpeedInsightsWrapper />
        </div>
      </div>
    </div>
  );
};

export default App;
