import { Card, CardContent } from "@/components/ui/card";

export function StatBlock({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
        <p className="tabular mt-1 text-xl font-semibold text-[var(--color-ink)]">{value}</p>
        {hint && <p className="mt-1 text-[11px] leading-snug text-[var(--color-ink-soft)]">{hint}</p>}
      </CardContent>
    </Card>
  );
}
