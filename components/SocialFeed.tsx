import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { ThumbsUp, ThumbsDown, MessageCircle, DollarSign } from 'lucide-react';

interface SocialFeedProps {
    transactions: Transaction[];
    user?: { firstName?: string | null; email?: string | null } | null;
}

const SocialFeed: React.FC<SocialFeedProps> = ({ transactions, user }) => {
    // Group transactions by date AND user
    const groupedPosts = useMemo(() => {
        const groups: { [key: string]: { date: string, userId: string, userName: string, transactions: Transaction[], timestamp: number } } = {};
        
        // Sort transactions by date descending
        const sorted = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());

        sorted.forEach(t => {
            const dateStr = t.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            // Use userId if available, otherwise fallback to 'unknown' or the current user's id if it matches
            const tUserId = t.userId || 'anonymous';
            const tUserName = t.userName || (tUserId === user?.email ? (user?.firstName || 'You') : 'Anonymous User');

            const key = `${dateStr}_${tUserId}`;

            if (!groups[key]) {
                groups[key] = {
                    date: dateStr,
                    userId: tUserId,
                    userName: tUserName,
                    transactions: [],
                    timestamp: t.date.getTime()
                };
            }
            groups[key].transactions.push(t);
        });

        // Convert to array and sort by timestamp descending
        return Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
    }, [transactions, user]);

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <p>No transactions to display in the feed.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            {groupedPosts.map(post => (
                <div key={`${post.date}-${post.userId}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Post Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                            <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} 
                                alt="User Avatar" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {post.userName}
                            </h3>
                            <p className="text-xs text-gray-500">{post.date}</p>
                        </div>
                    </div>

                    {/* Post Content (Transactions List) */}
                    <div className="p-4 space-y-3">
                        {post.transactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between group">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-medium text-gray-700 truncate uppercase text-sm tracking-wide">
                                            {t.description}
                                        </span>
                                        {t.bucketOfLife && (
                                            <span className="text-xs text-gray-400 truncate">
                                                {t.bucketOfLife}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <DollarSign className="w-3 h-3 text-green-600" />
                                    </div>
                                    <span className="font-bold text-gray-900">
                                        ${Math.abs(t.amount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Post Actions */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-gray-500">
                        <button className="flex items-center space-x-1.5 hover:text-green-600 transition-colors">
                            <ThumbsUp className="w-5 h-5" />
                            <span className="text-sm font-medium">0</span>
                        </button>
                        <button className="flex items-center space-x-1.5 hover:text-red-600 transition-colors">
                            <ThumbsDown className="w-5 h-5" />
                            <span className="text-sm font-medium">0</span>
                        </button>
                        <button className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">0</span>
                        </button>
                    </div>
                    
                    {/* Comment Input Placeholder */}
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                             <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'mateus'}`} 
                                alt="User Avatar" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Add a comment..." 
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-700 placeholder-gray-400"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SocialFeed;
