import React, { useState, useEffect, useMemo } from 'react';
import { LatteFactorOpportunity, Recommendation, ProcessedData } from '../types';
import { TrendingUp, DollarSign, AlertCircle, Lightbulb, ArrowRight, Calculator, Info } from 'lucide-react';

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
    processedData, 
    isLoading, 
    onAnalyze 
}) => {
    const [annualIncome, setAnnualIncome] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(30); // Default 30%
    const [showTaxSettings, setShowTaxSettings] = useState<boolean>(false);

    // Try to estimate annual income from processed data if available
    useEffect(() => {
        if (processedData && annualIncome === 0) {
            // This is a rough estimate. If data spans multiple years, this might be wrong.
            // Ideally we'd look at the most recent full year or project current year.
            // For now, let's just use the totalIncome if it looks like a reasonable annual figure,
            // or just leave it for the user to input.
            if (processedData.totalIncome > 0) {
                setAnnualIncome(processedData.totalIncome);
            }
        }
    }, [processedData]);

    const calculateTrueCost = (amount: number) => {
        // Amount is the post-tax price (what you paid)
        // We want to find how much pre-tax income was needed.
        // PreTax * (1 - TaxRate) = Amount
        // PreTax = Amount / (1 - TaxRate)
        if (taxRate >= 100 || taxRate < 0) return amount;
        return amount / (1 - (taxRate / 100));
    };

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
            description: string;
            amount: number; // Monthly amount
            type: 'latte' | 'recommendation';
            category: string;
        }[] = [];

        if (opportunities) {
            opportunities.forEach(op => {
                items.push({
                    id: `latte-${op.id}`,
                    title: op.name,
                    description: `Recurring ${op.frequency} expense. ${op.reason}`,
                    amount: op.monthlyCost,
                    type: 'latte',
                    category: op.category
                });
            });
        }

        // Filter recommendations to avoid duplicates or low quality ones as requested
        if (recommendations) {
            recommendations.forEach((rec, idx) => {
                // Only include high impact or recurring recommendations
                if (rec.potentialImpact === 'High' || rec.type === 'recurring') {
                    items.push({
                        id: `rec-${idx}`,
                        title: rec.title,
                        description: rec.shortDescription,
                        amount: rec.savings, // Assuming savings is monthly for recurring
                        type: 'recommendation',
                        category: rec.category
                    });
                }
            });
        }

        return items.sort((a, b) => b.amount - a.amount);
    }, [opportunities, recommendations]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-lg font-medium">Analyzing your finances...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Lightbulb className="w-6 h-6 text-yellow-500" />
                            Financial Insights
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Discover the true cost of your spending habits and find smart ways to save.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-blue-50 p-3 rounded-lg">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Your Tax Bracket</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-blue-800">{taxRate}%</span>
                                <button 
                                    onClick={() => setShowTaxSettings(!showTaxSettings)}
                                    className="text-blue-500 hover:text-blue-700 text-sm underline"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                        <Calculator className="w-8 h-8 text-blue-300" />
                    </div>
                </div>

                {showTaxSettings && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <h3 className="font-semibold text-gray-700 mb-3">Adjust Tax Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Estimated Marginal Tax Rate (%)</label>
                                <input 
                                    type="number" 
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                    max="100"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This is used to calculate how much you really need to earn to afford an item.
                                </p>
                            </div>
                            {/* 
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Annual Income (Optional)</label>
                                <input 
                                    type="number" 
                                    value={annualIncome}
                                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            */}
                        </div>
                    </div>
                )}
            </div>

            {/* True Cost Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {combinedInsights.map((item) => {
                    const monthlyCost = item.amount;
                    const annualCost = monthlyCost * 12;
                    const trueMonthlyCost = calculateTrueCost(monthlyCost);
                    const trueAnnualCost = calculateTrueCost(annualCost);
                    const taxPaid = trueAnnualCost - annualCost;

                    return (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.type === 'latte' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {item.type === 'latte' ? 'Habit' : 'Recommendation'}
                                            </span>
                                            <span className="text-gray-400 text-sm">• {item.category}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyCost)}</div>
                                        <div className="text-sm text-gray-500">per month</div>
                                    </div>
                                </div>

                                <p className="text-gray-600 mb-6">{item.description}</p>

                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        <h4 className="font-semibold text-blue-900">The True Cost Analysis</h4>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Sticker Price (Annual)</span>
                                            <span className="font-medium text-gray-900">{formatCurrency(annualCost)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Income Tax Paid to Earn This</span>
                                            <span className="font-medium text-red-600">+{formatCurrency(taxPaid)}</span>
                                        </div>
                                        <div className="pt-3 border-t border-blue-200 flex justify-between items-center">
                                            <span className="font-bold text-blue-900">Pre-Tax Earnings Needed</span>
                                            <span className="font-bold text-xl text-blue-700">{formatCurrency(trueAnnualCost)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 text-xs text-blue-600 flex items-start gap-1">
                                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <p>
                                            At a {taxRate}% tax rate, you need to earn {formatCurrency(trueAnnualCost)} to spend {formatCurrency(annualCost)}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {combinedInsights.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Lightbulb className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900">No insights available yet</h3>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                        We couldn't find any significant recurring expenses or recommendations. Try adding more transaction data.
                    </p>
                    <button 
                        onClick={onAnalyze}
                        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Refresh Analysis
                    </button>
                </div>
            )}
        </div>
    );
};
