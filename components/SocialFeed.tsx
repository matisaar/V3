import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, PostComment } from '../types';
import { ThumbsUp, ThumbsDown, MessageCircle, DollarSign, Send, Loader } from 'lucide-react';
import { getPostReactions, togglePostReaction, getPostComments, addPostComment } from '../services/supabaseClient';

interface SocialFeedProps {
    transactions: Transaction[];
    user?: { id: string | null; firstName?: string | null; email?: string | null } | null;
}

interface PostData {
    postKey: string;
    date: string;
    userId: string;
    userName: string;
    transactions: Transaction[];
    timestamp: number;
    likes: number;
    dislikes: number;
    userReaction: 'like' | 'dislike' | null;
    comments: PostComment[];
    commentsExpanded: boolean;
    reactionsLoaded: boolean;
}

// Helper to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const SocialFeed: React.FC<SocialFeedProps> = ({ transactions, user }) => {
    const [posts, setPosts] = useState<PostData[]>([]);
    const [commentInputs, setCommentInputs] = useState<{ [postKey: string]: string }>({});
    const [loadingStates, setLoadingStates] = useState<{ [postKey: string]: boolean }>({});
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Group transactions by date AND user
    const groupedPosts = useMemo(() => {
        const groups: { [key: string]: Omit<PostData, 'likes' | 'dislikes' | 'userReaction' | 'comments' | 'commentsExpanded' | 'reactionsLoaded'> } = {};
        
        // Sort transactions by date descending
        const sorted = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());

        sorted.forEach(t => {
            const dateStr = t.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            const tUserId = t.userId || 'anonymous';
            const tUserName = t.userName || 'Anonymous User';
            const postKey = `${dateStr}_${tUserId}`;

            if (!groups[postKey]) {
                groups[postKey] = {
                    postKey,
                    date: dateStr,
                    userId: tUserId,
                    userName: tUserName,
                    transactions: [],
                    timestamp: t.date.getTime()
                };
            }
            groups[postKey].transactions.push(t);
        });

        return Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
    }, [transactions]);

    // Initialize posts with default values (no API calls yet)
    useEffect(() => {
        if (groupedPosts.length > 0) {
            const initialPosts: PostData[] = groupedPosts.map(post => ({
                ...post,
                likes: 0,
                dislikes: 0,
                userReaction: null,
                comments: [],
                commentsExpanded: false,
                reactionsLoaded: false,
            }));
            setPosts(initialPosts);
            setIsInitialLoad(false);
        } else {
            setPosts([]);
            setIsInitialLoad(false);
        }
    }, [groupedPosts]);

    // NOTE: Reactions are NOT auto-loaded to avoid rate limiting.
    // They load on-demand when user clicks like/dislike button.

    const handleReaction = async (postKey: string, reactionType: 'like' | 'dislike') => {
        if (!user?.id) return;
        
        setLoadingStates(prev => ({ ...prev, [`${postKey}_${reactionType}`]: true }));
        
        try {
            // If reactions haven't been loaded yet, load them first
            const post = posts.find(p => p.postKey === postKey);
            if (post && !post.reactionsLoaded) {
                const reactions = await getPostReactions(postKey, user.id);
                setPosts(prev => prev.map(p => 
                    p.postKey === postKey 
                        ? { ...p, likes: reactions.likes, dislikes: reactions.dislikes, userReaction: reactions.userReaction, reactionsLoaded: true }
                        : p
                ));
                // Small delay before the toggle
                await delay(100);
            }
            
            await togglePostReaction(postKey, user.id, reactionType);
            
            // Refresh reactions for this post
            const reactions = await getPostReactions(postKey, user.id);
            
            setPosts(prev => prev.map(post => 
                post.postKey === postKey 
                    ? { ...post, likes: reactions.likes, dislikes: reactions.dislikes, userReaction: reactions.userReaction }
                    : post
            ));
        } catch (error) {
            console.error('Failed to toggle reaction:', error);
        } finally {
            setLoadingStates(prev => ({ ...prev, [`${postKey}_${reactionType}`]: false }));
        }
    };

    const handleAddComment = async (postKey: string) => {
        if (!user?.id || !commentInputs[postKey]?.trim()) return;
        
        setLoadingStates(prev => ({ ...prev, [`${postKey}_comment`]: true }));
        
        try {
            const userName = user.firstName || user.email || 'Anonymous User';
            const newComment = await addPostComment(postKey, user.id, userName, commentInputs[postKey].trim());
            
            setPosts(prev => prev.map(post => 
                post.postKey === postKey 
                    ? { ...post, comments: [...post.comments, newComment], commentsExpanded: true }
                    : post
            ));
            
            setCommentInputs(prev => ({ ...prev, [postKey]: '' }));
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setLoadingStates(prev => ({ ...prev, [`${postKey}_comment`]: false }));
        }
    };

    const toggleCommentsExpanded = async (postKey: string) => {
        const post = posts.find(p => p.postKey === postKey);
        if (!post) return;
        
        // If expanding and comments haven't been loaded yet, load them
        if (!post.commentsExpanded && post.comments.length === 0) {
            setLoadingStates(prev => ({ ...prev, [`${postKey}_loadComments`]: true }));
            try {
                const comments = await getPostComments(postKey);
                setPosts(prev => prev.map(p => 
                    p.postKey === postKey 
                        ? { ...p, comments, commentsExpanded: true }
                        : p
                ));
            } catch (error) {
                console.warn('Failed to load comments:', error);
                // Still expand even if loading failed
                setPosts(prev => prev.map(p => 
                    p.postKey === postKey 
                        ? { ...p, commentsExpanded: true }
                        : p
                ));
            } finally {
                setLoadingStates(prev => ({ ...prev, [`${postKey}_loadComments`]: false }));
            }
        } else {
            setPosts(prev => prev.map(p => 
                p.postKey === postKey 
                    ? { ...p, commentsExpanded: !p.commentsExpanded }
                    : p
            ));
        }
    };

    if (isInitialLoad) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mb-2" />
                <p>Loading social feed...</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <p>No transactions to display in the feed.</p>
                <p className="text-sm mt-2">Upload some transactions to share with the community!</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            {posts.map(post => (
                <div key={post.postKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                                    <div className={`w-6 h-6 rounded-full ${t.type === 'Income' ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                                        <DollarSign className={`w-3 h-3 ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`} />
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
                        <button 
                            onClick={() => handleReaction(post.postKey, 'like')}
                            disabled={!user?.id || loadingStates[`${post.postKey}_like`]}
                            className={`flex items-center space-x-1.5 transition-colors ${
                                post.userReaction === 'like' 
                                    ? 'text-green-600' 
                                    : 'hover:text-green-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <ThumbsUp className={`w-5 h-5 ${post.userReaction === 'like' ? 'fill-current' : ''}`} />
                            <span className="text-sm font-medium">{post.likes}</span>
                        </button>
                        <button 
                            onClick={() => handleReaction(post.postKey, 'dislike')}
                            disabled={!user?.id || loadingStates[`${post.postKey}_dislike`]}
                            className={`flex items-center space-x-1.5 transition-colors ${
                                post.userReaction === 'dislike' 
                                    ? 'text-red-600' 
                                    : 'hover:text-red-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <ThumbsDown className={`w-5 h-5 ${post.userReaction === 'dislike' ? 'fill-current' : ''}`} />
                            <span className="text-sm font-medium">{post.dislikes}</span>
                        </button>
                        <button 
                            onClick={() => toggleCommentsExpanded(post.postKey)}
                            className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">{post.comments.length}</span>
                        </button>
                    </div>
                    
                    {/* Comments Section */}
                    {post.commentsExpanded && (
                        <div className="border-t border-gray-100">
                            {post.comments.length > 0 && (
                                <div className="px-4 py-3 space-y-3 max-h-64 overflow-y-auto">
                                    {post.comments.map(comment => (
                                        <div key={comment.id} className="flex items-start space-x-2">
                                            <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                <img 
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} 
                                                    alt="User Avatar" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="bg-gray-100 rounded-lg px-3 py-2">
                                                    <p className="text-xs font-semibold text-gray-900">{comment.userName}</p>
                                                    <p className="text-sm text-gray-700 break-words">{comment.text}</p>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 ml-1">
                                                    {comment.createdAt.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Comment Input */}
                            <div className="px-4 py-3 border-t border-gray-100 flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                    <img 
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'anonymous'}`} 
                                        alt="User Avatar" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder={user?.id ? "Add a comment..." : "Sign in to comment"}
                                    disabled={!user?.id}
                                    value={commentInputs[post.postKey] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.postKey]: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddComment(post.postKey);
                                        }
                                    }}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    onClick={() => handleAddComment(post.postKey)}
                                    disabled={!user?.id || !commentInputs[post.postKey]?.trim() || loadingStates[`${post.postKey}_comment`]}
                                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingStates[`${post.postKey}_comment`] ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
