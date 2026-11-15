"use client";

import { useEffect, useState } from "react";

export default function InstructivoPage() {
  const [md, setMd] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/manual.md", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => setMd(t))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            <i className="fa-solid fa-book" aria-hidden="true" />
            Manual de usuario
          </span>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-white">
            Instructivo de uso del Portal SGC
          </h1>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Guía detallada de acceso, roles, permisos, documentoteca, administración, plan de trabajo y mapa SGC.
          </p>
        </header>
        {loading && (
          <div className="glass animate-pulse rounded-xl p-10 text-center text-[#94a3b8]">
            Cargando manual…
          </div>
        )}
        {error && (
          <div className="glass rounded-xl border border-rose-400/30 p-6 text-rose-300">
            No se pudo cargar el manual: {error}
          </div>
        )}
        {!loading && !error && (
          <article className="glass rounded-xl p-6">
            <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-200">
              {md}
            </pre>
          </article>
        )}
      </div>
    </main>
  );
}
