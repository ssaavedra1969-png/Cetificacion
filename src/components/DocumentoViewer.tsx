"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Documento } from "@/types/models";
import { downloadUrl, isImageUrl, normalizeUrl } from "@/lib/urls";

export default function DocumentoViewer() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/documentos")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el documento");
        return res.json();
      })
      .then((data) => setDocumentos((data.documentos ?? []) as Documento[]))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error desconocido"),
      )
      .finally(() => setLoading(false));
  }, []);

  const doc = useMemo(
    () => documentos.find((d) => d.id === id) ?? null,
    [documentos, id],
  );

  const url = doc ? normalizeUrl(doc.archivoUrl) : "";
  const descargaUrl = downloadUrl(url);
  const esImagen = doc ? doc.tipo === "imagen" || isImageUrl(url) : false;
  const volver = doc?.puntoId ? `/temas/${doc.puntoId}` : "/documentoteca";

  return (
    <main className="flex min-h-screen flex-col bg-[#02040a]">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#02040a]/90 px-4 py-3 backdrop-blur-xl">
        <Link
          href={volver}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#9fb0c9] transition-colors hover:text-white"
        >
          <i className="fa-solid fa-arrow-left text-gold" aria-hidden="true" />
          Volver
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold text-white">
            {doc?.nombre ?? "Documento"}
          </p>
          {doc && (
            <p className="truncate text-[11px] text-[#6f7f99]">
              {doc.categoria} · v{doc.version} · {doc.fecha}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {doc && (
            <a
              href={descargaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
            >
              <i className="fa-solid fa-download" aria-hidden="true" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
          )}
        </div>
      </header>

      <div className="flex-1">
        {loading ? (
          <div className="flex h-[calc(100vh-64px)] items-center justify-center">
            <span className="inline-flex items-center gap-2 text-sm text-[#9fb0c9]">
              <i
                className="fa-solid fa-spinner fa-spin text-gold"
                aria-hidden="true"
              />
              Cargando documento...
            </span>
          </div>
        ) : error || !doc ? (
          <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-3 px-6 text-center">
            <i
              className="fa-solid fa-file-circle-xmark text-3xl text-gold"
              aria-hidden="true"
            />
            <p className="text-white">
              {error ?? "No se encontró el documento solicitado."}
            </p>
            <Link
              href="/documentoteca"
              className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
            >
              Ir a la Documentoteca
            </Link>
          </div>
        ) : esImagen ? (
          <div className="h-[calc(100vh-64px)] overflow-auto p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={doc.nombre}
              className="mx-auto max-w-full rounded-lg"
            />
          </div>
        ) : (
          <iframe
            src={url}
            title={doc.nombre}
            className="h-[calc(100vh-64px)] w-full border-0 bg-white"
          />
        )}
      </div>
    </main>
  );
}