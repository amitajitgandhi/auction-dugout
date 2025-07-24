import { useState } from 'react';
import { supabase } from '../supabaseClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  // Get current user (if already logged in)
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
    return data?.user || null;
  };

  return { user, loading, error, signUp, signIn, signOut, getUser };
}
