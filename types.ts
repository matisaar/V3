
// FIX: Removed a self-referencing import that was causing declaration conflicts.
export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  type: 'Income' | 'Expense';
  bucketOfLife?: string;
}

export interface PeriodSummary {
  periodLabel: string;
  year: number;
  startDate: Date;
  income: number;
  expenses: number;
  incomeBreakdown: { [category:string]: number };
  expenseBreakdown: { [category:string]: number };
}

export interface ProcessedData {
  periodSummaries: PeriodSummary[];
  totalIncome: number;
  totalExpenses: number;
  incomeBreakdown: { [category: string]: number };
  expenseBreakdown: { [category: string]: number };
}

export interface Recommendation {
  title: string;
  shortDescription: string;
  actionableSteps: string[];
  savings: number;
  sourceTransactionDescription: string;
  category: string;
  type: 'recurring' | 'habit';
  potentialImpact: 'High' | 'Medium' | 'Low';
}

export interface RecurringExpense {
  name: string;
  representativeDescription: string;
  category: string;
  averageAmount: number;
  transactionCount: number;
}

export interface TransactionExplanation {
  title: string;
  explanation: string;
  categorySuggestion: string;
  confidence: 'High' | 'Medium' | 'Low';
  allOccurrences: Transaction[];
}

// FIX: Added BucketOfLife interface to be used in bucket setup modals and views.
export interface BucketOfLife {
    id: string;
    name: string;
    keywords: string[];
}
