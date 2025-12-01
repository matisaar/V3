
import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { PeriodSummary } from '../types';
import { Activity } from 'lucide-react';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
};

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const net = data.income - data.expenses;
    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200 text-sm w-48">
        <p className="font-bold text-gray-800 mb-2">{data.fullName}</p>
        <div className="space-y-1">
            <p className="flex justify-between items-center">
                <span className="text-green-600 font-medium flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Income
                </span>
                <span className="font-semibold">{formatCurrency(data.income)}</span>
            </p>
            <p className="flex justify-between items-center">
                <span className="text-red-600 font-medium flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>Expenses
                </span>
                <span className="font-semibold">{formatCurrency(data.expenses)}</span>
            </p>
            <hr className="my-2 border-gray-200" />
            <p className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Net</span>
                <span className={`font-bold text-lg ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(net)}</span>
            </p>
        </div>
      </div>
    );
  }
  return null;
};

interface SavingsChartProps {
    data: PeriodSummary[];
}

export const SavingsChart: React.FC<SavingsChartProps> = ({ data }) => {
    const chartData = data
      .filter(p => p.income > 0 || p.expenses > 0)
      .map(period => {
        const net = period.income - period.expenses;
        // For profit, the area is between expenses (bottom) and income (top)
        const profitRange = net >= 0 ? [period.expenses, period.income] : [period.income, period.income];
        // For loss, the area is between income (bottom) and expenses (top)
        const lossRange = net < 0 ? [period.income, period.expenses] : [period.expenses, period.expenses];

        return {
            name: period.periodLabel,
            fullName: period.periodLabel,
            income: period.income,
            expenses: period.expenses,
            profitRange,
            lossRange,
        };
    });

    return (
        <div>
            <div className="flex items-center text-gray-600 mb-4">
                <Activity className="w-5 h-5 mr-2" />
                <h3 className="font-semibold text-lg">Monthly Cash Flow</h3>
            </div>
            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tickFormatter={formatCurrency} tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />

                        <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                            </linearGradient>
                             <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05}/>
                            </linearGradient>
                        </defs>
                        
                        {/* Shaded areas between lines */}
                        <Area type="monotone" dataKey="profitRange" stroke="none" fill="url(#colorProfit)" />
                        <Area type="monotone" dataKey="lossRange" stroke="none" fill="url(#colorLoss)" />

                        <Line 
                            type="monotone" 
                            dataKey="income" 
                            stroke="#10B981" 
                            strokeWidth={2.5} 
                            dot={{ r: 0 }}
                            activeDot={{ r: 6, fill: 'white', stroke: '#10B981', strokeWidth: 2 }}
                        />
                         <Line 
                            type="monotone" 
                            dataKey="expenses" 
                            stroke="#EF4444" 
                            strokeWidth={2.5} 
                            dot={{ r: 0 }}
                            activeDot={{ r: 6, fill: 'white', stroke: '#EF4444', strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
