import { Construction } from "lucide-react";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[var(--color-ink)]">{title}</h1>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line)] text-center">
        <Construction className="h-10 w-10 text-[var(--color-wine-400)]" />
        <p className="text-sm text-[var(--color-ink-soft)]">هاد القسم جاهز للبناء بالخطوة الجاية</p>
      </div>
    </div>
  );
}
