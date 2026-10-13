import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <ShieldAlert className="h-12 w-12 text-[var(--color-danger)]" />
      <h1 className="text-xl font-semibold text-[var(--color-ink)]">ما عندك صلاحية توصل لهاد القسم</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">تواصل مع مدير النظام إذا بتحتاج صلاحية إضافية</p>
      <Button asChild variant="outline">
        <Link to="/">الرجوع للوحة التحكم</Link>
      </Button>
    </div>
  );
}
