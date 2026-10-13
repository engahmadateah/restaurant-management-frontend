
export function Flourish({ tone = "light" }: { tone?: "light" | "dark" }) {
  const lineColor = tone === "dark" ? "var(--color-wine-700)" : "var(--color-line)";

  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1" style={{ backgroundColor: lineColor }} />
      <span
        className="h-1.5 w-1.5 rotate-45"
        style={{ backgroundColor: "var(--color-gold-500)" }}
      />
      <span className="h-px flex-1" style={{ backgroundColor: lineColor }} />
    </div>
  );
}
