const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dkomihipebixlegygnoy.supabase.co';
// This is the public "anon" key — safe to ship in the build. It can only ever
// read rows that Row Level Security marks as public (published = true).
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase;
