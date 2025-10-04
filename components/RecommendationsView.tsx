
import React, { useState } from 'react';
import { Recommendation, ProcessedData, Transaction } from '../types';
import { Lightbulb, Loader, AlertCircle, Sparkles, Target, PiggyBank, Home, Zap, Repeat, Car, Landmark, CreditCard, ShoppingCart, Utensils, HeartPulse, Clapperboard, Users, Shuffle, ChevronDown, Scissors, CheckCircle, Info, X } from 'lucide-react';
import { InterestImpactAnalysis } from './InterestImpactAnalysis';
import { generateCancellationSteps } from '../services/geminiService';


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const getCategoryIcon = (category: string) => {
    const iconProps = { className: "w-6 h-6" };
    switch (category) {
        case 'Rent/Mortgage': return <Home {...iconProps} />;
        case 'Utilities': return <Zap {...iconProps} />;
        case 'Subscriptions': return <Repeat {...iconProps} />;
        case 'Transportation': return <Car {...iconProps} />;
        case 'Loan': return <Landmark {...iconProps} />;
        case 'Groceries': return <ShoppingCart {...iconProps} />;
        case 'Dining Out': return <Utensils {...iconProps} />;
        case 'Healthcare': return <HeartPulse {...iconProps} />;
        case 'Entertainment': return <Clapperboard {...iconProps} />;
        case 'Bank Fees': return <PiggyBank {...iconProps} />;
        case 'Personal Transfer': return <Users {...iconProps} />;
        case 'Internal Transfer': return <Shuffle {...iconProps} />;
        default: return <CreditCard {...iconProps} />;
    }
};

const iconBgColors: { [key: string]: string } = {
    'Rent/Mortgage': 'bg-red-100 text-red-600',
    'Utilities': 'bg-yellow-100 text-yellow-600',
    'Subscriptions': 'bg-purple-100 text-purple-600',
    'Transportation': 'bg-indigo-100 text-indigo-600',
    'Loan': 'bg-blue-100 text-blue-600',
    'Dining Out': 'bg-pink-100 text-pink-600',
    'Retail': 'bg-fuchsia-100 text-fuchsia-600',
    'Default': 'bg-gray-100 text-gray-600',
};

const getIconBgColor = (category: string) => iconBgColors[category] || iconBgColors['Default'];

const impactStyles: { [key: string]: string } = {
    High: 'bg-red-100 text-red-800 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-green-100 text-green-800 border-green-200',
};

interface CancellationStepsModalProps {
    isOpen: boolean;
    onClose: () => void;
    cancellationInfo: {
        service: string;
        steps: string[] | null;
        isLoading: boolean;
        error: string | null;
    };
}

const CancellationStepsModal: React.FC<CancellationStepsModalProps> = ({ isOpen, onClose, cancellationInfo }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">How to Cancel {cancellationInfo.service}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200" aria-label="Close modal">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {cancellationInfo.isLoading && (
                        <div className="flex flex-col items-center justify-center h-40">
                            <Loader className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                            <p className="text-gray-600">Generating instructions...</p>
                        </div>
                    )}
                    {cancellationInfo.error && (
                         <div className="flex flex-col items-center justify-center h-40 text-center">
                            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
                            <p className="font-semibold text-red-700">Could not get instructions</p>
                            <p className="text-sm text-gray-600 mt-1">{cancellationInfo.error}</p>
                        </div>
                    )}
                    {cancellationInfo.steps && (
                        <ol className="space-y-3 list-decimal list-inside">
                            {cancellationInfo.steps.map((step, index) => (
                                <li key={index} className="text-gray-700 leading-relaxed flex">
                                    <span className="font-bold mr-2">{index + 1}.</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
};

const RecommendationItem: React.FC<{
    rec: Recommendation;
    onGetCancellationSteps: (serviceName: string) => void;
}> = ({ rec, onGetCancellationSteps }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 transition-all duration-300">
            {/* Collapsed View */}
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${getIconBgColor(rec.category)}`}>
                    {getCategoryIcon(rec.category)}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-md text-gray-800">{rec.title}</h3>
                    <p className="text-sm text-gray-500">{rec.shortDescription}</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(rec.savings)}</span>
                    <span className="text-xs text-gray-500 block">/month</span>
                </div>
            </div>

            {/* Expanded View */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm text-gray-600 mb-2 flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Actionable Steps</h4>
                        <ul className="space-y-1 list-disc list-inside pl-1 text-sm text-gray-700">
                            {rec.actionableSteps.map((step, i) => <li key={i}>{step}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold text-sm text-gray-600 mb-2 flex items-center"><Info className="w-4 h-4 mr-2 text-blue-500" />Basis</h4>
                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-200" title={`Based on: "${rec.sourceTransactionDescription}"`}>
                           This advice is based on transactions like: "{rec.sourceTransactionDescription}"
                        </p>
                    </div>
                </div>
            )}
            
            {/* Footer with actions */}
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-xs font-medium">
                    <span className={`px-2 py-0.5 rounded-full mr-2 ${impactStyles[rec.potentialImpact]}`}>
                        {rec.potentialImpact} Impact
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 capitalize">
                        {rec.type}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 flex items-center transition-colors">
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {rec.type === 'recurring' && (
                        <button 
                            onClick={() => onGetCancellationSteps(rec.title)}
                            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md flex items-center shadow-sm transition-colors"
                        >
                           <Scissors className="w-4 h-4 mr-1.5" />
                           How to Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface RecommendationsViewProps {
    processedData: ProcessedData | null;
    onGenerate: () => void;
    recommendations: Recommendation[] | null;
    isLoading: boolean;
    error: string | null;
    hasData: boolean;
    allTransactions: Transaction[];
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
    processedData,
    onGenerate,
    recommendations,
    isLoading,
    error,
    hasData,
    allTransactions,
}) => {
    const [isCancellationModalOpen, setIsCancellationModalOpen] = useState<boolean>(false);
    const [cancellationInfo, setCancellationInfo] = useState<{ service: string; steps: string[] | null; isLoading: boolean; error: string | null }>({ service: '', steps: null, isLoading: false, error: null });

    const handleGetCancellationSteps = async (serviceName: string) => {
        setIsCancellationModalOpen(true);
        setCancellationInfo({ service: serviceName, steps: null, isLoading: true, error: null });
        try {
            const steps = await generateCancellationSteps(serviceName);
            setCancellationInfo({ service: serviceName, steps, isLoading: false, error: null });
        } catch (err) {
            console.error("Failed to get cancellation steps:", err);
            setCancellationInfo({ service: serviceName, steps: null, isLoading: false, error: "Could not retrieve cancellation steps. Please try again." });
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center h-96">
                    <Loader className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-600">Generating Your Personal Plan...</h2>
                    <p className="text-gray-500 mt-2">Our AI is analyzing your spending to find savings opportunities.</p>
                </div>
            );
        }

        if (error) {
             return (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative my-4 flex items-center justify-center flex-col text-center" role="alert">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <span className="block font-bold mb-2">Could not get recommendations.</span>
                    <span className="text-sm">{error}</span>
                </div>
            );
        }

        if (recommendations && processedData && recommendations.length > 0) {
            const totalPotentialSavings = recommendations.reduce((acc, rec) => acc + rec.savings, 0);
            
            return (
                <div className="space-y-8">
                    {/* Header Summary */}
                    <div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-500 flex items-center justify-center">
                            <PiggyBank className="w-4 h-4 mr-1.5 text-green-600"/>
                            Total Potential Monthly Savings
                        </h3>
                        <p className="text-5xl font-bold text-green-600 mt-2 tracking-tight">{formatCurrency(totalPotentialSavings)}</p>
                        <p className="text-sm text-gray-500 mt-1 max-w-2xl mx-auto">This is an estimate of how much you could save each month by following the personalized recommendations below.</p>
                    </div>

                    <InterestImpactAnalysis transactions={allTransactions} />

                    {/* Action Plan Title */}
                    <div className="flex items-center text-gray-800">
                        <Target className="w-6 h-6 mr-3" />
                        <h2 className="font-semibold text-xl">Your Personalized Action Plan</h2>
                    </div>
                    
                    {/* Recommendations List */}
                    <div className="space-y-4">
                        {recommendations.map((rec, index) => (
                           <RecommendationItem key={index} rec={rec} onGetCancellationSteps={handleGetCancellationSteps} />
                        ))}
                    </div>
                </div>
            );
        }

        // Initial state
        return (
            <div className="flex flex-col items-center justify-center text-center h-96 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <Lightbulb className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-600">Unlock Your Personalized Savings Plan</h2>
                <p className="text-gray-500 mt-2 max-w-md">Let our AI find specific, non-essential expenses you can cut to save money based on your monthly habits.</p>
                <button
                    onClick={onGenerate}
                    disabled={!hasData}
                    className="mt-6 bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate My Savings Plan
                </button>
                {!hasData && <p className="text-xs text-gray-400 mt-2">Please upload your transaction data first.</p>}
            </div>
        );
    };

    return (
        <div>
            {renderContent()}
            <CancellationStepsModal 
                isOpen={isCancellationModalOpen}
                onClose={() => setIsCancellationModalOpen(false)}
                cancellationInfo={cancellationInfo}
            />
        </div>
    );
};
