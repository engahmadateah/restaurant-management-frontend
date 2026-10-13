import { qrSvgMarkup } from "./qr";

export interface QrCard {
  /** العنوان الكبير (رقم الطاولة أو "اطلب أونلاين") */
  title: string;
  /** سطر صغير فوق (مثلاً: امسح للطلب) */
  subtitle: string;
  /** الرابط يلي بيفتحه الـ QR (بينعرض كمان نص صغير تحته) */
  url: string;
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** مستند HTML جاهز للطباعة (A4، بطاقتين بالصف). كل النصوص بتنعمل لها escape. */
export function buildQrPrintHtml(cards: QrCard[], restaurantName: string): string {
  const body = cards
    .map(
      (c) => `
    <section class="card">
      <p class="rest">${esc(restaurantName)}</p>
      <p class="sub">${esc(c.subtitle)}</p>
      <h2>${esc(c.title)}</h2>
      ${qrSvgMarkup(c.url, 240)}
      <p class="url" dir="ltr">${esc(c.url)}</p>
    </section>`
    )
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${esc(restaurantName)} - QR</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, "Segoe UI", Tahoma, sans-serif; color: #111; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
  .card { border: 1.5px solid #222; border-radius: 6mm; padding: 8mm 6mm; text-align: center; break-inside: avoid; }
  .rest { margin: 0; font-size: 14pt; font-weight: 700; }
  .sub { margin: 2mm 0 0; font-size: 11pt; color: #444; }
  h2 { margin: 3mm 0 4mm; font-size: 26pt; }
  svg { width: 56mm; height: 56mm; }
  .url { margin: 3mm 0 0; font-size: 7pt; color: #666; word-break: break-all; }
</style>
</head>
<body>
<div class="grid">${body}</div>
<script>window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 300); });</script>
</body>
</html>`;
}

/** افتح نافذة طباعة فوراً (لازم تنادى مباشرة من ضغطة زر وإلا المتصفح بيمنعها) وبعدين عبّيها */
export function openPrintWindow(): Window | null {
  const w = window.open("", "_blank");
  if (w) w.document.write('<p dir="rtl" style="font-family:sans-serif;padding:24px">جارِ تحضير الملصقات...</p>');
  return w;
}

export function writeQrPrintWindow(w: Window, cards: QrCard[], restaurantName: string) {
  w.document.open();
  w.document.write(buildQrPrintHtml(cards, restaurantName));
  w.document.close();
}
