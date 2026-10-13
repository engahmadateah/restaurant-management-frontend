
export interface Translations {
  en?: { name?: string; description?: string };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;

  tax_rate: string | null;
  translations: Translations | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  category_id: number;
  category?: Category;
  name: string;
  description: string | null;
  price: string; 
 
  tax_rate: string | null;
  translations: Translations | null;
  image: string | null;
  is_available: boolean;
  sort_order: number;
  track_stock: boolean;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  created_at: string;
  updated_at: string;
}

export interface Modifier {
  id: number;
  modifier_group_id: number;
  name: string;
  extra_price: string;
  is_available: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ModifierGroup {
  id: number;
  menu_item_id: number;
  name: string;
  is_required: boolean;
  max_selections: number;
  sort_order: number;
  modifiers?: Modifier[];
  created_at?: string;
  updated_at?: string;
}

export type TableStatus = "available" | "occupied" | "reserved";
export type TableShape = "rectangle" | "circle" | "square";

export interface RestaurantTable {
  id: number;
  table_number: string;
  capacity: number;
  status: TableStatus;
  
  floor_id: number | null;
  pos_x: number | null;
  pos_y: number | null;
  width: number;
  height: number;
  rotation: number;
  shape: TableShape;
  floor?: Floor | null;
  created_at: string;
  updated_at: string;
}

export interface Floor {
  id: number;
  name: string;
  canvas_width: number;
  canvas_height: number;
  sort_order: number;
  is_active: boolean;
  tables?: RestaurantTable[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface FavoriteMenuItem extends MenuItem {
  category?: Category;
}

export type OrderType = "dine_in" | "takeaway" | "delivery";
export type OrderSource = "pos" | "qr" | "online";
export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

export type DeliveryStatus = "not_applicable" | "pending" | "assigned" | "out_for_delivery" | "delivered" | "cancelled";
export type PaymentMethod = "cash" | "card" | "online";

export interface Payment {
  id: number;
  order_id: number;
  method: PaymentMethod;
  amount: string;
  
  tendered_amount?: string | null;
  change_amount?: string | null;
  status: "pending" | "paid" | "refunded";
  created_at: string;
  updated_at: string;
}

export interface OrderItemModifier {
  id: number;
  modifier_id: number;
  name: string;
  price: string;
}

export interface OrderItem {
  id: number;
  menu_item_id: number;
  menu_item?: MenuItem;
  quantity: number;
  unit_price: string;
  notes: string | null;
  modifiers?: OrderItemModifier[];
}

export interface LoyaltyTransaction {
  id: number;
  customer_id: number;
  type: string;
  points: number;
  description: string | null;
  order_id: number | null;
  created_at: string;
}

export type RefundStatus = "pending" | "approved" | "rejected";

export interface Refund {
  id: number;
  order_id: number;
  order?: { id: number; order_number: string; total: string } | null;
  payment_id: number | null;
  payment?: { id: number; method: PaymentMethod; amount: string } | null;
  amount: string;
  reason: string | null;
  status: RefundStatus;
  requested_by?: number;
  requestedBy?: { id: number; name: string } | null;
  processed_by?: number | null;
  processedBy?: { id: number; name: string } | null;
  processed_at: string | null;
  admin_note: string | null;
  created_at: string;
}

export interface Review {
  id: number;
  menu_item_id: number;
  menuItem?: { id: number; name: string } | null;
  customer_id: number | null;
  customer?: { id: number; name: string } | null;
  order_id: number | null;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  table_id: number | null;
  table?: RestaurantTable;
  customer_id: number | null;
  customer?: Customer;
  user_id: number | null;
  coupon_id: number | null;
  source?: OrderSource;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  payment_status: PaymentStatus;
  notes: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  loyalty_points_earned: number;
  loyalty_points_redeemed: number;
  driver_id: number | null;
  driver?: { id: number; name: string; phone?: string | null } | null;
  delivery_address: string | null;
  delivery_phone: string | null;
  delivery_fee: string | null;
  delivery_status: DeliveryStatus | null;
  items?: OrderItem[];
  payments?: Payment[];
  refunds?: Refund[];
  loyaltyTransactions?: LoyaltyTransaction[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

export interface Reservation {
  id: number;
  table_id: number | null;
  table?: RestaurantTable | null;
  customer_id: number | null;
  customer?: Customer | null;
  user_id: number;
  user?: { id: number; name: string } | null;
  customer_name: string | null;
  customer_phone: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: ReservationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory =
  | "rent"
  | "utilities"
  | "salaries"
  | "supplies"
  | "maintenance"
  | "marketing"
  | "other";

export interface Expense {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: string;
  expense_date: string;
  notes: string | null;
  created_by: number;
  creator?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: number;
  user_id: number;
  user?: { id: number; name: string; role: import("./auth").UserRole };
  clock_in: string;
  clock_out: string | null;
  auto_closed?: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ShiftScheduleStatus = "scheduled" | "confirmed" | "cancelled" | "completed";

export interface ShiftSchedule {
  id: number;
  user_id: number;
  user?: { id: number; name: string; role: import("./auth").UserRole };
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: ShiftScheduleStatus;
  notes: string | null;
  created_by: number | null;
  creator?: { id: number; name: string } | null;
  shift_id: number | null;
  created_at: string;
  updated_at: string;
}

export type SalaryType = "hourly" | "monthly";
export type PayrollStatus = "draft" | "approved" | "paid";

export interface Payroll {
  id: number;
  user_id: number;
  user?: { id: number; name: string; role: import("./auth").UserRole };
  period_start: string;
  period_end: string;
  salary_type: SalaryType;
  hourly_rate: string | null;
  monthly_salary: string | null;
  overtime_multiplier: string;
  total_hours: string;
  regular_hours: string;
  overtime_hours: string;
  regular_pay: string;
  overtime_pay: string;
  deductions: string;
  gross_pay: string;
  net_pay: string;
  status: PayrollStatus;
  generated_by: number | null;
  generatedBy?: { id: number; name: string } | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: number;
  code: string;
  type: CouponType;
  value: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: import("./auth").UserRole;
  phone: string | null;
  is_active: boolean;
  must_change_password?: boolean;

  salary_type: SalaryType;
  hourly_rate: string | null;
  monthly_salary: string | null;
  weekly_overtime_threshold_hours: number;
  overtime_multiplier: string;
  created_at: string;
  updated_at: string;
}
