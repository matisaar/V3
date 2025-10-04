import React, { useEffect, useState } from 'react';
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
    <div className="mb-4 p-4 border rounded-lg bg-gray-50">
      {user ? (
        <div>
          <div className="mb-2">Logged in as <b>{user.email}</b></div>
          <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); handleSignIn(); }} className="flex flex-col gap-2">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="px-3 py-2 border rounded" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="px-3 py-2 border rounded" required />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded" disabled={loading}>Sign In</button>
            <button type="button" className="px-3 py-2 bg-green-600 text-white rounded" onClick={handleSignUp} disabled={loading}>Sign Up</button>
          </div>
        </form>
      )}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
