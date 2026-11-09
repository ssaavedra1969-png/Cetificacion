import Link from "next/link";
import type { Documento } from "@/types/models";

type TipoDocumento = Documento["tipo"];

const tipoVisual: Record<
  TipoDocumento,
  { icon: string; tone: string; label: string }
> = {
  pdf: {
    icon: "fa-file-pdf",
    tone: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    label: "PDF",
  },
  word: {
    icon: "fa-file-word",
    tone: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    label: "DOCX",
  },
  excel: {
    icon: "fa-file-excel",
    tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    label: "XLSX",
  },
  imagen: {
    icon: "fa-file-image",
    tone: "border-violet-400/20 bg-violet-400/10 text-violet-300",
    label: "IMG",
  },
  otro: {
    icon: "fa-file",
    tone: "border-slate-400/20 bg-slate-400/10 text-slate-300",
    label: "ARCHIVO",
  },
};

function archivoVisual(documento: Documento) {
  const visual = tipoVisual[documento.tipo] ?? tipoVisual.otro;

  return {
    id: documento.id,
    nombre: documento.nombre || "Documento sin nombre",
    meta: `${visual.label} · ${documento.planta || "General"}`,
    badge: documento.puntoId || "SGC",
    icon: visual.icon,
    tone: visual.tone,
    badgeTone: "border-white/10 bg-white/[0.03] text-slate-300",
  };
}

function ProgressRing({ value, tone }: { value: number; tone: string }) {
  const radio = 16;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (value / 100) * circunferencia;

  return (
    <svg
      viewBox="0 0 40 40"
      className={`h-9 w-9 -rotate-90 ${tone}`}
      aria-hidden="true"
    >
      <circle
        cx="20"
        cy="20"
        r={radio}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-slate-800"
      />
      <circle
        cx="20"
        cy="20"
        r={radio}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export default function RepositorioPanel({
  documentos = [],
}: {
  documentos?: Documento[];
}) {
  const totalDocumentos = documentos.length;
  const normasIram = documentos.filter((documento) =>
    `${documento.nombre} ${documento.categoria}`.toLowerCase().includes("iram"),
  ).length;
  const plantasConDocumentos = new Set(
    documentos
      .map((documento) => documento.planta)
      .filter((planta) => planta && planta !== "General"),
  ).size;

  const metricas = [
    {
      label: "Documentos",
      value: String(totalDocumentos),
      detail: "Archivos indexados",
      icon: "fa-folder-open",
      iconTone: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      ring: totalDocumentos > 0 ? 100 : 0,
      ringTone: "text-amber-400",
      bar: "from-amber-400 to-orange-500",
    },
    {
      label: "Normas IRAM",
      value: String(normasIram),
      detail: "Vigentes",
      icon: "fa-certificate",
      iconTone: "border-sky-400/20 bg-sky-400/10 text-sky-300",
      ring: normasIram > 0 ? 100 : 0,
      ringTone: "text-sky-400",
      bar: "from-sky-400 to-cyan-400",
    },
    {
      label: "Plantas",
      value: String(plantasConDocumentos).padStart(2, "0"),
      detail: plantasConDocumentos > 0 ? "Con documentación" : "Sin actividad",
      icon: "fa-industry",
      iconTone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      ring: plantasConDocumentos > 0 ? 100 : 0,
      ringTone: "text-emerald-400",
      bar: "from-emerald-400 to-teal-400",
    },
  ];

  const archivos = documentos
    .slice()
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))
    .slice(0, 4)
    .map(archivoVisual);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_30px_90px_-50px_rgba(0,0,0,1)] backdrop-blur-md sm:p-6">
      <span
        className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/[0.04] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-4 border-b border-white/5 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300 shadow-[0_0_28px_-10px_rgba(245,158,11,0.7)]">
            <i className="fa-solid fa-folder-tree text-sm" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">
              Repositorio SGC
            </p>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-50">
              Certificaciones 2026
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[10px] font-semibold text-amber-200">
            <i
              className="fa-solid fa-certificate text-[10px]"
              aria-hidden="true"
            />
            Normas IRAM
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${
              totalDocumentos > 0
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-slate-800 bg-slate-900/60 text-slate-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                totalDocumentos > 0
                  ? "animate-pulse-dot bg-emerald-400"
                  : "bg-slate-600"
              }`}
            />
            {totalDocumentos > 0 ? "Sincronizado" : "Sin documentos"}
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs text-slate-500 transition-colors hover:border-white/15">
        <i
          className="fa-solid fa-magnifying-glass text-[11px] text-slate-500"
          aria-hidden="true"
        />
        <input
          type="text"
          readOnly
          placeholder="Buscar norma, certificado o planta..."
          aria-label="Buscar en el repositorio"
          className="min-w-0 flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-500 outline-none"
        />
        <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
          ⌘K
        </span>
      </div>

      <div className="relative mb-6 mt-6 grid grid-cols-3 gap-4">
        {metricas.map((metrica) => (
          <div
            key={metrica.label}
            className="rounded-xl border border-white/10 bg-slate-950/40 p-3 sm:p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:text-[10px]">
                  {metrica.label}
                </p>
                <p className="font-display mt-2 text-2xl font-extrabold leading-none text-slate-50 sm:text-3xl">
                  {metrica.value}
                </p>
                <p className="mt-1 hidden text-[10px] text-slate-500 sm:block">
                  {metrica.detail}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border ${metrica.iconTone}`}
                >
                  <i
                    className={`fa-solid ${metrica.icon} text-[10px]`}
                    aria-hidden="true"
                  />
                </span>
                <ProgressRing value={metrica.ring} tone={metrica.ringTone} />
              </div>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${metrica.bar}`}
                style={{ width: `${metrica.ring}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {archivos.length === 0 ? (
        <div className="relative rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-6 py-8 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-500">
            <i
              className="fa-regular fa-folder-open text-sm"
              aria-hidden="true"
            />
          </span>
          <p className="mt-3 text-xs font-semibold text-slate-300">
            Todavía no hay documentos cargados.
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Cuando cargues un archivo va a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="relative grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {archivos.map((archivo) => (
            <div
              key={archivo.id}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-3.5 py-3 transition-all duration-300 hover:border-amber-400/20 hover:bg-slate-900/60"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${archivo.tone}`}
              >
                <i
                  className={`fa-solid ${archivo.icon} text-xs`}
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {archivo.nombre}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {archivo.meta}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${archivo.badgeTone}`}
              >
                {archivo.badge}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
          <i
            className="fa-solid fa-shield-halved text-emerald-400"
            aria-hidden="true"
          />
          Trazabilidad completa
        </span>
        <Link
          href="/documentoteca"
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-300 transition-colors hover:text-amber-200"
        >
          Ver repositorio
          <i
            className="fa-solid fa-arrow-right text-[9px]"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
