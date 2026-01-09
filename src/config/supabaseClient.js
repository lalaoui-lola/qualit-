import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzeorubnmelpgofchclh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZW9ydWJubWVscGdvZmNoY2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDkxNDAsImV4cCI6MjA4MTUyNTE0MH0.UuBW8Vczp3AzV02euuUfPgKAsCXwb9vivZfBi4cikdk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
