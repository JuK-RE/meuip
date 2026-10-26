"use client";

import { useCallback, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type State<T> = { data: T | null; error: string | null; loading: boolean };

/** GET em /api/* com cancelamento da consulta anterior e o erro já em texto. `query` substitui `params` quando há chaves repetidas. */
export function useApi<T>() {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: false });
  const controller = useRef<AbortController | null>(null);
  const { locale, t } = useI18n();

  const run = useCallback(async (path: string, params: Record<string, string>, query?: URLSearchParams) => {
    controller.current?.abort();
    const ctl = (controller.current = new AbortController());
    setState({ data: null, error: null, loading: true });
    try {
      const res = await fetch(`${path}?${query ?? new URLSearchParams(params)}`, { signal: ctl.signal, headers: { "x-lang": locale } });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? t.errors.unknown);
      setState({ data: body as T, error: null, loading: false });
    } catch (e) {
      if (ctl.signal.aborted) return;
      setState({ data: null, error: e instanceof Error ? e.message : t.errors.network, loading: false });
    }
  }, [locale, t]);

  return { ...state, run };
}

/** Atualiza a barra de endereço (sem navegar) pra o resultado poder ser compartilhado. */
export function syncUrl(params: Record<string, string>) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}
