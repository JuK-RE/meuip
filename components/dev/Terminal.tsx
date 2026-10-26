import { Minus, Square, X } from "lucide-react";
import type { ReactNode } from "react";
import { VscTerminalCmd, VscTerminalPowershell } from "react-icons/vsc";

/** Prompt do terminal escolhido: "PS C:\meuip>" no PowerShell e "C:\meuip>" no CMD. */
export function Prompt({ path = "C:\\meuip" }: { path?: string }) {
  return (
    <>
      <span className="only-ps">PS {path}&gt;</span>
      <span className="only-cmd">{path}&gt;</span>
    </>
  );
}

/** Janela de terminal estilo Windows (barra de título com os três botões). As cores vêm do tema da página. */
export function TerminalWindow({ children, className = "", flush = false }: { children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-term-line bg-term text-term-fg shadow-card ${className}`}>
      <div className="flex items-center gap-2 bg-term-bar px-3 py-1.5 text-xs">
        <span className="only-ps"><VscTerminalPowershell className="size-4" /></span>
        <span className="only-cmd"><VscTerminalCmd className="size-4" /></span>
        <span className="only-ps">Windows PowerShell</span>
        <span className="only-cmd">C:\Windows\System32\cmd.exe</span>
        <span className="ml-auto flex items-center gap-3 text-term-dim" aria-hidden>
          <Minus className="size-3.5" />
          <Square className="size-3" />
          <X className="size-3.5" />
        </span>
      </div>
      <div className={flush ? "" : "p-4"}>{children}</div>
    </div>
  );
}
