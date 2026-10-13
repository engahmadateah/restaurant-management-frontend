

export function newIdempotencyKey(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;

  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  if (c && typeof c.getRandomValues === "function") {
    const bytes = c.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

export interface IdempotencyKeeper {
 
  keyFor: (payload: unknown) => string;

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


export function idempotencyHeaders(key?: string) {
  return key ? { "Idempotency-Key": key } : undefined;
}
