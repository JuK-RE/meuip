"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Estado "aberto" de menus e janelas que fecha sozinho quando a página muda.
 * Ele guarda em qual página foi aberto: ao navegar (link, voltar, trocar de idioma), deixa de valer.
 */
export function useRouteOpen(): [boolean, (next: boolean | ((open: boolean) => boolean)) => void] {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const set = useCallback(
    (next: boolean | ((open: boolean) => boolean)) =>
      setOpenAt((prev) => {
        const value = typeof next === "function" ? next(prev === pathname) : next;
        return value ? pathname : null;
      }),
    [pathname],
  );
  return [open, set];
}
