"use client";

import { useEffect, useRef, useState } from "react";
import type { Documento } from "@/types/models";
import { extFromName } from "@/lib/files";
import { downloadUrl } from "@/lib/urls";

interface Props {
  documento: Documento;
  url: string;
}

interface Hoja {
  nombre: string;
  filas: string[][];
}

const MAX_FILAS = 400;
const MAX_COLUMNAS = 40;

function normalizarFilas(rows: unknown[][]): string[][] {
  const filas = rows.map((fila) =>
    (Array.isArray(fila) ? fila : []).map((celda) =>
      celda === null || celda === undefined ? "" : String(celda),
    ),
  );

  for (const fila of filas) {
    while (fila.length && fila[fila.length - 1] === "") fila.pop();
  }

  while (
    filas.length &&
    filas[filas.length - 1].every((celda) => celda === "")
  ) {
    filas.pop();
  }

  return filas;
}

function DescargaFallback({ mensaje, url }: { mensaje: string; url: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <i
        className="fa-solid fa-triangle-exclamation text-3xl text-amber-400"
        aria-hidden="true"
      />
      <p className="max-w-md text-sm text-slate-400">{mensaje}</p>
      <a
        href={downloadUrl(url)}
        className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-400/20"
      >
        Descargar archivo
      </a>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-400">
      <i
        className="fa-solid fa-spinner fa-spin text-amber-400"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export default function OfficePreview({ documento, url }: Props) {
  const ext = extFromName(
    documento.ruta || documento.archivoUrl || documento.nombre,
  ).toLowerCase();
  const esExcel = ext === ".xlsx" || ext === ".xls" || ext === ".csv";
  const esDocx = ext === ".docx";

  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [error, setError] = useState<string | null>(null);
  const [hojas, setHojas] = useState<Hoja[]>([]);
  const [hojaActiva, setHojaActiva] = useState(0);
  const docxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!esExcel && !esDocx) return;

    let activo = true;
    const controller = new AbortController();
    const contenedorDocx = docxRef.current;
    if (contenedorDocx) contenedorDocx.innerHTML = "";

    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(
            "No se pudo descargar el archivo para generar la vista previa.",
          );
        }

        if (esExcel) {
          const buffer = await res.arrayBuffer();
          const XLSX = await import("xlsx");
          const libro = XLSX.read(new Uint8Array(buffer), { type: "array" });
          const procesadas = libro.SheetNames.map((nombre) => {
            const hoja = libro.Sheets[nombre];
            const aoa = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
              header: 1,
              defval: "",
              raw: false,
              blankrows: false,
            });
            return { nombre, filas: normalizarFilas(aoa) };
          }).filter((hoja) => hoja.filas.length > 0);

          if (!activo) return;
          setHojas(procesadas);
          setHojaActiva(0);
          setEstado("listo");
          return;
        }

        const blob = await res.blob();
        const { renderAsync } = await import("docx-preview");
        if (!activo) return;
        if (!contenedorDocx) throw new Error("No se pudo preparar el visor.");
        contenedorDocx.innerHTML = "";
        await renderAsync(blob, contenedorDocx, undefined, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreWidth: false,
        });
        if (!activo) return;
        setEstado("listo");
      } catch (err) {
        if (!activo || controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo generar la vista previa del archivo.",
        );
        setEstado("error");
      }
    })();

    return () => {
      activo = false;
      controller.abort();
      if (contenedorDocx) contenedorDocx.innerHTML = "";
    };
  }, [url, esExcel, esDocx]);

  if (!esExcel && !esDocx) {
    return (
      <DescargaFallback
        mensaje="Este formato de Office no se puede previsualizar en el navegador. Descargá el archivo para verlo."
        url={url}
      />
    );
  }

  if (estado === "error") {
    return (
      <DescargaFallback
        mensaje={error ?? "No se pudo generar la vista previa del archivo."}
        url={url}
      />
    );
  }

  if (esDocx) {
    return (
      <div className="relative h-full min-h-[320px]">
        <div className="h-full overflow-auto bg-slate-200 p-4">
          <div ref={docxRef} className="docx-host mx-auto max-w-[900px]" />
        </div>
        {estado === "cargando" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <Spinner label="Generando vista previa del documento..." />
          </div>
        )}
      </div>
    );
  }

  if (estado === "cargando") {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center">
        <Spinner label="Generando vista previa de la planilla..." />
      </div>
    );
  }

  const hoja = hojas[hojaActiva] ?? { nombre: "", filas: [] };
  const columnas = Math.min(
    MAX_COLUMNAS,
    hoja.filas.reduce((max, fila) => Math.max(max, fila.length), 1),
  );
  const truncada =
    hoja.filas.length > MAX_FILAS ||
    hoja.filas.some((fila) => fila.length > MAX_COLUMNAS);

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      {hojas.length > 1 && (
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950/80 px-3 py-2">
          {hojas.map((item, index) => (
            <button
              key={`${item.nombre}-${index}`}
              type="button"
              onClick={() => setHojaActiva(index)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                index === hojaActiva
                  ? "bg-amber-400/15 text-amber-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {item.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-3">
        <div className="mx-auto w-fit min-w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl">
          <table className="border-collapse text-left text-[11px] text-slate-800">
            <tbody>
              {hoja.filas.slice(0, MAX_FILAS).map((fila, filaIndex) => (
                <tr
                  key={filaIndex}
                  className={
                    filaIndex === 0
                      ? "bg-slate-100 font-semibold"
                      : filaIndex % 2 === 0
                        ? "bg-white"
                        : "bg-slate-50"
                  }
                >
                  <td className="sticky left-0 z-10 border border-slate-200 bg-inherit px-1.5 py-1 text-center font-mono text-[10px] text-slate-400">
                    {filaIndex + 1}
                  </td>
                  {Array.from({ length: columnas }).map((_, colIndex) => (
                    <td
                      key={colIndex}
                      className="max-w-[320px] border border-slate-200 px-2 py-1 align-top whitespace-pre-wrap break-words"
                    >
                      {fila[colIndex] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hoja.filas.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            La hoja seleccionada está vacía.
          </p>
        )}

        {truncada && (
          <p className="mx-auto mt-3 max-w-xl text-center text-[11px] text-slate-500">
            Vista previa limitada a {MAX_FILAS} filas y {MAX_COLUMNAS} columnas.
            Descargá el archivo para ver el contenido completo.
          </p>
        )}
      </div>
    </div>
  );
}
