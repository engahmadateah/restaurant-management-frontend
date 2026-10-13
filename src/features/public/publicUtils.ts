import axios from "axios";

export function publicErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "تعذّر الاتصال بالإنترنت. تأكد من الشبكة وجرّب مرة تانية";
    if (err.response.status === 429) return "محاولات كتير بوقت قصير. انتظر دقيقة وجرّب مرة تانية";
    const data = err.response.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    const first = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
    return first ?? data?.message ?? "صار خطأ غير متوقع، جرّب مرة تانية";
  }
  return "صار خطأ غير متوقع، جرّب مرة تانية";
}

export const toCents = (value: number) => Math.round(value * 100);
export const fromCents = (cents: number) => cents / 100;

const LAST_ORDER_KEY = "zeitoun-public-last-order";
const LAST_ORDER_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export interface LastOrder {
  token: string;
  menuPath: string;
  at: number;
}

export function saveLastOrder(order: Omit<LastOrder, "at">) {
  try {
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ ...order, at: Date.now() }));
  } catch {
  }
}

export function readLastOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastOrder;
    if (!parsed?.token || Date.now() - parsed.at > LAST_ORDER_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

const CONTACT_KEY = "zeitoun-public-contact";

export interface SavedContact {
  name: string;
  phone: string;
  address: string;
}

export function readContact(): SavedContact {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONTACT_KEY) ?? "{}") as Partial<SavedContact>;
    return { name: parsed.name ?? "", phone: parsed.phone ?? "", address: parsed.address ?? "" };
  } catch {
    return { name: "", phone: "", address: "" };
  }
}

export function saveContact(contact: SavedContact) {
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
  } catch {

  }
}
