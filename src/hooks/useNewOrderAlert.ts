import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "kitchen-sound-enabled";

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
 
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.start(start);
      osc.stop(start + 0.17);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {

  }
}


export function useNewOrderAlert(pendingIds: number[] | undefined) {
  const [enabled, setEnabled] = useState(readEnabled);
  const seen = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (!pendingIds) return;
    if (seen.current === null) {
      seen.current = new Set(pendingIds);
      return;
    }
    const hasNew = pendingIds.some((id) => !seen.current!.has(id));
    pendingIds.forEach((id) => seen.current!.add(id));
    if (hasNew && enabled) beep();
  }, [pendingIds, enabled]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
  
      }
      if (next) beep();
      return next;
    });
  }, []);

  return { enabled, toggle };
}
