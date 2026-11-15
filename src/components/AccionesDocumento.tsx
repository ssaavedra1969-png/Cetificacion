"use client";

import { useState } from "react";
import Link from "next/link";
import type { Documento } from "@/types/models";
import { downloadUrl } from "@/lib/urls";

interface Props {
  documento: Documento;
  onVer: (documento: Documento) => void;
  onChanged?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export default function AccionesDocumento({
  documento,
  onVer,
  onChanged,
  canEdit = false,
  canDelete = false,
  size = "sm",
  className = "",
}: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dim = size === "md" ? "px-2.5 py-1.5 text-xs" : "h-7 w-7 text-[11px]";
  const esObsoleto = documento.categoria === "Obsoletos";

  async function pasarAObsoletos() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("id", documento.id);
      fd.append("categoria", "Obsoletos");
      const res = await fetch("/api/documentos", { method: "PATCH", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo mover a obsoletos");
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al mover");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/documentos?id=${encodeURIComponent(documento.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo eliminar");
      }
      setConfirmando(false);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex items-center justify-end gap-1.5 ${className}`}>
      {error && (
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-400/30 bg-rose-400/10 text-rose-300"
          title={error}
        >
          <i className="fa-solid fa-triangle-exclamation text-[11px]" />
        </span>
      )}

      <button
        type="button"
        onClick={() => onVer(documento)}
        className={`${base} ${dim} border-emerald-400/30 bg-emerald-400/10 font-semibold text-emerald-300 hover:bg-emerald-400/20`}
        title="Ver en el visor integrado"
      >
        <i className="fa-solid fa-eye" aria-hidden="true" />
        {size === "md" && "Ver"}
      </button>

      <Link
        href={`/documentos/${documento.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${dim} border-white/10 bg-white/5 text-[#94a3b8] hover:bg-white/10 hover:text-white`}
        title="Vista tipo PDF en página completa"
      >
        <i className="fa-solid fa-file-pdf" aria-hidden="true" />
        {size === "md" && "PDF"}
      </Link>

      <a
        href={downloadUrl(documento.archivoUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${dim} border-white/10 bg-white/5 text-[#94a3b8] hover:bg-white/10 hover:text-white`}
        title="Descargar archivo"
      >
        <i className="fa-solid fa-download" aria-hidden="true" />
      </a>

      {canEdit && (
        <a
          href={`/administracion?doc=${encodeURIComponent(documento.id)}#documentos`}
          className={`${base} ${dim} border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20`}
          title="Editar documento"
        >
          <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
          {size === "md" && "Editar"}
        </a>
      )}

      {canEdit && !esObsoleto && (
        <button
          type="button"
          onClick={pasarAObsoletos}
          disabled={busy}
          className={`${base} ${dim} border-slate-400/30 bg-slate-400/10 text-slate-300 hover:bg-slate-400/20`}
          title="Mover a Documentos Obsoletos"
        >
          {busy ? (
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
          ) : (
            <i className="fa-solid fa-box-archive" aria-hidden="true" />
          )}
          {size === "md" && "Obsoletos"}
        </button>
      )}

      {canDelete &&
        (confirmando ? (
          <>
            <button
              type="button"
              onClick={eliminar}
              disabled={busy}
              className={`${base} ${dim} border-rose-400/40 bg-rose-400/20 font-semibold text-rose-200 hover:bg-rose-400/30`}
              title="Confirmar eliminación"
            >
              {busy ? (
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
              ) : (
                <i className="fa-solid fa-trash-can" aria-hidden="true" />
              )}
              {size === "md" && "Sí"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className={`${base} ${dim} border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white`}
              title="Cancelar"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className={`${base} ${dim} border-rose-400/30 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20`}
            title="Eliminar documento"
          >
            <i className="fa-solid fa-trash-can" aria-hidden="true" />
            {size === "md" && "Eliminar"}
          </button>
        ))}
    </div>
  );
}
