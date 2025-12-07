import React, { useState, useMemo } from 'react';
import { LatteFactorOpportunity, Recommendation, ProcessedData } from '../types';
import { TrendingUp, DollarSign, Coffee, Calculator, CheckCircle } from 'lucide-react';

interface InsightsViewProps {
    opportunities: LatteFactorOpportunity[] | null;
    recommendations: Recommendation[] | null;
    processedData: ProcessedData | null;
    isLoading: boolean;
    onAnalyze: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ 
    opportunities, 
    recommendations, 
    isLoading, 
    onAnalyze 
}) => {
    const [taxRate, setTaxRate] = useState<number>(30);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [interestRate, setInterestRate] = useState(7);

    // Initialize selection when data loads
    React.useEffect(() => {
        const newSet = new Set<string>();
        if (opportunities) opportunities.forEach(o => newSet.add(`latte-${o.id}`));
        if (recommendations) {
            recommendations.forEach((r, i) => {
                if (r.potentialImpact === 'High' || r.type === 'recurring') {
                    newSet.add(`rec-${i}`);
                }
            });
        }
        setSelectedItems(newSet);
    }, [opportunities, recommendations]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const combinedInsights = useMemo(() => {
        const items: {
            id: string;
            title: string;
            amount: number;
            type: 'latte' | 'recommendation';
            category: string;
        }[] = [];

        if (opportunities) {
            opportunities.forEach(op => {
                items.push({
                    id: `latte-${op.id}`,
                    title: op.name,
                    amount: op.monthlyCost,
                    type: 'latte',
                    category: op.category
                });
            });
        }

        if (recommendations) {
            recommendations.forEach((rec, idx) => {
                if (rec.potentialImpact === 'High' || rec.type === 'recurring') {
                    items.push({
                        id: `rec-${idx}`,
                        title: rec.title,
                        amount: rec.savings,
                        type: 'recommendation',
                        category: rec.category
                    });
                }
            });
        }

        return items.sort((a, b) => b.amount - a.amount);
    }, [opportunities, recommendations]);

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
        const selectedList = combinedInsights.filter(i => selectedItems.has(i.id));
        const monthlyTotal = selectedList.reduce((acc, i) => acc + i.amount, 0);
        const annualTotal = monthlyTotal * 12;
        
        // True Cost Calculation
        const trueAnnualCost = annualTotal / (1 - (taxRate / 100));
        const taxPaid = trueAnnualCost - annualTotal;

        // Investment Growth
        const r = interestRate / 100;
        const n = 12;
        const fv = (years: number) => monthlyTotal * ((Math.pow(1 + r/n, n*years) - 1) / (r/n));

        return {
            monthly: monthlyTotal,
            annual: annualTotal,
            trueAnnualCost,
            taxPaid,
            year10: fv(10),
            year20: fv(20),
        };
    };

    const impact = calculateImpact();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-lg font-medium">Analyzing your finances...</p>
            </div>
        );
    }

    if (combinedInsights.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <Coffee className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">No Money Leaks Found</h3>
                <p className="max-w-md text-center mt-2">
                    We couldn't find any obvious habitual spending or high-impact savings opportunities.
                </p>
                <button 
                    onClick={onAnalyze}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Refresh Analysis
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Intro */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-orange-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start">
                    <div className="bg-white p-3 rounded-full shadow-sm mr-4">
                        <Coffee className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Money Leaks & True Cost</h2>
                        <p className="text-gray-600 mt-1 max-w-xl">
                            Select the items below to see how much you could save, and what they <em>really</em> cost you in pre-tax earnings.
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white/60 p-2 rounded-lg border border-orange-100">
                    <span className="text-sm font-medium text-gray-600">Tax Rate:</span>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={taxRate}
                            onChange={(e) => setTaxRate(Number(e.target.value))}
                            className="w-16 p-1 text-center border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                            min="0" max="100"
                        />
                        <span className="text-gray-500">%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: List of Items */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Identified Opportunities
                    </h3>
                    <div className="grid gap-3">
                        {combinedInsights.map((item) => (
                            <div 
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`relative p-4 pr-12 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md flex justify-between items-center ${
                                    selectedItems.has(item.id) 
                                        ? 'bg-white border-blue-500 shadow-sm' 
                                        : 'bg-gray-50 border-transparent opacity-70'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-800">{item.title}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold ${
                                            item.type === 'latte' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {item.type === 'latte' ? 'Habit' : 'Save'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{item.category}</p>
                                </div>
                                
                                <div className="text-right">
                                    <p className={`text-xl font-bold ${selectedItems.has(item.id) ? 'text-blue-600' : 'text-gray-900'}`}>
                                        {formatCurrency(item.amount)}
                                    </p>
                                    <p className="text-xs text-gray-400 uppercase">/ Month</p>
                                </div>

                                {selectedItems.has(item.id) && (
                                    <div className="absolute top-1/2 -translate-y-1/2 right-4">
                                        <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-50" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Impact Calculator */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6 space-y-6">
                        
                        {/* True Cost Section */}
                        <div>
                            <h3 className="font-semibold text-gray-800 flex items-center mb-4">
                                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                                The True Cost
                            </h3>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Sticker Price (Yearly)</span>
                                    <span className="font-medium">{formatCurrency(impact.annual)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Income Tax Paid</span>
                                    <span className="font-medium text-red-600">+{formatCurrency(impact.taxPaid)}</span>
                                </div>
                                <div className="pt-2 border-t border-blue-200 flex justify-between items-center">
                                    <span className="font-bold text-blue-900 text-sm">Earnings Needed</span>
                                    <span className="font-bold text-lg text-blue-700">{formatCurrency(impact.trueAnnualCost)}</span>
                                </div>
                                <p className="text-xs text-blue-600 mt-2 leading-tight">
                                    You need to earn <b>{formatCurrency(impact.trueAnnualCost)}</b> a year just to pay for these items after tax.
                                </p>
                            </div>
                        </div>

                        {/* Wealth Impact Section */}
                        <div>
                            <h3 className="font-semibold text-gray-800 flex items-center mb-4">
                                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                                Potential Wealth
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">In 10 Years</span>
                                    <span className="font-bold text-green-600">{formatCurrency(impact.year10)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                                    <span className="text-sm font-semibold text-green-800">In 20 Years</span>
                                    <span className="font-bold text-green-700 text-xl">{formatCurrency(impact.year20)}</span>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs text-gray-500">Investment Return</label>
                                        <span className="text-xs font-bold text-gray-700">{interestRate}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="12" 
                                        value={interestRate} 
                                        onChange={(e) => setInterestRate(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
