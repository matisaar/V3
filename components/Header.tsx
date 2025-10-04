import React from 'react';
import { MoneyIcon } from './icons';
import { FileUp, Loader } from 'lucide-react';

interface HeaderProps {
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onFileChange, isLoading }) => {
    return (
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center mb-4 sm:mb-0">
                <div className="bg-gray-800 p-3 rounded-lg mr-4">
                    <MoneyIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Personal Finance Tracker</h1>
                </div>
            </div>
            <label className="cursor-pointer bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center">
                {isLoading ? (
                    <>
                        <Loader className="animate-spin w-5 h-5 mr-2" />
                        Processing...
                    </>
                ) : (
                    <>
                        <FileUp className="w-5 h-5 mr-2" />
                        Upload CSV(s)
                    </>
                )}
                <input type="file" className="hidden" accept=".csv" onChange={onFileChange} disabled={isLoading} multiple />
            </label>
            {/* The Gemini API key is read from .env.local (VITE_GEMINI_API_KEY). */}
        </header>
    );
};