import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/**
 * navigator.onLine بس إشارة تقريبية: false = أكيد مقطوع، لكن true ممكن يكون واصل لراوتر بدون إنترنت.
 * فالمزامنة بتعتمد على نجاح الطلبات الفعلي، مش على هالقيمة.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );
}
