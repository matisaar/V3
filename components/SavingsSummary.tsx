

import React, { useState, useMemo, useEffect } from 'react';
import { PeriodSummary } from '../types';
import { Calendar, SlidersHorizontal, ArrowUpCircle, ArrowDownCircle, ChevronDown, Scale } from 'lucide-react';

const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    let formattedValue;

    if (absValue >= 1000) {
        formattedValue = `$${(absValue / 1000).toFixed(1)}K`;
    } else {
        formattedValue = `$${absValue.toFixed(0)}`;
    }
    
    return value < 0 ? `-${formattedValue}` : formattedValue;
};

const INITIAL_DISPLAY_COUNT = 8;


// FIX: Added interface definition for component props.
interface SavingsSummaryProps {
    periodData: PeriodSummary[];
}

export const SavingsSummary: React.FC<SavingsSummaryProps> = ({ periodData }) => {
    const [activeYear, setActiveYear] = useState<string>('All');
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const availableYears = useMemo(() => {
        const years = new Set(periodData.map(m => m.year.toString()));
        // FIX: Explicitly typed sort callback parameters to prevent type inference issues.
        return ['All', ...Array.from(years).sort((a: string, b: string) => parseInt(b) - parseInt(a))];
    }, [periodData]);

    const filteredPeriods = useMemo(() => {
        let filtered = periodData.filter(m => m.income > 0 || m.expenses > 0);
        if (activeYear !== 'All') {
            filtered = filtered.filter(m => m.year.toString() === activeYear);
        }
        // Sort descending to show most recent first
        return filtered.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    }, [periodData, activeYear]);
    
    const periodsToDisplay = useMemo(() => {
        if (isExpanded) {
            return filteredPeriods;
        }
        return filteredPeriods.slice(0, INITIAL_DISPLAY_COUNT);
    }, [filteredPeriods, isExpanded]);

    // Reset expansion when filters change to avoid showing a large list with new data
    useEffect(() => {
        setIsExpanded(false);
    }, [activeYear]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="flex items-center text-gray-600 mb-4 sm:mb-0">
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    <h3 className="font-semibold text-lg">Monthly Breakdown</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                            <Calendar className="w-4 h-4"/>
                         </div>
                         <select
                            value={activeYear}
                            onChange={(e) => setActiveYear(e.target.value)}
                            className="appearance-none w-full sm:w-40 bg-gray-100 border border-gray-200 text-gray-700 py-2 pl-9 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-semibold text-sm"
                            aria-label="Select year to filter savings"
                         >
                            {availableYears.map(year => (
                               <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>
                            ))}
                         </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown className="w-4 h-4" />
                         </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {periodsToDisplay.map(period => (
                    <div key={period.startDate.toISOString()} className="bg-gray-50 border border-gray-200/80 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                            <div className={`w-3 h-3 rounded-full mr-2 ${(period.income - period.expenses) > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <h4 className="font-semibold text-gray-700 text-sm">{period.periodLabel}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                           <div className="flex items-center justify-between text-green-600">
                                <div className="flex items-center">
                                    <ArrowUpCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                    <span>Income:</span>
                                </div>
                                <span className="font-semibold">{formatCurrency(period.income)}</span>
                           </div>
                           <div className="flex items-center justify-between text-red-600">
                                <div className="flex items-center">
                                    <ArrowDownCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                    <span>Expenses:</span>
                                </div>
                                <span className="font-semibold">{formatCurrency(period.expenses)}</span>
                           </div>
                           <div className={`flex items-center justify-between font-medium ${(period.income - period.expenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                               <div className="flex items-center">
                                    <Scale className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                    <span>Net:</span>
                               </div>
                                <span className="font-bold">{formatCurrency(period.income - period.expenses)}</span>
                           </div>
                        </div>
                    </div>
                ))}
                 {filteredPeriods.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                        No data available for this period.
                    </div>
                )}
            </div>

            {filteredPeriods.length > INITIAL_DISPLAY_COUNT && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center mx-auto bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg"
                        aria-expanded={isExpanded}
                    >
                        {isExpanded ? 'Show Less' : `Show ${filteredPeriods.length - INITIAL_DISPLAY_COUNT} More`}
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            )}
        </div>
    );
};
