import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Armchair, QrCode, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { tablesApi, type TablePayload } from "@/api/tables";
import { getApiErrorMessage } from "@/api/client";
import type { RestaurantTable, TableStatus } from "@/types/models";
import { TableFormDialog, type TableFormValues } from "./TableFormDialog";
import FloorPlanPage from "./FloorPlanPage";
import { TableQrDialog } from "./TableQrDialog";
import { printAllTableQr } from "./printAllQr";

const STATUS_LABELS: Record<TableStatus, string> = {
  available: "متاحة",
  occupied: "مشغولة",
  reserved: "محجوزة",
};

const STATUS_VARIANTS: Record<TableStatus, "success" | "danger" | "warning"> = {
  available: "success",
  occupied: "danger",
  reserved: "warning",
};

export default function TablesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [deleting, setDeleting] = useState<RestaurantTable | null>(null);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [printingAll, setPrintingAll] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: tablesApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tables"] });

  const createMutation = useMutation({
    mutationFn: tablesApi.create,
    onSuccess: () => {
      toast.success("تمت إضافة الطاولة");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TablePayload }) => tablesApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tablesApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الطاولة");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  async function handlePrintAll() {
    setPrintingAll(true);
    try {
      await printAllTableQr(data ?? []);
    } catch (err) {
      toast.error(err instanceof Error && !("response" in err) ? err.message : getApiErrorMessage(err));
    } finally {
      setPrintingAll(false);
    }
  }

  function handleSubmit(values: TableFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الطاولات"
        description="إدارة طاولات المطعم وحالتها"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={printingAll || !data?.length} onClick={() => void handlePrintAll()}>
              <Printer className="h-4 w-4" />
              طباعة QR للكل
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              طاولة جديدة
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">قائمة الطاولات</TabsTrigger>
          <TabsTrigger value="floor-plan">خطة الطاولات المرئية</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطاولة</TableHead>
                <TableHead>السعة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-32 text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableEmpty colSpan={4}>جارِ التحميل...</TableEmpty>}
              {!isLoading && data?.length === 0 && <TableEmpty colSpan={4}>ما في طاولات مسجّلة</TableEmpty>}
              {data?.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Armchair className="h-4 w-4 text-[var(--color-ink-soft)]" />
                      {table.table_number}
                    </div>
                  </TableCell>
                  <TableCell className="tabular">{table.capacity}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[table.status]}>{STATUS_LABELS[table.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title="رمز QR للطلب من الطاولة" onClick={() => setQrTable(table)}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="تعديل"
                        onClick={() => {
                          setEditing(table);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleting(table)}>
                        <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="floor-plan">
          <FloorPlanPage />
        </TabsContent>
      </Tabs>

      <TableFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        table={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <TableQrDialog table={qrTable} onOpenChange={(open) => !open && setQrTable(null)} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`حذف الطاولة "${deleting?.table_number}"؟`}
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}