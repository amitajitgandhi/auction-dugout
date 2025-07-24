import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zutiuriemwwcvucsqqoc.supabase.co'; // TODO: Replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dGl1cmllbXd3Y3Z1Y3NxcW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNTE3NjQsImV4cCI6MjA2ODgyNzc2NH0.hmHziqSSr_TrT0RvAUiw1c1lL63oBJBFVklsoOAUMPE'; // TODO: Replace with your Supabase anon/public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);