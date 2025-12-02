// FIX: Create services/geminiService.ts to implement AI functionalities and resolve module not found errors.
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, ProcessedData, Recommendation, RecurringExpense, TransactionExplanation } from '../types';
import { getGeminiAI } from './geminiClient';

// Wrap the client so existing calls (ai.models.generateContent) keep working.
const ai = {
  models: {
    generateContent: (...args: any[]) => getGeminiAI().models.generateContent(...args),
  }
};

export const EXPENSE_CATEGORIES = [
    'Rent/Mortgage', 'Utilities', 'Groceries', 'Dining Out', 'Transportation',
    'Retail', 'Entertainment', 'Healthcare', 'Subscriptions', 'Interest',
    'Bank Fees', 'Personal Transfer', 'Internal Transfer', 'Loan', 'Other Expense'
];

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Other Income'];

const CHUNK_SIZE = 50;

const generateDeterministicId = (parts: (string | number)[]): string => {
  const str = parts.join('-');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Use a prefix and convert to hex for a cleaner ID
  return `tx-${Math.abs(hash).toString(16)}`;
};

type ParsedRow = {
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
} | null;

const parseRbcRow = (parts: string[]): ParsedRow => {
  if (parts.length < 7) return null;
  const date = parts[2];
  const description = `${parts[4]} ${parts[5]}`.trim().replace(/"/g, '');
  const amount = parseFloat(parts[6]);

  if (!date || !description || isNaN(amount)) return null;

  return {
    date,
    description,
    amount: Math.abs(amount),
    type: amount >= 0 ? 'Income' : 'Expense',
  };
};

const parseCibcRow = (parts: string[]): ParsedRow => {
  if (parts.length < 4) return null;
  const date = parts[0];
  const description = parts[1];
  const debit = parseFloat(parts[2]);
  const credit = parseFloat(parts[3]);
  
  if (!date || !description || (isNaN(debit) && isNaN(credit))) return null;

  if (!isNaN(debit) && debit > 0) {
    return { date, description, amount: debit, type: 'Expense' };
  }
  if (!isNaN(credit) && credit > 0) {
    return { date, description, amount: credit, type: 'Income' };
  }
  return null;
};

const parseTdRow = (parts: string[]): ParsedRow => {
  if (parts.length < 3) return null;
  const date = parts[0];
  const description = parts[1];
  const debit = parseFloat(parts[2]);
  const credit = parseFloat(parts[3]);

  if (!date || !description || (isNaN(debit) && isNaN(credit))) return null;
  
  if (!isNaN(debit) && debit > 0) {
    return { date, description, amount: debit, type: 'Expense' };
  }
  if (!isNaN(credit) && credit > 0) {
    return { date, description, amount: credit, type: 'Income' };
  }
  return null;
};


export const parseTransactions = async (
  csvContent: string,
  fileName: string
): Promise<Omit<Transaction, 'category'>[]> => {
  const lines = csvContent.split('\n').map(l => l.trim()).filter(line => line);
  if (lines.length === 0) return [];

  let format: 'RBC' | 'CIBC' | 'TD' | 'UNKNOWN' = 'UNKNOWN';
  
  const header = lines[0].toLowerCase();
  if (header.includes('account type') && header.includes('account number')) {
    format = 'RBC';
  } else {
    for (const line of lines.slice(0, 5)) {
      const parts = line.split(',');
      if (parts.length === 5 && parts[3] === '' && !isNaN(parseFloat(parts[2]))) {
        format = 'TD';
        break;
      }
      if (parts.length === 4 && (parts[2] === '' || parts[3] === '') && /^\d{4}-\d{2}-\d{2}/.test(parts[0])) {
        format = 'CIBC';
        break;
      }
       if (parts.length > 6 && !isNaN(parseFloat(parts[6])) && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(parts[2])) {
        format = 'RBC';
        break;
      }
    }
  }

  let parser: (parts: string[]) => ParsedRow;
  let linesToParse = lines;

  switch (format) {
    case 'RBC':
      parser = parseRbcRow;
      if (lines[0].toLowerCase().includes('account type')) {
        linesToParse = lines.slice(1);
      }
      break;
    case 'CIBC':
      parser = parseCibcRow;
      break;
    case 'TD':
      parser = parseTdRow;
      break;
    default:
      throw new Error("Could not automatically determine the bank statement format. Supported formats: TD, RBC, CIBC.");
  }

  const parsedTransactions: Omit<Transaction, 'category'>[] = [];

  for (const [index, line] of linesToParse.entries()) {
    const parts = line.split(',');
    const parsedRow = parser(parts);
    
    if (parsedRow) {
      const date = new Date(parsedRow.date);
      if (isNaN(date.getTime())) {
        console.warn(`Skipping row with invalid date: ${line}`);
        continue;
      }
      parsedTransactions.push({
        id: generateDeterministicId([fileName, index, parsedRow.date, parsedRow.description, parsedRow.amount]),
        date: date,
        description: parsedRow.description.replace(/"/g, ''),
        amount: parsedRow.amount,
        type: parsedRow.type,
      });
    }
  }

  if (parsedTransactions.length === 0) {
    throw new Error("No valid transactions could be parsed from the file. Please check the file content and format.");
  }

  return parsedTransactions;
};

export const categorizeTransactions = async (
  transactions: Omit<Transaction, 'category'>[],
  onProgress: (completed: number, total: number) => void
): Promise<Transaction[]> => {
  const model = 'gemini-2.5-flash';
  const categorizedTransactions: Transaction[] = [];
  const totalChunks = Math.ceil(transactions.length / CHUNK_SIZE);

  for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
    const chunk = transactions.slice(i, i + CHUNK_SIZE);
    
    const prompt = `Categorize the following financial transactions. Each transaction has a pre-assigned 'type' ("Income" or "Expense"). Use this type and the transaction's description to assign it to the most appropriate category.
    
    Expense Categories: ${EXPENSE_CATEGORIES.join(', ')}.
    Income Categories: ${INCOME_CATEGORIES.join(', ')}.

    Return a JSON array of objects, where each object includes the original 'id', 'date', 'description', 'amount', and 'type', plus the new 'category' field. Ensure the 'type' in your response matches the 'type' provided in the input.

    Transactions to categorize:
    ---
    ${JSON.stringify(chunk)}
    ---
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0,
        },
    });

    try {
      const jsonString = response.text.trim().replace(/^```json\s*/, '').replace(/```$/, '');
      const resultChunk = JSON.parse(jsonString);
      
      if (Array.isArray(resultChunk)) {
          // Map back to original objects to preserve valid Date objects and other fields
          // We use the ID to match, assuming Gemini returns the correct IDs.
          // If ID is missing or mismatch, we might lose data, so we iterate over the *original* chunk
          // and try to find the category from the result.
          
          const categoryMap = new Map<string, string>();
          resultChunk.forEach((r: any) => {
              if (r.id && r.category) {
                  categoryMap.set(r.id, r.category);
              }
          });

          const processedChunk = chunk.map(originalTx => ({
              ...originalTx,
              category: categoryMap.get(originalTx.id) || 'Uncategorized', // Fallback if Gemini missed it
          }));
          
          categorizedTransactions.push(...processedChunk);
      }
    } catch (e) {
      console.error("Error processing chunk:", e, response.text);
      // Fallback: add the chunk as uncategorized so we don't lose data
      categorizedTransactions.push(...chunk.map(t => ({ ...t, category: 'Uncategorized' })));
    }

    onProgress(Math.min(i + CHUNK_SIZE, transactions.length), transactions.length);
  }

  return categorizedTransactions;
};

const _findRecurringExpensesWithAI = async (
  transactions: Transaction[]
): Promise<RecurringExpense[]> => {
  if (transactions.length === 0) {
    return [];
  }

  const model = 'gemini-2.5-flash';
  const prompt = `Analyze the following list of expense transactions to identify and group recurring payments. A recurring payment is one that happens repeatedly.

  **Crucially, transactions for the same recurring expense might have slight variations in their description (e.g., store numbers, dates) and amount.** Your task is to intelligently group these together. For example, 'Spotify P3 14.34_V' and 'Spotify P3 14.34' should be in the same group. Similarly, "BOOSTER JUICE STORE #123" and "BOOSTER JUICE #456" should both be grouped under a single "Booster Juice" expense.

  For each distinct recurring expense you identify, create a summary object with the following fields:
  - "name": A clean, user-friendly name for the recurring expense (e.g., "Netflix Subscription", "Booster Juice").
  - "representativeDescription": One of the actual transaction descriptions that best represents this group.
  - "category": The category of this expense group.
  - "averageAmount": The average transaction amount for this group.
  - "transactionCount": The total number of transactions you have grouped under this expense.

  Return a JSON array of these summary objects, sorted from the highest averageAmount to the lowest. If you don't find any recurring expenses, return an empty array.

  Transactions:
  ---
  ${JSON.stringify(transactions.map(t => ({ id: t.id, description: t.description, amount: t.amount, category: t.category, date: t.date.toISOString().split('T')[0] })))}
  ---
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            representativeDescription: { type: Type.STRING },
            category: { type: Type.STRING },
            averageAmount: { type: Type.NUMBER },
            transactionCount: { type: Type.NUMBER },
          },
          required: ['name', 'representativeDescription', 'category', 'averageAmount', 'transactionCount'],
        }
      }
    }
  });

  try {
    const jsonString = response.text.trim().replace(/^```json\s*/, '').replace(/```$/, '');
    const aiResult = JSON.parse(jsonString);
    
    if (!Array.isArray(aiResult)) {
        console.error("AI result for recurring transactions is not an array:", aiResult);
        return [];
    }
    
    const recurringExpenses: RecurringExpense[] = aiResult.map((group: any) => {
        if (!group.name || !group.representativeDescription || !group.category || typeof group.averageAmount !== 'number' || typeof group.transactionCount !== 'number') {
            return null;
        }
        return {
            name: group.name,
            representativeDescription: group.representativeDescription,
            category: group.category,
            averageAmount: group.averageAmount,
            transactionCount: group.transactionCount,
        };
    }).filter((item): item is RecurringExpense => item !== null);

    return recurringExpenses;

  } catch (e) {
    console.error("Failed to parse recurring transactions JSON:", response.text, e);
    // Return empty on failure to prevent app crash
    return [];
  }
};


export const identifyRecurringTransactions = async (
  transactions: Transaction[]
): Promise<{ majorRecurringExpenses: RecurringExpense[]; minorRecurringTransactions: Transaction[] }> => {
  const expenses = transactions.filter(t => t.type === 'Expense');
  if (expenses.length < 3) {
    return { majorRecurringExpenses: [], minorRecurringTransactions: [] };
  }

  const normalizeDescription = (desc: string): string => {
    return desc
      .toLowerCase()
      .replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/, '') 
      .replace(/[\d\W_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(w => w.length > 2)
      .sort()
      .join(' ');
  };

  const groups: Map<string, Transaction[]> = new Map();
  expenses.forEach(tx => {
    const key = normalizeDescription(tx.description);
    if (key) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tx);
    }
  });

  const potentialRecurring = Array.from(groups.values())
    .filter(group => group.length >= 3);

  if (potentialRecurring.length === 0) {
    return { majorRecurringExpenses: [], minorRecurringTransactions: [] };
  }

  const summarizedGroups = potentialRecurring.map(group => {
    const totalAmount = group.reduce((sum, tx) => sum + tx.amount, 0);
    return {
      transactions: group,
      averageAmount: totalAmount / group.length,
    };
  }).sort((a, b) => b.averageAmount - a.averageAmount);

  const MAJOR_EXPENSE_COUNT = 5;
  const majorGroups = summarizedGroups.slice(0, MAJOR_EXPENSE_COUNT);
  const minorGroups = summarizedGroups.slice(MAJOR_EXPENSE_COUNT);

  const majorTransactions = majorGroups.flatMap(g => g.transactions);
  const minorRecurringTransactions = minorGroups.flatMap(g => g.transactions);

  const majorRecurringExpenses = majorTransactions.length > 0
    ? await _findRecurringExpensesWithAI(majorTransactions)
    : [];

  return { majorRecurringExpenses, minorRecurringTransactions };
};

export const analyzeMinorRecurringTransactions = async (
  transactions: Transaction[]
): Promise<RecurringExpense[]> => {
  if (transactions.length === 0) return [];
  return await _findRecurringExpensesWithAI(transactions);
};

export const generateRecommendations = async (
  processedData: ProcessedData,
  allTransactions: Transaction[]
): Promise<Recommendation[]> => {
  const model = 'gemini-2.5-flash';

  const expenses = allTransactions.filter(t => t.type === 'Expense');
  const transactionSample = expenses
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 50)
    .map(t => ({ description: t.description, amount: t.amount, category: t.category }));

  const prompt = `You are a personal finance advisor. Based on the user's financial summary and a sample of their transactions, generate actionable recommendations to help them save money. For each recommendation, provide a title, a short description, 3-4 actionable steps, an estimated monthly savings amount (as a number), the description of a source transaction that triggered this recommendation, the category, the type ('recurring' for subscriptions/bills or 'habit' for spending patterns), and a potential impact level ('High', 'Medium', or 'Low').

  Financial Summary:
  - Total Income: ${processedData.totalIncome}
  - Total Expenses: ${processedData.totalExpenses}
  - Top Expense Categories: ${Object.entries(processedData.expenseBreakdown).sort((a,b) => b[1]-a[1]).slice(0, 5).map(e => `${e[0]}: ${e[1].toFixed(2)}`).join(', ')}

  Transaction Sample:
  ---
  ${JSON.stringify(transactionSample)}
  ---

  Return a JSON array of recommendation objects.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            shortDescription: { type: Type.STRING },
            actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            savings: { type: Type.NUMBER },
            sourceTransactionDescription: { type: Type.STRING },
            category: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['recurring', 'habit'] },
            potentialImpact: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
          },
          required: ['title', 'shortDescription', 'actionableSteps', 'savings', 'sourceTransactionDescription', 'category', 'type', 'potentialImpact'],
        }
      }
    }
  });

  try {
    const jsonString = response.text.trim().replace(/^```json\s*/, '').replace(/```$/, '');
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse recommendations JSON:", response.text, e);
    return [];
  }
};

export const explainTransaction = async (
  transaction: Transaction,
  allTransactions: Transaction[]
): Promise<TransactionExplanation> => {
  const model = 'gemini-2.5-flash';

  const similarTransactions = allTransactions
    .filter(t => t.description.toLowerCase() === transaction.description.toLowerCase() || t.description.toLowerCase().includes(transaction.description.toLowerCase().split(" ")[0]))
    .slice(0, 15);

  const prompt = `Analyze the following financial transaction.
  
  Transaction to explain:
  - Description: "${transaction.description}"
  - Amount: ${transaction.amount}
  - Date: ${transaction.date.toISOString().split('T')[0]}
  - Current Category: "${transaction.category}"

  Here are other potentially related transactions for context:
  ---
  ${JSON.stringify(similarTransactions.map(t => ({ id: t.id, description: t.description, amount: t.amount, date: t.date.toISOString().split('T')[0], category: t.category, type: t.type })))}
  ---

  Based on this, provide a detailed analysis in JSON format with the following fields:
  - "title": A clean, human-readable name for this type of transaction (e.g., "Spotify Subscription").
  - "explanation": A concise, one-paragraph explanation of what this transaction likely is, its potential recurring nature, and its financial impact.
  - "categorySuggestion": The most appropriate category from this list: ${EXPENSE_CATEGORIES.join(', ')}.
  - "confidence": Your confidence level in this analysis ('High', 'Medium', or 'Low').
  - "allOccurrences": An array of all transactions (from the provided context) that you believe are the same type of expense, including the original one. Include their id, date, description, amount, category, and type.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0,
    }
  });

  try {
    const jsonString = response.text.trim().replace(/^```json\s*/, '').replace(/```$/, '');
    const result = JSON.parse(jsonString);
    if (!result.allOccurrences.find((t: Transaction) => t.id === transaction.id)) {
      result.allOccurrences.push(transaction);
    }
    result.allOccurrences = result.allOccurrences.map((t: any) => ({...t, date: new Date(t.date) }));
    return result;
  } catch (e) {
    console.error("Failed to parse transaction explanation JSON:", response.text, e);
    throw new Error("AI failed to provide a valid explanation.");
  }
};

export const generateCancellationSteps = async (
  serviceName: string
): Promise<string[]> => {
  const model = 'gemini-2.5-flash';

  const prompt = `Provide a simple, step-by-step guide on how to cancel the service: "${serviceName}". The steps should be clear and concise for a general audience. Return just the steps.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  
  const steps = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\d+\./.test(line) || /^\*/.test(line) || /^-/.test(line))
    .map(line => line.replace(/^\d+\.\s*|^\*\s*|^-\s*/, ''));

  if (steps.length === 0 && text.length > 0) {
      return text.split('. ').filter(s => s.trim().length > 0 && isNaN(parseInt(s.trim().charAt(0))));
  }

  return steps;
};
