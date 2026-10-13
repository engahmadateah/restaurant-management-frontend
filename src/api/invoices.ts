import { apiClient } from "./client";

export const invoicesApi = {
 
  print: (orderId: number) =>
    apiClient.get(`/orders/${orderId}/invoice`, { responseType: "blob" }).then((r) => r.data as Blob),
};
