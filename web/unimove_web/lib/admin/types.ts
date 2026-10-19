// Enums from actual DB schema
export type UserRole = "customer" | "provider" | "admin";
export type UserStatus = "active" | "inactive" | "suspended" | "pending_verification";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type OrderStatus =
  | "pending"
  | "matched"
  | "accepted"
  | "picking_up"
  | "picked_up"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "cancelled";
export type PaymentMethod =
  | "payos"
  | "cash"
  | "bank_transfer"
  | "wallet"
  | "credit_card"
  | "debit_card"
  | "momo";
export type ServiceType = "standard" | "express" | "premium";
export type VehicleSize = "motorbike" | "small_truck" | "medium_truck" | "large_truck";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type DisputeStatus = "open" | "investigating" | "resolved" | "closed";
export type DisputeType = "payment" | "service_quality" | "damage" | "cancellation" | "other";

// Profile
export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  student_id: string | null;
  university: string | null;
  business_name: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  rating: number | null;
  total_reviews: number;
  total_orders: number;
  total_spent: number;
  total_earnings: number;
  is_verified: boolean;
  is_available: boolean | null;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

// Provider Document
export interface ProviderDocument {
  id: string;
  provider_id: string;
  document_type: string;
  document_url: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  is_verified: boolean;
  notes: string | null;
  created_at: string;
}

// Order
export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  provider_id: string | null;
  service_type: ServiceType;
  vehicle_size: VehicleSize;
  pickup_address: string;
  pickup_city: string;
  pickup_district: string;
  delivery_address: string;
  delivery_city: string;
  delivery_district: string;
  total_price: number;
  base_price: number;
  status: OrderStatus;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // joined
  customer?: Pick<Profile, "id" | "full_name" | "email" | "phone" | "avatar_url">;
  provider?: Pick<Profile, "id" | "full_name" | "business_name" | "phone" | "avatar_url">;
}

// Payment
export interface Payment {
  id: string;
  payment_code: string;
  order_id: string;
  customer_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

// Refund
export interface Refund {
  id: string;
  payment_id: string;
  order_id: string;
  refund_amount: number;
  refund_reason: string;
  status: PaymentStatus;
  requested_by: string;
  approved_by: string | null;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
  // joined
  requester?: Pick<Profile, "id" | "full_name" | "role">;
  order?: Pick<Order, "id" | "order_number">;
}

// Dispute
export interface Dispute {
  id: string;
  order_id: string;
  raised_by: string;
  raised_by_role: UserRole;
  against_user_id: string | null;
  dispute_type: DisputeType;
  subject: string;
  description: string;
  evidence_images: string[] | null;
  evidence_documents: string[] | null;
  status: DisputeStatus;
  priority: string;
  resolution: string | null;
  resolution_type: string | null;
  refund_amount: number | null;
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  order?: Pick<Order, "id" | "order_number">;
  raiser?: Pick<Profile, "id" | "full_name" | "role">;
}

// Review
export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  provider_id: string;
  rating: number;
  service_quality_rating: number | null;
  punctuality_rating: number | null;
  comment: string | null;
  tags: string[] | null;
  images: string[] | null;
  is_published: boolean;
  is_flagged: boolean;
  flagged_reason: string | null;
  is_hidden: boolean;
  hidden_reason: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  // joined
  customer?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  provider?: Pick<Profile, "id" | "full_name" | "business_name" | "avatar_url">;
  order?: Pick<Order, "id" | "order_number">;
}

// Announcement
export interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  target_audience: "all" | "customers" | "providers";
  target_cities: string[] | null;
  priority: NotificationPriority;
  scheduled_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  is_published: boolean;
  is_active: boolean;
  sent_count: number;
  read_count: number;
  created_by: string | null;
  created_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  gmv_yesterday: number;
  orders_yesterday: number;
  active_users: number;
  pending_verifications: number;
  open_disputes: number;
  platform_commission: number;
}

// Revenue data for charts
export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

// Pagination
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
