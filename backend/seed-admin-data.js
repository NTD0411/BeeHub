/**
 * Seed dữ liệu demo cho Admin Dashboard
 * Chạy: node seed-admin-data.js
 * Hoặc: npm run seed:admin
 */

require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase.service');

const SEED_TAG = 'demo@unimove.demo';

// UUID cố định để có thể chạy lại script (xóa & tạo lại)
const IDS = {
  admin: '2690c66f-d1b5-4820-a7fb-b4bf94b96277',
  customers: [
    'a1000001-0001-4001-8001-000000000001',
    'a1000001-0001-4001-8001-000000000002',
    'a1000001-0001-4001-8001-000000000003',
    'a1000001-0001-4001-8001-000000000004',
    'a1000001-0001-4001-8001-000000000005',
  ],
  providers: [
    'b2000001-0001-4001-8001-000000000001',
    'b2000001-0001-4001-8001-000000000002',
    'b2000001-0001-4001-8001-000000000003',
    'b2000001-0001-4001-8001-000000000004',
    'b2000001-0001-4001-8001-000000000005',
    'b2000001-0001-4001-8001-000000000006',
  ],
};

const CUSTOMERS = [
  { id: IDS.customers[0], full_name: 'Nguyễn Văn An', email: 'an.nguyen.demo@unimove.demo', phone: '0901234567', university: 'ĐH Bách Khoa TP.HCM', total_orders: 12, total_spent: 8500000 },
  { id: IDS.customers[1], full_name: 'Trần Thị Bình', email: 'binh.tran.demo@unimove.demo', phone: '0912345678', university: 'ĐH Kinh tế TP.HCM', total_orders: 8, total_spent: 5200000 },
  { id: IDS.customers[2], full_name: 'Lê Hoàng Cường', email: 'cuong.le.demo@unimove.demo', phone: '0923456789', university: 'ĐH FPT', total_orders: 5, total_spent: 3100000 },
  { id: IDS.customers[3], full_name: 'Phạm Minh Đức', email: 'duc.pham.demo@unimove.demo', phone: '0934567890', university: 'ĐH RMIT', total_orders: 3, total_spent: 1800000 },
  { id: IDS.customers[4], full_name: 'Hoàng Thị Em', email: 'em.hoang.demo@unimove.demo', phone: '0945678901', university: 'ĐH Sư phạm', total_orders: 15, total_spent: 12300000 },
];

const PROVIDERS = [
  { id: IDS.providers[0], full_name: 'Võ Thành Hùng', email: 'hung.vo.demo@unimove.demo', business_name: 'Hùng Move Express', vehicle_type: 'small_truck', vehicle_plate: '51A-12345', rating: 4.8, total_reviews: 45, total_orders: 120, total_earnings: 45000000, verification_status: 'approved', is_verified: true },
  { id: IDS.providers[1], full_name: 'Đặng Văn Khánh', email: 'khanh.dang.demo@unimove.demo', business_name: 'Khánh Logistics', vehicle_type: 'medium_truck', vehicle_plate: '51B-67890', rating: 4.5, total_reviews: 32, total_orders: 85, total_earnings: 38000000, verification_status: 'approved', is_verified: true },
  { id: IDS.providers[2], full_name: 'Bùi Thị Lan', email: 'lan.bui.demo@unimove.demo', business_name: 'Lan Transport', vehicle_type: 'motorbike', vehicle_plate: '59-F1 2345', rating: 4.9, total_reviews: 28, total_orders: 200, total_earnings: 22000000, verification_status: 'approved', is_verified: true },
  { id: IDS.providers[3], full_name: 'Ngô Quốc Minh', email: 'minh.ngo.demo@unimove.demo', business_name: 'Minh Cargo', vehicle_type: 'large_truck', vehicle_plate: '51C-11111', rating: 4.2, total_reviews: 18, total_orders: 45, total_earnings: 55000000, verification_status: 'approved', is_verified: true },
  { id: IDS.providers[4], full_name: 'Trương Văn Nam', email: 'nam.truong.demo@unimove.demo', business_name: 'Nam Moving Co.', vehicle_type: 'small_truck', vehicle_plate: '51D-22222', rating: 0, total_reviews: 0, total_orders: 0, total_earnings: 0, verification_status: 'pending', is_verified: false },
  { id: IDS.providers[5], full_name: 'Lý Thị Oanh', email: 'oanh.ly.demo@unimove.demo', business_name: 'Oanh Delivery', vehicle_type: 'motorbike', vehicle_plate: '59-H3 5678', rating: 0, total_reviews: 0, total_orders: 0, total_earnings: 0, verification_status: 'pending', is_verified: false },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function yesterdayRange() {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(16, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

function monthOffset(monthsBack, day = 15) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(day);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

async function getAdminId() {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', 'admin@unimove.com')
    .maybeSingle();
  return data?.id ?? IDS.admin;
}

async function cleanupSeedData() {
  console.log('🧹 Xóa dữ liệu demo cũ...');

  const { data: seedProfiles } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .like('email', `%${SEED_TAG}`);

  const seedIds = (seedProfiles ?? []).map((p) => p.id);
  if (seedIds.length === 0) {
    console.log('   Không có dữ liệu demo cũ.');
    return;
  }

  const { data: seedOrders } = await supabaseAdmin
    .from('orders')
    .select('id')
    .in('customer_id', seedIds);

  const orderIds = (seedOrders ?? []).map((o) => o.id);

  if (orderIds.length) {
    await supabaseAdmin.from('dispute_messages').delete().in('dispute_id',
      (await supabaseAdmin.from('disputes').select('id').in('order_id', orderIds)).data?.map(d => d.id) ?? []
    );
    await supabaseAdmin.from('disputes').delete().in('order_id', orderIds);
    await supabaseAdmin.from('reviews').delete().in('order_id', orderIds);
    await supabaseAdmin.from('refunds').delete().in('order_id', orderIds);
    await supabaseAdmin.from('provider_earnings').delete().in('order_id', orderIds);
    await supabaseAdmin.from('payment_transactions').delete().in('payment_id',
      (await supabaseAdmin.from('payments').select('id').in('order_id', orderIds)).data?.map(p => p.id) ?? []
    );
    await supabaseAdmin.from('payments').delete().in('order_id', orderIds);
    await supabaseAdmin.from('order_status_history').delete().in('order_id', orderIds);
    await supabaseAdmin.from('orders').delete().in('id', orderIds);
  }

  await supabaseAdmin.from('provider_documents').delete().in('provider_id', seedIds);
  await supabaseAdmin.from('notifications').delete().in('user_id', seedIds);
  await supabaseAdmin.from('announcements').delete().like('title', '[Demo]%');
  await supabaseAdmin.from('customer_profiles').delete().in('id', seedIds);
  await supabaseAdmin.from('provider_profiles').delete().in('id', seedIds);
  await supabaseAdmin.from('user_credentials').delete().in('user_id', seedIds);
  await supabaseAdmin.from('profiles').delete().in('id', seedIds);

  console.log(`   Đã xóa ${seedIds.length} profile demo.`);
}

async function seedProfiles(adminId) {
  console.log('👥 Tạo khách hàng & nhà vận chuyển...');

  const now = new Date().toISOString();

  for (const c of CUSTOMERS) {
    const { error: pErr } = await supabaseAdmin.from('profiles').upsert({
      id: c.id,
      email: c.email,
      phone: c.phone,
      full_name: c.full_name,
      role: 'customer',
      status: 'active',
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    }, { onConflict: 'id' });
    if (pErr) throw new Error(`Profile customer ${c.email}: ${pErr.message}`);

    const { error: cpErr } = await supabaseAdmin.from('customer_profiles').upsert({
      id: c.id,
      university: c.university,
      city: 'TP.HCM',
      district: 'Quận 1',
      total_orders: c.total_orders,
      total_spent: c.total_spent,
      loyalty_points: Math.floor(c.total_spent / 10000),
    }, { onConflict: 'id' });
    if (cpErr) throw new Error(`Customer profile ${c.email}: ${cpErr.message}`);
  }

  for (const p of PROVIDERS) {
    const { error: pErr } = await supabaseAdmin.from('profiles').upsert({
      id: p.id,
      email: p.email,
      phone: '09' + Math.floor(10000000 + Math.random() * 89999999),
      full_name: p.full_name,
      role: 'provider',
      status: p.verification_status === 'pending' ? 'pending_verification' : 'active',
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    }, { onConflict: 'id' });
    if (pErr) throw new Error(`Profile provider ${p.email}: ${pErr.message}`);

    const verifiedAt = p.is_verified ? daysAgo(Math.floor(Math.random() * 30) + 1) : null;
    const { error: ppErr } = await supabaseAdmin.from('provider_profiles').upsert({
      id: p.id,
      business_name: p.business_name,
      vehicle_type: p.vehicle_type,
      vehicle_plate: p.vehicle_plate,
      base_price: 100000,
      price_per_km: 10000,
      price_per_floor: 15000,
      rating: p.rating,
      total_reviews: p.total_reviews,
      total_orders: p.total_orders,
      total_earnings: p.total_earnings,
      is_verified: p.is_verified,
      is_available: true,
      verification_status: p.verification_status,
      verified_at: verifiedAt,
      verified_by: p.is_verified ? adminId : null,
      verification_notes: p.is_verified ? 'Đã duyệt hồ sơ đầy đủ' : null,
    }, { onConflict: 'id' });
    if (ppErr) throw new Error(`Provider profile ${p.email}: ${ppErr.message}`);

    if (p.verification_status === 'pending') {
      await supabaseAdmin.from('provider_documents').insert([
        {
          provider_id: p.id,
          document_type: 'license',
          document_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          document_number: 'B2-' + p.id.slice(-6),
          is_verified: false,
        },
        {
          provider_id: p.id,
          document_type: 'id_card',
          document_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          document_number: 'CCCD-' + p.id.slice(-6),
          is_verified: false,
        },
      ]);
    }
  }

  console.log(`   ✅ ${CUSTOMERS.length} khách hàng, ${PROVIDERS.length} nhà vận chuyển`);
}

function buildOrder(idx, customerId, providerId, status, completedAt, createdAt) {
  const prices = [350000, 480000, 620000, 890000, 1200000, 250000, 1750000];
  const total = prices[idx % prices.length];
  const orderNum = `UNI-DEMO-${String(idx + 1).padStart(4, '0')}`;

  return {
    order_number: orderNum,
    customer_id: customerId,
    provider_id: providerId,
    service_type: 'standard',
    vehicle_size: idx % 2 === 0 ? 'small_truck' : 'motorbike',
    pickup_address: '123 Nguyễn Huệ, Quận 1',
    pickup_city: 'TP.HCM',
    pickup_district: 'Quận 1',
    pickup_contact_name: 'Người gửi',
    pickup_contact_phone: '0901000001',
    delivery_address: '456 Lê Lợi, Quận 3',
    delivery_city: 'TP.HCM',
    delivery_district: 'Quận 3',
    delivery_contact_name: 'Người nhận',
    delivery_contact_phone: '0901000002',
    estimated_distance: 5.2 + (idx % 3),
    base_price: 100000,
    distance_price: total * 0.4,
    floor_price: total * 0.1,
    service_fee: total * 0.05,
    discount_amount: 0,
    total_price: total,
    deposit_amount: total * 0.3,
    remaining_amount: total * 0.7,
    status,
    created_at: createdAt,
    updated_at: createdAt,
    completed_at: completedAt,
  };
}

async function seedOrders(adminId) {
  console.log('📦 Tạo đơn hàng, thanh toán & lịch sử...');

  const verifiedProviders = PROVIDERS.filter((p) => p.is_verified);
  const yRange = yesterdayRange();
  const orders = [];

  // 3 đơn hoàn thành hôm qua (GMV dashboard)
  for (let i = 0; i < 3; i++) {
    orders.push(buildOrder(
      i,
      CUSTOMERS[i % CUSTOMERS.length].id,
      verifiedProviders[i % verifiedProviders.length].id,
      'completed',
      yRange.start,
      daysAgo(2)
    ));
  }

  // Đơn theo tháng (analytics)
  const statuses = ['completed', 'completed', 'completed', 'cancelled', 'pending', 'in_progress', 'accepted', 'disputed'];
  for (let m = 0; m < 6; m++) {
    for (let j = 0; j < 3; j++) {
      const idx = 3 + m * 3 + j;
      const st = statuses[(m + j) % statuses.length];
      const created = monthOffset(m, 5 + j);
      const completed = st === 'completed' ? monthOffset(m, 8 + j) : null;
      orders.push(buildOrder(
        idx,
        CUSTOMERS[(m + j) % CUSTOMERS.length].id,
        verifiedProviders[j % verifiedProviders.length].id,
        st,
        completed,
        created
      ));
    }
  }

  const { data: insertedOrders, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert(orders)
    .select('id, order_number, customer_id, provider_id, status, total_price, completed_at, created_at');

  if (orderErr) throw new Error(`Orders: ${orderErr.message}`);

  const payments = [];
  const earnings = [];
  const history = [];
  const reviews = [];
  let paymentIdx = 0;

  for (const order of insertedOrders) {
    // Lịch sử trạng thái
    history.push(
      { order_id: order.id, from_status: null, to_status: 'pending', changed_by: order.customer_id, created_at: order.created_at },
      { order_id: order.id, from_status: 'pending', to_status: 'accepted', changed_by: order.provider_id, created_at: order.created_at },
    );
    if (order.status === 'completed') {
      history.push({ order_id: order.id, from_status: 'accepted', to_status: 'in_progress', changed_by: order.provider_id, created_at: order.completed_at });
      history.push({ order_id: order.id, from_status: 'in_progress', to_status: 'completed', changed_by: order.provider_id, created_at: order.completed_at });
    } else if (order.status === 'cancelled') {
      history.push({ order_id: order.id, from_status: 'accepted', to_status: 'cancelled', changed_by: order.customer_id, notes: 'Khách hàng đổi lịch', created_at: order.created_at });
    } else {
      history.push({ order_id: order.id, from_status: 'accepted', to_status: order.status, changed_by: order.provider_id, created_at: order.created_at });
    }

    if (order.status === 'completed') {
      paymentIdx++;
      const paidAt = order.completed_at;
      const paymentId = `pay-demo-${paymentIdx}`;
      payments.push({
        payment_code: `PAY-DEMO-${String(paymentIdx).padStart(5, '0')}`,
        order_id: order.id,
        customer_id: order.customer_id,
        amount: order.total_price,
        payment_method: paymentIdx % 2 === 0 ? 'payos' : 'cash',
        status: 'completed',
        paid_at: paidAt,
        created_at: paidAt,
      });

      const commission = Math.round(order.total_price * 0.15);
      const net = order.total_price - commission;
      earnings.push({
        provider_id: order.provider_id,
        order_id: order.id,
        order_amount: order.total_price,
        platform_commission: commission,
        net_earnings: net,
        commission_rate: 15,
        status: 'available',
        created_at: paidAt,
      });

      reviews.push({
        order_id: order.id,
        customer_id: order.customer_id,
        provider_id: order.provider_id,
        rating: 4 + (paymentIdx % 2),
        service_quality_rating: 5,
        punctuality_rating: 4,
        professionalism_rating: 5,
        comment: 'Dịch vụ tốt, nhân viên nhiệt tình và cẩn thận.',
        tags: ['friendly', 'careful', 'fast'],
        is_published: true,
        is_verified: true,
      });
    }
  }

  const { data: insertedPayments, error: payErr } = await supabaseAdmin
    .from('payments')
    .insert(payments)
    .select('id, order_id');

  if (payErr) throw new Error(`Payments: ${payErr.message}`);

  // Gắn payment_id vào earnings
  for (const earning of earnings) {
    const pay = insertedPayments.find((p) => p.order_id === earning.order_id);
    earning.payment_id = pay?.id ?? null;
  }

  await supabaseAdmin.from('provider_earnings').insert(earnings);
  await supabaseAdmin.from('order_status_history').insert(history);
  await supabaseAdmin.from('reviews').insert(reviews);

  console.log(`   ✅ ${insertedOrders.length} đơn, ${payments.length} thanh toán, ${reviews.length} đánh giá`);

  return insertedOrders;
}

async function seedDisputesAndRefunds(orders, adminId) {
  console.log('⚖️ Tạo khiếu nại & hoàn tiền...');

  const disputed = orders.find((o) => o.status === 'disputed');
  const cancelled = orders.find((o) => o.status === 'cancelled');
  const completed = orders.find((o) => o.status === 'completed');

  if (disputed) {
    await supabaseAdmin.from('disputes').insert({
      order_id: disputed.id,
      raised_by: disputed.customer_id,
      raised_by_role: 'customer',
      against_user_id: disputed.provider_id,
      dispute_type: 'service_quality',
      subject: 'Hàng hóa bị hư hỏng nhẹ',
      description: 'Khách hàng phản ánh một số đồ nội thất bị trầy xước trong quá trình vận chuyển.',
      status: 'open',
      priority: 'high',
    });
  }

  if (cancelled) {
    await supabaseAdmin.from('disputes').insert({
      order_id: cancelled.id,
      raised_by: cancelled.customer_id,
      raised_by_role: 'customer',
      dispute_type: 'cancellation',
      subject: 'Yêu cầu hoàn tiền đặt cọc',
      description: 'Khách hàng hủy đơn sau khi provider đã nhận, yêu cầu hoàn 50% đặt cọc.',
      status: 'investigating',
      priority: 'normal',
      assigned_to: adminId,
      assigned_at: daysAgo(1),
    });
  }

  if (completed) {
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('order_id', completed.id)
      .single();

    if (payment) {
      await supabaseAdmin.from('refunds').insert({
        payment_id: payment.id,
        order_id: completed.id,
        refund_amount: 150000,
        refund_reason: 'Khách hàng báo thiếu 1 kiện hàng nhỏ',
        status: 'completed',
        requested_by: completed.customer_id,
        approved_by: adminId,
        processed_at: daysAgo(3),
      });
    }
  }

  console.log('   ✅ Khiếu nại & hoàn tiền');
}

async function seedAnnouncementsAndNotifications(adminId) {
  console.log('📢 Tạo thông báo & announcements...');

  await supabaseAdmin.from('announcements').insert([
    {
      title: '[Demo] Khuyến mãi tháng 6',
      body: 'Giảm 15% phí vận chuyển cho sinh viên đến hết tháng 6.',
      target_audience: 'customers',
      priority: 'normal',
      is_published: true,
      published_at: daysAgo(2),
      created_by: adminId,
    },
    {
      title: '[Demo] Cập nhật chính sách hoa hồng',
      body: 'Hoa hồng nền tảng giữ nguyên 15% cho quý 2/2026.',
      target_audience: 'providers',
      priority: 'high',
      is_published: true,
      published_at: daysAgo(5),
      created_by: adminId,
    },
  ]);

  for (const c of CUSTOMERS.slice(0, 3)) {
    await supabaseAdmin.from('notifications').insert({
      user_id: c.id,
      notification_type: 'order_completed',
      title: 'Đơn hàng hoàn thành',
      body: 'Đơn hàng demo của bạn đã được giao thành công.',
      priority: 'normal',
      is_read: false,
    });
  }

  console.log('   ✅ Thông báo');
}

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu Admin Dashboard...\n');

  const adminId = await getAdminId();
  console.log(`🔑 Admin ID: ${adminId}\n`);

  await cleanupSeedData();
  await seedProfiles(adminId);
  const orders = await seedOrders(adminId);
  await seedDisputesAndRefunds(orders, adminId);
  await seedAnnouncementsAndNotifications(adminId);

  console.log('\n🎉 Seed hoàn tất! Refresh Admin Dashboard để xem dữ liệu.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Dashboard  : GMV hôm qua, đơn hàng, biểu đồ');
  console.log('Users      : 5 khách hàng + 6 nhà vận chuyển (2 chờ xác minh)');
  console.log('Orders     : ~21 đơn (nhiều trạng thái)');
  console.log('Verifications: 2 provider pending');
  console.log('Reviews    : ~12 đánh giá');
  console.log('Disputes   : 2 khiếu nại mở');
  console.log('Analytics  : doanh thu & hoa hồng theo tháng');
  console.log('Activity   : lịch sử đơn, xác minh, hoàn tiền');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Seed thất bại:', err.message);
    console.error(err);
    process.exit(1);
  });
