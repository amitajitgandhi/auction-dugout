import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nlgwgsjhvklilkmuziiw.supabase.co'; // TODO: Replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZ3dnc2podmtsaWxrbXV6aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODE1MDgsImV4cCI6MjA2ODk1NzUwOH0.DtsxHV-4mEucYMrQcfLOjLt7K9Nps1gov1YUZfG6LsI'; // TODO: Replace with your Supabase anon/public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Force users to login on every app start by not persisting sessions
    persistSession: false,
    // Alternatively, you can use 'none' storage to prevent persistence
    // storage: undefined
  }
});