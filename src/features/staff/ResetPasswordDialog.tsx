import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StaffUser } from "@/types/models";

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: StaffUser | null;
  submitting: boolean;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("لازم 6 حروف/أرقام على الأقل");
      return;
    }
    onSubmit(password);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>تصفير كلمة السر</DialogTitle>
          <DialogDescription>
            كلمة سر جديدة لـ "{user?.name}". رح يتسحبوا كل جلسات الموظف الحالية، وبأول دخول رح يضطر يغيّر كلمة السر لواحدة خاصة فيه.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new_password">كلمة السر الجديدة</Label>
            <Input
              id="new_password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoFocus
            />
            {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              تأكيد
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}