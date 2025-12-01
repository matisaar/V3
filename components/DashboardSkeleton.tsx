import React from 'react';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="bg-gray-200 p-6 rounded-xl h-[120px]"></div>

            <div className="bg-gray-200 p-6 rounded-xl h-[320px]"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="bg-gray-200 p-6 rounded-xl h-[320px]"></div>
                <div className="bg-gray-200 p-6 rounded-xl h-[320px]"></div>
            </div>

            <div className="bg-gray-200 p-6 rounded-xl h-[120px]"></div>
            
            <div className="bg-gray-200 p-6 rounded-xl h-[120px]"></div>
        </div>
    );
};
