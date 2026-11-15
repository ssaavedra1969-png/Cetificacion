"use client";

import { useMemo } from "react";

function inline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(<strong key={key++} className="font-semibold text-white">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      parts.push(<code key={key++} className="rounded bg-white/10 px-1 py-0.5 text-[12px] text-gold">{tok.slice(1, -1)}</code>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ source }: { source: string }) {
  const blocks = useMemo(() => {
    const lines = source.split(/\r?\n/);
    const out: React.ReactNode[] = [];
    let i = 0;
    let key = 0;
    const para: string[] = [];
    const flushPara = () => {
      if (para.length) {
        out.push(
          <p key={key++} className="mb-3 text-[14px] leading-relaxed text-slate-200">
            {inline(para.join(" "))}
          </p>,
        );
        para.length = 0;
      }
    };
    while (i < lines.length) {
      const line = lines[i];
      if (/^---+\s*$/.test(line)) {
        flushPara();
        out.push(<hr key={key++} className="my-6 border-white/10" />);
        i++;
        continue;
      }
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      if (h) {
        flushPara();
        const lvl = h[1].length;
        const cls =
          lvl === 1
            ? "mt-6 mb-3 text-2xl font-bold text-gold"
            : lvl === 2
              ? "mt-5 mb-2 text-lg font-semibold text-white"
              : "mt-4 mb-2 text-base font-semibold text-gold/90";
        out.push(<h3 key={key++} className={cls}>{inline(h[2])}</h3>);
        i++;
        continue;
      }
      if (/^\|\s/.test(line) && lines[i + 1]?.match(/^\|[-\s|]+\|?\s*$/)) {
        flushPara();
        const header = line.split("|").map((c) => c.trim()).filter(Boolean);
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && /^\|/.test(lines[i])) {
          rows.push(lines[i].split("|").map((c) => c.trim()).filter(Boolean));
          i++;
        }
        out.push(
          <div key={key++} className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  {header.map((h, hi) => (
                    <th key={hi} className="px-3 py-2 text-left font-semibold text-gold">{inline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri} className="border-b border-white/[0.06]">
                    {r.map((c, ci) => (
                      <td key={ci} className="px-3 py-2 text-slate-200">{inline(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }
      const li = line.match(/^[-*]\s+(.*)$/);
      if (li) {
        flushPara();
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^[-*]\s+/, ""));
          i++;
        }
        out.push(
          <ul key={key++} className="mb-3 list-disc space-y-1 pl-6 text-[14px] text-slate-200">
            {items.map((it, ii) => (
              <li key={ii}>{inline(it)}</li>
            ))}
          </ul>,
        );
        continue;
      }
      const ol = line.match(/^\d+\.\s+(.*)$/);
      if (ol) {
        flushPara();
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\.\s+/, ""));
          i++;
        }
        out.push(
          <ol key={key++} className="mb-3 list-decimal space-y-1 pl-6 text-[14px] text-slate-200">
            {items.map((it, ii) => (
              <li key={ii}>{inline(it)}</li>
            ))}
          </ol>,
        );
        continue;
      }
      if (line.trim() === "") {
        flushPara();
        i++;
        continue;
      }
      para.push(line.trim());
      i++;
    }
    flushPara();
    return out;
  }, [source]);

  return <div className="space-y-1">{blocks}</div>;
}
