import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);

  // Subscribe first, then fetch the current session. If an auth event arrives
  // while the initial fetch is pending, never let that older result overwrite it.
  useEffect(() => {
    let authEventReceived = false;
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authEventReceived = true;
        console.log('[AUTH] Auth state changed:', event, session?.user?.email);
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted && !authEventReceived) {
          setUser(session?.user ?? null);
          console.log('[AUTH] Initial session:', session?.user?.email || 'No user');
        }
      } catch (error) {
        if (mounted) {
          console.error('[AUTH] Initial session check failed:', error);
          setError(error.message);
        }
      } finally {
        if (mounted && !authEventReceived) setLoading(false);
      }
    };

    checkSession();
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email and password
  const signUp = async (email, password) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    setUser(data?.user || null);
    return { user: data?.user, error };
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    setUser(data?.user || null);
    return { user: data?.user, error };
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) setUser(null);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Get current user (if already logged in)
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
    return data?.user || null;
  };

  return { user, loading, error, signUp, signIn, signOut, getUser };
}
