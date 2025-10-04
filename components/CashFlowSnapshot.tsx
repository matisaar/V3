
import React from 'react';
import { ProcessedData } from '../types';
import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};

interface CashFlowSnapshotProps {
    processedData: ProcessedData;
}

export const CashFlowSnapshot: React.FC<CashFlowSnapshotProps> = ({ processedData }) => {
    const { periodSummaries, totalIncome, totalExpenses } = processedData;

    const activePeriods = periodSummaries.filter(p => p.income > 0 || p.expenses > 0);
    
    if (activePeriods.length < 1) {
        return null;
    }

    const numberOfPeriods = activePeriods.length;
    const averagePeriodNet = (totalIncome - totalExpenses) / numberOfPeriods;
    const cashReserveFromPeriod = totalIncome - totalExpenses;

    const renderContent = () => {
        if (averagePeriodNet >= 0) {
            return (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start">
                        <div className="p-3 bg-green-100 rounded-full mr-4">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg text-gray-800">Positive Cash Flow</h4>
                            <p className="text-sm text-gray-600">On average, you're saving more than you spend. Great work!</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-200">
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Average Monthly Savings</p>
                            <p className="text-3xl font-bold text-green-600 tracking-tight">{formatCurrency(averagePeriodNet)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Total Saved This Period</p>
                            <p className="text-3xl font-bold text-green-600 tracking-tight">{formatCurrency(cashReserveFromPeriod)}</p>
                        </div>
                    </div>
                </div>
            );
        }

        const averagePeriodBurn = -averagePeriodNet;
        
        if (cashReserveFromPeriod <= 0) {
            return (
                 <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start">
                        <div className="p-3 bg-red-100 rounded-full mr-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg text-gray-800">Action Required: Negative Cash Flow</h4>
                            <p className="text-sm text-gray-600">Your expenses are higher than your income. Focus on reducing spending.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-red-200">
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Average Monthly Burn</p>
                            <p className="text-3xl font-bold text-red-600 tracking-tight">{formatCurrency(averagePeriodBurn)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Total Net Loss This Period</p>
                            <p className="text-3xl font-bold text-red-600 tracking-tight">{formatCurrency(cashReserveFromPeriod)}</p>
                        </div>
                    </div>
                </div>
            );
        }

        const periodsToDepletion = cashReserveFromPeriod / averagePeriodBurn;
        const runwayPeriods = Math.floor(periodsToDepletion);
        
        return (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6">
                 <div className="flex items-start">
                    <div className="p-3 bg-yellow-100 rounded-full mr-4">
                        <AlertTriangle className="w-6 h-6 text-yellow-700" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg text-gray-800">Cash Runway Projection</h4>
                        <p className="text-sm text-gray-600">You are spending more than you earn, but have a cash reserve.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-yellow-200">
                     <div>
                        <p className="text-sm font-semibold text-gray-500">Starting Net Savings</p>
                        <p className="text-2xl font-bold text-yellow-800 tracking-tight">{formatCurrency(cashReserveFromPeriod)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-500">Average Monthly Burn</p>
                        <p className="text-2xl font-bold text-red-600 tracking-tight">{formatCurrency(averagePeriodBurn)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-500">Estimated Cash Runway</p>
                        <p className="text-2xl font-bold text-yellow-800 tracking-tight">{runwayPeriods} month{runwayPeriods !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="flex items-center text-gray-600 mb-4">
                <TrendingDown className="w-5 h-5 mr-2" />
                <h3 className="font-semibold text-lg">Cash Flow Snapshot</h3>
            </div>
            {renderContent()}
        </div>
    );
};
