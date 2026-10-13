import type { ModifierGroup } from "@/types/models";

/**
 * قواعد الخيارات الإضافية متل ما بيفرضها الباك (OrderService):
 *  - المجموعة الإلزامية (is_required) لازم يتختار منها خيار على الأقل،
 *    إلا إذا ما فيها ولا خيار متاح (is_available) فما بتعلّق الطلب.
 *  - ما بيتجاوز عدد الخيارات المختارة من المجموعة حد max_selections.
 *
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
