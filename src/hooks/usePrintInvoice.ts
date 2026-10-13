import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { invoicesApi } from "@/api/invoices";
import { getApiErrorMessage } from "@/api/client";

/**
 * طباعة فاتورة طلب بضغطة وحدة، من أي مكان (الكاشير، قائمة الطلبات، تفاصيل الطلب).
 * بيفتح الـ PDF بتاب جديد، ولو المتصفح منع النافذة المنبثقة بينزّل الملف مباشرة
 * بدل ما تضيع على الكاشير.
 */
export function usePrintInvoice() {
  return useMutation({
    mutationFn: (orderId: number) => invoicesApi.print(orderId).then((blob) => ({ blob, orderId })),
    onSuccess: ({ blob, orderId }) => {
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      // منحرر الذاكرة بعد ما ياخد التاب وقته يحمّل الملف
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
