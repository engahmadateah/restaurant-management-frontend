import axios from "axios";


export const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { Accept: "application/json" },
  timeout: 20_000,
});

export interface PublicInfo {
  restaurant_name: string;
  phone: string;
  address: string;
  currency: string;
  delivery_fee: number;
  qr_ordering_enabled: boolean;
  online_ordering_enabled: boolean;
  online_min_order: number;
}

export interface PublicModifier {
  id: number;
  name: string;
  extra_price: number;
}

export interface PublicModifierGroup {
  id: number;
  name: string;
  is_required: boolean;
  max_selections: number | null;
  modifiers: PublicModifier[];
}

export interface PublicMenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
 
  tax_rate: number;
 
  image: string | null;
  sold_out: boolean;
  modifier_groups: PublicModifierGroup[];
}

export interface PublicCategory {
  id: number;
  name: string;
  items: PublicMenuItem[];
}

export type PublicOrderType = "dine_in" | "takeaway" | "delivery";

export interface PublicOrderPayload {

  client_request_id: string;
  order_type: PublicOrderType;
  table_token?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  notes?: string;
  items: { menu_item_id: number; quantity: number; notes?: string; modifiers?: number[] }[];
}

export interface PublicOrder {

  token: string;
  order_number: string;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  order_type: PublicOrderType;
  delivery_status: "not_applicable" | "pending" | "assigned" | "out_for_delivery" | "delivered" | "cancelled" | null;
  payment_status: "unpaid" | "partial" | "paid" | "refunded";
  table_number: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  items: { name: string | null; quantity: number; price: number; notes: string | null; modifiers: string[] }[];
}

export const publicOrderingApi = {
  info: () => publicClient.get<PublicInfo>("/public/info").then((r) => r.data),
  menu: (lang?: string) =>
    publicClient.get<{ categories: PublicCategory[] }>("/public/menu", { params: lang ? { lang } : undefined }).then((r) => r.data.categories),
  table: (token: string) =>
    publicClient.get<{ table_number: string; ordering_enabled: boolean }>(`/public/tables/${encodeURIComponent(token)}`).then((r) => r.data),
  createOrder: (payload: PublicOrderPayload) => publicClient.post<PublicOrder>("/public/orders", payload).then((r) => r.data),
  track: (token: string) => publicClient.get<PublicOrder>(`/public/orders/${encodeURIComponent(token)}`).then((r) => r.data),
};
