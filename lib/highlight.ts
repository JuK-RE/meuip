export type Token = { text: string; kind?: "string" | "comment" | "number" | "keyword" };

const KEYWORDS = new Set(
  (
    "const let var await async function return if else for while break new import from as package func defer go type struct " +
    "def class end do require using var string true false null nil None True False echo print puts curl public static void try catch " +
    "Invoke-RestMethod"
  ).split(" "),
);

// strings primeiro, depois comentários (// e #), números e palavras
const RE = /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\/\/[^\n]*|(?<![\w"'])#[^\n]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w-]*)/g;

/** Realce de sintaxe leve e genérico, bom o bastante para os exemplos de todas as linguagens. */
export function highlight(code: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of code.matchAll(RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: code.slice(last, i) });
    if (m[1]) out.push({ text: m[0], kind: "string" });
    else if (m[2]) out.push({ text: m[0], kind: "comment" });
    else if (m[3]) out.push({ text: m[0], kind: "number" });
    else out.push(KEYWORDS.has(m[0]) ? { text: m[0], kind: "keyword" } : { text: m[0] });
    last = i + m[0].length;
  }
  if (last < code.length) out.push({ text: code.slice(last) });
  return out;
}
