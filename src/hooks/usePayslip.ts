import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { payrollApi } from "@/api/payroll";
import { getApiErrorMessage } from "@/api/client";
import { openBlob } from "@/lib/download";


export function usePayslip() {
  return useMutation({
    mutationFn: (payrollId: number) => payrollApi.payslip(payrollId).then((blob) => ({ blob, payrollId })),
    onSuccess: ({ blob, payrollId }) => openBlob(blob, `payslip-${payrollId}.pdf`),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
