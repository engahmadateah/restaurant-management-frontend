/**
 * بيولّد slug بسيط من اسم (عربي أو إنجليزي). ما بترجم الحروف العربية
 * لحروف لاتينية - بس بستبدل المسافات بشرطة وبشيل الرموز الغريبة،
 * لأنو الباك اند بس بده قيمة فريدة (unique) مو بالضرورة إنجليزية.
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
