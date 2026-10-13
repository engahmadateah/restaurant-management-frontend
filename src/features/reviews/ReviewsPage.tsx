import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Check, Trash2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { reviewsApi, type ReviewCreatePayload, type ReviewUpdatePayload } from "@/api/reviews";
import { getApiErrorMessage } from "@/api/client";
import { formatDate } from "@/lib/format";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/models";
import { ReviewFormDialog } from "./ReviewFormDialog";

const NONE = "none";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating ? "fill-[var(--color-gold-500)] text-[var(--color-gold-500)]" : "text-[var(--color-line)]"
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canModerate = hasPermission("reviews.approve");

  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [ratingFilter, setRatingFilter] = useState<string>(NONE);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", statusFilter, ratingFilter],
    queryFn: () =>
      reviewsApi.list({
        is_approved: statusFilter === NONE ? undefined : statusFilter === "approved",
        rating: ratingFilter === NONE ? undefined : Number(ratingFilter),
      }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reviews"] });

  const approveMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.approve(id),
    onSuccess: () => {
      toast.success("تمت الموافقة على التقييم وصار ظاهر للعموم");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف التقييم");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const createMutation = useMutation({
    mutationFn: (payload: ReviewCreatePayload) => reviewsApi.create(payload),
    onSuccess: () => {
      toast.success("تمت إضافة التقييم");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReviewUpdatePayload }) => reviewsApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const reviews = data ?? [];
  const pendingCount = reviews.filter((r) => !r.is_approved).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="تقييمات الزبائن" description="راجع تقييمات الأصناف ووافق على المعلّق منها" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>كل الحالات</SelectItem>
              <SelectItem value="pending">بانتظار الموافقة</SelectItem>
              <SelectItem value="approved">منشورة</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="كل التقييمات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>كل التقييمات</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} نجوم
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canModerate && pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] px-4 py-2 text-sm text-[var(--color-warning)]">
              {pendingCount} تقييم بانتظار المراجعة
            </div>
          )}
        </div>

        {canModerate && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            تقييم جديد
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الصنف</TableHead>
            <TableHead>التقييم</TableHead>
            <TableHead>التعليق</TableHead>
            <TableHead>الزبون</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead className="w-24 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={7}>جارِ التحميل...</TableEmpty>}
          {!isLoading && reviews.length === 0 && <TableEmpty colSpan={7}>ما في تقييمات مطابقة</TableEmpty>}
          {reviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell className="font-medium">{review.menuItem?.name ?? "—"}</TableCell>
              <TableCell>
                <Stars rating={review.rating} />
              </TableCell>
              <TableCell className="max-w-72 truncate text-[var(--color-ink-soft)]" title={review.comment ?? ""}>
                {review.comment ?? "—"}
              </TableCell>
              <TableCell className="text-[var(--color-ink-soft)]">{review.customer?.name ?? "زبون غير مسجّل"}</TableCell>
              <TableCell>
                <Badge variant={review.is_approved ? "success" : "warning"}>
                  {review.is_approved ? "منشور" : "بانتظار الموافقة"}
                </Badge>
              </TableCell>
              <TableCell className="tabular text-[var(--color-ink-soft)]">{formatDate(review.created_at)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {canModerate && !review.is_approved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="موافقة ونشر"
                      onClick={() => approveMutation.mutate(review.id)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4 text-[var(--color-success)]" />
                    </Button>
                  )}
                  {canModerate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="تعديل"
                      onClick={() => {
                        setEditing(review);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canModerate && (
                    <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleting(review)}>
                      <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="حذف هاد التقييم؟"
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />

      <ReviewFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        review={editing}
        onSubmitCreate={(payload) => createMutation.mutate(payload)}
        onSubmitUpdate={(id, payload) => updateMutation.mutate({ id, payload })}
        submitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
