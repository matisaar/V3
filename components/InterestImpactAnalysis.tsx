
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Flame, Info, ShieldCheck } from 'lucide-react';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};

interface InterestImpactAnalysisProps {
    transactions: Transaction[];
}

const getStartOfMonth = (d: Date): Date => {
    const date = new Date(d.getFullYear(), d.getMonth(), 1);
    date.setHours(0, 0, 0, 0);
    return date;
};


export const InterestImpactAnalysis: React.FC<InterestImpactAnalysisProps> = ({ transactions }) => {
    const interestData = useMemo(() => {
        const interestTransactions = transactions.filter(t => t.category === 'Interest');
        if (interestTransactions.length === 0) {
            return null;
        }

        const totalInterestPaid = interestTransactions.reduce((acc, t) => acc + t.amount, 0);
        
        const uniquePeriods = new Set(
            transactions.map(t => getStartOfMonth(t.date).toISOString())
        ).size;
        
        const numberOfPeriods = uniquePeriods > 0 ? uniquePeriods : 1;
        const averagePeriodInterest = totalInterestPaid / numberOfPeriods;

        return {
            totalInterestPaid,
            averagePeriodInterest,
            transactionCount: interestTransactions.length,
        };
    }, [transactions]);

    if (!interestData) {
        return (
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-center">
                <ShieldCheck className="w-10 h-10 text-green-600 mr-4 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-lg text-green-800">No Interest Payments Found</h3>
                    <p className="text-green-700 text-sm mt-1">
                        Great job! We didn't find any transactions categorized as 'Interest'. This is a fantastic sign of financial health.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-orange-50/50 border-2 border-dashed border-orange-300 p-6 rounded-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <Flame className="w-10 h-10 text-orange-500 mr-4 flex-shrink-0 mb-3 sm:mb-0" />
                <div>
                    <h3 className="font-bold text-xl text-gray-800">Interest Payment Analysis</h3>
                    <p className="text-orange-800 text-sm mt-1">
                        High-interest payments directly reduce your ability to save and invest. Here's your breakdown:
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-500">Total Interest Paid</p>
                    <p className="text-3xl font-bold text-red-600 tracking-tight">{formatCurrency(interestData.totalInterestPaid)}</p>
                    <p className="text-xs text-gray-400 mt-1">Across {interestData.transactionCount} payments</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-500">Monthly "Interest Burn"</p>
                    <p className="text-3xl font-bold text-red-600 tracking-tight">{formatCurrency(interestData.averagePeriodInterest)}</p>
                    <p className="text-xs text-gray-400 mt-1">Average per month</p>
                </div>
            </div>

            <div className="mt-6 flex items-start bg-white/50 p-4 rounded-lg border border-gray-200/80">
                <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                    <span className="font-semibold">Key Insight:</span> This monthly "burn" is money that could have been saved or invested. Tackling high-interest debt is one of the most effective ways to boost your savings rate and accelerate your financial goals.
                </p>
            </div>
        </div>
    );
};
