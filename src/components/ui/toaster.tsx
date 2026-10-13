import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      dir="rtl"
      toastOptions={{
        style: {
          background: "white",
          border: "1px solid var(--color-line)",
          color: "var(--color-ink)",
          fontFamily: "var(--font-sans)",
          borderRadius: "var(--radius-md)",
        },
      }}
    />
  );
}
