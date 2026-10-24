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
/**
 * supabase.service.js — Khởi tạo Supabase Admin client (Service Role Key).
 * Dùng cho tất cả server-side DB + Storage operations.
 */
const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabaseAdmin };
