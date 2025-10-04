

import React, { useState } from 'react';
// FIX: Changed CustomPartOfLife to BucketOfLife to match the exported type from '../types'.
import { BucketOfLife } from '../types';
import { X, Plus, Car, Building, Sparkles, Tag, ArrowRight } from 'lucide-react';

interface BucketSetupModalProps {
    isOpen: boolean;
    onComplete: (buckets: BucketOfLife[]) => void;
    onSkip: () => void;
}

const KeywordPill: React.FC<{ keyword: string; onRemove: () => void }> = ({ keyword, onRemove }) => (
    <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full flex items-center">
        {keyword}
        <button onClick={onRemove} className="ml-2 text-blue-500 hover:text-blue-700">
            <X className="w-3 h-3" />
        </button>
    </div>
);

const BucketCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    bucket: BucketOfLife;
    onNameChange: (name: string) => void;
    onKeywordsChange: (keywords: string[]) => void;
    isCustom: boolean;
    onRemove?: () => void;
}> = ({ icon, title, description, bucket, onNameChange, onKeywordsChange, isCustom, onRemove }) => {
    const [currentKeyword, setCurrentKeyword] = useState('');

    const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentKeyword.trim()) {
            e.preventDefault();
            if (!bucket.keywords.includes(currentKeyword.trim().toLowerCase())) {
                onKeywordsChange([...bucket.keywords, currentKeyword.trim().toLowerCase()]);
            }
            setCurrentKeyword('');
        }
    };
    
    const handleRemoveKeyword = (keywordToRemove: string) => {
        onKeywordsChange(bucket.keywords.filter(k => k !== keywordToRemove));
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 relative">
            {isCustom && onRemove && (
                 <button onClick={onRemove} className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors" aria-label="Remove bucket">
                    <X className="w-4 h-4" />
                </button>
            )}
            <div className="flex items-start mb-4">
                <div className="p-3 bg-gray-100 rounded-lg mr-4 text-gray-600">{icon}</div>
                <div>
                    {isCustom ? (
                        <input
                            type="text"
                            value={bucket.name}
                            onChange={(e) => onNameChange(e.target.value)}
                            placeholder="e.g., Side Business"
                            className="text-lg font-bold text-gray-800 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none w-full transition-colors"
                        />
                    ) : (
                        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    )}
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-600 flex items-center mb-2">
                    <Tag className="w-4 h-4 mr-2" />
                    Keywords
                </label>
                <input
                    type="text"
                    value={currentKeyword}
                    onChange={(e) => setCurrentKeyword(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    placeholder="Type a keyword and press Enter"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                    {bucket.keywords.map(k => (
                        <KeywordPill key={k} keyword={k} onRemove={() => handleRemoveKeyword(k)} />
                    ))}
                </div>
                 {bucket.keywords.length === 0 && <p className="text-xs text-gray-400 mt-2">No keywords added yet.</p>}
            </div>
        </div>
    );
};


export const EntitySetupModal: React.FC<BucketSetupModalProps> = ({ isOpen, onComplete, onSkip }) => {
    const [buckets, setBuckets] = useState<BucketOfLife[]>([
        { id: 'vehicle', name: 'Vehicle', keywords: ['gas', 'insurance', 'service', 'mechanic', 'loan payment'] },
        { id: 'property', name: 'Rental Property', keywords: ['rent', 'strata', 'property tax', 'mortgage'] }
    ]);

    if (!isOpen) return null;

    const updateBucket = (id: string, updates: Partial<BucketOfLife>) => {
        setBuckets(buckets.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const addCustomBucket = () => {
        setBuckets([...buckets, { id: Date.now().toString(), name: '', keywords: [] }]);
    };
    
    const removeCustomBucket = (id: string) => {
        setBuckets(buckets.filter(e => e.id !== id));
    };

    const handleComplete = () => {
        const validBuckets = buckets.filter(e => e.name.trim() && e.keywords.length > 0);
        onComplete(validBuckets);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Set Up Your Financial Buckets</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Help our AI sort transactions by providing keywords for big financial areas (e.g., a car, a rental property). Everything else will go into your 'Personal' bucket.
                    </p>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <BucketCard
                        icon={<Car className="w-6 h-6" />}
                        title="Vehicle"
                        description="Track car-related costs like gas, insurance, loans, and maintenance."
                        bucket={buckets.find(e => e.id === 'vehicle')!}
                        onKeywordsChange={(keywords) => updateBucket('vehicle', { keywords })}
                        onNameChange={() => {}}
                        isCustom={false}
                    />
                     <BucketCard
                        icon={<Building className="w-6 h-6" />}
                        title="Rental Property"
                        description="Group income and expenses for properties you manage. Add street names or property IDs as keywords."
                        bucket={buckets.find(e => e.id === 'property')!}
                        onKeywordsChange={(keywords) => updateBucket('property', { keywords })}
                        onNameChange={() => {}}
                        isCustom={false}
                    />
                    {buckets.filter(e => !['vehicle', 'property'].includes(e.id)).map(bucket => (
                        <BucketCard
                            key={bucket.id}
                            icon={<Sparkles className="w-6 h-6" />}
                            title="Custom Bucket"
                            description="Track a side-business, a specific project, or anything else with its own finances."
                            bucket={bucket}
                            onKeywordsChange={(keywords) => updateBucket(bucket.id, { keywords })}
                            onNameChange={(name) => updateBucket(bucket.id, { name })}
                            isCustom={true}
                            onRemove={() => removeCustomBucket(bucket.id)}
                        />
                    ))}
                    
                    <button onClick={addCustomBucket} className="w-full flex items-center justify-center text-sm font-semibold text-blue-600 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg py-4 hover:bg-blue-100 hover:border-blue-300 transition-colors">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Another Custom Bucket
                    </button>
                </div>

                <div className="p-6 mt-auto border-t border-gray-200 bg-white/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button onClick={onSkip} className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                        Skip for Now
                    </button>
                    <button onClick={handleComplete} className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center">
                        Save & Analyze Transactions
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};