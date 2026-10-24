/**
 * Đặt số user status = 'active' lên mục tiêu (mặc định 95).
 * Chạy: node scripts/bump-active-users.js
 * Hoặc: node scripts/bump-active-users.js 95
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { supabaseAdmin } = require('../src/services/supabase.service');

const TARGET = parseInt(process.argv[2] || '95', 10);

async function countActive() {
  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  const before = await countActive();
  console.log(`Active trước: ${before} (mục tiêu: ${TARGET})`);

  if (before >= TARGET) {
    console.log('Đã đạt mục tiêu, không cần cập nhật.');
    return;
  }

  const need = TARGET - before;
  const { data: inactive, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, status')
    .neq('status', 'active')
    .limit(need);

  if (fetchError) throw fetchError;
  if (!inactive?.length) {
    console.error(`Thiếu user — chỉ tìm được ${inactive?.length ?? 0}, cần ${need}.`);
    process.exit(1);
  }

  const ids = inactive.map((p) => p.id);
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .in('id', ids);

  if (updateError) throw updateError;

  const after = await countActive();
  console.log(`Đã kích hoạt ${ids.length} tài khoản → active sau: ${after}`);
  inactive.forEach((p) => console.log(`  - ${p.email} (${p.status} → active)`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
