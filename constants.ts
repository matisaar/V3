
import { ProcessedData, Transaction, Recommendation, RecurringExpense } from './types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  // January 2025
  { id: 'mock-tx-1', date: new Date('2025-01-15'), description: 'Monthly Salary', amount: 6500, category: 'Salary', type: 'Income' },
  { id: 'mock-tx-2', date: new Date('2025-01-05'), description: 'Apartment Rent', amount: 2200, category: 'Rent/Mortgage', type: 'Expense' },
  // FIX: Changed `new date` to `new Date` for correct object instantiation.
  { id: 'mock-tx-3', date: new Date('2025-01-10'), description: 'Electricity Bill', amount: 150, category: 'Utilities', type: 'Expense' },
  { id: 'mock-tx-4', date: new Date('2025-01-12'), description: 'Dinner with friends', amount: 320, category: 'Dining Out', type: 'Expense' },
  { id: 'mock-tx-5', date: new Date('2025-01-20'), description: 'New winter jacket', amount: 175, category: 'Retail', type: 'Expense' },
  { id: 'mock-tx-12', date: new Date('2025-01-28'), description: 'Spotify Premium', amount: 15, category: 'Subscriptions', type: 'Expense' },
  { id: 'mock-tx-15', date: new Date('2025-01-20'), description: 'Goodlife Gym', amount: 50, category: 'Subscriptions', type: 'Expense' },
  { id: 'mock-tx-22', date: new Date('2025-01-15'), description: 'AUTO LOAN PAYMENT', amount: 450, category: 'Loan', type: 'Expense' },

  // February 2025
  { id: 'mock-tx-6', date: new Date('2025-02-15'), description: 'Monthly Salary', amount: 6000, category: 'Salary', type: 'Income' },
  { id: 'mock-tx-7', date: new Date('2025-02-05'), description: 'Apartment Rent', amount: 2200, category: 'Rent/Mortgage', type: 'Expense' },
  { id: 'mock-tx-8', date: new Date('2025-02-10'), description: 'Internet Bill', amount: 140, category: 'Utilities', type: 'Expense' },
  { id: 'mock-tx-9', date: new Date('2025-02-18'), description: 'Date night', amount: 160, category: 'Dining Out', type: 'Expense' },
  { id: 'mock-tx-13', date: new Date('2025-02-28'), description: 'Credit Card Interest', amount: 25, category: 'Interest', type: 'Expense' },
  { id: 'mock-tx-14', date: new Date('2025-02-20'), description: 'Goodlife Gym', amount: 50, category: 'Subscriptions', type: 'Expense' },
  { id: 'mock-tx-16', date: new Date('2025-02-28'), description: 'Spotify Premium', amount: 15, category: 'Subscriptions', type: 'Expense' },
  { id: 'mock-tx-21', date: new Date('2025-02-15'), description: 'AUTO LOAN PAYMENT', amount: 450, category: 'Loan', type: 'Expense' },

  // March 2025
  { id: 'mock-tx-10', date: new Date('2025-03-15'), description: 'Monthly Salary', amount: 6000, category: 'Salary', type: 'Income' },
  { id: 'mock-tx-11', date: new Date('2025-03-25'), description: 'Freelance Project', amount: 1500, category: 'Freelance', type: 'Income' },
  { id: 'mock-tx-17', date: new Date('2025-03-05'), description: 'Apartment Rent', amount: 2200, category: 'Rent/Mortgage', type: 'Expense' },
  { id: 'mock-tx-18', date: new Date('2025-03-20'), description: 'Goodlife Gym', amount: 50, category: 'Subscriptions', type: 'Expense' },
  { id: 'mock-tx-19', date: new Date('2025-03-28'), description: 'Spotify Premium', amount: 15, category: 'Subscriptions', type: 'Expense' },
  { id: 'mock-tx-20', date: new Date('2025-03-15'), description: 'AUTO LOAN PAYMENT', amount: 450, category: 'Loan', type: 'Expense' },
];


export const MOCK_DATA: ProcessedData = {
  periodSummaries: [
    {
      periodLabel: 'Jan 5 - Jan 11',
      year: 2025,
      startDate: new Date('2025-01-05'),
      income: 0,
      expenses: 2350,
      incomeBreakdown: {},
      expenseBreakdown: { 'Rent/Mortgage': 2200, 'Utilities': 150 },
    },
    {
      periodLabel: 'Jan 12 - Jan 18',
      year: 2025,
      startDate: new Date('2025-01-12'),
      income: 6500,
      expenses: 770,
      incomeBreakdown: { 'Salary': 6500 },
      expenseBreakdown: { 'Dining Out': 320, 'Loan': 450 },
    },
     {
      periodLabel: 'Jan 19 - Jan 25',
      year: 2025,
      startDate: new Date('2025-01-19'),
      income: 0,
      expenses: 225,
      incomeBreakdown: {},
      expenseBreakdown: { 'Retail': 175, 'Subscriptions': 50 },
    },
    {
      periodLabel: 'Feb 2 - Feb 8',
      year: 2025,
      startDate: new Date('2025-02-02'),
      income: 0,
      expenses: 2200,
      incomeBreakdown: { },
      expenseBreakdown: { 'Rent/Mortgage': 2200 },
    },
     {
      periodLabel: 'Feb 9 - Feb 15',
      year: 2025,
      startDate: new Date('2025-02-09'),
      income: 6000,
      expenses: 590,
      incomeBreakdown: { 'Salary': 6000 },
      expenseBreakdown: { 'Utilities': 140, 'Loan': 450 },
    },
  ],
  totalIncome: 20000,
  totalExpenses: 8945,
  incomeBreakdown: {
    'Salary': 18500,
    'Freelance': 1500,
  },
  expenseBreakdown: {
    'Rent/Mortgage': 6600,
    'Retail': 175,
    'Utilities': 290,
    'Dining Out': 480,
    'Subscriptions': 195,
    'Interest': 25,
    'Loan': 1350
  },
};

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
    {
        title: "Reduce Dining Out Costs",
        shortDescription: "Your average spend on dining out is quite high.",
        actionableSteps: [
            "Try packing lunch just two days a week.",
            "Set a weekly budget for eating out.",
            "Look for deals or happy hour specials."
        ],
        savings: 30,
        sourceTransactionDescription: "Dinner with friends",
        category: 'Dining Out',
        type: 'habit',
        potentialImpact: 'High',
    },
    {
        title: "Cancel Goodlife Gym Membership",
        shortDescription: "This recurring subscription can be cut to save a significant amount.",
        actionableSteps: [
            "Consider bodyweight exercises at home.",
            "Running or cycling outdoors are free alternatives.",
            "Check if your employer offers any fitness subsidies."
        ],
        savings: 12.5,
        sourceTransactionDescription: "Goodlife Gym",
        category: 'Subscriptions',
        type: 'recurring',
        potentialImpact: 'Medium',
    },
    {
        title: "Switch Spotify Premium Plan",
        shortDescription: "Switching to a cheaper plan or the free version can trim costs.",
        actionableSteps: [
            "Evaluate if you need all the Premium features.",
            "Consider a family or duo plan if applicable.",
            "The free version offers access to the same music library."
        ],
        savings: 3.75,
        sourceTransactionDescription: "Spotify Premium",
        category: 'Subscriptions',
        type: 'recurring',
        potentialImpact: 'Low',
    },
];

export const MOCK_RECURRING_EXPENSES: RecurringExpense[] = [
    { name: 'Apartment Rent', representativeDescription: 'Apartment Rent', category: 'Rent/Mortgage', averageAmount: 2200, transactionCount: 3 },
    { name: 'Auto Loan', representativeDescription: 'AUTO LOAN PAYMENT', category: 'Loan', averageAmount: 450, transactionCount: 3 },
    { name: 'Goodlife Gym', representativeDescription: 'Goodlife Gym', category: 'Subscriptions', averageAmount: 50, transactionCount: 3 },
    { name: 'Spotify Premium', representativeDescription: 'Spotify Premium', category: 'Subscriptions', averageAmount: 15, transactionCount: 3 },
];
