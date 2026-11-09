"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Documento, PuntoSGC } from "@/types/models";
import DocumentoModal from "@/components/DocumentoModal";

const estadoClasses: Record<PuntoSGC["estado"], string> = {
  Pendiente: "border-slate-400/25 bg-slate-400/10 text-slate-300",
  "En curso": "border-blue-400/30 bg-blue-400/10 text-blue-300",
  Bloqueado: "border-red-400/30 bg-red-400/10 text-red-300",
  Completado: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

const tipoIcon: Record<Documento["tipo"], string> = {
  pdf: "fa-file-pdf",
  word: "fa-file-word",
  excel: "fa-file-excel",
  imagen: "fa-file-image",
  otro: "fa-file",
};

interface Props {
  id: string;
}

export default function TemaDetalle({ id }: Props) {
  const [punto, setPunto] = useState<PuntoSGC | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalDoc, setModalDoc] = useState<Documento | null>(null);

  const fetchTema = useCallback(async () => {
    const [agendaRes, docsRes] = await Promise.all([
      fetch("/api/agenda"),
      fetch("/api/documentos"),
    ]);
    const agenda = agendaRes.ok ? await agendaRes.json() : { puntos: [] };
    const docs = docsRes.ok ? await docsRes.json() : { documentos: [] };

    const encontrado =
      ((agenda.puntos ?? []) as PuntoSGC[]).find((p) => p.id === id) ?? null;

    return {
      punto: encontrado,
      documentos: (docs.documentos ?? []) as Documento[],
    };
  }, [id]);

  useEffect(() => {
    let activo = true;
    fetchTema()
      .then((data) => {
        if (!activo) return;
        setPunto(data.punto);
        setDocumentos(data.documentos);
      })
      .catch(() => {
        if (activo) setError("No se pudo cargar la información del tema.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, [fetchTema]);

  const docsDelTema = useMemo(() => {
    if (!punto) return [] as Documento[];
    const ids = new Set(punto.documentosIds ?? []);
    return documentos.filter((d) => d.puntoId === punto.id || ids.has(d.id));
  }, [documentos, punto]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-[#94a3b8]">
          <i
            className="fa-solid fa-spinner fa-spin text-gold"
            aria-hidden="true"
          />
          Cargando tema...
        </span>
      </main>
    );
  }

  if (error || !punto) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <i
          className="fa-solid fa-triangle-exclamation text-3xl text-gold"
          aria-hidden="true"
        />
        <p className="text-white">
          {error ?? "No se encontró el tema solicitado."}
        </p>
        <Link
          href="/"
          className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
        >
          Volver al portal
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Ficha del tema */}
        <section className="glass rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
                Tema {punto.id}
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {punto.titulo}
              </h1>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${estadoClasses[punto.estado]}`}
            >
              {punto.estado}
            </span>
          </div>

          {punto.descripcion && (
            <p className="mt-4 text-sm leading-relaxed text-[#94a3b8]">
              {punto.descripcion}
            </p>
          )}

          <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Categoría
              </dt>
              <dd className="mt-1 text-[#c7d2e3]">{punto.categoria || "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Plantas
              </dt>
              <dd className="mt-1 text-[#c7d2e3]">
                {punto.plantas?.length ? punto.plantas.join(" · ") : "General"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Responsable
              </dt>
              <dd className="mt-1 text-[#c7d2e3]">
                {punto.responsable || "A definir"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Prioridad
              </dt>
              <dd className="mt-1 capitalize text-[#c7d2e3]">
                {punto.prioridad}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Fecha compromiso
              </dt>
              <dd className="mt-1 text-[#c7d2e3]">
                {punto.fechaCompromiso?.slice(0, 10) || "Sin definir"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Última actualización
              </dt>
              <dd className="mt-1 text-[#c7d2e3]">
                {punto.fechaActualizacion
                  ? new Date(punto.fechaActualizacion).toLocaleString("es-AR")
                  : "—"}
              </dd>
            </div>
          </dl>

          {punto.notas && (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Notas
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-[#c7d2e3]">
                {punto.notas}
              </p>
            </div>
          )}
        </section>

        {/* Documentos anexados */}
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-white">
                Documentos anexados
              </h2>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-[#94a3b8]">
                {docsDelTema.length}
              </span>
            </div>

            <Link
              href={`/administracion?tema=${punto.id}#documentos`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/25"
            >
              <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
              Subir o vincular documento a este tema
            </Link>
          </div>

          {docsDelTema.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <i
                className="fa-solid fa-folder-open mb-3 text-3xl text-gold/60"
                aria-hidden="true"
              />
              <p className="text-sm text-[#94a3b8]">
                Este tema todavía no tiene documentos anexados.
              </p>
              <Link
                href={`/administracion?tema=${punto.id}#documentos`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-bold text-gold transition-colors hover:bg-gold/20"
              >
                <i className="fa-solid fa-plus" aria-hidden="true" />
                Adjuntar primer documento
              </Link>
            </div>
          ) : (
            <ul className="glass divide-y divide-white/[0.06] rounded-2xl">
              {docsDelTema.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setModalDoc(d)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold"
                    >
                      <i
                        className={`fa-solid ${tipoIcon[d.tipo] || "fa-file"}`}
                        aria-hidden="true"
                      />
                    </button>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setModalDoc(d)}
                        className="block truncate text-left text-sm font-medium text-white hover:text-gold"
                      >
                        {d.nombre}
                      </button>
                      <span className="block truncate text-[11px] text-[#64748b]">
                        {d.categoria} · v{d.version} · {d.fecha}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalDoc(d)}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20"
                    >
                      <i className="fa-solid fa-eye text-[10px]" />
                      Ver
                    </button>
                    <Link
                      href={`/documentos/${d.id}`}
                      className="rounded-md border border-white/10 bg-white/5 p-1 text-xs text-[#94a3b8] hover:text-white"
                      title="Abrir en página completa"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square text-[11px]" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {modalDoc && (
        <DocumentoModal documento={modalDoc} onClose={() => setModalDoc(null)} />
      )}
    </main>
  );
}
