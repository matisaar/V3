import React, { useState, useEffect } from 'react';
import { LatteFactorOpportunity } from '../types';
import { Coffee, TrendingUp, DollarSign, Calendar, ArrowRight, Loader } from 'lucide-react';

interface LatteFactorViewProps {
    opportunities: LatteFactorOpportunity[] | null;
    isLoading: boolean;
    onAnalyze: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
};

export const LatteFactorView: React.FC<LatteFactorViewProps> = ({ opportunities, isLoading, onAnalyze }) => {
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [interestRate, setInterestRate] = useState(7); // 7% default return

    useEffect(() => {
        if (opportunities) {
            // Select all by default
            setSelectedItems(new Set(opportunities.map(o => o.id)));
        } else if (!isLoading) {
            // Trigger analysis if no data and not loading
            onAnalyze();
        }
    }, [opportunities, isLoading, onAnalyze]);

    const toggleItem = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const calculateImpact = () => {
        if (!opportunities) return { monthly: 0, annual: 0, lifetime: 0 };
        
        const monthlyTotal = opportunities
            .filter(o => selectedItems.has(o.id))
            .reduce((acc, o) => acc + o.monthlyCost, 0);
            
        const annualTotal = monthlyTotal * 12;
        
        // Future Value of a Series formula: PMT * (((1 + r/n)^(n*t) - 1) / (r/n))
        // Monthly contribution, compounded monthly
        const r = interestRate / 100;
        const n = 12;
        const t = 10; // 10 years
        const t20 = 20; // 20 years
        const t30 = 30; // 30 years

        const fv = (years: number) => {
            return monthlyTotal * ((Math.pow(1 + r/n, n*years) - 1) / (r/n));
        };

        return {
            monthly: monthlyTotal,
            annual: annualTotal,
            year10: fv(10),
            year20: fv(20),
            year30: fv(30),
        };
    };

    const impact = calculateImpact();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <Loader className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                <p className="text-lg font-medium">Analyzing your spending habits...</p>
                <p className="text-sm">Identifying potential money leaks...</p>
            </div>
        );
    }

    if (!opportunities || opportunities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <Coffee className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">No Money Leaks Found</h3>
                <p className="max-w-md text-center mt-2">
                    We couldn't find any obvious habitual discretionary spending. You might be a budgeting pro already!
                </p>
                <button 
                    onClick={onAnalyze}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-orange-100">
                <div className="flex items-start">
                    <div className="bg-white p-3 rounded-full shadow-sm mr-4">
                        <Coffee className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Money Leaks</h2>
                        <p className="text-gray-600 mt-1 max-w-2xl">
                            Small, frequent purchases add up to massive amounts over time. 
                            Select the habits below to see how much wealth you could build by investing that money instead.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: List of Habits */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Identified Habits
                    </h3>
                    <div className="grid gap-4">
                        {opportunities.map((item) => (
                            <div 
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                                    selectedItems.has(item.id) 
                                        ? 'bg-white border-blue-500 shadow-sm' 
                                        : 'bg-gray-50 border-transparent opacity-70'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-1">
                                            <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                                            <span className="ml-3 text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                                {item.category}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{item.reason}</p>
                                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                                            <span className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {item.frequency}
                                            </span>
                                            <span>
                                                ~{formatCurrency(item.averageAmount)} / txn
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(item.monthlyCost)}</p>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Per Month</p>
                                    </div>
                                </div>
                                {selectedItems.has(item.id) && (
                                    <div className="absolute top-4 right-4 w-4 h-4 bg-blue-500 rounded-full" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Impact Calculator */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
                        <h3 className="font-semibold text-gray-700 flex items-center mb-6">
                            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                            Potential Wealth Impact
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Monthly Savings</p>
                                <p className="text-4xl font-bold text-gray-900">{formatCurrency(impact.monthly)}</p>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Annual Savings</p>
                                <p className="text-2xl font-semibold text-gray-800">{formatCurrency(impact.annual)}</p>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-medium text-gray-700">Investment Growth</p>
                                    <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        <span>@ {interestRate}% Return</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">In 10 Years</span>
                                        <span className="font-bold text-green-600">{formatCurrency(impact.year10)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">In 20 Years</span>
                                        <span className="font-bold text-green-600">{formatCurrency(impact.year20)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg -mx-2">
                                        <span className="text-sm font-semibold text-green-800">In 30 Years</span>
                                        <span className="font-bold text-green-700 text-lg">{formatCurrency(impact.year30)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-gray-100">
                                <label className="text-xs text-gray-500 block mb-2">Adjust Return Rate (%)</label>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="12" 
                                    value={interestRate} 
                                    onChange={(e) => setInterestRate(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>Conservative (1%)</span>
                                    <span>Aggressive (12%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
