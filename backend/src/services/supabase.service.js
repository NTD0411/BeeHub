const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const env = require('../config/env');

/** Postgres qua service role — không dùng Supabase Auth JWT. */
const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

module.exports = {
  supabaseAdmin,
};
