import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iqgpbzvyyywflluqhpqj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ3BienZ5eXl3ZmxsdXFocHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTE0NjAsImV4cCI6MjA5MDIyNzQ2MH0.jafS2kcycAmhro63PehEJJW4Hbr58uiq2oCML4-ZmyA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
