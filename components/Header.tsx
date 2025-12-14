import React, { useRef, useState } from 'react';
import { MoneyIcon } from './icons';
import { FileUp, Loader, Camera } from 'lucide-react';
import { uploadAvatar, updateProfileAvatar } from '../services/supabaseClient';

interface HeaderProps {
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading: boolean;
    user?: { id: string | null; email?: string | null; avatarUrl?: string | null } | null;
    onSignOut?: () => void;
    onAvatarUpdate?: (newUrl: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onFileChange, isLoading, user, onSignOut, onAvatarUpdate }) => {
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;
        
        setIsUploadingAvatar(true);
        try {
            const avatarUrl = await uploadAvatar(user.id, file);
            if (avatarUrl) {
                await updateProfileAvatar(user.id, avatarUrl);
                onAvatarUpdate?.(avatarUrl);
            }
        } catch (err) {
            console.error('Failed to upload avatar:', err);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

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
                        {/* Avatar with upload */}
                        <div 
                            className="relative w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer group"
                            onClick={() => avatarInputRef.current?.click()}
                            title="Click to change profile picture"
                        >
                            {isUploadingAvatar ? (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                    <Loader className="w-5 h-5 animate-spin text-gray-600" />
                                </div>
                            ) : (
                                <>
                                    <img 
                                        src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                        <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </>
                            )}
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </div>
                        <div className="text-sm text-gray-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full flex items-center">
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