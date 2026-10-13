import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, PackagePlus, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatBlock } from "@/features/reports/StatBlock";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { menuItemsApi } from "@/api/menuItems";
import { inventoryApi, type InventorySettingsPayload } from "@/api/inventory";
import { getApiErrorMessage } from "@/api/client";
import type { MenuItem } from "@/types/models";
import { RestockDialog } from "./RestockDialog";
import { InventorySettingsDialog } from "./InventorySettingsDialog";

function StockBadge({ item }: { item: MenuItem }) {
  if (!item.track_stock) return <Badge variant="neutral">غير متتبَّع</Badge>;
  const qty = item.stock_quantity ?? 0;
  if (qty <= 0) return <Badge variant="danger">نفد المخزون</Badge>;
  const low = qty <= (item.low_stock_threshold ?? 0);
  return (
    <Badge variant={low ? "danger" : "success"}>
      {item.stock_quantity ?? 0} {low && "· منخفض"}
    </Badge>
  );
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [restocking, setRestocking] = useState<MenuItem | null>(null);
  const [configuring, setConfiguring] = useState<MenuItem | null>(null);
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<"all" | "tracked" | "untracked">("all");

  const { data: items, isLoading } = useQuery({ queryKey: ["menu-items", "all"], queryFn: () => menuItemsApi.list() });
  const { data: lowStock, isLoading: lowStockLoading } = useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: inventoryApi.lowStock,
  });

  const stats = useMemo(() => {
    const tracked = (items ?? []).filter((i) => i.track_stock);
    return {
      total: items?.length ?? 0,
      tracked: tracked.length,
      out: tracked.filter((i) => (i.stock_quantity ?? 0) <= 0).length,
    };
  }, [items]);


  const visibleItems = useMemo(() => {
    const q = search.trim();
    return (items ?? [])
      .filter((i) => (trackFilter === "all" ? true : trackFilter === "tracked" ? i.track_stock : !i.track_stock))
      .filter((i) => !q || i.name.includes(q) || (i.category?.name ?? "").includes(q))
      .sort((a, b) => {
        if (a.track_stock !== b.track_stock) return a.track_stock ? -1 : 1;
        return (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0);
      });
  }, [items, search, trackFilter]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };

  const restockMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => inventoryApi.restock(id, quantity),
    onSuccess: () => {
      toast.success("تم تحديث المخزون");
      invalidate();
      setRestocking(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const settingsMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InventorySettingsPayload }) =>
      inventoryApi.updateSettings(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ إعدادات المخزون");
      invalidate();
      setConfiguring(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function renderRow(item: MenuItem) {
    return (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell className="text-[var(--color-ink-soft)]">{item.category?.name ?? "—"}</TableCell>
        <TableCell>
          <StockBadge item={item} />
        </TableCell>
        <TableCell className="tabular">{item.track_stock ? item.low_stock_threshold ?? 0 : "—"}</TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            {item.track_stock && (
              <Button variant="ghost" size="icon" onClick={() => setRestocking(item)} title="تزويد المخزون">
                <PackagePlus className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setConfiguring(item)} title="إعدادات المخزون">
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="المخزون" description="تتبّع كميات الأصناف والتنبيه عند انخفاضها" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock label="عدد الأصناف" value={String(stats.total)} />
        <StatBlock label="أصناف متتبَّعة" value={String(stats.tracked)} />
        <StatBlock label="مخزون منخفض" value={String(lowStock?.length ?? 0)} />
        <StatBlock label="نفد المخزون" value={String(stats.out)} />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">كل الأصناف</TabsTrigger>
          <TabsTrigger value="low">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              مخزون منخفض
              {!!lowStock?.length && <Badge variant="danger">{lowStock.length}</Badge>}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-52 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالصنف أو التصنيف..." className="pr-9" />
            </div>
            <div className="flex gap-1.5">
              {([["all", "الكل"], ["tracked", "متتبَّع"], ["untracked", "غير متتبَّع"]] as const).map(([value, label]) => (
                <Button key={value} size="sm" variant={trackFilter === value ? "default" : "outline"} onClick={() => setTrackFilter(value)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>حد التنبيه</TableHead>
                <TableHead className="w-24 text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableEmpty colSpan={5}>جارِ التحميل...</TableEmpty>}
              {!isLoading && visibleItems.length === 0 && <TableEmpty colSpan={5}>ما في أصناف مطابقة</TableEmpty>}
              {visibleItems.map(renderRow)}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="low">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>حد التنبيه</TableHead>
                <TableHead className="w-24 text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockLoading && <TableEmpty colSpan={5}>جارِ التحميل...</TableEmpty>}
              {!lowStockLoading && lowStock?.length === 0 && (
                <TableEmpty colSpan={5}>ولا صنف وصل لحد المخزون المنخفض</TableEmpty>
              )}
              {lowStock?.map(renderRow)}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <RestockDialog
        item={restocking}
        onOpenChange={(open) => !open && setRestocking(null)}
        submitting={restockMutation.isPending}
        onConfirm={(quantity) => restocking && restockMutation.mutate({ id: restocking.id, quantity })}
      />

      <InventorySettingsDialog
        item={configuring}
        onOpenChange={(open) => !open && setConfiguring(null)}
        submitting={settingsMutation.isPending}
        onConfirm={(payload) => configuring && settingsMutation.mutate({ id: configuring.id, payload })}
      />
    </div>
  );
}
