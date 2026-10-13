import { Loader2 } from "lucide-react";


export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center text-[var(--color-ink-soft)]" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--color-gold-500)]" />
      <span className="sr-only">جارِ التحميل...</span>
    </div>
  );
}
