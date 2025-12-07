import React from 'react';
import { RecurringExpense } from '../types';
import { Home, Zap, Repeat, Car, Landmark, CreditCard, ShoppingCart, Utensils, HeartPulse, Clapperboard, PiggyBank, Users, Shuffle, ChevronRight, Sparkles, Loader } from 'lucide-react';

interface RecurringExpensesProps {
    data: RecurringExpense[];
    onExpenseClick: (expense: RecurringExpense) => void;
    hasMinorExpenses: boolean;
    onInvestigate: () => void;
    isInvestigating: boolean;
    onSave?: () => void;
    isSaving?: boolean;
}

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
    'Bank Fees': 'bg-orange-100 text-orange-600',
    'Personal Transfer': 'bg-teal-100 text-teal-600',
    'Internal Transfer': 'bg-cyan-100 text-cyan-600',
    'Default': 'bg-gray-100 text-gray-600',
};

const getIconBgColor = (category: string) => iconBgColors[category] || iconBgColors['Default'];

export const RecurringExpenses: React.FC<RecurringExpensesProps> = ({ data, onExpenseClick, hasMinorExpenses, onInvestigate, isInvestigating, onSave, isSaving }) => {
    return (
        <div>
            <div className="flex items-center justify-between text-gray-800 mb-6">
                <div className="flex items-center">
                    <Repeat className="w-6 h-6 mr-3" />
                    <h2 className="font-semibold text-xl">Recurring Payments</h2>
                </div>
                {onSave && (
                    <button 
                        onClick={onSave}
                        disabled={isSaving}
                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                        {isSaving ? <Loader className="w-4 h-4 animate-spin mr-1" /> : null}
                        {isSaving ? 'Saving...' : 'Save to Cloud'}
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.map((item, index) => (
                    <div 
                        key={index}
                        onClick={() => onExpenseClick(item)}
                        className="group bg-gray-50/80 border border-gray-200/80 rounded-xl p-4 flex items-center space-x-4 hover:shadow-md hover:border-blue-300 hover:bg-white transition-all duration-200 cursor-pointer"
                        role="button"
                        aria-label={`View details for ${item.name}`}
                    >
                        <div className={`p-3 rounded-full ${getIconBgColor(item.category)}`}>
                            {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg text-gray-800">{formatCurrency(item.averageAmount)}</p>
                            <p className="text-xs text-gray-400 font-medium">seen {item.transactionCount} times</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500 transition-all duration-200 group-hover:translate-x-1" />
                    </div>
                ))}
                {hasMinorExpenses && (
                    <div className="col-span-full mt-2">
                        <button
                            onClick={onInvestigate}
                            disabled={isInvestigating}
                            className="w-full flex items-center justify-center text-sm font-semibold text-blue-600 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg py-3 hover:bg-blue-100 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isInvestigating ? (
                                <>
                                    <Loader className="animate-spin w-5 h-5 mr-2" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Investigate Smaller Recurring Expenses
                                </>
                            )}
                        </button>
                    </div>
                )}
                 {data.length === 0 && !hasMinorExpenses && (
                    <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <p>No recurring expenses were identified in your data.</p>
                    </div>
                )}
            </div>
        </div>
    );
};