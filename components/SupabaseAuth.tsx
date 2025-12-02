import React, { useEffect, useState } from 'react';
import { MoneyIcon } from './icons';
import { getSupabaseClient } from '../services/supabaseClient';

export const SupabaseAuth: React.FC<{ onAuth: (user: { id: string | null; email?: string | null; firstName?: string | null }) => void }> = ({ onAuth }) => {
  const getClient = () => getSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Removed useEffect that calls getSession and onAuthStateChange.
  // App.tsx handles the global auth state and listener.
  // This component is now just a presentation layer for the login form.

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    // Pass firstName as user_metadata (Supabase will store this in auth.users)
    const { data, error } = await getClient().auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName }
      }
    });
    if (error) setError(error.message);
    // Force refresh of session/user after sign-up to get latest metadata
    if (data?.user) {
      // Try to persist a lightweight profile row so other code can read a display name quickly
      try {
        await getClient().from('profiles').upsert({ id: data.user.id, email: data.user.email, full_name: firstName });
      } catch (e) {
        console.warn('Could not upsert profile after signup:', e);
      }
      // App.tsx listener will pick up the auth change automatically.
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) {
        setError(error.message);
    }
    // App.tsx listener will pick up the auth change automatically.
    setLoading(false);
  };

  const handleSignOut = async () => {
    await getClient().auth.signOut();
    onAuth({ id: null, email: null });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full mx-auto">
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className="bg-gray-800 p-3 rounded-lg mr-4">
              {/* MoneyIcon from icons.tsx */}
              <MoneyIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Personal Finance Tracker</h1>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <>
              <h2 className="text-2xl font-semibold text-center text-gray-700 mb-1">Welcome Back!</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Sign in to access your dashboard.</p>
              <form onSubmit={e => { e.preventDefault(); handleSignIn(); }} className="space-y-6">
                <div>
                  <label htmlFor="firstName" className="text-sm font-medium text-gray-600 block mb-2">First Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <span role="img" aria-label="user" className="w-5 h-5 text-gray-400">👤</span>
                    </span>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Your first name"
                      required
                      aria-label="First Name"
                    />
                  </div>
                </div>
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
          {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
        </div>
        <p className="text-center text-sm text-gray-500 mt-8">
          Don't have an account? <a href="#" className="font-semibold text-blue-600 hover:underline">Sign Up</a>
        </p>
      </div>
    </div>
  );
}
