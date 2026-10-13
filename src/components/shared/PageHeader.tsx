import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="mb-1.5 h-[3px] w-8 rounded-full bg-[var(--color-gold-500)]" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">{title}</h1>
        {description && <p className="text-sm text-[var(--color-ink-soft)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
