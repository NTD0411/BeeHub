const { supabaseAdmin } = require('./supabase.service');

async function getTableCount(table) {
  const allowed = ['orders', 'profiles', 'payments', 'disputes'];
  if (!allowed.includes(table)) {
    const err = new Error('Bảng không được phép');
    err.status = 400;
    throw err;
  }

  const { count, error } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

async function getOpenDisputes(limit = 10) {
  const { data, error } = await supabaseAdmin
    .from('disputes')
    .select('id, subject, status')
    .in('status', ['open', 'investigating'])
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

async function getPendingProviders(limit = 10) {
  const { data, error } = await supabaseAdmin
    .from('provider_profiles')
    .select('id, business_name, verification_status')
    .eq('verification_status', 'pending')
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

module.exports = {
  getTableCount,
  getOpenDisputes,
  getPendingProviders,
};
