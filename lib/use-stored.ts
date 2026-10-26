"use client";

import { useSyncExternalStore } from "react";

const EVENT = "meuip-storage";

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

/** Valor do localStorage como estado reativo. No servidor (e na hidratação) devolve null. */
export function useStored(key: string): string | null {
  return useSyncExternalStore(
    (notify) => {
      window.addEventListener(EVENT, notify);
      window.addEventListener("storage", notify);
      return () => {
        window.removeEventListener(EVENT, notify);
        window.removeEventListener("storage", notify);
      };
    },
    () => read(key),
    () => null,
  );
}

export function setStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
