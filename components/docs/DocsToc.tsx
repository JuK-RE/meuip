"use client";

import { AlignLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";

/** "Nesta página": lista os títulos e destaca o que está na tela. */
export function DocsToc({ items }: { items: { id: string; text: string }[] }) {
  const t = useT();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const headings = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;
  return (
    <nav aria-label={t.docs.onThisPage} className="sticky top-[calc(4rem+3.75rem+2rem)]">
      <p className="mb-3 flex items-center gap-2 text-sm text-strong">
        <AlignLeft className="size-4 text-dim" /> {t.docs.onThisPage}
      </p>
      <ul className="border-l border-line">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={`-ml-px block border-l py-1.5 pl-4 text-sm transition-colors ${
                active === i.id ? "border-accent-ink font-medium text-strong" : "border-transparent text-muted hover:text-strong"
              }`}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
