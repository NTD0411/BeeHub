const { supabaseAdmin } = require('./supabase.service');
const { httpError } = require('./auth.helpers');
const { createNotification } = require('./notification.service');
const { ensurePublicImageBucket, getImageExtFromMime, COMMON_IMAGE_MIME_TYPES } = require('./storage.helpers');
const { previewLabel, isImageMime } = require('./chat-attachments.service');
const payosService = require('./payos.service');
const env = require('../config/env');

const VALID_CATEGORIES = ['furniture', 'electronics', 'appliances', 'clothes', 'books', 'other'];
const VALID_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'];
const VALID_STATUSES   = ['active', 'reserved', 'hidden', 'closed'];
const TERMINAL_STATUSES = ['closed'];

const MARKETPLACE_IMAGES_BUCKET = 'marketplace-images';

function isTerminalListingStatus(status) {
  return TERMINAL_STATUSES.includes(status);
}

/** Nhãn & quyền chat cho UI (web/mobile). */
function buildDealUiMeta(listing, userId) {
  const ownerId = listing.owner_id ?? listing.profiles?.id;
  const isOwner = !!(userId && ownerId && userId === ownerId);
  const isConfirmedBuyer = !!(userId && listing.confirmed_buyer_id && userId === listing.confirmed_buyer_id);
  const isParticipant = isOwner || isConfirmedBuyer;

  if (isTerminalListingStatus(listing.status)) {
    return {
      chat_enabled: false,
      deal_status_label: 'Đã chốt — không nhận thêm tin nhắn',
      deal_phase: 'completed',
      is_public: false,
    };
  }

  if (listing.deal_confirmed && listing.status === 'reserved') {
    return {
      chat_enabled: isParticipant,
      deal_status_label: isParticipant
        ? (listing.transport_booked
          ? 'Đã chốt — xác nhận khi nhận đồ để hoàn tất'
          : 'Đã chốt đơn — có thể đặt xe lấy đồ')
        : 'Đã chốt — không nhận thêm tin nhắn',
      deal_phase: 'reserved',
      is_public: false,
    };
  }

  return {
    chat_enabled: true,
    deal_status_label: null,
    deal_phase: 'open',
    is_public: listing.status === 'active',
  };
}

function assertListingReadable(listing, userId) {
  const ownerId = listing.owner_id ?? listing.profiles?.id;
  const isOwner = userId && ownerId && userId === ownerId;
  const isConfirmedBuyer = userId && listing.confirmed_buyer_id && userId === listing.confirmed_buyer_id;

  if (listing.status === 'hidden' && !isOwner) {
    throw httpError(404, 'Không tìm thấy tin', 'not_found');
  }

  if (isTerminalListingStatus(listing.status) && !isOwner && !isConfirmedBuyer) {
    throw httpError(404, 'Không tìm thấy tin', 'not_found');
  }

  if (listing.deal_confirmed && listing.status === 'reserved' && !isOwner && !isConfirmedBuyer) {
    throw httpError(404, 'Không tìm thấy tin', 'not_found');
  }
}

function computeListingFee(price) {
  const p = Number(price);
  if (!p || p <= 0) return 0;
  const raw = Math.round(p * 0.02);
  if (raw < 5000) return 5000;
  if (raw > 30000) return 30000;
  return raw;
}

const FREE_LISTINGS_PER_ACCOUNT = 2;

async function countOwnerListings(userId) {
  const { count, error } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);
  if (error) throw httpError(500, error.message, 'db_error');
  return count ?? 0;
}

/** Tính phí đăng tin theo quota miễn phí (2 tin đầu / tài khoản). */
function buildListingFeeInfo(price, listingsCreatedBefore) {
  const p = Number(price);
  if (!p || p <= 0) {
    return {
      amount: 0,
      requires_payment: false,
      reason: 'free_item',
      message: 'Đồ cho tặng — không thu phí đăng tin',
    };
  }

  const amount = computeListingFee(price);
  const used = Math.max(0, Number(listingsCreatedBefore) || 0);
  const remainingBefore = Math.max(0, FREE_LISTINGS_PER_ACCOUNT - used);

  if (used < FREE_LISTINGS_PER_ACCOUNT) {
    return {
      amount,
      requires_payment: false,
      reason: 'free_quota',
      message: `Tin miễn phí (${remainingBefore} lượt còn lại trong ${FREE_LISTINGS_PER_ACCOUNT} tin đầu)`,
      free_listings_total: FREE_LISTINGS_PER_ACCOUNT,
      free_listings_used: used,
      free_listings_remaining_before: remainingBefore,
      free_listings_remaining_after: Math.max(0, remainingBefore - 1),
    };
  }

  return {
    amount,
    requires_payment: amount > 0,
    reason: 'paid',
    message: amount > 0
      ? `Phí đăng tin ${amount.toLocaleString('vi-VN')}đ (2% giá bán, tối thiểu 5.000đ, tối đa 30.000đ)`
      : 'Miễn phí',
    free_listings_total: FREE_LISTINGS_PER_ACCOUNT,
    free_listings_used: used,
    free_listings_remaining_before: 0,
    free_listings_remaining_after: 0,
  };
}

async function getListingFeeQuota(userId, price) {
  const listingsCreated = await countOwnerListings(userId);
  const remaining = Math.max(0, FREE_LISTINGS_PER_ACCOUNT - listingsCreated);
  const base = {
    free_listings_total: FREE_LISTINGS_PER_ACCOUNT,
    free_listings_used: Math.min(listingsCreated, FREE_LISTINGS_PER_ACCOUNT),
    free_listings_remaining: remaining,
    listings_created_count: listingsCreated,
    rate_label: '2% giá bán (tối thiểu 5.000đ, tối đa 30.000đ) · 2 tin đầu miễn phí',
  };

  if (price === undefined || price === null || price === '') {
    return base;
  }

  const feeInfo = buildListingFeeInfo(price, listingsCreated);
  return { ...base, preview: feeInfo };
}

const BUMPED_AT_MISSING = /bumped_at/i;

function orderListingsByRecency(q, useBumpSort = true) {
  if (useBumpSort) {
    return q
      .order('bumped_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
  }
  return q.order('created_at', { ascending: false });
}

async function runWithBumpSortFallback(runQuery) {
  let result = await runQuery(true);
  if (result.error && BUMPED_AT_MISSING.test(result.error.message || '')) {
    result = await runQuery(false);
  }
  return result;
}

// ── Batch 1 ──────────────────────────────────────────────────────────────────

/** API-062 — POST /api/marketplace/listings */
async function createListing(userId, body) {
  const { title, description, category, condition, area, price, images, usage_duration } = body || {};

  if (!title || !category || !condition || price === undefined) {
    throw httpError(400, 'Thiếu field bắt buộc: title, category, condition, price', 'validation_error');
  }
  if (!VALID_CATEGORIES.includes(category)) {
    throw httpError(400, `category không hợp lệ. Chọn: ${VALID_CATEGORIES.join(', ')}`, 'validation_error');
  }
  if (!VALID_CONDITIONS.includes(condition)) {
    throw httpError(400, `condition không hợp lệ. Chọn: ${VALID_CONDITIONS.join(', ')}`, 'validation_error');
  }
  if (isNaN(Number(price)) || Number(price) < 0) {
    throw httpError(400, 'price phải là số không âm', 'validation_error');
  }

  const listingsCreated = await countOwnerListings(userId);
  const feeInfo = buildListingFeeInfo(price, listingsCreated);

  // Bài đăng luôn được kích hoạt ngay khi nhấn "Đăng tin ngay",
  // không giữ trạng thái hidden chờ thanh toán phí.
  const { data, error } = await supabaseAdmin
    .from('marketplace_listings')
    .insert([{
      owner_id:    userId,
      title:       String(title).trim(),
      description: description ? String(description).trim() : null,
      category,
      condition,
      area:           area ? String(area).trim() : null,
      price:          Number(price),
      images:         Array.isArray(images) ? images : [],
      usage_duration: usage_duration ? String(usage_duration).trim() : null,
      status:      'active',
      fee_paid:    true,
    }])
    .select(`
      id, title, description, category, condition, area,
      price, images, status, fee_paid, created_at, updated_at,
      profiles:owner_id ( id, full_name, avatar_url, phone )
    `)
    .single();

  if (error) throw httpError(500, error.message, 'db_error');
  return {
    listing: data,
    listing_fee: {
      amount: feeInfo.amount,
      requires_payment: false,
      reason: feeInfo.reason,
      message: feeInfo.message,
      free_listings_total: feeInfo.free_listings_total,
      free_listings_remaining_after: feeInfo.free_listings_remaining_after,
    },
  };
}

async function loadListingForFeePay(userId, listingId) {
  const { data: listing, error } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id, price, fee_paid, status, title')
    .eq('id', listingId)
    .single();

  if (error || !listing) throw httpError(404, 'Không tìm thấy tin đăng', 'not_found');
  if (listing.owner_id !== userId) throw httpError(403, 'Không có quyền thanh toán tin này', 'access_denied');
  return listing;
}

async function selectListingAfterFeePay(listingId) {
  const { data: updatedListing, error } = await supabaseAdmin
    .from('marketplace_listings')
    .update({ fee_paid: true, status: 'active' })
    .eq('id', listingId)
    .select(`
      id, title, description, category, condition, area,
      price, images, status, fee_paid, created_at, updated_at,
      profiles:owner_id ( id, full_name, avatar_url, phone )
    `)
    .single();
  if (error) throw httpError(500, error.message, 'db_error');
  return updatedListing;
}

/** Kích hoạt tin sau khi PayOS xác nhận thanh toán phí đăng tin. */
async function finalizeListingFeePayment(listingId) {
  if (!listingId) return;
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, fee_paid')
    .eq('id', listingId)
    .maybeSingle();
  if (!listing || listing.fee_paid) return;
  await selectListingAfterFeePay(listingId);
}

async function payListingFeeWithWallet(userId, listingId, fee) {
  let { data: wallet, error: walletError } = await supabaseAdmin
    .from('wallets')
    .select('id, balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (walletError) throw httpError(500, walletError.message, 'db_error');

  if (!wallet) {
    const { data: createdWallet, error: createWalletError } = await supabaseAdmin
      .from('wallets')
      .insert({ user_id: userId, balance: 0, currency: 'VND' })
      .select('id, balance')
      .single();
    if (createWalletError) throw httpError(500, createWalletError.message, 'db_error');
    wallet = createdWallet;
  }

  const balanceBefore = Number(wallet.balance) || 0;
  if (balanceBefore < fee) {
    throw httpError(
      400,
      `Số dư ví không đủ. Cần ${fee.toLocaleString('vi-VN')}đ, hiện có ${balanceBefore.toLocaleString('vi-VN')}đ`,
      'insufficient_balance',
    );
  }

  const balanceAfter = balanceBefore - fee;
  const { error: walletUpdateError } = await supabaseAdmin
    .from('wallets')
    .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
    .eq('id', wallet.id);
  if (walletUpdateError) throw httpError(500, walletUpdateError.message, 'db_error');

  const { error: txError } = await supabaseAdmin.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    transaction_type: 'order_payment',
    amount: fee,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    reference_type: 'marketplace_listing',
    reference_id: listingId,
    description: 'Phí đăng tin Chợ sinh viên',
  });
  if (txError) throw httpError(500, txError.message, 'db_error');

  const updatedListing = await selectListingAfterFeePay(listingId);
  return {
    listing: updatedListing,
    fee_paid: fee,
    wallet_balance: balanceAfter,
    payment_method: 'wallet',
    already_paid: false,
  };
}

function mapListingFeePaymentResponse(paymentRecord, listing, fee, payosExtras = {}) {
  return {
    listing,
    fee_amount: fee,
    payment_method: 'payos',
    already_paid: false,
    payment: {
      payment_id: paymentRecord.id,
      payment_code: paymentRecord.payment_code,
      amount: Number(paymentRecord.amount) || fee,
      currency: paymentRecord.currency || 'VND',
      status: paymentRecord.status || 'pending',
      checkout_url: paymentRecord.payos_payment_url,
      qr_code: paymentRecord.payos_qr_code,
      qr_code_data_url: paymentRecord.payos_qr_code,
      bank_account_number: payosExtras.accountNumber || paymentRecord.bank_account_number || null,
      bank_account_name: payosExtras.accountName || null,
      expires_at: paymentRecord.expires_at,
    },
  };
}

async function findPendingListingFeePayment(userId, listingId) {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('customer_id', userId)
    .eq('marketplace_listing_id', listingId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (String(error.message || '').includes('marketplace_listing_id')) {
      throw httpError(
        500,
        'Database chưa cập nhật. Chạy: node scripts/apply-migration.js supabase/migrations/20240131000000_marketplace_listing_fee_payments.sql',
        'db_migration_required',
      );
    }
    throw httpError(500, error.message, 'db_error');
  }
  return data;
}

async function payListingFeeWithPayos(userId, listingId, fee, body = {}) {
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, title, status, fee_paid, price, images, created_at')
    .eq('id', listingId)
    .single();

  const existing = await findPendingListingFeePayment(userId, listingId);
  if (existing?.payos_qr_code) {
    return mapListingFeePaymentResponse(existing, listing, fee);
  }

  const paymentCode = existing?.payment_code || payosService.generatePaymentCode();
  const orderCode = payosService.generateOrderCode();

  let paymentRecord = existing;
  if (!paymentRecord) {
    const { data, error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        payment_code: paymentCode,
        order_id: null,
        marketplace_listing_id: listingId,
        customer_id: userId,
        amount: fee,
        currency: 'VND',
        payment_method: 'payos',
        status: 'pending',
        escrow_status: 'none',
        payment_purpose: 'full',
        description: `LISTING_FEE:${listingId}`,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('[ListingFee] payment insert error:', insertError);
      const hint = String(insertError.message || '').includes('order_id')
        ? 'Chạy migration: node scripts/apply-migration.js supabase/migrations/20240131000000_marketplace_listing_fee_payments.sql'
        : insertError.message;
      throw httpError(500, `Lỗi tạo payment record: ${hint}`, 'db_error');
    }
    paymentRecord = data;
  }

  let payosResponse;
  try {
    payosResponse = await payosService.createPaymentLink({
      paymentCode,
      amount: Math.round(fee),
      orderCode: parseInt(orderCode, 10),
      description: paymentCode,
      returnUrl: `${env.APP_URL}/payment-success?payment_code=${paymentCode}`,
      cancelUrl: `${env.APP_URL}/payment-cancel?payment_code=${paymentCode}`,
      customerName: body.customer_name || 'Customer',
      customerEmail: body.customer_email || 'noreply@unimove.com',
    });
  } catch (payosError) {
    if (!existing) {
      await supabaseAdmin.from('payments').delete().eq('id', paymentRecord.id);
    }
    throw payosError;
  }

  const expiresAt = payosResponse.expiresAt instanceof Date
    ? payosResponse.expiresAt.toISOString()
    : new Date(Date.now() + 3600000).toISOString();

  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      payos_order_id: String(payosResponse.orderCode),
      payos_payment_url: payosResponse.checkoutUrl,
      payos_qr_code: payosResponse.qrCode,
      bank_account_number: payosResponse.accountNumber || null,
      expires_at: expiresAt,
    })
    .eq('id', paymentRecord.id);

  if (updateError) {
    console.error('[ListingFee] payment update error:', updateError);
    throw httpError(500, `Lỗi cập nhật payment PayOS: ${updateError.message}`, 'db_error');
  }

  const updatedPayment = {
    ...paymentRecord,
    payos_order_id: String(payosResponse.orderCode),
    payos_payment_url: payosResponse.checkoutUrl,
    payos_qr_code: payosResponse.qrCode,
    bank_account_number: payosResponse.accountNumber || null,
    expires_at: expiresAt,
  };

  return mapListingFeePaymentResponse(updatedPayment, listing, fee, {
    accountNumber: payosResponse.accountNumber,
    accountName: payosResponse.accountName,
  });
}

/** PASS-03 — POST /api/marketplace/listings/:id/listing-fee/pay */
async function payListingFee(userId, listingId, body = {}) {
  const paymentMethod = body.payment_method || 'payos';

  // Dev bypass: kích hoạt ngay không cần thanh toán (chỉ dùng khi NODE_ENV !== production)
  if (paymentMethod === 'dev_bypass') {
    if (process.env.NODE_ENV === 'production') {
      throw httpError(403, 'dev_bypass không khả dụng trong môi trường production', 'forbidden');
    }
    const listing = await loadListingForFeePay(userId, listingId);
    if (listing.fee_paid) {
      return { listing, fee_paid: 0, already_paid: true, payment_method: 'dev_bypass' };
    }
    const updated = await selectListingAfterFeePay(listingId);
    return { listing: updated, fee_paid: 0, already_paid: false, payment_method: 'dev_bypass', activated: true };
  }

  if (!['wallet', 'payos'].includes(paymentMethod)) {
    throw httpError(400, 'payment_method phải là wallet hoặc payos', 'unsupported_payment_method');
  }

  const listing = await loadListingForFeePay(userId, listingId);
  if (listing.fee_paid) {
    return { listing, fee_paid: 0, wallet_balance: null, already_paid: true, payment_method: paymentMethod };
  }

  const fee = computeListingFee(listing.price);
  if (fee <= 0) {
    const updated = await selectListingAfterFeePay(listingId);
    return { listing: updated, fee_paid: 0, wallet_balance: null, already_paid: false, payment_method: paymentMethod };
  }

  if (paymentMethod === 'payos') {
    return payListingFeeWithPayos(userId, listingId, fee, body);
  }

  return payListingFeeWithWallet(userId, listingId, fee);
}

/** API-059 — GET /api/marketplace/listings */
async function browseListings(query, userId) {
  const { keyword, category, condition, area, min_price, max_price, seller_id, page = 1, limit = 20 } = query || {};

  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const from = (pageNum - 1) * limitNum;
  const to   = from + limitNum - 1;

  const uid = String(userId || '').trim();

  const buildQuery = (useBumpSort) => {
    let q = supabaseAdmin
      .from('marketplace_listings')
      .select(
        `id, title, description, category, condition, area,
         price, images, status, created_at,
         profiles:owner_id ( id, full_name, avatar_url )`,
        { count: 'exact' }
      )
      .range(from, to);

    q = orderListingsByRecency(q, useBumpSort);

    // active: mọi user; reserved: chỉ người đăng hoặc người mua đã được chốt
    if (uid) {
      q = q.or(
        `status.eq.active,and(status.eq.reserved,or(owner_id.eq.${uid},confirmed_buyer_id.eq.${uid}))`,
      );
    } else {
      q = q.eq('status', 'active');
    }

    if (keyword) q = q.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    if (category && VALID_CATEGORIES.includes(category)) q = q.eq('category', category);
    if (condition && VALID_CONDITIONS.includes(condition)) q = q.eq('condition', condition);
    if (area) q = q.ilike('area', `%${area}%`);
    if (min_price !== undefined && !isNaN(Number(min_price))) q = q.gte('price', Number(min_price));
    if (max_price !== undefined && !isNaN(Number(max_price))) q = q.lte('price', Number(max_price));
    if (seller_id) q = q.eq('owner_id', seller_id);

    return q;
  };

  const { data, error, count } = await runWithBumpSortFallback(buildQuery);
  if (error) throw httpError(500, error.message, 'db_error');

  return {
    listings: data || [],
    pagination: { total: count || 0, page: pageNum, limit: limitNum, pages: Math.ceil((count || 0) / limitNum) },
  };
}

/** API-060 — GET /api/marketplace/my-listings */
async function getMyListings(userId, query) {
  const { status, page = 1, limit = 20 } = query || {};

  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const from = (pageNum - 1) * limitNum;
  const to   = from + limitNum - 1;

  const buildQuery = (useBumpSort) => {
    let q = supabaseAdmin
      .from('marketplace_listings')
      .select('id, title, description, category, condition, area, price, images, status, fee_paid, created_at, updated_at', { count: 'exact' })
      .eq('owner_id', userId)
      .range(from, to);

    q = orderListingsByRecency(q, useBumpSort);

    if (status && VALID_STATUSES.includes(status)) q = q.eq('status', status);
    return q;
  };

  const { data, error, count } = await runWithBumpSortFallback(buildQuery);
  if (error) throw httpError(500, error.message, 'db_error');

  const listings = data || [];

  // Đếm số khách quan tâm cho từng tin
  const withCounts = await Promise.all(listings.map(async (l) => {
    const { count: interestCount } = await supabaseAdmin
      .from('marketplace_interests')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', l.id);
    return { ...l, interest_count: interestCount || 0 };
  }));

  return {
    listings: withCounts,
    pagination: { total: count || 0, page: pageNum, limit: limitNum, pages: Math.ceil((count || 0) / limitNum) },
  };
}

// ── Batch 2 ──────────────────────────────────────────────────────────────────

/** API-061 — GET /api/marketplace/listings/:id */
async function getListing(listingId, userId) {
  const listingSelect = (includeBump) => `
      id, title, description, category, condition, area,
      price, images, status, fee_paid, usage_duration, created_at, updated_at${includeBump ? ', bumped_at' : ''},
      deal_confirmed, confirmed_price, confirmed_buyer_id, transport_booked,
      profiles:owner_id ( id, full_name, avatar_url, phone )
    `;

  let { data, error } = await supabaseAdmin
    .from('marketplace_listings')
    .select(listingSelect(true))
    .eq('id', listingId)
    .single();

  if (error && BUMPED_AT_MISSING.test(error.message || '')) {
    ({ data, error } = await supabaseAdmin
      .from('marketplace_listings')
      .select(listingSelect(false))
      .eq('id', listingId)
      .single());
  }

  if (error || !data) throw httpError(404, 'Không tìm thấy tin', 'not_found');

  const listingRow = { ...data, owner_id: data.profiles?.id ?? data.owner_id };
  assertListingReadable(listingRow, userId);

  const { count: interestCount } = await supabaseAdmin
    .from('marketplace_interests')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId);

  let isInterested = false;
  let isRated = false;
  if (userId) {
    const [{ data: mine }, { data: rating }] = await Promise.all([
      supabaseAdmin.from('marketplace_interests').select('id').eq('listing_id', listingId).eq('buyer_id', userId).single(),
      supabaseAdmin.from('marketplace_ratings').select('id').eq('listing_id', listingId).eq('buyer_id', userId).single(),
    ]);
    isInterested = !!mine;
    isRated      = !!rating;
  }

  return {
    ...data,
    interest_count: interestCount || 0,
    is_interested:  isInterested,
    is_rated:       isRated,
    is_mine:        data.profiles?.id === userId,
    ...buildDealUiMeta(listingRow, userId),
  };
}

/** API-064 — PATCH /api/marketplace/listings/:id/status */
async function updateListingStatus(listingId, userId, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw httpError(400, `status không hợp lệ. Chọn: ${VALID_STATUSES.join(', ')}`, 'validation_error');
  }

  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');
  if (listing.owner_id !== userId) throw httpError(403, 'Không có quyền chỉnh sửa tin này', 'forbidden');

  const { data, error } = await supabaseAdmin
    .from('marketplace_listings')
    .update({ status })
    .eq('id', listingId)
    .select('id, title, status, updated_at')
    .single();

  if (error) throw httpError(500, error.message, 'db_error');
  return data;
}

/** API-065 — POST /api/marketplace/listings/:id/interest */
async function expressInterest(listingId, userId, body) {
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id, status')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');
  if (listing.status !== 'active') throw httpError(400, 'Tin không còn nhận quan tâm', 'listing_unavailable');

  const { data: dealRow } = await supabaseAdmin
    .from('marketplace_listings')
    .select('deal_confirmed')
    .eq('id', listingId)
    .single();
  if (dealRow?.deal_confirmed) {
    throw httpError(400, 'Đã chốt — không nhận thêm tin nhắn', 'deal_confirmed');
  }

  if (listing.owner_id === userId) throw httpError(400, 'Không thể quan tâm tin của chính mình', 'validation_error');

  const { error } = await supabaseAdmin
    .from('marketplace_interests')
    .upsert(
      { listing_id: listingId, buyer_id: userId, note: body?.note || null },
      { onConflict: 'listing_id,buyer_id', ignoreDuplicates: true }
    );

  if (error) throw httpError(500, error.message, 'db_error');

  const { count } = await supabaseAdmin
    .from('marketplace_interests')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId);

  // Lấy tên buyer để gửi thông báo cho seller
  const { data: buyer } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  const buyerName = buyer?.full_name || 'Ai đó';

  createNotification(
    listing.owner_id,
    'marketplace_interest',
    `❤️ ${buyerName} quan tâm tin của bạn`,
    `${buyerName} vừa bấm "Tôi muốn nhận". Hãy nhắn tin để thỏa thuận!`,
    { listingId, actionData: { listing_id: listingId, buyer_id: userId }, priority: 'normal' },
  );

  return { listing_id: listingId, interest_count: count || 0 };
}

// ── Batch 3 ──────────────────────────────────────────────────────────────────

/** Danh sách hội thoại Chợ SV của user (buyer hoặc seller) — dùng cho inbox thống nhất */
async function listUserConversations(userId) {
  const { data: convs, error } = await supabaseAdmin
    .from('marketplace_conversations')
    .select(`
      id, listing_id, seller_id, buyer_id,
      last_message_at, last_message_text,
      seller_unread, buyer_unread, created_at,
      listing:marketplace_listings ( id, title, price, images, status, deal_confirmed )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw httpError(500, error.message, 'db_error');

  const profileIds = [...new Set((convs || []).flatMap((c) => [c.seller_id, c.buyer_id]))];
  let profileMap = {};
  if (profileIds.length) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, phone')
      .in('id', profileIds);
    profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  }

  return (convs || [])
    .filter((conv) => conv.last_message_text && String(conv.last_message_text).trim())
    .map((conv) => {
    const isBuyer = conv.buyer_id === userId;
    const counterpartId = isBuyer ? conv.seller_id : conv.buyer_id;
    const listing = Array.isArray(conv.listing) ? conv.listing[0] : conv.listing;
    const counterpart = profileMap[counterpartId];
    return {
      id: conv.id,
      kind: 'marketplace',
      listing_id: conv.listing_id,
      buyer_id: conv.buyer_id,
      last_message_preview: String(conv.last_message_text).trim(),
      last_message_at: conv.last_message_at,
      unread_count: isBuyer ? (conv.buyer_unread || 0) : (conv.seller_unread || 0),
      created_at: conv.created_at,
      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
            price: listing.price,
            images: listing.images,
            status: listing.status,
            deal_confirmed: listing.deal_confirmed,
          }
        : null,
      counterpart: counterpart
        ? {
            full_name: counterpart.full_name,
            avatar_url: counterpart.avatar_url,
            phone: counterpart.phone,
          }
        : null,
    };
  });
}

/** API-066 — GET /api/marketplace/listings/:id/interests */
async function getInterestedBuyers(listingId, userId) {
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');
  if (listing.owner_id !== userId) throw httpError(403, 'Chỉ người đăng mới xem được', 'forbidden');

  const { data, error } = await supabaseAdmin
    .from('marketplace_interests')
    .select(`
      id, created_at, note,
      profiles:buyer_id ( id, full_name, avatar_url, phone )
    `)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });

  if (error) throw httpError(500, error.message, 'db_error');

  const buyers = await Promise.all((data || []).map(async (row) => {
    const buyerId = row.profiles?.id;
    if (!buyerId) return null;

    const { data: conv } = await supabaseAdmin
      .from('marketplace_conversations')
      .select('id, last_message_text, last_message_at, seller_unread')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .single();

    return {
      id:            buyerId,
      name:          row.profiles?.full_name || '',
      avatar_url:    row.profiles?.avatar_url || null,
      contact:       row.profiles?.phone || '',
      interested_at: row.created_at,
      note:          row.note || '',
      last_message:  conv?.last_message_text || null,
      unread_count:  conv?.seller_unread || 0,
      conversation_id: conv?.id || null,
    };
  }));

  return buyers.filter(Boolean);
}

/** Tạo hoặc lấy conversation giữa seller và buyer cho 1 listing */
async function getOrCreateConversation(listingId, buyerId, sellerId) {
  const { data: existing } = await supabaseAdmin
    .from('marketplace_conversations')
    .select('id, seller_id, buyer_id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .single();

  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from('marketplace_conversations')
    .insert([{ listing_id: listingId, seller_id: sellerId, buyer_id: buyerId }])
    .select('id, seller_id, buyer_id')
    .single();

  if (error) throw httpError(500, error.message, 'db_error');
  return data;
}

/** API-067 — GET /api/marketplace/listings/:listingId/conversations/:buyerId/messages */
async function getMessages(listingId, buyerId, userId) {
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id, status, deal_confirmed, confirmed_buyer_id, transport_booked')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');

  const isSeller = listing.owner_id === userId;
  const isBuyer  = userId === buyerId;
  if (!isSeller && !isBuyer) throw httpError(403, 'Không có quyền xem chat này', 'forbidden');

  assertListingReadable(listing, userId);
  const dealUi = buildDealUiMeta(listing, userId);

  const conv = await getOrCreateConversation(listingId, buyerId, listing.owner_id);

  const unreadField = isSeller ? { seller_unread: 0 } : { buyer_unread: 0 };
  await supabaseAdmin
    .from('marketplace_conversations')
    .update(unreadField)
    .eq('id', conv.id);

  const { data: messages, error } = await supabaseAdmin
    .from('marketplace_messages')
    .select(`
      id, text, sender_id, is_offer, offer_amount,
      is_deal_confirm, is_deal_cancel, created_at,
      media_url, media_type, media_size, media_name,
      profiles:sender_id ( id, full_name )
    `)
    .eq('conversation_id', conv.id)
    .order('created_at', { ascending: true });

  if (error) throw httpError(500, error.message, 'db_error');

  return {
    conversation_id: conv.id,
    chat_enabled: dealUi.chat_enabled,
    deal_status_label: dealUi.deal_status_label,
    deal_phase: dealUi.deal_phase,
    messages: (messages || []).map((m) => {
      const senderProfile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      const senderId = senderProfile?.id ?? m.sender_id;
      return {
        id: m.id,
        text: m.text,
        content: m.text,
        sender_id: senderId,
        from_buyer: senderId === buyerId,
        is_offer: m.is_offer,
        offer_amount: m.offer_amount,
        is_deal_confirm: m.is_deal_confirm,
        is_deal_cancel: m.is_deal_cancel,
        media_url: m.media_url ?? null,
        media_type: m.media_type ?? null,
        media_size: m.media_size ?? null,
        media_name: m.media_name ?? null,
        message_type: m.media_url
          ? (isImageMime(m.media_type) ? 'image' : 'file')
          : undefined,
        created_at: m.created_at,
      };
    }),
  };
}

/** API-068 — POST /api/marketplace/listings/:listingId/conversations/:buyerId/messages */
async function sendMessage(listingId, buyerId, userId, body) {
  const rawText = body?.text ?? body?.content;
  const {
    is_offer = false,
    offer_amount,
    media_url,
    media_type,
    media_size,
    media_name,
  } = body || {};

  const textContent = rawText ? String(rawText).trim() : '';
  const hasMedia = !!(media_url && media_type);

  if (!textContent && !hasMedia) {
    throw httpError(400, 'text không được để trống', 'validation_error');
  }

  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id, status, deal_confirmed, confirmed_buyer_id')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');

  if (isTerminalListingStatus(listing.status)) {
    throw httpError(403, 'Đã chốt — không nhận thêm tin nhắn', 'chat_closed');
  }

  const isSeller = listing.owner_id === userId;
  const isBuyer  = userId === buyerId;
  if (!isSeller && !isBuyer) throw httpError(403, 'Không có quyền chat này', 'forbidden');

  if (listing.deal_confirmed) {
    const isConfirmedBuyer = userId === listing.confirmed_buyer_id;
    if (!isSeller && !isConfirmedBuyer) {
      throw httpError(403, 'Đã chốt — không nhận thêm tin nhắn', 'deal_confirmed');
    }
    if (isBuyer && buyerId !== listing.confirmed_buyer_id) {
      throw httpError(403, 'Đã chốt — không nhận thêm tin nhắn', 'deal_confirmed');
    }
  }

  const conv = await getOrCreateConversation(listingId, buyerId, listing.owner_id);

  if (isBuyer && !listing.deal_confirmed && listing.status === 'active') {
    await supabaseAdmin
      .from('marketplace_interests')
      .upsert(
        { listing_id: listingId, buyer_id: buyerId },
        { onConflict: 'listing_id,buyer_id', ignoreDuplicates: true },
      );
  }

  const storedText = textContent || previewLabel({
    text: '',
    mediaUrl: media_url,
    mediaType: media_type,
    mediaName: media_name,
  });

  const { data: msg, error } = await supabaseAdmin
    .from('marketplace_messages')
    .insert([{
      conversation_id: conv.id,
      sender_id:       userId,
      text:            storedText,
      is_offer:        is_offer && !!offer_amount,
      offer_amount:    is_offer && offer_amount ? Number(offer_amount) : null,
      media_url:       hasMedia ? media_url : null,
      media_type:      hasMedia ? media_type : null,
      media_size:      hasMedia ? (media_size ?? null) : null,
      media_name:      hasMedia ? (media_name ?? null) : null,
    }])
    .select('id, text, is_offer, offer_amount, media_url, media_type, media_name, created_at')
    .single();

  if (error) throw httpError(500, error.message, 'db_error');

  await supabaseAdmin
    .from('marketplace_conversations')
    .update({
      last_message_text: msg.text,
      last_message_at:   msg.created_at,
      ...(isSeller ? { buyer_unread: 1 } : { seller_unread: 1 }),
    })
    .eq('id', conv.id);

  const recipientId = isSeller ? buyerId : listing.owner_id;
  const preview = previewLabel({
    text: msg.text,
    mediaUrl: msg.media_url,
    mediaType: msg.media_type,
    mediaName: msg.media_name,
  });
  const previewShort = preview.length > 60 ? `${preview.slice(0, 60)}…` : preview;
  createNotification(recipientId, 'marketplace_message', 'Tin nhắn mới trong Chợ sinh viên', previewShort, {
    listingId,
    actionData: { listing_id: listingId, buyer_id: buyerId },
    icon: 'chat',
  });

  return { ...msg, from_buyer: isBuyer };
}

// ── Batch 4 ──────────────────────────────────────────────────────────────────

/** API-069 — POST /api/marketplace/listings/:listingId/conversations/:buyerId/deal */
async function confirmDeal(listingId, sellerId, buyerId, body) {
  const { agreed_price } = body || {};

  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id, status, deal_confirmed, transport_booked, price')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');
  if (listing.owner_id !== sellerId) throw httpError(403, 'Chỉ người đăng mới chốt được', 'forbidden');
  if (listing.deal_confirmed) throw httpError(400, 'Tin đã được chốt đơn rồi', 'already_confirmed');
  if (listing.status === 'closed') throw httpError(400, 'Tin đã đóng', 'listing_closed');

  const { data: interest } = await supabaseAdmin
    .from('marketplace_interests')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .maybeSingle();

  if (!interest) {
    const { data: conv } = await supabaseAdmin
      .from('marketplace_conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .maybeSingle();

    if (!conv) {
      throw httpError(400, 'Người mua chưa quan tâm tin này', 'buyer_not_interested');
    }

    const { count: messageCount } = await supabaseAdmin
      .from('marketplace_messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conv.id);

    if (!messageCount) {
      throw httpError(400, 'Người mua chưa quan tâm tin này', 'buyer_not_interested');
    }

    await supabaseAdmin
      .from('marketplace_interests')
      .upsert(
        { listing_id: listingId, buyer_id: buyerId },
        { onConflict: 'listing_id,buyer_id', ignoreDuplicates: true },
      );
  }

  const confirmedPrice = agreed_price != null && !isNaN(Number(agreed_price)) && Number(agreed_price) > 0
    ? Number(agreed_price)
    : null;

  const { data: updated, error } = await supabaseAdmin
    .from('marketplace_listings')
    .update({
      deal_confirmed:      true,
      confirmed_buyer_id:  buyerId,
      confirmed_price:     confirmedPrice,
      status:              'reserved',
    })
    .eq('id', listingId)
    .select('id, title, status, deal_confirmed, confirmed_price, confirmed_buyer_id, transport_booked')
    .single();

  if (error) throw httpError(500, error.message, 'db_error');

  const conv = await getOrCreateConversation(listingId, buyerId, sellerId);
  const priceNote = confirmedPrice
    ? ` — Giá chốt: ${Number(confirmedPrice).toLocaleString('vi-VN')}đ`
    : '';
  await supabaseAdmin
    .from('marketplace_messages')
    .insert([{
      conversation_id: conv.id,
      sender_id:       sellerId,
      text:            `Người bán đã chốt đơn — bạn có thể đặt xe lấy đồ${priceNote}.`,
      is_deal_confirm: true,
    }]);

  createNotification(buyerId, 'marketplace_deal_confirmed',
    '🎉 Đơn hàng đã được chốt!',
    `Người bán đã chốt đơn${priceNote}. Bạn có thể đặt xe lấy đồ ngay.`,
    { listingId, actionData: { listing_id: listingId, buyer_id: buyerId }, priority: 'high' },
  );

  return {
    ...updated,
    ...buildDealUiMeta({ ...updated, owner_id: sellerId }, sellerId),
  };
}

/** API-070 — DELETE /api/marketplace/listings/:listingId/deal */
async function cancelDeal(listingId, sellerId) {
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id, deal_confirmed, confirmed_buyer_id, transport_booked')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');
  if (listing.owner_id !== sellerId) throw httpError(403, 'Chỉ người đăng mới huỷ được', 'forbidden');
  if (!listing.deal_confirmed) throw httpError(400, 'Tin chưa được chốt đơn', 'not_confirmed');
  if (listing.transport_booked) throw httpError(400, 'Khách đã đặt xe — không thể huỷ chốt', 'transport_already_booked');

  const buyerId = listing.confirmed_buyer_id;

  const { data: updated, error } = await supabaseAdmin
    .from('marketplace_listings')
    .update({
      deal_confirmed:     false,
      confirmed_buyer_id: null,
      confirmed_price:    null,
      status:             'active',
    })
    .eq('id', listingId)
    .select('id, title, status, deal_confirmed, confirmed_price, confirmed_buyer_id, transport_booked')
    .single();

  if (error) throw httpError(500, error.message, 'db_error');

  if (buyerId) {
    const conv = await getOrCreateConversation(listingId, buyerId, sellerId);
    await supabaseAdmin
      .from('marketplace_messages')
      .insert([{
        conversation_id: conv.id,
        sender_id:       sellerId,
        text:            'Người bán đã huỷ chốt đơn.',
        is_deal_cancel:  true,
      }]);

    createNotification(buyerId, 'marketplace_deal_cancelled',
      'Đơn hàng bị huỷ chốt',
      'Người bán đã huỷ chốt đơn. Bạn vẫn có thể tiếp tục thương lượng.',
      { listingId, actionData: { listing_id: listingId, buyer_id: buyerId } },
    );
  }

  return updated;
}

/** API-071 — POST /api/marketplace/listings/:listingId/transport-booked */
async function markTransportBooked(listingId, buyerId) {
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id, deal_confirmed, confirmed_buyer_id, transport_booked')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');
  if (!listing.deal_confirmed) throw httpError(400, 'Tin chưa được chốt đơn', 'not_confirmed');
  if (listing.confirmed_buyer_id !== buyerId) throw httpError(403, 'Chỉ người được chốt mới đặt xe được', 'forbidden');
  if (listing.transport_booked) return { listing_id: listingId, transport_booked: true };

  const { data: updated, error } = await supabaseAdmin
    .from('marketplace_listings')
    .update({ transport_booked: true })
    .eq('id', listingId)
    .select('id, transport_booked')
    .single();

  if (error) throw httpError(500, error.message, 'db_error');

  createNotification(listing.owner_id, 'marketplace_transport_booked',
    '🚚 Người mua đã đặt xe!',
    'Người mua đã đặt xe lấy đồ. Chuẩn bị đồ để bàn giao nhé.',
    { listingId, actionData: { listing_id: listingId, buyer_id: buyerId }, priority: 'high' },
  );

  return updated;
}

// ── Batch 5 — Yêu thích ──────────────────────────────────────────────────────

/** GET /api/marketplace/my-interests */
async function getMyInterests(userId) {
  const { data, error } = await supabaseAdmin
    .from('marketplace_interests')
    .select(`
      id, created_at,
      listing:listing_id (
        id, title, description, category, condition, area,
        price, images, status, deal_confirmed, confirmed_buyer_id, created_at,
        profiles:owner_id ( id, full_name, avatar_url )
      )
    `)
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw httpError(500, error.message, 'db_error');

  const listings = (data || [])
    .filter((row) => row.listing)
    .map((row) => ({ ...row.listing, interest_count: 0, interested_at: row.created_at }))
    .filter((l) => {
      if (l.status === 'active') return true;
      if (l.status === 'reserved' && l.confirmed_buyer_id === userId) return true;
      if (l.status === 'closed' && l.confirmed_buyer_id === userId) return true;
      return false;
    });

  return { listings };
}

/** DELETE /api/marketplace/listings/:id/interest */
async function removeInterest(listingId, userId) {
  const { error } = await supabaseAdmin
    .from('marketplace_interests')
    .delete()
    .eq('listing_id', listingId)
    .eq('buyer_id', userId);

  if (error) throw httpError(500, error.message, 'db_error');
  return { listing_id: listingId };
}

// ── Bump listing ──────────────────────────────────────────────────────────────

/** Xem tin của 1 seller cụ thể (seller profile page) */
async function browseByOwner(sellerId) {
  const buildQuery = (useBumpSort) => {
    let q = supabaseAdmin
      .from('marketplace_listings')
      .select(`
      id, title, description, category, condition, area,
      price, images, status, created_at,
      profiles:owner_id ( id, full_name, avatar_url )
    `)
      .eq('owner_id', sellerId)
      .eq('status', 'active');

    return orderListingsByRecency(q, useBumpSort);
  };

  const { data, error } = await runWithBumpSortFallback(buildQuery);
  if (error) throw httpError(500, error.message, 'db_error');
  return data || [];
}

/** Đẩy tin lên đầu (1 lần / 24h) */
async function bumpListing(listingId, userId) {
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id, status')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');
  if (listing.owner_id !== userId) throw httpError(403, 'Chỉ người đăng mới đẩy được tin', 'forbidden');
  if (!['active', 'reserved'].includes(listing.status)) {
    throw httpError(400, 'Chỉ đẩy được tin đang mở hoặc đang giữ', 'invalid_status');
  }

  const { data: bumpMeta } = await supabaseAdmin
    .from('marketplace_listings')
    .select('bumped_at')
    .eq('id', listingId)
    .maybeSingle();

  const lastBumpedAt = bumpMeta?.bumped_at ?? null;
  if (lastBumpedAt) {
    const hoursSince = (Date.now() - new Date(lastBumpedAt).getTime()) / 3_600_000;
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince);
      throw httpError(429, `Bạn chỉ được đẩy tin 1 lần / 24h. Còn ${hoursLeft} giờ nữa.`, 'too_many_requests');
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from('marketplace_listings')
    .update({ bumped_at: now })
    .eq('id', listingId);

  if (error) {
    // Cột bumped_at chưa migrate — fallback cập nhật created_at
    if (/bumped_at/i.test(error.message || '')) {
      const { error: fallbackError } = await supabaseAdmin
        .from('marketplace_listings')
        .update({ created_at: now })
        .eq('id', listingId);
      if (fallbackError) throw httpError(500, fallbackError.message, 'db_error');
      return { listing_id: listingId, bumped_at: now, fallback: true };
    }
    throw httpError(500, error.message, 'db_error');
  }
  return { listing_id: listingId, bumped_at: now };
}

// ── UX Improvements ──────────────────────────────────────────────────────────

/** POST /api/marketplace/listings/:id/confirm-received */
async function confirmReceived(listingId, buyerId) {
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id, confirmed_buyer_id, transport_booked, status')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');
  if (listing.confirmed_buyer_id !== buyerId) throw httpError(403, 'Chỉ người được chốt mới xác nhận được', 'forbidden');
  if (!listing.transport_booked) throw httpError(400, 'Chưa đặt xe', 'transport_not_booked');
  if (listing.status === 'closed') throw httpError(400, 'Tin đã đóng', 'already_closed');

  const { data: updated, error } = await supabaseAdmin
    .from('marketplace_listings')
    .update({ status: 'closed' })
    .eq('id', listingId)
    .select('id, status, deal_confirmed, confirmed_buyer_id, transport_booked')
    .single();

  if (error) throw httpError(500, error.message, 'db_error');

  const conv = await getOrCreateConversation(listingId, buyerId, listing.owner_id);
  await supabaseAdmin
    .from('marketplace_messages')
    .insert([{
      conversation_id: conv.id,
      sender_id:       buyerId,
      text:            'Đã chốt — không nhận thêm tin nhắn. Giao dịch hoàn tất.',
      is_deal_confirm: false,
    }]);

  createNotification(listing.owner_id, 'marketplace_item_received',
    '✅ Người mua đã xác nhận nhận đồ!',
    'Giao dịch hoàn tất. Hãy để người mua đánh giá bạn.',
    { listingId, actionData: { listing_id: listingId, buyer_id: buyerId }, priority: 'high' },
  );

  return {
    ...updated,
    ...buildDealUiMeta({ ...updated, owner_id: listing.owner_id }, buyerId),
  };
}

/** POST /api/marketplace/listings/:id/rating */
async function createRating(listingId, buyerId, body) {
  const { rating, comment } = body || {};

  if (!rating || isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    throw httpError(400, 'rating phải là số từ 1 đến 5', 'validation_error');
  }

  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, owner_id, confirmed_buyer_id, status')
    .eq('id', listingId)
    .single();

  if (!listing) throw httpError(404, 'Không tìm thấy tin', 'not_found');
  if (listing.confirmed_buyer_id !== buyerId) throw httpError(403, 'Chỉ người mua mới đánh giá được', 'forbidden');
  if (listing.status !== 'closed') throw httpError(400, 'Tin chưa hoàn tất giao dịch', 'not_closed');

  const { data, error } = await supabaseAdmin
    .from('marketplace_ratings')
    .insert([{
      listing_id: listingId,
      buyer_id:   buyerId,
      seller_id:  listing.owner_id,
      rating:     Number(rating),
      comment:    comment ? String(comment).trim() : null,
    }])
    .select('id, rating, comment, created_at')
    .single();

  if (error) {
    if (error.code === '23505') throw httpError(400, 'Bạn đã đánh giá giao dịch này rồi', 'already_rated');
    throw httpError(500, error.message, 'db_error');
  }

  return data;
}

/** GET /api/marketplace/seller/:sellerId/stats */
async function getSellerStats(sellerId) {
  const { data, error } = await supabaseAdmin
    .from('marketplace_ratings')
    .select('rating')
    .eq('seller_id', sellerId);

  if (error) throw httpError(500, error.message, 'db_error');

  const ratings = (data || []).map(r => r.rating);
  const review_count = ratings.length;
  const avg_rating = review_count > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / review_count) * 10) / 10
    : null;

  return { seller_id: sellerId, avg_rating, review_count };
}

/** API-072 — POST /api/marketplace/listings/images (Supabase Storage) */
async function uploadListingImage(userId, file) {
  if (!file?.buffer?.length) {
    throw httpError(400, 'Thiếu file ảnh (field: image)', 'validation_error');
  }

  const ext = getImageExtFromMime(file.mimetype);
  if (!ext) throw httpError(400, 'Chỉ chấp nhận file ảnh', 'invalid_file_type');

  const objectPath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  try {
    await ensurePublicImageBucket(MARKETPLACE_IMAGES_BUCKET, {
      fileSizeLimit: 5242880,
      allowedMimeTypes: COMMON_IMAGE_MIME_TYPES,
    });
  } catch (bucketError) {
    throw httpError(
      500,
      `Không tạo được bucket ${MARKETPLACE_IMAGES_BUCKET}: ${bucketError.message}`,
      'storage_bucket_missing',
    );
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from(MARKETPLACE_IMAGES_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
      cacheControl: '3600',
    });

  if (uploadError) {
    throw httpError(500, uploadError.message, 'storage_error');
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(MARKETPLACE_IMAGES_BUCKET)
    .getPublicUrl(objectPath);
  const url = urlData?.publicUrl;
  if (!url) throw httpError(500, 'Không tạo được URL ảnh', 'storage_error');

  return { url };
}

async function getMyConversations(userId) {
  const { data, error } = await supabaseAdmin
    .from('marketplace_conversations')
    .select(`
      id, listing_id, buyer_id, seller_id,
      last_message_text, last_message_at, seller_unread, buyer_unread,
      listing:listing_id ( id, title, images ),
      buyer:buyer_id ( id, full_name, avatar_url ),
      seller:seller_id ( id, full_name, avatar_url )
    `)
    .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
    .not('last_message_at', 'is', null)
    .order('last_message_at', { ascending: false });

  if (error) throw httpError(500, error.message, 'db_error');

  return (data || []).map((conv) => {
    const isSeller   = conv.seller_id === userId;
    const counterpart = isSeller ? conv.buyer : conv.seller;
    const unread     = isSeller ? (conv.seller_unread ?? 0) : (conv.buyer_unread ?? 0);
    return {
      id:              conv.id,
      listing_id:      conv.listing_id,
      buyer_id:        conv.buyer_id,
      listing_title:   conv.listing?.title,
      listing_image:   conv.listing?.images?.[0],
      counterpart:     { id: counterpart?.id, full_name: counterpart?.full_name, avatar_url: counterpart?.avatar_url },
      last_message:    conv.last_message_text,
      last_message_at: conv.last_message_at,
      unread_count:    unread,
      is_seller:       isSeller,
    };
  });
}

module.exports = {
  createListing, payListingFee, finalizeListingFeePayment, getListingFeeQuota, browseListings, getMyListings,
  getListing, updateListingStatus, expressInterest, removeInterest,
  listUserConversations, getInterestedBuyers, getMessages, sendMessage,
  confirmDeal, cancelDeal, markTransportBooked,
  getMyInterests, browseByOwner, bumpListing,
  confirmReceived, createRating, getSellerStats,
  uploadListingImage, computeListingFee, buildListingFeeInfo, FREE_LISTINGS_PER_ACCOUNT, getMyConversations,
};
