import React from 'react';
import { MoneyIcon } from './icons';
import { FileUp, Loader } from 'lucide-react';

interface HeaderProps {
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading: boolean;
    user?: { id: string | null; email?: string | null } | null;
    onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onFileChange, isLoading, user, onSignOut }) => {
    return (
        <header
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200"
        >
            <div className="flex items-center mb-4 sm:mb-0">
                <div className="bg-gray-800 p-3 rounded-lg mr-4">
                    <MoneyIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Personal Finance Tracker</h1>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {user && user.id ? (
                    <>
                        <div className="text-sm text-gray-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full flex items-center mr-2">
                            <svg className="w-3 h-3 text-green-600 mr-2" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                            <span className="truncate">Signed in as <span className="font-semibold">{user.email ?? 'Account'}</span></span>
                        </div>
                        <button
                            className="ml-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full border border-gray-300 font-semibold transition-colors duration-150"
                            onClick={onSignOut}
                        >Sign Out</button>
                    </>
                ) : (
                    <div style={{ minWidth: 210, minHeight: 32 }}></div>
                )}
                <label
                    className="cursor-pointer bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center"
                    style={{ minWidth: 140 }}
                >
                    {isLoading ? (
                        <>
                            <Loader className="animate-spin w-5 h-5 mr-2" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <FileUp className="w-5 h-5 mr-2" />
                            <span>Upload CSV(s)</span>
                        </>
                    )}
                    <input type="file" className="hidden" accept=".csv" onChange={onFileChange} disabled={isLoading} multiple />
                </label>
            </div>
            {/* The Gemini API key is read from .env.local (VITE_GEMINI_API_KEY). */}
        </header>
    );
};