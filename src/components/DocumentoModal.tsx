"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Documento } from "@/types/models";
import { downloadUrl, isImageUrl, normalizeUrl } from "@/lib/urls";

interface Props {
  documento: Documento;
  onClose: () => void;
}

export default function DocumentoModal({ documento, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const url = normalizeUrl(documento.archivoUrl);
  const esImagen = documento.tipo === "imagen" || isImageUrl(url);
  const descarga = downloadUrl(url);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/85 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={documento.nombre}
    >
      <header
        className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0a0e17] px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <i
              className={`fa-solid ${
                esImagen ? "fa-file-image" : "fa-file-pdf"
              }`}
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {documento.nombre}
            </p>
            <p className="truncate text-[11px] text-[#6f7f99]">
              {documento.categoria} · v{documento.version} · {documento.fecha}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/documentos/${documento.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[#c7d2e3] transition-colors hover:bg-white/10 sm:inline-flex"
          >
            <i className="fa-solid fa-up-right-from-square" aria-hidden="true" />
            Abrir
          </Link>
          <a
            href={descarga}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
          >
            <i className="fa-solid fa-download" aria-hidden="true" />
            <span className="hidden sm:inline">Descargar</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar documento"
            className="rounded-lg p-2 text-[#9fb0c9] transition-colors hover:bg-white/10 hover:text-white"
          >
            <i className="fa-solid fa-xmark text-lg" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        className="flex-1 overflow-auto bg-[#0b0f16]"
        onClick={(e) => e.stopPropagation()}
      >
        {esImagen ? (
          <div className="flex min-h-full items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={documento.nombre}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        ) : (
          <iframe
            src={url}
            title={documento.nombre}
            className="h-full w-full border-0 bg-white"
          />
        )}
      </div>
    </div>,
    document.body,
  );
}