"use client";

import { useEffect } from "react";
import type { Documento } from "@/types/models";
import { useApp } from "./AppProviders";
import { downloadUrl } from "@/lib/urls";

interface Props {
  doc: Documento | null;
  onClose: () => void;
}

export default function DocDrawer({ doc, onClose }: Props) {
  const { showToast } = useApp();

  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, onClose]);

  if (!doc) return null;

  const url = downloadUrl(doc.archivoUrl);
  const isPdf = doc.tipo === "pdf" || /\.pdf$/i.test(doc.archivoUrl);
  const isImage = doc.tipo === "imagen";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + doc.archivoUrl);
      showToast("✓ Enlace copiado al portapapeles");
    } catch {
      showToast("No se pudo copiar");
    }
  };

  return (
    <div className="fixed inset-0 z-[80]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0a0f1e]/95 p-5 shadow-[-8px_0_32px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-rise"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideIn 0.25s ease-out" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Ficha técnica</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Cerrar"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-3 text-[13px]">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Nombre</p>
            <p className="font-semibold text-white">{doc.nombre}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Categoría</p>
              <p className="text-white">{doc.categoria}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Planta</p>
              <p className="text-white">{doc.planta}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Versión</p>
              <p className="font-mono-code text-white">v{doc.version}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Fecha</p>
              <p className="font-mono-code text-white">{doc.fecha}</p>
            </div>
          </div>
          {doc.responsable && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Responsable</p>
              <p className="text-white">{doc.responsable}</p>
            </div>
          )}
          {doc.descripcion && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Descripción</p>
              <p className="text-white">{doc.descripcion}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/20"
            >
              <i className="fa-solid fa-link" aria-hidden="true" />
              Copiar enlace
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              <i className="fa-solid fa-download" aria-hidden="true" />
              Descargar
            </a>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/40">
            {isPdf && (
              <iframe src={doc.archivoUrl} className="h-[420px] w-full" title={doc.nombre} />
            )}
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doc.archivoUrl} alt={doc.nombre} className="max-h-[420px] w-full object-contain" />
            )}
            {!isPdf && !isImage && (
              <div className="flex h-40 items-center justify-center text-sm text-[#64748b]">
                Vista previa no disponible para este tipo.
              </div>
            )}
          </div>
        </div>
      </aside>
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
