/** فتح ملف (PDF) بتاب جديد، ولو المتصفح منع النافذة المنبثقة بينزّله مباشرة. */
export function openBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) triggerDownload(url, filename);
  // منحرر الذاكرة بعد ما ياخد التاب وقته يحمّل الملف
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** تنزيل ملف مباشرة (Excel/CSV). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** تاريخ اليوم بصيغة YYYY-MM-DD حسب توقيت الجهاز (مش UTC). */
export function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
