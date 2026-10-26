"use client";

import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { ArrowUp, Check, ChevronRight, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n/config";
import { CopyButton } from "./kit";

/** Respeita "reduzir movimento" do sistema em todas as animações do site. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/**
 * Linha do tempo do resultado (padrão do YouGetSignal): "Verificando…" com um
 * ponto, e depois um ✓ (ou ✗) com a conclusão e o cartão de resultado.
 */
export function ResultFlow({
  loading,
  error,
  hasData,
  start,
  done,
  children,
}: {
  loading: boolean;
  error: string | null;
  hasData: boolean;
  start: ReactNode;
  done: ReactNode;
  children?: ReactNode;
}) {
  const show = loading || error || hasData;
  const finished = !loading && (error || hasData);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="flow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-line bg-surface p-5 shadow-card"
        >
          <div className="relative pl-9 text-sm text-strong">
            <span className="absolute top-[7px] left-[7px] size-1.5 rounded-full bg-strong" />
            <span className={loading ? "animate-pulse" : ""}>{start}</span>
            {loading && <span className="ml-1 text-dim">…</span>}
          </div>
          {finished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="relative mt-4 pl-9"
            >
              <span aria-hidden className="absolute -top-4 left-[9.5px] h-4 w-px bg-pill" />
              <span className={`absolute top-0 left-0 grid size-5 place-items-center rounded-full ${error ? "bg-bad text-surface" : "bg-accent text-accent-fg"}`}>
                {error ? <X className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}
              </span>
              <div className={`text-sm ${error ? "text-bad" : "text-strong"}`}>{error ?? done}</div>
              {!error && children && <div className="mt-4">{children}</div>}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Como fmt(), mas os argumentos podem ser elementos React (ex.: um InlineChip). */
export function fmtNode(text: string, ...args: ReactNode[]): ReactNode {
  return text.split(/(\{\d+\})/).map((part, i) => {
    const m = part.match(/^\{(\d+)\}$/);
    return m ? <span key={i}>{args[Number(m[1])]}</span> : part;
  });
}

/** Chip em linha dentro do texto do timeline (ex.: o host consultado). */
export function InlineChip({ children }: { children: ReactNode }) {
  return <span className="mx-0.5 inline-block rounded-full bg-hover px-2.5 py-0.5 font-mono text-[13px]">{children}</span>;
}

/** Seção que abre/fecha com altura animada. */
export function Collapsible({ title, count, defaultOpen = false, children }: { title: string; count?: number; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-hair first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2 px-5 py-3 text-left text-sm text-strong transition-colors hover:bg-hover"
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight className="size-4 text-dim" />
        </motion.span>
        {title}
        {count !== undefined && <span className="text-dim">({count})</span>}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

let myIp: Promise<string | null> | null = null;

/** "↑ Usar IP atual (1.2.3.4)" abaixo do campo de host, com botão de copiar. */
export function UseMyIp({ onUse }: { onUse: (ip: string) => void }) {
  const [ip, setIp] = useState<string | null>(null);
  const t = useT();
  useEffect(() => {
    myIp ??= fetch("/api/ip")
      .then((r) => r.json())
      .then((d) => (d.ip as string) ?? null)
      .catch(() => null);
    myIp.then(setIp);
  }, []);
  if (!ip) return <div className="mt-2 h-6" />;
  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
      <button type="button" onClick={() => onUse(ip)} className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-accent-ink">
        <ArrowUp className="size-3.5" /> {fmt(t.common.useCurrentIp, ip)}
      </button>
      <CopyButton value={ip} iconOnly />
    </div>
  );
}
