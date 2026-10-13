import type { ModifierGroup } from "@/types/models";

/**
 * @param selectedIds معرّفات كل الخيارات المختارة للصنف (من كل المجموعات)
 * @returns رسالة الخطأ العربية، أو null إذا الاختيار سليم
 */
export function validateModifierSelection(
  groups: ModifierGroup[] | undefined,
  selectedIds: number[],
  itemName?: string
): string | null {
  const suffix = itemName ? ` (${itemName})` : "";

  for (const group of groups ?? []) {
    const modifiers = group.modifiers ?? [];
    const count = modifiers.filter((m) => selectedIds.includes(m.id)).length;
    const hasAvailable = modifiers.some((m) => m.is_available);

    if (group.is_required && hasAvailable && count === 0) {
      return `لازم تختار خيار من مجموعة "${group.name}"${suffix}`;
    }
    if (group.max_selections > 0 && count > group.max_selections) {
      return `أقصى عدد خيارات من "${group.name}" هو ${group.max_selections}${suffix}`;
    }
  }

  return null;
}
