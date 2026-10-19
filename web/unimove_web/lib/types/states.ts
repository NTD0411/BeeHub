/* ============================================================
   UniMove — Screen State Types

   Covers: AsyncState, EmptyState, LoadingState,
           SuccessMessages, ErrorMessages
   ============================================================ */

/* ── Async State ─────────────────────────────────────────────
   Discriminated union for every data-fetching operation.
   Usage:  const [state, setState] = useState<AsyncState<Product[]>>({ status: 'idle' })
   ──────────────────────────────────────────────────────────── */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; code?: string }

export type AsyncStatus = AsyncState<unknown>['status']

export function isLoading<T>(s: AsyncState<T>): s is { status: 'loading' } {
  return s.status === 'loading'
}
export function isSuccess<T>(s: AsyncState<T>): s is { status: 'success'; data: T } {
  return s.status === 'success'
}
export function isError<T>(s: AsyncState<T>): s is { status: 'error'; error: string; code?: string } {
  return s.status === 'error'
}

/* ── Empty State Config ──────────────────────────────────────
   Props fed into the <EmptyState /> component.
   ──────────────────────────────────────────────────────────── */
export interface EmptyStateConfig {
  icon: string          // Lucide icon component name
  title: string
  description: string
  action?: {
    label: string
    href?: string
  }
}

export const EMPTY_STATES = {
  /* Đơn hàng */
  'don-hang': {
    icon: 'Package',
    title: 'Chưa có đơn hàng nào',
    description: 'Bạn chưa đặt chuyến nào. Đặt ngay để bắt đầu!',
    action: { label: 'Đặt chuyến ngay', href: '/dat-chuyen' },
  },
  'don-hang-dang-xu-ly': {
    icon: 'Clock',
    title: 'Không có đơn đang xử lý',
    description: 'Các đơn hàng đang thực hiện sẽ hiển thị ở đây.',
  },
  'don-hang-hoan-thanh': {
    icon: 'CheckCircle',
    title: 'Chưa có đơn hoàn thành',
    description: 'Các chuyến đã hoàn thành được lưu ở đây.',
  },
  'don-hang-da-huy': {
    icon: 'XCircle',
    title: 'Không có đơn đã huỷ',
    description: 'Các đơn bị huỷ sẽ hiển thị ở đây.',
  },

  /* Chợ sinh viên */
  'cho-sinh-vien': {
    icon: 'ShoppingBag',
    title: 'Chưa có sản phẩm nào',
    description: 'Hãy là người đầu tiên đăng bán trong khu vực của bạn!',
    action: { label: 'Đăng bán ngay', href: '/cho-sinh-vien/dang-ban' },
  },
  'ket-qua-tim-kiem': {
    icon: 'SearchX',
    title: 'Không tìm thấy kết quả',
    description: 'Thử từ khoá khác hoặc bỏ bộ lọc để xem thêm sản phẩm.',
  },
  'yeu-thich': {
    icon: 'Heart',
    title: 'Chưa có sản phẩm yêu thích',
    description: 'Nhấn ♡ trên sản phẩm bất kỳ để lưu vào đây.',
    action: { label: 'Khám phá chợ sinh viên', href: '/cho-sinh-vien' },
  },
  'tin-cua-toi-dang-ban': {
    icon: 'Tag',
    title: 'Bạn chưa đăng tin nào',
    description: 'Đăng tin để bán đồ nhanh cho sinh viên quanh bạn.',
    action: { label: 'Đăng tin ngay', href: '/cho-sinh-vien/dang-ban' },
  },
  'tin-cua-toi-da-ban': {
    icon: 'CheckCircle',
    title: 'Chưa có giao dịch nào',
    description: 'Sản phẩm bạn đã bán thành công sẽ hiển thị ở đây.',
  },
  'tin-cua-toi-da-an': {
    icon: 'EyeOff',
    title: 'Không có tin đã ẩn',
    description: 'Tin bạn ẩn sẽ không hiển thị với người mua khác.',
  },

  /* Tin nhắn */
  'tin-nhan': {
    icon: 'MessageCircle',
    title: 'Chưa có tin nhắn nào',
    description: 'Nhắn tin với người mua hoặc người bán để bắt đầu trao đổi.',
    action: { label: 'Khám phá chợ sinh viên', href: '/cho-sinh-vien' },
  },

  /* Thông báo */
  'thong-bao': {
    icon: 'Bell',
    title: 'Không có thông báo mới',
    description: 'Chúng tôi sẽ thông báo khi có cập nhật về đơn hàng và sản phẩm của bạn.',
  },

  /* Lịch sử */
  'lich-su-giao-dich': {
    icon: 'Receipt',
    title: 'Chưa có giao dịch nào',
    description: 'Lịch sử mua bán và đặt chuyến sẽ được lưu ở đây.',
  },

  /* Địa chỉ */
  'dia-chi-da-luu': {
    icon: 'MapPin',
    title: 'Chưa có địa chỉ nào',
    description: 'Lưu địa chỉ KTX, nhà trọ để đặt chuyến nhanh hơn.',
    action: { label: 'Thêm địa chỉ', href: '/tai-khoan/dia-chi' },
  },
} satisfies Record<string, EmptyStateConfig>

export type EmptyStateKey = keyof typeof EMPTY_STATES

/* ── Loading / Skeleton Config ───────────────────────────────
   Maps each screen to the skeleton variant it should render.
   ──────────────────────────────────────────────────────────── */
export type SkeletonType =
  | 'product-grid'        // 2-col product cards (Chợ SV, Yêu thích)
  | 'product-list-h'      // horizontal scroll strip (Home preview)
  | 'product-detail'      // full product detail page
  | 'order-list'          // order card stack
  | 'order-detail'        // single order detail
  | 'message-list'        // conversation list rows
  | 'message-chat'        // chat bubble sequence
  | 'profile'             // profile page with avatar + menu rows
  | 'notification-list'   // notification item rows
  | 'listing-form'        // create/edit form fields

export interface LoadingStateConfig {
  skeletonType: SkeletonType
  count: number
}

export const LOADING_CONFIGS: Record<string, LoadingStateConfig> = {
  'cho-sinh-vien':       { skeletonType: 'product-grid',       count: 6 },
  'yeu-thich':           { skeletonType: 'product-grid',       count: 4 },
  'tin-cua-toi':         { skeletonType: 'order-list',         count: 4 },
  'home-preview':        { skeletonType: 'product-list-h',     count: 4 },
  'chi-tiet-san-pham':   { skeletonType: 'product-detail',     count: 1 },
  'don-hang':            { skeletonType: 'order-list',         count: 4 },
  'chi-tiet-don-hang':   { skeletonType: 'order-detail',       count: 1 },
  'tin-nhan':            { skeletonType: 'message-list',       count: 6 },
  'cuoc-tro-chuyen':     { skeletonType: 'message-chat',       count: 8 },
  'tai-khoan':           { skeletonType: 'profile',            count: 1 },
  'thong-bao':           { skeletonType: 'notification-list',  count: 5 },
  'dang-ban-form':       { skeletonType: 'listing-form',       count: 1 },
}

/* ── Success Messages ────────────────────────────────────────
   Key format: '<domain>.<action>'
   ──────────────────────────────────────────────────────────── */
export const SUCCESS_MESSAGES = {
  'tin.dang-moi':          'Đã đăng tin thành công 🎉',
  'tin.cap-nhat':          'Đã cập nhật tin',
  'tin.da-ban':            'Chúc mừng! Bán thành công 🎉',
  'tin.gia-han':           'Đã gia hạn thêm 30 ngày',
  'tin.an':                'Đã ẩn tin',
  'tin.hien':              'Đã hiện tin',
  'tin.xoa':               'Đã xoá tin',
  'chuyen.dat-thanh-cong': 'Đặt chuyến thành công!',
  'chuyen.huy':            'Đã huỷ chuyến',
  'ho-so.cap-nhat':        'Đã cập nhật hồ sơ',
  'mat-khau.doi':          'Đã đổi mật khẩu',
  'xac-minh.thanh-cong':   'Xác minh sinh viên thành công ✅',
  'dia-chi.them':          'Đã thêm địa chỉ',
  'dia-chi.cap-nhat':      'Đã cập nhật địa chỉ',
  'dia-chi.xoa':           'Đã xoá địa chỉ',
  'yeu-thich.them':        'Đã lưu vào yêu thích',
  'yeu-thich.bo':          'Đã bỏ khỏi yêu thích',
  'bao-cao.gui':           'Đã gửi báo cáo. Cảm ơn bạn!',
} satisfies Record<string, string>

export type SuccessKey = keyof typeof SUCCESS_MESSAGES

/* ── Error Messages ──────────────────────────────────────────
   Shown in toast or inline error states.
   ──────────────────────────────────────────────────────────── */
export const ERROR_MESSAGES = {
  'mang':                   'Không thể kết nối. Vui lòng kiểm tra mạng.',
  'xac-thuc':               'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
  'khong-tim-thay':         'Không tìm thấy nội dung này.',
  'tin.khong-ton-tai':      'Tin đăng không tồn tại hoặc đã bị xoá.',
  'tin.da-bi-an':           'Tin đăng này đã bị ẩn.',
  'don-hang.khong-ton-tai': 'Đơn hàng không tồn tại.',
  'tai-anh.that-bai':       'Tải ảnh thất bại. Vui lòng thử lại.',
  'tai-anh.qua-lon':        'Ảnh quá lớn. Tối đa 5MB mỗi ảnh.',
  'tai-anh.sai-dinh-dang':  'Định dạng không hỗ trợ. Dùng JPG, PNG hoặc WebP.',
  'dang-nhap.sai':          'Email hoặc mật khẩu không đúng.',
  'dang-ky.email-ton-tai':  'Email này đã được đăng ký.',
  'gia.khong-hop-le':       'Giá không hợp lệ. Vui lòng nhập số nguyên dương.',
  'tieu-de.qua-ngan':       'Tiêu đề quá ngắn. Cần ít nhất 10 ký tự.',
  'khong-co-anh':           'Vui lòng thêm ít nhất 1 ảnh sản phẩm.',
  'mac-dinh':               'Đã có lỗi xảy ra. Vui lòng thử lại.',
} satisfies Record<string, string>

export type ErrorKey = keyof typeof ERROR_MESSAGES
