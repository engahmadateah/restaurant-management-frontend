import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { invoicesApi } from "@/api/invoices";
import { getApiErrorMessage } from "@/api/client";


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
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
