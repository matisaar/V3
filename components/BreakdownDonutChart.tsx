import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Clock } from 'lucide-react';

interface BreakdownDonutChartProps {
    title: string;
    totalAmount: number;
    data: { [category: string]: number };
    colors: string[];
}

const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
};

export const BreakdownDonutChart: React.FC<BreakdownDonutChartProps> = ({ title, totalAmount, data, colors }) => {
    const chartData = Object.entries(data)
        .filter(([, value]) => Number(value) > 0)
        .map(([name, value]) => ({ name, value: Number(value) }));
    
    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 text-sm">
            {payload.map((entry: any, index: number) => (
                <div key={`item-${index}`} className="flex items-center">
                    <div style={{ width: 10, height: 10, backgroundColor: entry.color, marginRight: 8, borderRadius: '50%' }}></div>
                    <span className="text-gray-600">{entry.value}</span>
                </div>
            ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center text-gray-600 mb-4">
                <Clock className="w-5 h-5 mr-2" />
                <h3 className="font-semibold text-lg">{title}</h3>
            </div>
            <div className="relative flex-grow" style={{minHeight: '200px'}}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="90%"
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            cornerRadius={8}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-800">{formatCurrency(totalAmount)}</span>
                    <span className="text-sm text-gray-500">Total Amount</span>
                </div>
            </div>
            <Legend content={renderLegend} />
        </div>
    );
};
