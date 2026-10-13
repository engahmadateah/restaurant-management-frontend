import qrcodegen from "./vendor/qrcodegen.js";

/**
 * مولّد QR (مكتبة Project Nayuki بترخيص MIT، منسوخة بـ lib/vendor/qrcodegen.js بدون أي dependency).
 * بيرجّع SVG جاهز: مستوى تصحيح أخطاء M (بيتحمّل ~15% تلف/اتساخ) و4 وحدات هامش (الحد الأدنى للقراءة).
 */
export interface QrSvg {
  /** عدد الوحدات بالضلع (بدون الهامش) */
  size: number;
  /** viewBox كامل بالهامش */
  viewBox: string;
  /** مسار SVG واحد لكل الوحدات السودا */
  path: string;
}

const BORDER = 4;

export function buildQr(text: string): QrSvg {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  const parts: string[] = [];
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) parts.push(`M${x + BORDER},${y + BORDER}h1v1h-1z`);
    }
  }
  const total = qr.size + BORDER * 2;
  return { size: qr.size, viewBox: `0 0 ${total} ${total}`, path: parts.join(" ") };
}

/** نص SVG كامل (للطباعة/التحميل): خلفية بيضا وQR أسود */
export function qrSvgMarkup(text: string, pixelSize = 240): string {
  const { viewBox, path } = buildQr(text);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${pixelSize}" height="${pixelSize}" shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#000"/></svg>`
  );
}
