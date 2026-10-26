"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useT } from "@/components/I18nProvider";
import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border border-pill bg-surface px-3.5 py-2.5 text-[15px] text-strong placeholder:text-dim transition-colors focus:border-accent-ink focus:outline-none";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input autoComplete="off" autoCapitalize="off" spellCheck={false} {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block font-mono text-[10.5px] font-medium tracking-[0.08em] text-dim uppercase">
      {children}
    </label>
  );
}

export function Button({
  loading,
  children,
  variant = "primary",
  block = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: "primary" | "outline"; block?: boolean }) {
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-fg border-accent hover:bg-accent-hover hover:border-accent-hover"
      : "bg-surface text-ink border-pill hover:bg-hover";
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 border px-5 py-2.5 ${block ? "w-full rounded-xl" : "rounded-full"} text-sm font-medium whitespace-nowrap transition-colors active:scale-[0.98] disabled:cursor-default disabled:opacity-60 ${styles} ${props.className ?? ""}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function CopyButton({ value, label, iconOnly = false }: { value: string; label?: string; iconOnly?: boolean }) {
  const [done, setDone] = useState(false);
  const t = useT();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
      aria-label={iconOnly ? t.common.copy : undefined}
      className={
        iconOnly
          ? "inline-grid size-6 cursor-pointer place-items-center rounded-md text-dim transition-colors hover:bg-hover hover:text-strong"
          : "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-pill px-3 py-1 text-xs text-muted transition-colors hover:bg-hover hover:text-strong"
      }
    >
      {done ? <Check className="size-3.5 text-accent-ink" /> : <Copy className="size-3.5" />}
      {!iconOnly && (done ? t.common.copied : (label ?? t.common.copy))}
    </button>
  );
}

type Tone = "ok" | "warn" | "bad" | "neutral";
const tones: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok border-ok-line",
  warn: "bg-warn-bg text-warn border-warn-line",
  bad: "bg-bad-bg text-bad border-bad-line",
  neutral: "bg-hover text-muted border-line",
};

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Cartão do formulário: campos empilhados e botão de largura total, como no YouGetSignal. */
export function FormCard({ onSubmit, children }: { onSubmit: () => void; children: ReactNode }) {
  return (
    <form
      className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}>{children}</section>;
}

/** Linhas "rótulo → valor" separadas por fios, usadas nos resultados. */
export function KV({ rows }: { rows: [label: string, value: ReactNode][] }) {
  return (
    <dl className="divide-y divide-hair">
      {rows
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v]) => (
          <div key={k} className="grid gap-1 px-5 py-3 sm:grid-cols-[170px_1fr] sm:gap-4">
            <dt className="font-mono text-[10.5px] font-medium tracking-[0.08em] text-dim uppercase sm:pt-0.5">{k}</dt>
            <dd className="min-w-0 text-sm break-words text-strong">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-bad-line bg-bad-bg px-4 py-3 text-sm text-bad">
      {message}
    </div>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[13px]">{children}</span>;
}
