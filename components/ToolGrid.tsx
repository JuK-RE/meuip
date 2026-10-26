"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { tools } from "@/lib/tools";
import { useI18n } from "./I18nProvider";

export function ToolGrid() {
  const { locale, t } = useI18n();
  return (
    <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {tools.map((tool, i) => {
        const text = t.tools[tool.slug];
        return (
          <li key={tool.slug} className="bg-surface">
            <Link href={`/${locale}/tools/${tool.slug}`} className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-tint">
              <span className="flex items-center justify-between">
                <tool.icon className="size-5 text-accent-ink" />
                <span className="font-mono text-[10px] tracking-[0.08em] text-dim">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <span className="text-[17px] font-light text-strong">{text.title}</span>
              <span className="text-[13px] leading-relaxed">{text.description}</span>
              <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs text-accent-ink opacity-0 transition-opacity group-hover:opacity-100">
                {t.common.open} <ArrowRight className="size-3.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
