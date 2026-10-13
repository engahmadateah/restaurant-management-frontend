import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { usersApi } from "@/api/users";
import { getApiErrorMessage } from "@/api/client";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@/lib/permissionLabels";
import { ROLE_LABELS } from "@/lib/roleLabels";
import type { Permission } from "@/types/auth";
import type { StaffUser } from "@/types/models";


export function UserPermissionsDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: StaffUser | null;
}) {
  const queryClient = useQueryClient();
  const [extra, setExtra] = useState<Set<Permission>>(new Set());
  const [revoked, setRevoked] = useState<Set<Permission>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: () => usersApi.getPermissions(user!.id),
    enabled: open && !!user,
  });

  const isAdmin = user?.role === "admin";
  const roleDefaults = new Set<Permission>(
    isAdmin ? (Object.keys(PERMISSION_LABELS) as Permission[]) : ((data?.role_defaults as Permission[]) ?? [])
  );

  useEffect(() => {
    if (open && data) {
      setExtra(new Set(data.extra_permissions));
      setRevoked(new Set(data.revoked_permissions));
    }
  }, [open, data]);

  const mutation = useMutation({
    mutationFn: () =>
      usersApi.updatePermissions(user!.id, {
        extra_permissions: [...extra],
        revoked_permissions: [...revoked],
      }),
    onSuccess: () => {
      toast.success("تم حفظ الصلاحيات");
      queryClient.invalidateQueries({ queryKey: ["user-permissions", user?.id] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function isChecked(permission: Permission) {
    if (roleDefaults.has(permission)) return !revoked.has(permission);
    return extra.has(permission);
  }

  function toggle(permission: Permission) {
    const checked = isChecked(permission);
    if (roleDefaults.has(permission)) {
      setRevoked((prev) => {
        const next = new Set(prev);
        if (checked) next.add(permission);
        else next.delete(permission);
        return next;
      });
    } else {
      setExtra((prev) => {
        const next = new Set(prev);
        if (checked) next.delete(permission);
        else next.add(permission);
        return next;
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            صلاحيات "{user?.name}"
          </DialogTitle>
          <DialogDescription>
            الدور الأساسي <Badge variant="neutral">{user ? ROLE_LABELS[user.role] : ""}</Badge> بيحدد الصلاحيات
            الافتراضية. فيك تسحب صلاحية افتراضية أو تضيف صلاحية زيادة فوق الدور.
          </DialogDescription>
        </DialogHeader>

        {isAdmin ? (
          <p className="rounded-[var(--radius-sm)] bg-[var(--color-wine-50)] p-3 text-sm text-[var(--color-ink-soft)]">
            حساب الأدمن عنده كل الصلاحيات دايمًا بشكل تلقائي، وما فيك تعدّلها.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-[var(--color-ink-soft)]">جارِ التحميل...</p>
        ) : (
          <div className="flex max-h-[50vh] flex-col gap-5 overflow-y-auto pl-1">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-2">
                <p className="text-xs font-medium text-[var(--color-ink-soft)]">{group.title}</p>
                <div className="flex flex-col gap-2">
                  {group.permissions.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-1 py-0.5 text-sm hover:bg-[var(--color-wine-50)]"
                    >
                      <Checkbox checked={isChecked(permission)} onCheckedChange={() => toggle(permission)} />
                      {PERMISSION_LABELS[permission]}
                      {roleDefaults.has(permission) && !revoked.has(permission) && (
                        <span className="text-xs text-[var(--color-ink-soft)]">(افتراضية من الدور)</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {!isAdmin && (
            <Button type="button" disabled={mutation.isPending || isLoading} onClick={() => mutation.mutate()}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ الصلاحيات
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              إغلاق
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
