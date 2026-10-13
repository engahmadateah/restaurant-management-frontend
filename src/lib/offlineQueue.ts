import axios from "axios";
import { getApiErrorMessage } from "@/api/client";
import { newIdempotencyKey } from "@/lib/idempotency";
import type { OrderPayload } from "@/api/orders";
import type { PaymentMethod } from "@/types/models";


export interface QueuedPayment {
  method: PaymentMethod;
}

export interface QueuedOrder {
 
  id: string;

  userId: number;
  createdAt: string;
  orderKey: string;
  paymentKey: string;
  payload: OrderPayload;

  estimatedSubtotal: number;
  itemCount: number;
  payment: QueuedPayment | null;
  orderId?: number;
  orderNumber?: string;
  orderTotal?: number;
  paymentDone?: boolean;
  status: "pending" | "failed";
  attempts: number;
  lastError?: string;
}


export type FailureKind = "offline" | "transient" | "auth" | "rejected";

export function classifyError(err: unknown): FailureKind {
  if (axios.isCancel(err) || !axios.isAxiosError(err)) return "transient";
  if (!err.response) return "offline";

  const status = err.response.status;
  if (status === 401) return "auth";
  if (status === 408 || status === 409 || status === 425 || status === 429 || status >= 500) return "transient";
  return "rejected";
}

export class OfflineSaveError extends Error {
  constructor() {
    super("تعذّر حفظ الطلب على الجهاز (التخزين ممتلئ أو غير متاح). الطلب ما انحفظ، جرّب لما يرجع الاتصال.");
    this.name = "OfflineSaveError";
  }
}

export function buildQueuedOrder(args: {
  userId: number;
  payload: OrderPayload;
  orderKey: string;
  estimatedSubtotal: number;
}): QueuedOrder {
  return {
    id: newIdempotencyKey(),
    userId: args.userId,
    createdAt: new Date().toISOString(),
    orderKey: args.orderKey,
    paymentKey: newIdempotencyKey(),
    payload: args.payload,
    estimatedSubtotal: args.estimatedSubtotal,
    itemCount: args.payload.items.reduce((n, i) => n + i.quantity, 0),
    payment: null,
    status: "pending",
    attempts: 0,
  };
}

export function shortRef(id: string): string {
  return id.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase();
}

export interface SyncStore {
  all: () => QueuedOrder[];
  update: (id: string, patch: Partial<QueuedOrder>) => void;
  remove: (id: string) => void;
}

export interface SyncDeps {
  createOrder: (payload: OrderPayload, key: string) => Promise<{ id: number; order_number: string; total: string | number }>;
  createPayment: (payload: { order_id: number; method: PaymentMethod; amount: number }, key: string) => Promise<unknown>;
  getMessage?: (err: unknown) => string;
}

export interface SyncResult {
  synced: QueuedOrder[];
  failed: QueuedOrder[];
  stoppedBy: FailureKind | null;
}


export async function runSync(userId: number, store: SyncStore, deps: SyncDeps): Promise<SyncResult> {
  const message = deps.getMessage ?? getApiErrorMessage;
  const result: SyncResult = { synced: [], failed: [], stoppedBy: null };

  const queue = store
    .all()
    .filter((e) => e.userId === userId && e.status === "pending")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const original of queue) {
    let entry = original;
    try {
      if (entry.orderId === undefined) {
        const order = await deps.createOrder(entry.payload, entry.orderKey);
        const patch = { orderId: order.id, orderNumber: order.order_number, orderTotal: Number(order.total) };
        store.update(entry.id, patch);
        entry = { ...entry, ...patch };
      }

      if (entry.payment && !entry.paymentDone) {

        if ((entry.orderTotal ?? 0) > 0) {
          await deps.createPayment(
            { order_id: entry.orderId as number, method: entry.payment.method, amount: entry.orderTotal as number },
            entry.paymentKey
          );
        }
        store.update(entry.id, { paymentDone: true });
        entry = { ...entry, paymentDone: true };
      }

      store.remove(entry.id);
      result.synced.push(entry);
    } catch (err) {
      const kind = classifyError(err);

      const patch = { attempts: entry.attempts + 1, lastError: kind === "offline" ? "ما في اتصال بالسيرفر" : message(err) };

      if (kind === "rejected") {
        store.update(entry.id, { ...patch, status: "failed" });
        result.failed.push({ ...entry, ...patch, status: "failed" });
        continue;
      }

      store.update(entry.id, patch);
      result.stoppedBy = kind;
      break;
    }
  }

  return result;
}
