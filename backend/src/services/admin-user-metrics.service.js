// The profile counters can contain stale/seeded values. Read transaction records
// for just the users on the requested page; never update financial records here.
async function readAll(db, table, columns, filters) {
  const rows = [];
  for (;;) {
    let query = db.from(table).select(columns, { count: 'exact' });
    for (const [column, values] of filters) query = query.in(column, values);
    const { data, error, count } = await query.order('id', { ascending: true })
      .range(rows.length, rows.length + 499);
    if (error) throw error;
    const batch = data || [];
    rows.push(...batch);
    // Use the actual count, not an assumed PostgREST response size limit.
    if (count != null && rows.length >= count) return rows;
    if (!batch.length) {
      if (count != null && rows.length < count) throw new Error(`Incomplete ${table} statistics`);
      return rows;
    }
    if (count == null && batch.length < 500) return rows;
  }
}

function summarizeUserMetrics(users, customerOrders, providerOrders, payments, refunds, earnings) {
  const result = new Map(users.map(user => [user.id, {
    total_orders: 0, total_spent: 0, total_earnings: 0,
  }]));
  for (const order of customerOrders) {
    const stats = result.get(order.customer_id);
    if (stats) stats.total_orders++;
  }
  for (const order of providerOrders) {
    const stats = result.get(order.provider_id);
    if (stats) stats.total_orders++;
  }
  const refundedByPayment = new Map();
  for (const refund of refunds) {
    if (refund.status !== 'completed') continue;
    refundedByPayment.set(refund.payment_id,
      (refundedByPayment.get(refund.payment_id) || 0) + Number(refund.refund_amount));
  }
  for (const payment of payments) {
    if (!['completed', 'refunded', 'partially_refunded'].includes(payment.status)) continue;
    if (payment.payment_purpose === 'refund') continue;
    const stats = result.get(payment.customer_id);
    if (!stats) continue;
    // A fully refunded payment contributes zero even when its legacy refund row
    // is absent. For partial refunds, deduct only completed refunds once.
    const net = payment.status === 'refunded' ? 0
      : Math.max(0, Number(payment.amount) - (refundedByPayment.get(payment.id) || 0));
    stats.total_spent += net;
  }
  for (const earning of earnings) {
    if (!['available', 'withdrawn'].includes(earning.status)) continue;
    const stats = result.get(earning.provider_id);
    if (stats) stats.total_earnings += Number(earning.net_earnings);
  }
  return result;
}

async function getUserMetrics(db, users) {
  const customers = users.filter(u => u.role === 'customer').map(u => u.id);
  const providers = users.filter(u => u.role === 'provider').map(u => u.id);
  const [customerOrders, providerOrders, payments, earnings] = await Promise.all([
    customers.length ? readAll(db, 'orders', 'id,customer_id', [['customer_id', customers]]) : [],
    providers.length ? readAll(db, 'orders', 'id,provider_id', [['provider_id', providers]]) : [],
    customers.length ? readAll(db, 'payments', 'id,customer_id,amount,status,payment_purpose', [
      ['customer_id', customers], ['status', ['completed', 'partially_refunded', 'refunded']],
    ]) : [],
    providers.length ? readAll(db, 'provider_earnings', 'id,provider_id,net_earnings,status', [
      ['provider_id', providers], ['status', ['available', 'withdrawn']],
    ]) : [],
  ]);
  const refunds = [];
  // Keep filter URLs small even for customers with thousands of payments.
  for (let offset = 0; offset < payments.length; offset += 100) {
    refunds.push(...await readAll(db, 'refunds', 'id,payment_id,refund_amount,status', [
      ['payment_id', payments.slice(offset, offset + 100).map(p => p.id)],
      ['status', ['completed']],
    ]));
  }
  return summarizeUserMetrics(users, customerOrders, providerOrders, payments, refunds, earnings);
}

module.exports = { getUserMetrics, summarizeUserMetrics };
