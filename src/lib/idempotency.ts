/**
 * مفاتيح Idempotency للطلبات يلي بتغيّر مال (إنشاء طلب، تسجيل دفعة).
 *
 * الفكرة: كل "نيّة" (طلب بهالمحتوى، دفعة بهالمبلغ) إلها مفتاح ثابت. لو الطلب فشل بسبب
 * النت والكاشير ضغط مرة تانية، بنبعت نفس المفتاح فالسيرفر بيرجّع النتيجة الأولى بدل ما ينفّذ
 * العملية مرتين. لو تغيّر المحتوى (عدّل السلة مثلاً) بنولّد مفتاح جديد. وبعد النجاح
 * بنعمل reset() حتى العملية الجاية تاخد مفتاح جديد.
 */

export function newIdempotencyKey(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  // randomUUID بس بالـ https/localhost: كاشير شغّال على http بالشبكة المحلية لازم يلاقي بديل
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  if (c && typeof c.getRandomValues === "function") {
    const bytes = c.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

export interface IdempotencyKeeper {
  /** نفس المفتاح طالما نفس المحتوى، ومفتاح جديد لما يتغيّر */
  keyFor: (payload: unknown) => string;
  /** استدعيه بعد النجاح */
  reset: () => void;
}

export function createIdempotencyKeeper(): IdempotencyKeeper {
  let last: { fingerprint: string; key: string } | null = null;

  return {
    keyFor(payload) {
      const fingerprint = JSON.stringify(payload);
      if (!last || last.fingerprint !== fingerprint) {
        last = { fingerprint, key: newIdempotencyKey() };
      }
      return last.key;
    },
    reset() {
      last = null;
    },
  };
}

/** هيدر جاهز للـ axios */
export function idempotencyHeaders(key?: string) {
  return key ? { "Idempotency-Key": key } : undefined;
}
