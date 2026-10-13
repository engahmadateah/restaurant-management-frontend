import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, Plus, Search, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { usersApi, type UserPayload } from "@/api/users";
import { getApiErrorMessage } from "@/api/client";
import { ROLE_LABELS } from "@/lib/roleLabels";
import { formatCurrency } from "@/lib/format";
import { usePermissions } from "@/hooks/usePermissions";
import type { UserRole } from "@/types/auth";
import type { StaffUser } from "@/types/models";
import { UserFormDialog, type UserFormValues } from "./UserFormDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { UserPermissionsDialog } from "./UserPermissionsDialog";

const ROLE_BADGE: Record<UserRole, "gold" | "info" | "success" | "warning" | "neutral"> = {
  admin: "gold",
  manager: "info",
  cashier: "success",
  waiter: "neutral",
  chef: "warning",
  driver: "neutral",
};

export default function StaffPage() {
  const queryClient = useQueryClient();
  const { user: me, hasRole } = usePermissions();
  const isAdmin = hasRole("admin");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [deleting, setDeleting] = useState<StaffUser | null>(null);
  const [resetting, setResetting] = useState<StaffUser | null>(null);
  const [permsUser, setPermsUser] = useState<StaffUser | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const createMutation = useMutation({
    mutationFn: (payload: UserPayload) => usersApi.create(payload),
    onSuccess: () => {
      toast.success("تمت إضافة الموظف، رح يغيّر كلمة السر بأول دخول");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UserPayload> }) => usersApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الموظف");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => usersApi.resetPassword(id, password),
    onSuccess: () => {
      toast.success("تم تغيير كلمة السر، رح يضطر الموظف يغيّرها بأول دخول");
      setResetting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleSubmit(values: UserFormValues) {
    const payload: UserPayload = {
      ...values,
      phone: values.phone || null,
      hourly_rate: values.hourly_rate || null,
      monthly_salary: values.monthly_salary || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (u) =>
        (roleFilter === "all" || u.role === roleFilter) &&
        (!q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone ?? "").includes(q))
    );
  }, [data, search, roleFilter]);

  function salaryLabel(u: StaffUser) {
    if (u.salary_type === "hourly") {
      return u.hourly_rate ? `${formatCurrency(u.hourly_rate)} / ساعة` : "—";
    }
    return u.monthly_salary ? `${formatCurrency(u.monthly_salary)} / شهر` : "—";
  }

  const colSpan = 6;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الموظفون"
        description="حسابات الموظفين وأدوارهم ورواتبهم وصلاحياتهم"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            موظف جديد
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الإيميل أو الهاتف..."
            className="pr-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={roleFilter === "all" ? "default" : "outline"} onClick={() => setRoleFilter("all")}>
            الكل
          </Button>
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
            <Button
              key={role}
              size="sm"
              variant={roleFilter === role ? "default" : "outline"}
              onClick={() => setRoleFilter(role)}
            >
              {ROLE_LABELS[role]}
            </Button>
          ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>الدور</TableHead>
            <TableHead>الهاتف</TableHead>
            <TableHead>الراتب</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-44 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={colSpan}>جارِ التحميل...</TableEmpty>}
          {!isLoading && data && data.length > 0 && visible.length === 0 && (
            <TableEmpty colSpan={colSpan}>ما في موظفين مطابقين</TableEmpty>
          )}
          {!isLoading && data?.length === 0 && (
            <TableEmpty colSpan={colSpan}>
              <div className="flex flex-col items-center gap-2 py-4">
                <UserCog className="h-8 w-8 text-[var(--color-ink-soft)]" />
                ما في موظفين مضافين بعد
              </div>
            </TableEmpty>
          )}
          {visible.map((u) => {
            const isSelf = me?.id === u.id;
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {u.name}
                      {isSelf && <span className="mr-1.5 text-xs text-[var(--color-ink-soft)]">(أنت)</span>}
                    </span>
                    <span className="text-xs text-[var(--color-ink-soft)]" dir="ltr">
                      {u.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={ROLE_BADGE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                </TableCell>
                <TableCell className="tabular text-[var(--color-ink-soft)]" dir="ltr">
                  {u.phone || "—"}
                </TableCell>
                <TableCell className="tabular">{salaryLabel(u)}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    {u.is_active ? <Badge variant="success">فعّال</Badge> : <Badge variant="neutral">معطّل</Badge>}
                    {u.must_change_password && <Badge variant="warning">بانتظار تغيير كلمة السر</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {isAdmin && (
                      <Button variant="ghost" size="icon" title="الصلاحيات" onClick={() => setPermsUser(u)}>
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="تصفير كلمة السر" onClick={() => setResetting(u)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="تعديل"
                      onClick={() => {
                        setEditing(u);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!isSelf && (
                      <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleting(u)}>
                        <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <ResetPasswordDialog
        open={!!resetting}
        onOpenChange={(open) => !open && setResetting(null)}
        user={resetting}
        submitting={resetMutation.isPending}
        onSubmit={(password) => resetting && resetMutation.mutate({ id: resetting.id, password })}
      />

      <UserPermissionsDialog
        open={!!permsUser}
        onOpenChange={(open) => !open && setPermsUser(null)}
        user={permsUser}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`حذف الموظف "${deleting?.name}"؟`}
        description="رح ينحذف حسابه وتنسحب جلساته، بس طلباته ودفعاته وكشوف رواتبه بتضل بالسجل."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
