import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { BreakdownDonutChart } from './BreakdownDonutChart';
import { WalletCards, ArrowUpCircle, ArrowDownCircle, Scale } from 'lucide-react';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};

interface BucketsOfLifeViewProps {
    transactions: Transaction[];
}

interface BucketOfLifeData {
    name: string;
    income: number;
    expenses: number;
    net: number;
    expenseBreakdown: { [category: string]: number };
    transactionCount: number;
}

export const BucketsOfLifeView: React.FC<BucketsOfLifeViewProps> = ({ transactions }) => {

    const bucketsOfLifeData = useMemo<BucketOfLifeData[]>(() => {
        const groupedByBucketOfLife: { [key: string]: BucketOfLifeData } = {};

        transactions.forEach(t => {
            const bucketOfLifeName = t.bucketOfLife || 'Unassigned';
            if (!groupedByBucketOfLife[bucketOfLifeName]) {
                groupedByBucketOfLife[bucketOfLifeName] = {
                    name: bucketOfLifeName,
                    income: 0,
                    expenses: 0,
                    net: 0,
                    expenseBreakdown: {},
                    transactionCount: 0,
                };
            }

            const bucketOfLife = groupedByBucketOfLife[bucketOfLifeName];
            bucketOfLife.transactionCount++;

            if (t.type === 'Income') {
                bucketOfLife.income += t.amount;
            } else {
                bucketOfLife.expenses += t.amount;
                bucketOfLife.expenseBreakdown[t.category] = (bucketOfLife.expenseBreakdown[t.category] || 0) + t.amount;
            }
        });

        return Object.values(groupedByBucketOfLife).map(bucketOfLife => ({
            ...bucketOfLife,
            net: bucketOfLife.income - bucketOfLife.expenses,
        })).sort((a, b) => b.expenses - a.expenses);

    }, [transactions]);

    const bucketOfLifeColors = [
        ['#EF4444', '#F87171', '#FCA5A5'],
        ['#3B82F6', '#60A5FA', '#93C5FD'],
        ['#10B981', '#34D399', '#6EE7B7'],
        ['#F97316', '#FB923C', '#FDBA74'],
        ['#8B5CF6', '#A78BFA', '#C4B5FD'],
        ['#EC4899', '#F472B6', '#F9A8D4'],
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center text-gray-800">
                <WalletCards className="w-6 h-6 mr-3" />
                <h2 className="font-semibold text-xl">Buckets of Life</h2>
            </div>

            {bucketsOfLifeData.length === 0 ? (
                 <div className="flex flex-col items-center justify-center text-center h-96 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <WalletCards className="w-16 h-16 text-gray-400 mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-600">No Buckets of Life Found</h2>
                    <p className="text-gray-500 mt-2 max-w-md">Once you upload your data, we'll automatically group your transactions into different buckets of your life, like 'Personal', 'Vehicle', etc.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {bucketsOfLifeData.map((bucketOfLife, index) => (
                        <div key={bucketOfLife.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">{bucketOfLife.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <p className="text-sm font-semibold text-green-800 flex items-center justify-center"><ArrowUpCircle className="w-4 h-4 mr-1.5" />Income</p>
                                    <p className="text-xl font-bold text-green-700">{formatCurrency(bucketOfLife.income)}</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                    <p className="text-sm font-semibold text-red-800 flex items-center justify-center"><ArrowDownCircle className="w-4 h-4 mr-1.5" />Expenses</p>
                                    <p className="text-xl font-bold text-red-700">{formatCurrency(bucketOfLife.expenses)}</p>
                                </div>
                                <div className={`p-3 rounded-lg border ${bucketOfLife.net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                                    <p className={`text-sm font-semibold flex items-center justify-center ${bucketOfLife.net >= 0 ? 'text-blue-800' : 'text-orange-800'}`}><Scale className="w-4 h-4 mr-1.5" />Net Flow</p>
                                    <p className={`text-xl font-bold ${bucketOfLife.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(bucketOfLife.net)}</p>
                                </div>
                            </div>
                            
                            <div className="h-80">
                                <BreakdownDonutChart
                                    title="Expense Breakdown"
                                    totalAmount={bucketOfLife.expenses}
                                    data={bucketOfLife.expenseBreakdown}
                                    colors={bucketOfLifeColors[index % bucketOfLifeColors.length]}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
