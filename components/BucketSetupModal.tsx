// FIX: Create BucketSetupModal.tsx to provide the BucketsOfLifeSetupModal component and resolve module not found errors.
import React, { useState, useEffect } from 'react';
import { BucketOfLife } from '../types';
import { X, Plus, Sparkles, Tag, ArrowRight, Building, Car, Briefcase, ShoppingBag } from 'lucide-react';

interface BucketsOfLifeSetupModalProps {
    isOpen: boolean;
    onComplete: (buckets: BucketOfLife[]) => void;
    onSkip: () => void;
    initialBucketsOfLife: BucketOfLife[];
}

const KeywordPill: React.FC<{ keyword: string; onRemove: () => void }> = ({ keyword, onRemove }) => (
    <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full flex items-center">
        {keyword}
        <button onClick={onRemove} className="ml-2 text-blue-500 hover:text-blue-700">
            <X className="w-3 h-3" />
        </button>
    </div>
);

const getIconForBucket = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('car') || lowerName.includes('vehicle')) return <Car className="w-6 h-6" />;
    if (lowerName.includes('property') || lowerName.includes('rental')) return <Building className="w-6 h-6" />;
    if (lowerName.includes('business') || lowerName.includes('freelance')) return <Briefcase className="w-6 h-6" />;
    if (lowerName.includes('shop') || lowerName.includes('retail')) return <ShoppingBag className="w-6 h-6" />;
    return <Sparkles className="w-6 h-6" />;
};

const BucketCard: React.FC<{
    bucket: BucketOfLife;
    onUpdate: (updates: Partial<BucketOfLife>) => void;
    onRemove: () => void;
}> = ({ bucket, onUpdate, onRemove }) => {
    const [currentKeyword, setCurrentKeyword] = useState('');

    const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentKeyword.trim()) {
            e.preventDefault();
            const newKeyword = currentKeyword.trim().toLowerCase();
            if (!bucket.keywords.includes(newKeyword)) {
                onUpdate({ keywords: [...bucket.keywords, newKeyword] });
            }
            setCurrentKeyword('');
        }
    };
    
    const handleRemoveKeyword = (keywordToRemove: string) => {
        onUpdate({ keywords: bucket.keywords.filter(k => k !== keywordToRemove) });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 relative">
             <button onClick={onRemove} className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors" aria-label="Remove bucket">
                <X className="w-4 h-4" />
            </button>
            <div className="flex items-start mb-4">
                <div className="p-3 bg-gray-100 rounded-lg mr-4 text-gray-600">{getIconForBucket(bucket.name)}</div>
                <div>
                    <input
                        type="text"
                        value={bucket.name}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        placeholder="e.g., Side Business"
                        className="text-lg font-bold text-gray-800 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none w-full transition-colors"
                    />
                    <p className="text-sm text-gray-500 mt-1">Provide keywords to group transactions for this bucket.</p>
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
                <div className="mt-3 flex flex-wrap gap-2 min-h-[30px]">
                    {bucket.keywords.map(k => (
                        <KeywordPill key={k} keyword={k} onRemove={() => handleRemoveKeyword(k)} />
                    ))}
                </div>
                 {bucket.keywords.length === 0 && <p className="text-xs text-gray-400 mt-2">Add keywords to help us categorize transactions.</p>}
            </div>
        </div>
    );
};


export const BucketsOfLifeSetupModal: React.FC<BucketsOfLifeSetupModalProps> = ({ isOpen, onComplete, onSkip, initialBucketsOfLife }) => {
    const [buckets, setBuckets] = useState<BucketOfLife[]>([]);
    
    useEffect(() => {
        if (isOpen) {
            setBuckets(initialBucketsOfLife);
        }
    }, [isOpen, initialBucketsOfLife]);

    if (!isOpen) return null;

    const updateBucket = (id: string, updates: Partial<BucketOfLife>) => {
        setBuckets(buckets.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const addCustomBucket = () => {
        setBuckets([...buckets, { id: `custom-${Date.now().toString()}`, name: '', keywords: [] }]);
    };
    
    const removeBucket = (id: string) => {
        setBuckets(buckets.filter(b => b.id !== id));
    };

    const handleComplete = () => {
        const validBuckets = buckets.filter(b => b.name.trim() && b.keywords.length > 0);
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
                    <div className='flex items-center mb-1'>
                        <Sparkles className="w-6 h-6 text-blue-500 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-800">Set Up Your Financial Buckets</h2>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Our AI has suggested some "Buckets of Life" based on your transactions. Review them, add keywords, or create your own. This helps us sort transactions for better insights. Anything not in a bucket goes to 'Personal'.
                    </p>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {buckets.length > 0 ? buckets.map(bucket => (
                        <BucketCard
                            key={bucket.id}
                            bucket={bucket}
                            onUpdate={(updates) => updateBucket(bucket.id, updates)}
                            onRemove={() => removeBucket(bucket.id)}
                        />
                    )) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>No buckets suggested. You can add one manually.</p>
                        </div>
                    )}
                    
                    <button onClick={addCustomBucket} className="w-full flex items-center justify-center text-sm font-semibold text-blue-600 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg py-4 hover:bg-blue-100 hover:border-blue-300 transition-colors">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Custom Bucket
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
