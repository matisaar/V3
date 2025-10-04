import React from 'react';
import { SavingsChart } from './SavingsChart';
import { BreakdownDonutChart } from './BreakdownDonutChart';
import { SavingsSummary } from './SavingsSummary';
import { ProcessedData, RecurringExpense, Transaction } from '../types';
import { CashFlowSnapshot } from './CashFlowSnapshot';
import { RecurringExpenses } from './RecurringExpenses';

interface DashboardProps {
    processedData: ProcessedData;
    recurringExpenses: RecurringExpense[] | null;
    onRecurringExpenseClick: (expense: RecurringExpense) => void;
    minorRecurringTransactions: Transaction[] | null;
    onInvestigateMinorExpenses: () => void;
    isInvestigatingMinorExpenses: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    processedData,
    recurringExpenses,
    onRecurringExpenseClick,
    minorRecurringTransactions,
    onInvestigateMinorExpenses,
    isInvestigatingMinorExpenses 
}) => {
    const hasMajorExpenses = recurringExpenses && recurringExpenses.length > 0;
    const hasMinorExpenses = minorRecurringTransactions && minorRecurringTransactions.length > 0;

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <CashFlowSnapshot processedData={processedData} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <SavingsChart data={processedData.periodSummaries} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <BreakdownDonutChart
                        title="Income Breakdown"
                        totalAmount={processedData.totalIncome}
                        data={processedData.incomeBreakdown}
                        colors={['#10B981', '#34D399', '#6EE7B7']}
                    />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <BreakdownDonutChart
                        title="Expenses Breakdown"
                        totalAmount={processedData.totalExpenses}
                        data={processedData.expenseBreakdown}
                        colors={['#EF4444', '#F87171', '#FCA5A5', '#FECACA']}
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <SavingsSummary
                    periodData={processedData.periodSummaries}
                />
            </div>
            
            {(hasMajorExpenses || hasMinorExpenses) && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <RecurringExpenses 
                        data={recurringExpenses || []} 
                        // FIX: Changed onExpenseClick to onRecurringExpenseClick to match the prop name.
                        onExpenseClick={onRecurringExpenseClick}
                        hasMinorExpenses={!!hasMinorExpenses}
                        onInvestigate={onInvestigateMinorExpenses}
                        isInvestigating={isInvestigatingMinorExpenses}
                    />
                </div>
            )}
        </div>
    );
};
