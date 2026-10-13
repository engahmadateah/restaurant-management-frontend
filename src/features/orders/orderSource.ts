import type { OrderSource } from "@/types/models";

export const SOURCE_LABELS: Record<OrderSource, string> = {
  pos: "الكاشير",
  qr: "QR طاولة",
  online: "أونلاين",
};


export const isCustomerSource = (source?: OrderSource) => source === "qr" || source === "online";
