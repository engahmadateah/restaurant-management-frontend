import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  modifierGroupsApi,
  type ModifierGroupPayload,
  type ModifierPayload,
} from "@/api/modifierGroups";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency } from "@/lib/format";
import type { MenuItem, Modifier, ModifierGroup } from "@/types/models";

const emptyGroupForm: ModifierGroupPayload = { name: "", is_required: false, max_selections: 1 };
const emptyModifierForm: ModifierPayload = { name: "", extra_price: 0, is_available: true };

export function ModifierGroupsDialog({
  open,
  onOpenChange,
  menuItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem | null;
}) {
  const queryClient = useQueryClient();
  const menuItemId = menuItem?.id;

  const [groupForm, setGroupForm] = useState<ModifierGroupPayload>(emptyGroupForm);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [editGroupForm, setEditGroupForm] = useState<ModifierGroupPayload>(emptyGroupForm);
  const [deletingGroup, setDeletingGroup] = useState<ModifierGroup | null>(null);

  const [modifierForms, setModifierForms] = useState<Record<number, ModifierPayload>>({});
  const [activeGroupForNewModifier, setActiveGroupForNewModifier] = useState<number | null>(null);
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
  const [editModifierForm, setEditModifierForm] = useState<ModifierPayload>(emptyModifierForm);
  const [deletingModifier, setDeletingModifier] = useState<{ group: ModifierGroup; modifier: Modifier } | null>(
    null
  );

  const { data: groups, isLoading } = useQuery({
    queryKey: ["modifier-groups", menuItemId],
    queryFn: () => modifierGroupsApi.list(menuItemId!),
    enabled: open && !!menuItemId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["modifier-groups", menuItemId] });

  const createGroupMutation = useMutation({
    mutationFn: (payload: ModifierGroupPayload) => modifierGroupsApi.createGroup(menuItemId!, payload),
    onSuccess: () => {
      toast.success("تمت إضافة المجموعة");
      setGroupForm(emptyGroupForm);
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ModifierGroupPayload> }) =>
      modifierGroupsApi.updateGroup(menuItemId!, id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      setEditingGroup(null);
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const removeGroupMutation = useMutation({
    mutationFn: (id: number) => modifierGroupsApi.removeGroup(menuItemId!, id),
    onSuccess: () => {
      toast.success("تم حذف المجموعة");
      setDeletingGroup(null);
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const createModifierMutation = useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload: ModifierPayload }) =>
      modifierGroupsApi.createModifier(menuItemId!, groupId, payload),
    onSuccess: (_data, variables) => {
      toast.success("تمت إضافة الخيار");
      setModifierForms((prev) => ({ ...prev, [variables.groupId]: emptyModifierForm }));
      setActiveGroupForNewModifier(null);
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateModifierMutation = useMutation({
    mutationFn: ({
      groupId,
      modifierId,
      payload,
    }: {
      groupId: number;
      modifierId: number;
      payload: Partial<ModifierPayload>;
    }) => modifierGroupsApi.updateModifier(menuItemId!, groupId, modifierId, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      setEditingModifier(null);
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const removeModifierMutation = useMutation({
    mutationFn: ({ groupId, modifierId }: { groupId: number; modifierId: number }) =>
      modifierGroupsApi.removeModifier(menuItemId!, groupId, modifierId),
    onSuccess: () => {
      toast.success("تم حذف الخيار");
      setDeletingModifier(null);
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleCreateGroup() {
    if (!groupForm.name.trim()) {
      toast.error("أدخل اسم المجموعة");
      return;
    }
    createGroupMutation.mutate(groupForm);
  }

  function startEditGroup(group: ModifierGroup) {
    setEditingGroup(group);
    setEditGroupForm({
      name: group.name,
      is_required: group.is_required,
      max_selections: group.max_selections,
    });
  }

  function handleSaveGroup() {
    if (!editingGroup) return;
    updateGroupMutation.mutate({ id: editingGroup.id, payload: editGroupForm });
  }

  function getModifierForm(groupId: number): ModifierPayload {
    return modifierForms[groupId] ?? emptyModifierForm;
  }

  function handleCreateModifier(groupId: number) {
    const form = getModifierForm(groupId);
    if (!form.name.trim()) {
      toast.error("أدخل اسم الخيار");
      return;
    }
    createModifierMutation.mutate({ groupId, payload: { ...form, extra_price: Number(form.extra_price) || 0 } });
  }

  function startEditModifier(modifier: Modifier) {
    setEditingModifier(modifier);
    setEditModifierForm({
      name: modifier.name,
      extra_price: Number(modifier.extra_price),
      is_available: modifier.is_available,
    });
  }

  function handleSaveModifier() {
    if (!editingModifier) return;
    updateModifierMutation.mutate({
      groupId: editingModifier.modifier_group_id,
      modifierId: editingModifier.id,
      payload: { ...editModifierForm, extra_price: Number(editModifierForm.extra_price) || 0 },
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>خيارات الإضافات — {menuItem?.name}</DialogTitle>
            <DialogDescription>مجموعات الخيارات الإضافية (زي الحجم أو الإضافات) لهاد الصنف</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {isLoading && (
              <div className="flex items-center justify-center py-6 text-sm text-[var(--color-ink-soft)]">
                جارِ التحميل...
              </div>
            )}
            {!isLoading && groups?.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-sm text-[var(--color-ink-soft)]">
                <Layers className="h-6 w-6 text-[var(--color-wine-200)]" />
                ما في مجموعات خيارات لهاد الصنف بعد
              </div>
            )}

            {groups?.map((group) => (
              <div key={group.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-3">
                {editingGroup?.id === group.id ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={editGroupForm.name}
                      onChange={(e) => setEditGroupForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="اسم المجموعة"
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={editGroupForm.is_required}
                          onCheckedChange={(checked) =>
                            setEditGroupForm((f) => ({ ...f, is_required: checked === true }))
                          }
                          id={`edit-required-${group.id}`}
                        />
                        <Label htmlFor={`edit-required-${group.id}`}>إلزامية</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`edit-max-${group.id}`} className="whitespace-nowrap">
                          أقصى عدد اختيارات
                        </Label>
                        <Input
                          id={`edit-max-${group.id}`}
                          type="number"
                          min={1}
                          className="w-20"
                          value={editGroupForm.max_selections}
                          onChange={(e) =>
                            setEditGroupForm((f) => ({ ...f, max_selections: Number(e.target.value) || 1 }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={handleSaveGroup} disabled={updateGroupMutation.isPending}>
                        {updateGroupMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        حفظ
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingGroup(null)}>
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--color-ink)]">{group.name}</p>
                        {group.is_required && <Badge variant="warning">إلزامية</Badge>}
                        <Badge variant="neutral">حتى {group.max_selections} اختيار</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEditGroup(group)} title="تعديل">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingGroup(group)}
                        title="حذف المجموعة"
                      >
                        <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* الخيارات جوا المجموعة */}
                <div className="mt-3 flex flex-col gap-2 border-t border-[var(--color-line)] pt-3">
                  {(group.modifiers ?? []).map((modifier) =>
                    editingModifier?.id === modifier.id ? (
                      <div key={modifier.id} className="flex items-center gap-2">
                        <Input
                          value={editModifierForm.name}
                          onChange={(e) => setEditModifierForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="اسم الخيار"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={editModifierForm.extra_price}
                          onChange={(e) =>
                            setEditModifierForm((f) => ({ ...f, extra_price: Number(e.target.value) || 0 }))
                          }
                          className="w-24"
                        />
                        <Button size="icon" onClick={handleSaveModifier} disabled={updateModifierMutation.isPending}>
                          {updateModifierMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pencil className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => setEditingModifier(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div key={modifier.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-[var(--color-ink)]">
                          {modifier.name}
                          {!modifier.is_available && (
                            <Badge variant="neutral" className="mr-2">
                              غير متوفر
                            </Badge>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="tabular text-[var(--color-ink-soft)]">
                            +{formatCurrency(modifier.extra_price)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditModifier(modifier)}
                            title="تعديل"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingModifier({ group, modifier })}
                            title="حذف"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger)]" />
                          </Button>
                        </div>
                      </div>
                    )
                  )}

                  {activeGroupForNewModifier === group.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={getModifierForm(group.id).name}
                        onChange={(e) =>
                          setModifierForms((prev) => ({
                            ...prev,
                            [group.id]: { ...getModifierForm(group.id), name: e.target.value },
                          }))
                        }
                        placeholder="اسم الخيار"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={getModifierForm(group.id).extra_price}
                        onChange={(e) =>
                          setModifierForms((prev) => ({
                            ...prev,
                            [group.id]: { ...getModifierForm(group.id), extra_price: Number(e.target.value) || 0 },
                          }))
                        }
                        placeholder="السعر الإضافي"
                        className="w-28"
                      />
                      <Button
                        size="icon"
                        onClick={() => handleCreateModifier(group.id)}
                        disabled={createModifierMutation.isPending}
                      >
                        {createModifierMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => setActiveGroupForNewModifier(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => setActiveGroupForNewModifier(group.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إضافة خيار
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* إضافة مجموعة جديدة */}
          <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] p-3">
            <Label>مجموعة جديدة</Label>
            <div className="flex items-center gap-2">
              <Input
                value={groupForm.name}
                onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="اسم المجموعة (مثلاً: الحجم)"
                className="flex-1"
              />
              <div className="flex items-center gap-1.5 whitespace-nowrap text-sm">
                <Checkbox
                  id="new-group-required"
                  checked={groupForm.is_required}
                  onCheckedChange={(checked) => setGroupForm((f) => ({ ...f, is_required: checked === true }))}
                />
                <Label htmlFor="new-group-required">إلزامية</Label>
              </div>
              <Input
                type="number"
                min={1}
                value={groupForm.max_selections}
                onChange={(e) => setGroupForm((f) => ({ ...f, max_selections: Number(e.target.value) || 1 }))}
                className="w-20"
                title="أقصى عدد اختيارات"
              />
              <Button onClick={handleCreateGroup} disabled={createGroupMutation.isPending}>
                {createGroupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                إضافة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
        title={`حذف مجموعة "${deletingGroup?.name}"؟`}
        description="رح ينحذف معها كل الخيارات جواها. هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={removeGroupMutation.isPending}
        onConfirm={() => deletingGroup && removeGroupMutation.mutate(deletingGroup.id)}
      />

      <ConfirmDialog
        open={!!deletingModifier}
        onOpenChange={(open) => !open && setDeletingModifier(null)}
        title={`حذف "${deletingModifier?.modifier.name}"؟`}
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={removeModifierMutation.isPending}
        onConfirm={() =>
          deletingModifier &&
          removeModifierMutation.mutate({
            groupId: deletingModifier.group.id,
            modifierId: deletingModifier.modifier.id,
          })
        }
      />
    </>
  );
}
