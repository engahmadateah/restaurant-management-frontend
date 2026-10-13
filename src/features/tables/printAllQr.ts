import { tablesApi } from "@/api/tables";
import { openPrintWindow, writeQrPrintWindow, type QrCard } from "@/lib/printQr";
import { getSetting } from "@/stores/settingsStore";
import type { RestaurantTable } from "@/types/models";
import { tableOrderUrl } from "./TableQrDialog";


export async function printAllTableQr(tables: RestaurantTable[]): Promise<void> {
  if (tables.length === 0) throw new Error("ما في طاولات لطباعتها");

  const w = openPrintWindow();
  if (!w) throw new Error("المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة وجرّب مرة تانية");

  try {
    const qrs = await Promise.all(tables.map((t) => tablesApi.qr(t.id)));
    const cards: QrCard[] = qrs.map((q) => ({
      title: `طاولة ${q.table_number}`,
      subtitle: "امسح الكود لتطلب من الموبايل",
      url: tableOrderUrl(q.token),
    }));
    cards.push({ title: "اطلب أونلاين", subtitle: "استلام من المطعم أو توصيل", url: `${window.location.origin}/order` });
    writeQrPrintWindow(w, cards, getSetting("restaurant_name", "المطعم"));
  } catch (err) {
    w.close();
    throw err;
  }
}
