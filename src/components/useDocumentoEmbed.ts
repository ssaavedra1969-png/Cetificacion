"use client";

import { useEffect, useState } from "react";
import type { Documento } from "@/types/models";
import {
  extFromName,
  isOfficeTipo,
  officeEmbedUrl,
  tipoFromExt,
} from "@/lib/files";
import { normalizeUrl } from "@/lib/urls";

export type EmbedKind = "pdf" | "imagen" | "office" | "otro";

export interface DocumentoEmbed {
  url: string;
  kind: EmbedKind;
  officeSrc: string | null;
  signing: boolean;
  signError: string | null;
}

interface Firmado {
  id: string;
  src: string | null;
  error: string | null;
}

const LOCAL_MSG =
  "El visor de Office no funciona en localhost. Descargá el archivo para abrirlo.";

export function useDocumentoEmbed(doc: Documento | null): DocumentoEmbed {
  const [firmado, setFirmado] = useState<Firmado | null>(null);

  const url = doc ? normalizeUrl(doc.archivoUrl) : "";
  const ext = doc ? extFromName(doc.ruta || doc.archivoUrl || doc.nombre) : "";
  const tipo = doc ? (ext ? tipoFromExt(ext) : doc.tipo) : "otro";
  const kind: EmbedKind =
    tipo === "pdf"
      ? "pdf"
      : tipo === "imagen"
        ? "imagen"
        : isOfficeTipo(tipo)
          ? "office"
          : "otro";
  const esExterno = /^https?:\/\//i.test(url);
  const esLocal =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname);
  const docId = doc?.id ?? "";

  useEffect(() => {
    if (!docId || kind !== "office" || esExterno || esLocal) return;

    let activo = true;

    fetch("/api/files/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: docId }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          throw new Error(data.error || "No se pudo firmar el enlace");
        }
        return data.url as string;
      })
      .then((signed) => {
        if (activo) {
          setFirmado({ id: docId, src: officeEmbedUrl(signed), error: null });
        }
      })
      .catch(() => {
        if (!activo) return;
        try {
          const absoluta = new URL(url, window.location.origin).href;
          setFirmado({
            id: docId,
            src: officeEmbedUrl(absoluta),
            error: null,
          });
        } catch {
          setFirmado({
            id: docId,
            src: null,
            error: "No se pudo preparar el visor de Office.",
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [docId, kind, esExterno, esLocal, url]);

  const delDoc = firmado && firmado.id === docId ? firmado : null;
  const officeSrc = esExterno
    ? officeEmbedUrl(url)
    : esLocal
      ? null
      : (delDoc?.src ?? null);
  const signError = esLocal
    ? LOCAL_MSG
    : (delDoc?.error ?? null);
  const signing =
    kind === "office" && !esExterno && !esLocal && !delDoc;

  return { url, kind, officeSrc, signing, signError };
}
