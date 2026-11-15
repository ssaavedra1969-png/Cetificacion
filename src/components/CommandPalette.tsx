"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { INSTRUCTIVO_INDEX } from "@/lib/instructivo-index";
import { norm, tokenizar, coincide } from "@/lib/search";

interface Doc { id: string; nombre: string; categoria: string; }
interface PlanTask { id: string; codigo: string; tarea: string; esGrupo: boolean; }

const SECTIONS = [
  { label: "Inicio", href: "/" },
  { label: "Mapa SGC", href: "/mapa" },
  { label: "Plan de Trabajo", href: "/plan" },
  { label: "Documentoteca", href: "/documentoteca" },
  { label: "Instructivo", href: "/instructivo" },
  { label: "Administración", href: "/administracion" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    if (loaded) return;
    fetch("/api/documentos")
      .then((r) => r.json())
      .then((d) => setDocs(d.documentos || []))
      .catch(() => {});
    fetch("/api/plan")
      .then((r) => r.json())
      .then((d) => setTasks(d.tareas || []))
      .catch(() => {});
    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          if (next) load();
          return next;
        });
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [load]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    const tokens = tokenizar(q);
    const out: { type: string; label: string; sub?: string; href: string; snippet?: string; sectionId?: string }[] = [];
    if (tokens.length === 0) {
      SECTIONS.forEach((s) => out.push({ type: "Sección", label: s.label, href: s.href }));
      return out.slice(0, 12);
    }
    SECTIONS.filter((s) => coincide(s.label, tokens)).forEach((s) =>
      out.push({ type: "Sección", label: s.label, href: s.href }),
    );
    docs
      .filter((d) => coincide(`${d.nombre} ${d.categoria}`, tokens))
      .slice(0, 8)
      .forEach((d) =>
        out.push({ type: "Documento", label: d.nombre, sub: d.categoria, href: `/documentoteca` }),
      );
    tasks
      .filter((t) => coincide(`${t.codigo} ${t.tarea}`, tokens))
      .slice(0, 8)
      .forEach((t) =>
        out.push({ type: t.esGrupo ? "Bloque" : "Tarea", label: `${t.codigo} ${t.tarea}`.trim(), href: "/plan" }),
      );
    // Instructivo
    INSTRUCTIVO_INDEX.filter((it) => coincide(`${it.titulo} ${it.texto}`, tokens))
      .slice(0, 8)
      .forEach((it) => {
        // snippet: find first matching token context
        const ntext = norm(it.texto);
        let snippet = it.texto.slice(0, 90);
        for (const t of tokens) {
          const i = ntext.indexOf(norm(t));
          if (i >= 0) {
            const start = Math.max(0, i - 40);
            snippet = (start > 0 ? "…" : "") + it.texto.slice(start, start + 100) + "…";
            break;
          }
        }
        out.push({ type: "Instructivo", label: it.titulo, sub: snippet, href: `/instructivo?section=${it.id}&q=${encodeURIComponent(q.trim())}`, sectionId: it.id });
      });
    return out.slice(0, 24);
  }, [q, docs, tasks]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  const openResult = (r: (typeof results)[number]) => {
    setOpen(false);
    router.push(r.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[idx]) openResult(results[idx]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-[16px]"
      onClick={() => setOpen(false)}
    >
      <div
        className="glass w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <i className="fa-solid fa-magnifying-glass text-gold" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Buscar documentos, tareas, secciones…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#64748b] focus:outline-none"
          />
          <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#64748b]">Esc</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="p-4">
              <p className="mb-3 text-center text-sm text-[#64748b]">Sin resultados.</p>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Accesos rápidos</p>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => { setOpen(false); router.push("/documentoteca"); }} className="rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-gold">
                  Ir a Documentoteca
                </button>
                <button type="button" onClick={() => { setOpen(false); router.push("/instructivo"); }} className="rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-gold">
                  Ver Manual de Usuario
                </button>
                <button type="button" onClick={() => { setOpen(false); router.push("/plan"); }} className="rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-gold">
                  Ver Plan de Trabajo
                </button>
              </div>
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openResult(r)}
                onMouseEnter={() => setIdx(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  i === idx ? "bg-gold/15 text-white" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span
                  className={`w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide ${
                    r.type === "Instructivo" ? "text-gold" : "text-[#64748b]"
                  }`}
                >
                  {r.type}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{r.label}</span>
                {r.sub && <span className="hidden max-w-[45%] truncate text-[11px] text-[#64748b] sm:block">{r.sub}</span>}
              </button>
            ))
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2 text-[10px] text-[#64748b]">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>Esc cerrar</span>
        </div>
      </div>
    </div>
  );
}
