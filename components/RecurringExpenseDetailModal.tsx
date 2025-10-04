import React, { useEffect, useState } from 'react';
import { Transaction, RecurringExpense } from '../types';
import { X, Calendar, Hash, BarChart2, Repeat } from 'lucide-react';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const findMatchingTransactions = (expense: RecurringExpense, allTransactions: Transaction[]): Transaction[] => {
    if (!expense) return [];

    const normalize = (desc: string) => desc.toLowerCase().replace(/[\d\W_]+/g, ' ').replace(/\s+/g, ' ').trim();
    const representativeDescWords = new Set(normalize(expense.representativeDescription).split(' ').filter(w => w.length > 1));

    if (representativeDescWords.size === 0) return [];

    const matches = allTransactions.filter(t => {
        if (t.type !== 'Expense' || t.category !== expense.category) {
            return false;
        }

        const otherDescWords = normalize(t.description).split(' ');
        const commonWords = otherDescWords.filter(word => representativeDescWords.has(word));

        const similarity = commonWords.length / representativeDescWords.size;
        const amountDifference = expense.averageAmount > 0 ? Math.abs(t.amount - expense.averageAmount) / expense.averageAmount : 0;

        return similarity > 0.6 && amountDifference < 0.25;
    });

    return matches.sort((a, b) => b.date.getTime() - a.date.getTime());
};


interface RecurringExpenseDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    expense: RecurringExpense | null;
    allTransactions: Transaction[];
}

export const RecurringExpenseDetailModal: React.FC<RecurringExpenseDetailModalProps> = ({
    isOpen,
    onClose,
    expense,
    allTransactions,
}) => {
    const [matchingTransactions, setMatchingTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (expense && allTransactions) {
            const matches = findMatchingTransactions(expense, allTransactions);
            setMatchingTransactions(matches);
        } else {
            setMatchingTransactions([]);
        }
    }, [expense, allTransactions]);


    if (!isOpen || !expense) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                         <div>
                            <h2 className="text-2xl font-bold text-gray-800">{expense.name}</h2>
                            <p className="text-sm text-gray-500 mt-1">{expense.category}</p>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors" aria-label="Close modal">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 bg-gray-50/50 max-h-[60vh] overflow-y-auto">
                    {/* Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center">
                            <Repeat className="w-6 h-6 text-blue-500 mr-3" />
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Frequency</p>
                                <p className="text-lg font-bold text-gray-800">{matchingTransactions.length} times</p>
                            </div>
                        </div>
                         <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center">
                            <BarChart2 className="w-6 h-6 text-green-500 mr-3" />
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Average Cost</p>
                                <p className="text-lg font-bold text-gray-800">{formatCurrency(expense.averageAmount)}</p>
                            </div>
                        </div>
                         <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center">
                            <Hash className="w-6 h-6 text-purple-500 mr-3" />
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Total Spent</p>
                                <p className="text-lg font-bold text-gray-800">{formatCurrency(matchingTransactions.reduce((acc, t) => acc + t.amount, 0))}</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div>
                        <h3 className="font-semibold text-lg text-gray-700 mb-3">Transaction History</h3>
                        <div className="space-y-2">
                             {matchingTransactions.length > 0 ? (
                                matchingTransactions.map(tx => (
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
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
                                    <p>No matching transactions found in the uploaded data.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
