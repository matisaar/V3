import React, { useEffect, useState } from 'react';
import { MoneyIcon } from './icons';
import { getSupabaseClient } from '../services/supabaseClient';

export const SupabaseAuth: React.FC<{ onAuth: (userId: string | null) => void }> = ({ onAuth }) => {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        onAuth(data.session.user.id);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        onAuth(session.user.id);
      } else {
        setUser(null);
        onAuth(null);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase, onAuth]);

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    onAuth(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full mx-auto">
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className="bg-gray-800 p-3 rounded-lg mr-4">
              {/* MoneyIcon from icons.tsx */}
              <imported.MoneyIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Personal Finance Tracker</h1>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
          {user ? (
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome!</h2>
              <div className="mb-4 text-gray-600">Logged in as <b>{user.email}</b></div>
              <button className="w-full bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:bg-red-700 transition-colors duration-200" onClick={handleSignOut}>Sign Out</button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-center text-gray-700 mb-1">Welcome Back!</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Sign in to access your dashboard.</p>
              <form onSubmit={e => { e.preventDefault(); handleSignIn(); }} className="space-y-6">
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-gray-600 block mb-2">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      {/* Use a mail icon here, fallback to emoji if lucide-react not available */}
                      <span role="img" aria-label="mail" className="w-5 h-5 text-gray-400">📧</span>
                    </span>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="you@example.com"
                      required
                      aria-label="Email Address"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="text-sm font-medium text-gray-600 block mb-2">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      {/* Use a lock icon here, fallback to emoji if lucide-react not available */}
                      <span role="img" aria-label="lock" className="w-5 h-5 text-gray-400">🔒</span>
                    </span>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="••••••••"
                      required
                      aria-label="Password"
                    />
                  </div>
                  <div className="text-right mt-2">
                    <a href="#" className="text-xs text-blue-600 hover:underline">Forgot Password?</a>
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:bg-gray-900 transition-colors duration-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-wait"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleSignUp}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-wait mt-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Signing Up...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
          {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
        </div>
        <p className="text-center text-sm text-gray-500 mt-8">
          Don't have an account? <a href="#" className="font-semibold text-blue-600 hover:underline">Sign Up</a>
        </p>
      </div>
    </div>
  );
}
