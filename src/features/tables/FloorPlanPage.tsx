import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RotateCw, Undo2, Armchair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { floorsApi, type FloorPayload } from "@/api/floors";
import { tablesApi } from "@/api/tables";
import { getApiErrorMessage } from "@/api/client";
import type { Floor, RestaurantTable } from "@/types/models";
import { FloorFormDialog, type FloorFormValues } from "./FloorFormDialog";

const STATUS_COLORS: Record<RestaurantTable["status"], string> = {
  available: "var(--color-success, #2f8a4b)",
  occupied: "var(--color-danger)",
  reserved: "var(--color-warning, #b8860b)",
};
const DRAG_THRESHOLD = 4;

export default function FloorPlanPage() {
  const queryClient = useQueryClient();

  const { data: floors, isLoading: floorsLoading } = useQuery({
    queryKey: ["floors"],
    queryFn: floorsApi.list,
  });

  const { data: allTables } = useQuery({
    queryKey: ["tables"],
    queryFn: tablesApi.list,
  });

  const [activeFloorId, setActiveFloorId] = useState<number | null>(null);
  const [floorFormOpen, setFloorFormOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  useEffect(() => {
    if (floors && floors.length > 0 && activeFloorId === null) {
      setActiveFloorId(floors[0].id);
    }
  }, [floors, activeFloorId]);

  const activeFloor = floors?.find((f) => f.id === activeFloorId) ?? null;
  const tablesOnFloor = activeFloor?.tables ?? [];

  const unassignedTables = useMemo(
    () => (allTables ?? []).filter((t) => !t.floor_id),
    [allTables]
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["floors"] });
    queryClient.invalidateQueries({ queryKey: ["tables"] });
  };

  const createFloorMutation = useMutation({
    mutationFn: floorsApi.create,
    onSuccess: (floor) => {
      toast.success("تمت إضافة الطابق");
      invalidateAll();
      setActiveFloorId(floor.id);
      setFloorFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateFloorMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<FloorPayload> }) =>
      floorsApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidateAll();
      setFloorFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteFloorMutation = useMutation({
    mutationFn: (id: number) => floorsApi.remove(id),
    onSuccess: (_data, id) => {
      toast.success("تم حذف الطابق");
      invalidateAll();
      setDeletingFloor(null);
      if (activeFloorId === id) setActiveFloorId(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setDeletingFloor(null);
    },
  });

  const positionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof floorsApi.updateTablePosition>[1] }) =>
      floorsApi.updateTablePosition(id, payload),
    onSuccess: () => invalidateAll(),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleFloorFormSubmit(values: FloorFormValues) {
    if (editingFloor) {
      updateFloorMutation.mutate({ id: editingFloor.id, payload: values });
    } else {
      createFloorMutation.mutate(values);
    }
  }

  function placeOnFloor(table: RestaurantTable) {
    if (!activeFloor) return;
    positionMutation.mutate({
      id: table.id,
      payload: {
        floor_id: activeFloor.id,
        pos_x: 40,
        pos_y: 40,
        width: table.width,
        height: table.height,
        rotation: table.rotation,
        shape: table.shape,
      },
    });
  }

  function removeFromFloor(table: RestaurantTable) {
    positionMutation.mutate({
      id: table.id,
      payload: {
        floor_id: null,
        pos_x: table.pos_x ?? 0,
        pos_y: table.pos_y ?? 0,
        width: table.width,
        height: table.height,
        rotation: table.rotation,
        shape: table.shape,
      },
    });
    setSelectedTableId(null);
  }

  function rotateTable(table: RestaurantTable) {
    positionMutation.mutate({
      id: table.id,
      payload: {
        floor_id: table.floor_id,
        pos_x: table.pos_x ?? 0,
        pos_y: table.pos_y ?? 0,
        width: table.width,
        height: table.height,
        rotation: (table.rotation + 45) % 360,
        shape: table.shape,
      },
    });
  }

  if (floorsLoading) {
    return <p className="py-10 text-center text-sm text-[var(--color-ink-soft)]">جارِ التحميل...</p>;
  }

  if (!floors || floors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line)] bg-[var(--color-wine-50)]/40 py-14 text-center">
        <p className="text-sm text-[var(--color-ink-soft)]">ما في طوابق مضافة بعد. أضف أول طابق حتى تبلش ترتّب الطاولات.</p>
        <Button onClick={() => { setEditingFloor(null); setFloorFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          طابق جديد
        </Button>
        <FloorFormDialog
          open={floorFormOpen}
          onOpenChange={setFloorFormOpen}
          floor={editingFloor}
          onSubmit={handleFloorFormSubmit}
          submitting={createFloorMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={String(activeFloorId)} onValueChange={(v) => { setActiveFloorId(Number(v)); setSelectedTableId(null); }}>
          <TabsList>
            {floors.map((floor) => (
              <TabsTrigger key={floor.id} value={String(floor.id)}>
                {floor.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingFloor(null); setFloorFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            طابق جديد
          </Button>
          {activeFloor && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditingFloor(activeFloor); setFloorFormOpen(true); }}
              >
                <Pencil className="h-4 w-4" />
                تعديل الطابق
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeletingFloor(activeFloor)}>
                <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                حذف الطابق
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        {activeFloor && (
          <FloorCanvas
            floor={activeFloor}
            tables={tablesOnFloor}
            selectedTableId={selectedTableId}
            onSelectTable={setSelectedTableId}
            onDragEnd={(table, pos_x, pos_y) =>
              positionMutation.mutate({
                id: table.id,
                payload: {
                  floor_id: table.floor_id,
                  pos_x,
                  pos_y,
                  width: table.width,
                  height: table.height,
                  rotation: table.rotation,
                  shape: table.shape,
                },
              })
            }
            onRotate={rotateTable}
            onRemove={removeFromFloor}
          />
        )}

        <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white p-4">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">طاولات غير موضوعة على خطة</h3>
          <p className="text-xs text-[var(--color-ink-soft)]">
            هاي الطاولات مسجّلة بس لسا ما انحطت على أي خطة. دوس "وضع" حتى تظهر على اللوحة وبعدين اسحبها لمكانها.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {unassignedTables.length === 0 && (
              <p className="py-4 text-center text-xs text-[var(--color-ink-soft)]">كل الطاولات موضوعة على خطط</p>
            )}
            {unassignedTables.map((table) => (
              <div
                key={table.id}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2"
              >
                <div className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                  <Armchair className="h-4 w-4 text-[var(--color-ink-soft)]" />
                  {table.table_number}
                  <span className="text-xs text-[var(--color-ink-soft)]">({table.capacity})</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={positionMutation.isPending}
                  onClick={() => placeOnFloor(table)}
                >
                  وضع
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FloorFormDialog
        open={floorFormOpen}
        onOpenChange={setFloorFormOpen}
        floor={editingFloor}
        onSubmit={handleFloorFormSubmit}
        submitting={createFloorMutation.isPending || updateFloorMutation.isPending}
      />

      <ConfirmDialog
        open={!!deletingFloor}
        onOpenChange={(open) => !open && setDeletingFloor(null)}
        title={`حذف الطابق "${deletingFloor?.name}"؟`}
        description="لازم تنقل أو تحذف طاولات الطابق أول قبل ما تقدر تحذفه."
        confirmLabel="حذف"
        loading={deleteFloorMutation.isPending}
        onConfirm={() => deletingFloor && deleteFloorMutation.mutate(deletingFloor.id)}
      />
    </div>
  );
}

function FloorCanvas({
  floor,
  tables,
  selectedTableId,
  onSelectTable,
  onDragEnd,
  onRotate,
  onRemove,
}: {
  floor: Floor;
  tables: RestaurantTable[];
  selectedTableId: number | null;
  onSelectTable: (id: number | null) => void;
  onDragEnd: (table: RestaurantTable, pos_x: number, pos_y: number) => void;
  onRotate: (table: RestaurantTable) => void;
  onRemove: (table: RestaurantTable) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragPositions, setDragPositions] = useState<Record<number, { x: number; y: number }>>({});
  const dragState = useRef<{
    table: RestaurantTable;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      const state = dragState.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) return;

      const dx = e.clientX - state.startClientX;
      const dy = e.clientY - state.startClientY;
      if (!state.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      state.moved = true;

      const maxX = floor.canvas_width - state.table.width;
      const maxY = floor.canvas_height - state.table.height;
      const nextX = Math.min(Math.max(state.startX + dx, 0), Math.max(maxX, 0));
      const nextY = Math.min(Math.max(state.startY + dy, 0), Math.max(maxY, 0));

      setDragPositions((prev) => ({ ...prev, [state.table.id]: { x: nextX, y: nextY } }));
    }

    function handlePointerUp() {
      const state = dragState.current;
      if (!state) return;
      dragState.current = null;

      if (state.moved) {
        const finalPos = dragPositions[state.table.id];
        if (finalPos) {
          onDragEnd(state.table, Math.round(finalPos.x), Math.round(finalPos.y));
        }
      } else {
       
        onSelectTable(state.table.id);
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

  }, [dragPositions, floor.canvas_width, floor.canvas_height]);

  function handlePointerDown(e: React.PointerEvent, table: RestaurantTable) {
    e.preventDefault();
    dragState.current = {
      table,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: table.pos_x ?? 0,
      startY: table.pos_y ?? 0,
      moved: false,
    };
  }

  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-auto rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-wine-50)]/30">
        <div
          ref={canvasRef}
          className="relative"
          style={{
            width: floor.canvas_width,
            height: floor.canvas_height,
            backgroundImage:
              "linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            backgroundColor: "white",
          }}
          onPointerDown={() => onSelectTable(null)}
        >
          {tables.map((table) => {
            const pos = dragPositions[table.id] ?? { x: table.pos_x ?? 0, y: table.pos_y ?? 0 };
            const isSelected = table.id === selectedTableId;
            return (
              <div
                key={table.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePointerDown(e, table);
                }}
                className="absolute flex cursor-move touch-none select-none flex-col items-center justify-center text-xs font-semibold text-white shadow-[var(--shadow-soft)] transition-shadow"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: table.width,
                  height: table.height,
                  transform: `rotate(${table.rotation}deg)`,
                  backgroundColor: STATUS_COLORS[table.status],
                  borderRadius: table.shape === "circle" ? "9999px" : "var(--radius-sm)",
                  outline: isSelected ? "3px solid var(--color-gold-500)" : "none",
                  outlineOffset: "2px",
                }}
              >
                {table.table_number}
                <span className="font-normal opacity-90">{table.capacity} أشخاص</span>
              </div>
            );
          })}

          {tables.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-[var(--color-ink-soft)]">
              ما في طاولات على هاد الطابق بعد - ضيف طاولة من القائمة الجانبية
            </p>
          )}
        </div>
      </div>

      {selectedTable && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-white px-3 py-2">
          <span className="text-sm text-[var(--color-ink)]">
            الطاولة المحددة: <strong>{selectedTable.table_number}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onRotate(selectedTable)}>
              <RotateCw className="h-4 w-4" />
              تدوير 45°
            </Button>
            <Button variant="outline" size="sm" onClick={() => onRemove(selectedTable)}>
              <Undo2 className="h-4 w-4" />
              إزالة من الخطة
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
