import React from 'react';
import { Transaction, TransactionExplanation } from '../types';
import { X, Loader, AlertTriangle, Lightbulb, HelpCircle, Calendar } from 'lucide-react';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    explanationResult: TransactionExplanation | null;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
    isOpen,
    onClose,
    isLoading,
    error,
    explanationResult
}) => {
    if (!isOpen) return null;

    const confidenceColor: { [key: string]: string } = {
        High: 'text-green-600 bg-green-100',
        Medium: 'text-yellow-600 bg-yellow-100',
        Low: 'text-red-600 bg-red-100',
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                    <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">Investigating Transaction...</h3>
                    <p className="text-gray-500 mt-1">Our AI is analyzing the details. This won't take long.</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">Analysis Failed</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                </div>
            );
        }
        if (explanationResult) {
            const totalAmount = explanationResult.allOccurrences.reduce((sum, tx) => sum + tx.amount, 0);
            return (
                <>
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold text-gray-800">{explanationResult.title}</h2>
                                <p className="text-sm text-gray-500 mt-1">AI-Powered Transaction Analysis</p>
                            </div>
                            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors" aria-label="Close modal">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="p-6 space-y-6 bg-gray-50/50 max-h-[60vh] overflow-y-auto">
                        {/* AI Explanation Section */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                             <div className="flex items-center text-gray-600 mb-3">
                                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                                <h3 className="font-semibold text-lg">AI Explanation</h3>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{explanationResult.explanation}</p>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <div className="font-semibold text-gray-500 mb-1">Suggested Category</div>
                                    <div className="font-bold text-gray-800">{explanationResult.categorySuggestion}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <div className="font-semibold text-gray-500 mb-1">Confidence</div>
                                    <div className={`font-bold px-2 py-0.5 rounded-full inline-block ${confidenceColor[explanationResult.confidence]}`}>{explanationResult.confidence}</div>
                                </div>
                            </div>
                        </div>

                        {/* Occurrences Section */}
                        <div>
                            <div className="flex items-center justify-between text-gray-600 mb-3">
                                <div className="flex items-center">
                                    <HelpCircle className="w-5 h-5 mr-2" />
                                    <h3 className="font-semibold text-lg">Transaction History</h3>
                                </div>
                                <div className="text-sm text-right">
                                     <span className="font-bold text-base text-gray-800">{formatCurrency(totalAmount)}</span>
                                     <span className="text-gray-500 ml-1.5">total in {explanationResult.allOccurrences.length} transactions</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {explanationResult.allOccurrences.map(tx => (
                                    <div key={tx.id} className="bg-white p-3 rounded-md border border-gray-200 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">{tx.description}</p>
                                            <p className="text-xs text-gray-500 flex items-center mt-1">
                                                <Calendar className="w-3 h-3 mr-1.5" />
                                                {formatDate(tx.date)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                             <p className="font-semibold text-gray-900">{formatCurrency(tx.amount)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            );
        }
        return null;
    };


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300"
                style={{ minWidth: 400, minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                onClick={e => e.stopPropagation()}
            >
                {renderContent()}
            </div>
        </div>
    );
};