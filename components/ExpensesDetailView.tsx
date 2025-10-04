
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { Calendar, ChevronDown, ChevronRight, CircleDot, Wallet, Tag, PieChart as PieChartIcon, Tags, TrendingDown, HelpCircle } from 'lucide-react';
import { BreakdownDonutChart } from './BreakdownDonutChart';
import { EXPENSE_CATEGORIES } from '../services/geminiService';


const tagColors: { [key: string]: string } = {
    'Rent/Mortgage': 'bg-red-100 text-red-800 border-red-200',
    'Utilities': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Groceries': 'bg-green-100 text-green-800 border-green-200',
    'Dining Out': 'bg-blue-100 text-blue-800 border-blue-200',
    'Transportation': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Retail': 'bg-purple-100 text-purple-800 border-purple-200',
    'Entertainment': 'bg-pink-100 text-pink-800 border-pink-200',
    'Healthcare': 'bg-rose-100 text-rose-800 border-rose-200',
    'Subscriptions': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    'Interest': 'bg-amber-100 text-amber-800 border-amber-200',
    'Bank Fees': 'bg-orange-100 text-orange-800 border-orange-200',
    'Personal Transfer': 'bg-teal-100 text-teal-800 border-teal-200',
    'Internal Transfer': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Other Expense': 'bg-gray-200 text-gray-800 border-gray-300',
    'Default': 'bg-gray-200 text-gray-800 border-gray-300',
};

const getTagColor = (category: string) => tagColors[category] || tagColors['Default'];

const tagDotColors: { [key: string]: string } = {
    'Rent/Mortgage': 'bg-red-400',
    'Utilities': 'bg-yellow-400',
    'Groceries': 'bg-green-400',
    'Dining Out': 'bg-blue-400',
    'Transportation': 'bg-indigo-400',
    'Retail': 'bg-purple-400',
    'Entertainment': 'bg-pink-400',
    'Healthcare': 'bg-rose-400',
    'Subscriptions': 'bg-fuchsia-400',
    'Interest': 'bg-amber-400',
    'Bank Fees': 'bg-orange-400',
    'Personal Transfer': 'bg-teal-400',
    'Internal Transfer': 'bg-cyan-400',
    'Other Expense': 'bg-gray-400',
    'Default': 'bg-gray-400',
};
const getTagDotColor = (category: string) => tagDotColors[category] || tagDotColors['Default'];

interface CategorySelectorProps {
    currentCategory: string;
    onCategoryChange: (newCategory: string) => void;
    ariaLabel: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ currentCategory, onCategoryChange, ariaLabel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (category: string) => {
        onCategoryChange(category);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative inline-block w-full max-w-[150px]">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between pl-2 pr-1 py-1 rounded-md text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${getTagColor(currentCategory)}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={ariaLabel}
            >
                <span className="truncate">{currentCategory}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-current opacity-70`} />
            </button>
            {isOpen && (
                <ul
                    className="absolute z-10 mt-1 w-max min-w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                    tabIndex={-1}
                    role="listbox"
                    aria-label="Categories"
                >
                    {EXPENSE_CATEGORIES.map(category => (
                        <li
                            key={category}
                            onClick={() => handleSelect(category)}
                            className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                            role="option"
                            aria-selected={category === currentCategory}
                        >
                            <div className="flex items-center">
                                <span className={`w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0 ${getTagDotColor(category)}`}></span>
                                <span className="font-normal block whitespace-nowrap">{category}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const getStartOfMonth = (d: Date): Date => {
    const date = new Date(d.getFullYear(), d.getMonth(), 1);
    date.setHours(0, 0, 0, 0);
    return date;
};

export const ExpensesDetailView: React.FC<{ 
    transactions: Transaction[];
    onUpdateTransaction: (transactionId: string, updates: { category?: string }) => void;
    onExplainTransaction: (transactionId: string) => void;
}> = ({ transactions, onUpdateTransaction, onExplainTransaction }) => {
    const [activeYear, setActiveYear] = useState<string>('All');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    
    const allUniquePeriods = useMemo(() => {
        const periodKeys = new Set<string>();
        if (transactions) {
            transactions.forEach(t => {
                if (t.type === 'Expense') {
                    const startDate = getStartOfMonth(t.date);
                    periodKeys.add(startDate.toISOString());
                }
            });
        }
        return periodKeys;
    }, [transactions]);
    
    const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(() => new Set(allUniquePeriods));
    
    useEffect(() => {
        setExpandedPeriods(new Set(allUniquePeriods));
    }, [allUniquePeriods]);

    const togglePeriod = (periodKey: string) => {
        setExpandedPeriods(prev => {
            const newSet = new Set(prev);
            if (newSet.has(periodKey)) {
                newSet.delete(periodKey);
            } else {
                newSet.add(periodKey);
            }
            return newSet;
        });
    };

    const availableCategories = useMemo(() => {
        if (!transactions) return [];
        const categories = new Set<string>();
        transactions.forEach(t => {
            if (t.type === 'Expense') {
                categories.add(t.category);
            }
        });
        return Array.from(categories).sort();
    }, [transactions]);

    const availableYearsForFilter = useMemo(() => {
        if (!transactions) return ['All'];
        const years = new Set<string>();
        transactions.forEach(t => {
            if (t.type === 'Expense') {
                years.add(t.date.getFullYear().toString());
            }
        });
        return ['All', ...Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))];
    }, [transactions]);


    const handleCategoryClick = (category: string) => {
        setSelectedCategories(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(category)) {
                newSelection.delete(category);
            } else {
                newSelection.add(category);
            }
            return Array.from(newSelection);
        });
    };
    
    const filteredExpenses = useMemo(() => {
        if (!transactions) return [];
        let expenses = transactions.filter(t => t.type === 'Expense');
        
        if (activeYear !== 'All') {
            expenses = expenses.filter(t => t.date.getFullYear().toString() === activeYear);
        }
        return expenses;
    }, [transactions, activeYear]);

    const totalFilteredExpenses = useMemo(() => {
        return filteredExpenses.reduce((acc, t) => acc + t.amount, 0);
    }, [filteredExpenses]);

    const listFilteredExpenses = useMemo(() => {
        if (selectedCategories.length === 0) {
            return filteredExpenses;
        }
        return filteredExpenses.filter(t => selectedCategories.includes(t.category));
    }, [filteredExpenses, selectedCategories]);

    const groupedExpenses = useMemo(() => {
        const getPeriodLabel = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        return listFilteredExpenses.reduce((acc, t) => {
            const startDate = getStartOfMonth(t.date);
            const periodKey = startDate.toISOString();

            if (!acc[periodKey]) {
                acc[periodKey] = { label: getPeriodLabel(startDate), transactions: [] };
            }
            acc[periodKey].transactions.push(t);
            return acc;
        }, {} as Record<string, {label: string, transactions: Transaction[]}>);
    }, [listFilteredExpenses]);

    const sortedPeriods = useMemo(() => {
        return Object.keys(groupedExpenses).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    }, [groupedExpenses]);

    const categorySpotlights = useMemo(() => {
        if (!filteredExpenses || filteredExpenses.length === 0) {
            return [];
        }

        const categoryTotals: { [key: string]: number } = {};
        filteredExpenses.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const spotlightCandidates: { name: string; total: number; data: { [key:string]: number }; colors: string[] }[] = [];
        const processedCategories = new Set<string>();

        // --- Standard/Typical Spotlights ---

        // Food (Groceries + Dining Out)
        const foodTotal = (categoryTotals['Groceries'] || 0) + (categoryTotals['Dining Out'] || 0);
        if (foodTotal > 0) {
            spotlightCandidates.push({
                name: 'Food',
                total: foodTotal,
                data: { 'Groceries': categoryTotals['Groceries'] || 0, 'Dining Out': categoryTotals['Dining Out'] || 0 },
                colors: ['#10B981', '#34D399']
            });
            processedCategories.add('Groceries');
            processedCategories.add('Dining Out');
        }

        // Rent/Mortgage
        const rentTotal = categoryTotals['Rent/Mortgage'] || 0;
        if (rentTotal > 0) {
            spotlightCandidates.push({
                name: 'Rent/Mortgage',
                total: rentTotal,
                data: { 'Rent/Mortgage': rentTotal },
                colors: ['#EF4444']
            });
            processedCategories.add('Rent/Mortgage');
        }

        // Subscriptions (breakdown by description)
        const subscriptionsTotal = categoryTotals['Subscriptions'] || 0;
        if (subscriptionsTotal > 0) {
            const subsData: { [key: string]: number } = {};
            filteredExpenses
                .filter(t => t.category === 'Subscriptions')
                .forEach(t => {
                    subsData[t.description] = (subsData[t.description] || 0) + t.amount;
                });
            spotlightCandidates.push({
                name: 'Subscriptions',
                total: subscriptionsTotal,
                data: Object.keys(subsData).length > 0 ? subsData : { 'Subscriptions': 0 },
                colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE']
            });
            processedCategories.add('Subscriptions');
        }

        // Transportation
        const transportTotal = categoryTotals['Transportation'] || 0;
        if (transportTotal > 0) {
            spotlightCandidates.push({
                name: 'Transportation',
                total: transportTotal,
                data: { 'Transportation': transportTotal },
                colors: ['#3B82F6']
            });
            processedCategories.add('Transportation');
        }

        // --- Other High-Spending Categories ---
        const otherCategoryColors = [
            ['#F59E0B'], ['#EC4899'], ['#6366F1'], ['#F43F5E'],
            ['#14B8A6'], ['#F97316'], ['#0EA5E9'], ['#D946EF'],
        ];
        let colorIndex = 0;

        Object.entries(categoryTotals).forEach(([category, total]) => {
            if (!processedCategories.has(category) && total > 0) {
                spotlightCandidates.push({
                    name: category,
                    total: total,
                    data: { [category]: total },
                    colors: otherCategoryColors[colorIndex++ % otherCategoryColors.length]
                });
            }
        });

        return spotlightCandidates
            .sort((a, b) => b.total - a.total)
            .slice(0, 4);
    }, [filteredExpenses]);


    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                 <div className="flex items-center text-gray-800 mb-4 sm:mb-0">
                    <TrendingDown className="w-6 h-6 mr-3" />
                    <h2 className="font-semibold text-xl">Expenses</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                     <div className="relative">
                         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                            <Calendar className="w-4 h-4"/>
                         </div>
                         <select
                            value={activeYear}
                            onChange={(e) => setActiveYear(e.target.value)}
                            className="appearance-none w-full sm:w-40 bg-gray-100 border border-gray-200 text-gray-700 py-2 pl-9 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-semibold text-sm"
                            aria-label="Select year to filter expenses"
                         >
                            {availableYearsForFilter.map(year => (
                               <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>
                            ))}
                         </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown className="w-4 h-4" />
                         </div>
                    </div>
                </div>
            </div>

            <div className="text-center mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-base font-semibold text-gray-500 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 mr-1.5 text-red-600"/>
                    Total Expenses
                </h3>
                <p className="text-4xl font-bold text-red-600 mt-2 tracking-tight">{formatCurrency(totalFilteredExpenses)}</p>
                <p className="text-sm text-gray-500 mt-1">{activeYear === 'All' ? 'For All Time' : `For ${activeYear}`}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-8">
                <div className="flex items-center text-gray-600 mb-4">
                    <PieChartIcon className="w-5 h-5 mr-2" />
                    <h3 className="font-semibold text-lg">Category Spotlights</h3>
                </div>
            </div>

            <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categorySpotlights.map(spotlight => (
                        <div key={spotlight.name} className="bg-gray-50/50 p-4 rounded-xl border border-gray-200/80">
                            <BreakdownDonutChart 
                                title={spotlight.name} 
                                totalAmount={spotlight.total} 
                                data={spotlight.data} 
                                colors={spotlight.colors} 
                            />
                        </div>
                    ))}
                     {categorySpotlights.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            <p>No expense data available for spotlights.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg mb-6">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center text-gray-600 font-semibold text-sm mr-2">
                        <Tags className="w-4 h-4 mr-2" />
                        <span>Filter by Category:</span>
                    </div>
                    <button
                        onClick={() => setSelectedCategories([])}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 ${
                            selectedCategories.length === 0 ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                    >
                        All Categories
                    </button>
                    {availableCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => handleCategoryClick(category)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 border ${
                                selectedCategories.includes(category) ? 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-200' : 'bg-white text-gray-700 hover:bg-gray-200 border-gray-300'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>


            <div className="space-y-6">
                {sortedPeriods.map(periodKey => {
                    const periodTransactions = groupedExpenses[periodKey].transactions;
                    const monthlyTotal = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);

                    return (
                        <div key={periodKey}>
                            <div onClick={() => togglePeriod(periodKey)} className="flex items-center justify-between cursor-pointer mb-2 group p-2 -mx-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center">
                                    {expandedPeriods.has(periodKey) ? <ChevronDown className="w-5 h-5 mr-2 text-gray-500 group-hover:text-gray-800" /> : <ChevronRight className="w-5 h-5 mr-2 text-gray-500 group-hover:text-gray-800" />}
                                    <h3 className="font-semibold text-gray-800">{groupedExpenses[periodKey].label}</h3>
                                    <span className="ml-2 text-sm font-medium text-gray-500 bg-gray-200/60 rounded-full px-2.5 py-0.5 text-center min-w-[24px]">{periodTransactions.length}</span>
                                </div>
                                <span className="font-bold text-gray-800 text-base">{formatCurrency(monthlyTotal)}</span>
                            </div>
                            {expandedPeriods.has(periodKey) && (
                                <div className="pl-7">
                                    <div className="border-l border-gray-200">
                                    <div className="table w-full">
                                        <div className="table-header-group text-sm font-medium text-gray-500">
                                            <div className="table-row">
                                                <div className="table-cell p-2 border-b border-gray-200"><CircleDot className="inline w-4 h-4 mr-2" />Source</div>
                                                <div className="table-cell p-2 border-b border-gray-200 w-32"><Wallet className="inline w-4 h-4 mr-2" />Amount</div>
                                                <div className="table-cell p-2 border-b border-gray-200 w-48"><Tag className="inline w-4 h-4 mr-2" />Category</div>
                                                <div className="table-cell p-2 border-b border-gray-200 w-48"><Calendar className="inline w-4 h-4 mr-2" />Date</div>
                                            </div>
                                        </div>
                                        <div className="table-row-group">
                                        {periodTransactions.sort((a, b) => b.date.getTime() - a.date.getTime()).map(t => (
                                            <div key={t.id} className="table-row text-sm hover:bg-gray-50">
                                                <div className="table-cell p-2 border-b border-gray-100 align-middle">
                                                    <div className="flex items-center">
                                                        <span className="text-gray-800 truncate font-medium" title={t.description}>{t.description}</span>
                                                        <button
                                                            onClick={() => onExplainTransaction(t.id)}
                                                            className="ml-2 text-gray-400 hover:text-blue-600 transition-colors duration-200 flex-shrink-0"
                                                            title="Get AI explanation for this transaction"
                                                            aria-label={`Get AI explanation for ${t.description}`}
                                                        >
                                                            <HelpCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="table-cell p-2 border-b border-gray-100 align-middle text-gray-700">{formatCurrency(t.amount)}</div>
                                                <div className="table-cell p-2 border-b border-gray-100 align-middle">
                                                   <CategorySelector
                                                        currentCategory={t.category}
                                                        onCategoryChange={(newCategory) => onUpdateTransaction(t.id, { category: newCategory })}
                                                        ariaLabel={`Change category for ${t.description}`}
                                                    />
                                                </div>
                                                <div className="table-cell p-2 border-b border-gray-100 align-middle text-gray-600">{formatDate(t.date)}</div>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {sortedPeriods.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No expenses found for the selected period and categories.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
