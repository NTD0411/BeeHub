/**
 * Đồng bộ payment đã PAID trên PayOS nhưng DB còn pending.
 * Yêu cầu: đã chạy migration 20240130000000_fix_deposit_payment_trigger.sql trên Supabase.
 *
 * node scripts/fix-stuck-deposit-payment.js PAY-20260610-8193
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { supabaseAdmin } = require('../src/services/supabase.service');
const payosService = require('../src/services/payos.service');
const { applyOrderAfterDepositPaid } = require('../src/services/payments.service');

async function main() {
  const paymentCode = process.argv[2];
  if (!paymentCode) {
    console.error('Usage: node scripts/fix-stuck-deposit-payment.js <PAY-YYYYMMDD-XXXX>');
    process.exit(1);
  }

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('payment_code', paymentCode)
    .single();

  if (error || !payment) {
    console.error('Payment not found:', paymentCode);
    process.exit(1);
  }

  console.log('Current status:', payment.status, '| amount:', payment.amount);

  if (payment.status === 'completed') {
    console.log('✅ Payment already completed — repairing order if needed');
    const repair = await applyOrderAfterDepositPaid(payment.id);
    console.log(repair.applied ? '✅ Order deposit_paid updated' : 'ℹ️ Order already up to date');
    return;
  }

  const payosData = await payosService.getPaymentStatus(payment.payos_order_id);
  console.log('PayOS status:', payosData.status, '| paid:', payosData.amountPaid);

  if (payosData.status !== 'PAID') {
    console.error('PayOS not PAID yet');
    process.exit(1);
  }

  const { data: updated, error: upErr } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'completed',
      paid_at: new Date().toISOString(),
      escrow_status: 'held',
      payos_transaction_id: payosData.transactions?.[0]?.transactionDateTime || null,
    })
    .eq('id', payment.id)
    .select('*')
    .single();

  if (upErr) {
    console.error('❌ DB update failed:', upErr.message);
    console.error('→ Chạy SQL migration: supabase/migrations/20240130000000_fix_deposit_payment_trigger.sql');
    process.exit(1);
  }

  if (updated.order_id) {
    const repair = await applyOrderAfterDepositPaid(updated.id);
    if (!repair.applied && !repair.already) {
      console.warn('⚠️ Order not updated:', repair.error || 'unknown');
    }
  }

  console.log('✅ Payment completed:', updated.payment_code);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
