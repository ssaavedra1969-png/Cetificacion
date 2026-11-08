"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Documento, PuntoSGC } from "@/types/models";
import DocumentoModal from "@/components/DocumentoModal";

const estadoClasses: Record<PuntoSGC["estado"], string> = {
  Pendiente: "border-slate-400/25 bg-slate-400/10 text-slate-300",
  "En curso": "border-blue-400/30 bg-blue-400/10 text-blue-300",
  Bloqueado: "border-red-400/30 bg-red-400/10 text-red-300",
  Completado: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

const prioridadClasses: Record<PuntoSGC["prioridad"], string> = {
  alta: "border-red-400/30 bg-red-400/10 text-red-300",
  media: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  baja: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

const tipoIcon: Record<Documento["tipo"], string> = {
  pdf: "fa-file-pdf",
  word: "fa-file-word",
  excel: "fa-file-excel",
  imagen: "fa-file-image",
  otro: "fa-file",
};

type Tab = "resumen" | "documentos" | "historial";

interface Props {
  punto: PuntoSGC;
  documentos: Documento[];
  onClose: () => void;
}

export default function PuntoModal({ punto, documentos, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("resumen");
  const [docAbierto, setDocAbierto] = useState<Documento | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !docAbierto) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, docAbierto]);

  const ids = new Set(punto.documentosIds ?? []);
  const docs = documentos.filter(
    (d) => d.puntoId === punto.id || ids.has(d.id),
  );

  if (typeof document === "undefined") return null;

  const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: "resumen", label: "Resumen", icon: "fa-circle-info" },
    {
      id: "documentos",
      label: "Documentos",
      icon: "fa-paperclip",
      count: docs.length,
    },
    {
      id: "historial",
      label: "Historial",
      icon: "fa-clock-rotate-left",
      count: punto.historial?.length ?? 0,
    },
  ];

  const contenido = (
    <>
      {tab === "resumen" && (
        <div className="space-y-5">
          {punto.descripcion && (
            <p className="text-sm leading-relaxed text-[#c7d2e3]">
              {punto.descripcion}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Categoría
              </p>
              <p className="mt-1 text-sm text-[#e2e8f2]">
                {punto.categoria || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Plantas
              </p>
              <p className="mt-1 text-sm text-[#e2e8f2]">
                {punto.plantas?.length ? punto.plantas.join(" · ") : "General"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Responsable
              </p>
              <p className="mt-1 text-sm text-[#e2e8f2]">
                {punto.responsable || "A definir"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Fecha compromiso
              </p>
              <p className="mt-1 text-sm text-[#e2e8f2]">
                {punto.fechaCompromiso?.slice(0, 10) || "Sin definir"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Última actualización
              </p>
              <p className="mt-1 text-sm text-[#e2e8f2]">
                {punto.fechaActualizacion
                  ? new Date(punto.fechaActualizacion).toLocaleString("es-AR")
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Documentos
              </p>
              <button
                type="button"
                onClick={() => setTab("documentos")}
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-gold transition-colors hover:text-amber-200"
              >
                {docs.length} adjunto{docs.length === 1 ? "" : "s"}
                <i
                  className="fa-solid fa-arrow-right text-[10px]"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {punto.notas && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Notas
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-[#c7d2e3]">
                {punto.notas}
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "documentos" && (
        <div>
          {docs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
              <i
                className="fa-solid fa-folder-open mb-3 text-2xl text-gold/60"
                aria-hidden="true"
              />
              <p className="text-sm text-[#9fb0c9]">
                Sin documentos adjuntos aún.
              </p>
              <Link
                href="/administracion#documentos"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-amber-200"
              >
                <i className="fa-solid fa-paperclip" aria-hidden="true" />
                Cargar documentos
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDocAbierto(d)}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition-colors hover:border-gold/40 hover:bg-white/[0.05]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <i
                      className={`fa-solid ${tipoIcon[d.tipo]}`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">
                      {d.nombre}
                    </span>
                    <span className="block truncate text-[11px] text-[#6f7f99]">
                      {d.categoria} · v{d.version} · {d.fecha}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-gold">
                    Ver
                    <i
                      className="fa-solid fa-eye ml-1 text-[10px]"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              ))}

              <Link
                href="/administracion#documentos"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-amber-200"
              >
                <i className="fa-solid fa-paperclip" aria-hidden="true" />
                Gestionar documentos
              </Link>
            </div>
          )}
        </div>
      )}

      {tab === "historial" && (
        <div>
          {punto.historial?.length ? (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    {["Fecha", "Usuario", "Campo", "Nuevo"].map((label) => (
                      <th
                        key={label}
                        className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {punto.historial.map((h, i) => (
                    <tr key={i} className="border-b border-white/[0.06]">
                      <td className="px-3 py-2 text-xs text-[#9fb0c9]">
                        {new Date(h.fecha).toLocaleString("es-AR")}
                      </td>
                      <td className="px-3 py-2 text-xs text-[#9fb0c9]">
                        {h.usuario}
                      </td>
                      <td className="px-3 py-2 text-xs text-[#9fb0c9]">
                        {h.campo}
                      </td>
                      <td className="px-3 py-2 text-xs text-[#c7d2e3]">
                        {h.valorNuevo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-[#6f7f99]">
              Sin historial de cambios aún.
            </p>
          )}
        </div>
      )}

    </>
  );

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={punto.titulo}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0a0e17] shadow-2xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="border-b border-white/10 px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                  Tema {punto.id}
                </p>
                <h2 className="font-display mt-1 pr-2 text-lg font-bold leading-tight text-white sm:text-xl">
                  {punto.titulo}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${estadoClasses[punto.estado]}`}
                  >
                    {punto.estado}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${prioridadClasses[punto.prioridad]}`}
                  >
                    {punto.prioridad}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-[#9fb0c9]">
                    {punto.plantas?.length
                      ? punto.plantas.join(" · ")
                      : "General"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="shrink-0 rounded-lg p-2 text-[#9fb0c9] transition-colors hover:bg-white/10 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-3">
            {tabs.map((t) => {
              const activo = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition-colors ${
                    activo
                      ? "border-gold text-gold"
                      : "border-transparent text-[#9fb0c9] hover:text-white"
                  }`}
                >
                  <i className={`fa-solid ${t.icon}`} aria-hidden="true" />
                  {t.label}
                  {typeof t.count === "number" && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        activo
                          ? "bg-gold/15 text-gold"
                          : "bg-white/10 text-[#9fb0c9]"
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {contenido}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-5">
            <Link
              href={`/temas/${punto.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold transition-colors hover:text-amber-200"
            >
              <i className="fa-solid fa-up-right-from-square" aria-hidden="true" />
              Abrir página completa
            </Link>
            <Link
              href="/administracion"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9fb0c9] transition-colors hover:text-white"
            >
              <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
              Editar en administración
            </Link>
          </footer>
        </div>
      </div>

      {docAbierto && (
        <DocumentoModal
          documento={docAbierto}
          onClose={() => setDocAbierto(null)}
        />
      )}
    </>,
    document.body,
  );
}
