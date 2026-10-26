import { highlight } from "@/lib/highlight";
import { endpoints } from "@/lib/api-docs";
import { tools } from "@/lib/tools";
import { SITE_URL } from "@/lib/site";
import { Prompt, TerminalWindow } from "./Terminal";

const sample = endpoints.find((e) => e.tool === "dns-lookup")!;

function FloatCard({ title, line, className }: { title: string; line: string; className: string }) {
  return (
    <div className={`absolute hidden w-[300px] rounded-sm border border-line bg-surface px-5 py-4 text-left font-mono text-[13px] text-strong shadow-card lg:block ${className}`}>
      <p>{title}</p>
      <p className="mt-1 opacity-55">{line}</p>
    </div>
  );
}

/** Vitrine do topo: uma janela de terminal com a API respondendo e cartões soltos ligados por linhas pontilhadas. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto mt-14 max-w-5xl px-5">
      <span aria-hidden className="absolute bottom-[104px] left-[150px] hidden h-16 w-28 border-t-2 border-l-2 border-dotted border-term-line lg:block" />
      <span aria-hidden className="absolute top-[120px] right-[150px] hidden h-20 w-24 border-r-2 border-b-2 border-dotted border-term-line lg:block" />

      <div className="mx-auto max-w-3xl text-left">
        <TerminalWindow flush className="rounded-b-none border-b-0">
          <div className="grid sm:grid-cols-[170px_1fr]">
            <ul className="hidden border-r border-term-line p-3 sm:block">
              {tools.map((tool) => (
                <li
                  key={tool.slug}
                  className={`flex items-center gap-2 rounded px-2.5 py-1.5 font-mono text-xs ${tool.slug === sample.tool ? "bg-white/12 text-term-fg" : "text-term-dim"}`}
                >
                  <tool.icon className="size-3.5" /> {tool.slug}
                </li>
              ))}
            </ul>
            <div className="min-w-0 p-5 font-mono text-[12.5px] leading-relaxed">
              <p className="break-all">
                <span className="text-term-dim">
                  <Prompt />
                </span>{" "}
                <span className="text-[var(--t-num)]">
                  <span className="only-ps">Invoke-RestMethod</span>
                  <span className="only-cmd">curl</span>
                </span>{" "}
                <span className="tok-string">&quot;{SITE_URL}{sample.example}&quot;</span>
              </p>
              <pre className="mt-3 break-words whitespace-pre-wrap">
                <code>
                  {highlight(sample.response).map((tok, i) =>
                    tok.kind ? (
                      <span key={i} className={`tok-${tok.kind}`}>
                        {tok.text}
                      </span>
                    ) : (
                      tok.text
                    ),
                  )}
                </code>
              </pre>
              <p className="mt-3 text-term-dim">
                <Prompt />
                <span className="ml-1 inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-term-fg" />
              </p>
            </div>
          </div>
          <div className="h-20 sm:h-24" aria-hidden />
        </TerminalWindow>
      </div>

      <FloatCard title="ssl-checker > protocol: TLSv1.3" line="Checking certificate..." className="bottom-4 -left-2 xl:-left-10" />
      <FloatCard title="ping > icmp_seq=4 time=14.7 ms" line="Pinging 1.1.1.1..." className="right-0 bottom-0 xl:-right-6" />
      <FloatCard title="port-checker > 443 open" line="Checking 2 ports..." className="top-12 right-0 xl:-right-8" />
    </div>
  );
}
