"use client";

import { useEffect, useMemo, useState } from "react";
import type { Documento } from "@/types/models";
import DocumentoModal from "@/components/DocumentoModal";

type CatKey =
  | "ALL"
  | "MSGC"
  | "DC"
  | "PG"
  | "PO"
  | "IT"
  | "FG"
  | "FO"
  | "REG"
  | "EXT"
  | "SOP"
  | "OBS"
  | "OTR";

const TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  MSGC: { label: "Manual", cls: "bg-[#1F4E79]" },
  DC: { label: "Documento de Calidad", cls: "bg-[#2E8BC0]" },
  PG: { label: "Procedimiento General", cls: "bg-[#3AA6A0]" },
  PO: { label: "Procedimiento Operativo", cls: "bg-[#7A5AF8]" },
  IT: { label: "Instructivo de Trabajo", cls: "bg-[#E08A2B]" },
  FG: { label: "Formulario / Registro", cls: "bg-[#4CAF50]" },
  FO: { label: "Formulario / Registro", cls: "bg-[#C0504D]" },
};

const CATS: [CatKey, string][] = [
  ["ALL", "Todos"],
  ["MSGC", "Manual"],
  ["DC", "Documentos de Calidad"],
  ["PG", "Procedimientos Generales"],
  ["PO", "Procedimientos Operativos"],
  ["IT", "Instructivos"],
  ["FG", "Formularios FG"],
  ["FO", "Formularios FO"],
  ["REG", "Registros"],
  ["EXT", "Externos"],
  ["SOP", "Soporte"],
  ["OBS", "Obsoletos"],
  ["OTR", "Otros"],
];

function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function codeOf(name: string): string {
  const m = name.match(/^(MSGC|DC|PG|PO|IT|FG|FO)\s+[0-9][0-9A-Za-z-]*/);
  return m ? m[0] : "";
}

interface Info {
  code: string;
  label: string;
  cls: string;
}

function infoOf(doc: Documento): Info {
  const code = codeOf(doc.nombre);
  const pre = code ? code.split(" ")[0] : "";
  if (TYPE_LABEL[pre]) {
    return { code, label: TYPE_LABEL[pre].label, cls: TYPE_LABEL[pre].cls };
  }
  const top = (doc.ruta ?? doc.nombre).split("/")[0];
  if (top.startsWith("06"))
    return { code: "", label: "Registro", cls: "bg-[#8A9BA8]" };
  if (top.startsWith("07"))
    return { code: "", label: "Externo", cls: "bg-[#6D7B8D]" };
  if (top.startsWith("08"))
    return { code: "", label: "Soporte", cls: "bg-[#B8860B]" };
  if (top.startsWith("99"))
    return { code: "", label: "Obsoleto", cls: "bg-[#B04A4A]" };
  return { code: "", label: "Otro", cls: "bg-[#9AA5B1]" };
}

function catOf(doc: Documento): CatKey {
  const pre = codeOf(doc.nombre).split(" ")[0];
  if (TYPE_LABEL[pre]) return pre as CatKey;
  const top = (doc.ruta ?? doc.nombre).split("/")[0];
  if (top.startsWith("06")) return "REG";
  if (top.startsWith("07")) return "EXT";
  if (top.startsWith("08")) return "SOP";
  if (top.startsWith("99")) return "OBS";
  return "OTR";
}

interface TreeNode {
  dirs: Record<string, TreeNode>;
  files: Documento[];
}

function buildTree(docs: Documento[]): TreeNode {
  const root: TreeNode = { dirs: {}, files: [] };
  for (const d of docs) {
    const parts = (d.ruta ?? d.nombre).split("/");
    parts.pop();
    let node = root;
    for (const p of parts) {
      node.dirs[p] = node.dirs[p] ?? { dirs: {}, files: [] };
      node = node.dirs[p];
    }
    node.files.push(d);
  }
  return root;
}

function countAll(node: TreeNode): number {
  let n = node.files.length;
  for (const k of Object.keys(node.dirs)) n += countAll(node.dirs[k]);
  return n;
}

const ESTRATEGICOS: [string, string][] = [
  ["Análisis de contexto y partes interesadas", "PG 02"],
  ["Revisión por la dirección", "PG 03"],
  ["Riesgos y oportunidades", "PG 07"],
  ["Planificación de cambios", "PG 08"],
  ["Indicadores de gestión", "PG 09"],
  ["Comunicación", "PG 11"],
];

const REALIZACION: [string, string][] = [
  ["Comercial", "PO 01"],
  ["Programación", "PO 02"],
  ["Producción", "PO 03"],
  ["Despacho y entrega", "PO 04"],
];

const APOYO: [string, string][] = [
  ["Compras y proveedores", "PO 06"],
  ["Mantenimiento y calibración", "PO 07"],
  ["Gestión de personal y competencias", "PG 05"],
  ["Formación y conocimientos", "PG 04"],
];

const MEJORA: [string, string][] = [
  ["No conformidades y acciones correctivas", "PG 06"],
  ["Auditorías internas", "PG 10"],
  ["Control de documentos y registros", "PG 01"],
];

function ProcessCard({ title, code }: { title: string; code: string }) {
  return (
    <div className="flex min-w-[120px] flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-white/10 bg-[#0e1329] px-3 py-3 text-center text-[12.5px] leading-tight text-slate-200 transition hover:-translate-y-0.5 hover:border-gold/50">
      <span>{title}</span>
      <span className="font-mono text-[10.5px] font-bold tracking-wide text-gold/80">
        {code}
      </span>
    </div>
  );
}

export default function MapaPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CatKey>("ALL");
  const [modalDoc, setModalDoc] = useState<Documento | null>(null);

  useEffect(() => {
    fetch("/api/documentos")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el mapa");
        return res.json();
      })
      .then((data) => setDocumentos(data.documentos || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const enriched = useMemo(
    () => documentos.map((d) => ({ d, info: infoOf(d), cat: catOf(d) })),
    [documentos],
  );

  const filtered = useMemo(() => {
    const term = norm(q.trim());
    return enriched.filter(({ d, cat: c }) => {
      if (cat !== "ALL" && c !== cat) return false;
      if (!term) return true;
      return norm(`${d.ruta ?? ""} ${d.nombre} ${codeOf(d.nombre)}`).includes(
        term,
      );
    });
  }, [enriched, cat, q]);

  const counts = useMemo(() => {
    const m: Partial<Record<CatKey, number>> = {};
    for (const { cat: c } of enriched) m[c] = (m[c] ?? 0) + 1;
    return m;
  }, [enriched]);

  const tree = useMemo(
    () => buildTree(filtered.map((x) => x.d)),
    [filtered],
  );

  const infoMap = useMemo(() => {
    const m = new Map<string, Info>();
    for (const { d, info } of enriched) m.set(d.id, info);
    return m;
  }, [enriched]);

  function renderTree(node: TreeNode, depth: number) {
    const keys = Object.keys(node.dirs).sort((a, b) =>
      a.localeCompare(b, "es"),
    );
    return (
      <>
        {keys.map((k) => (
          <details
            key={k}
            className="ml-1 border-l border-white/10 pl-2"
            open={depth < 1}
          >
            <summary className="cursor-pointer list-none py-1 text-[13px] font-semibold text-gold/90">
              <span className="mr-1 text-gold">▸</span>
              {k}
              <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                ({countAll(node.dirs[k])})
              </span>
            </summary>
            {renderTree(node.dirs[k], depth + 1)}
          </details>
        ))}
        {node.files
          .slice()
          .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
          .map((d) => {
            const info = infoMap.get(d.id) ?? infoOf(d);
            return (
              <div
                key={d.id}
                className="ml-4 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
              >
                <span
                  className={`min-w-[46px] rounded px-1.5 py-0.5 text-center text-[10.5px] font-bold text-white ${info.cls}`}
                >
                  {info.code || info.label}
                </span>
                <button
                  type="button"
                  onClick={() => setModalDoc(d)}
                  className="min-w-0 flex-1 truncate text-left text-[13px] text-slate-200 hover:text-gold"
                  title="Ver documento"
                >
                  {d.nombre}
                </button>
                <span className="hidden truncate text-[11px] text-slate-500 sm:block sm:max-w-[240px]">
                  {(d.ruta ?? "").replace("/" + d.nombre, "")}
                </span>
                <a
                  href={`/documentos/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1 text-slate-500 hover:text-white"
                  title="Abrir en página completa"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[11px]" />
                </a>
              </div>
            );
          })}
      </>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            <i className="fa-solid fa-sitemap" aria-hidden="true" />
            Sistema de Gestión de la Calidad
          </span>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Mapa del Proyecto SGC
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Grupo Falpat S.R.L. · ISO 9001:2026 · Plantas Luján y Campana · Rev. 0
          </p>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Mapa de procesos */}
        <section className="glass rounded-2xl p-5">
          <h2 className="mb-4 text-[15px] font-bold text-gold">
            Mapa de procesos
          </h2>
          <div className="grid gap-4 lg:grid-cols-[170px_minmax(0,1fr)_170px]">
            <div className="hidden flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-gold/80 to-gold-dark/80 p-4 text-center text-white lg:flex">
              <div className="text-[12px] font-bold uppercase leading-tight tracking-[0.09em]">
                Partes
                <br />
                interesadas
              </div>
              <ul className="flex w-full flex-col gap-2 text-[12px]">
                {["Clientes", "Personal", "Proveedores", "Organismos", "Comunidad"].map(
                  (x) => (
                    <li key={x} className="rounded-md bg-white/20 px-2 py-1">
                      {x}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.06em] text-gold">
                  Procesos estratégicos
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {ESTRATEGICOS.map(([t, c]) => (
                    <ProcessCard key={c} title={t} code={c} />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.06em] text-gold">
                  Procesos de realización (cadena de valor)
                </div>
                <div className="flex flex-wrap items-stretch gap-2">
                  <div className="flex min-w-[110px] flex-1 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 px-3 py-3 text-center text-[12.5px] font-bold text-amber-200">
                    Requisitos
                    <br />
                    del cliente
                  </div>
                  {REALIZACION.map(([t, c]) => (
                    <div key={c} className="flex flex-1 items-center gap-2">
                      <span className="text-gold">→</span>
                      <ProcessCard title={t} code={c} />
                    </div>
                  ))}
                  <span className="self-center text-gold">→</span>
                  <div className="flex min-w-[110px] flex-1 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 px-3 py-3 text-center text-[12.5px] font-bold text-amber-200">
                    Satisfacción
                    <br />
                    del cliente
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-[#0e1329] px-4 py-3 text-center">
                    <span className="text-[12.5px] text-slate-200">
                      Control de calidad{" "}
                      <span className="font-mono text-[10.5px] font-bold text-gold/80">
                        PO 05
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Laboratorio de Luján: materias primas, asentamiento,
                      probetas y rotura
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.06em] text-gold">
                  Procesos de apoyo
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {APOYO.map(([t, c]) => (
                    <ProcessCard key={c} title={t} code={c} />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.06em] text-gold">
                  Procesos de mejora
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {MEJORA.map(([t, c]) => (
                    <ProcessCard key={c} title={t} code={c} />
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-gold/80 to-gold-dark/80 p-4 text-center text-white lg:flex">
              <div className="text-[12px] font-bold uppercase leading-tight tracking-[0.09em]">
                Partes
                <br />
                interesadas
              </div>
              <ul className="flex w-full flex-col gap-2 text-[12px]">
                {["Clientes", "Personal", "Proveedores", "Organismos", "Comunidad"].map(
                  (x) => (
                    <li key={x} className="rounded-md bg-white/20 px-2 py-1">
                      {x}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Buscador y chips */}
        <section className="glass rounded-2xl p-4">
          <div className="relative mb-4">
            <i
              className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por código, nombre o carpeta (ej.: PG 06, mixer, auditoría)..."
              className="w-full rounded-lg border border-white/10 bg-[#0f172a] py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-gold/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATS.map(([key, label]) => {
              const count = key === "ALL" ? documentos.length : counts[key] ?? 0;
              const active = cat === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCat(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] transition ${
                    active
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-gold/40"
                  }`}
                >
                  {label}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
            <span className="ml-auto self-center text-xs text-slate-500">
              {filtered.length} de {documentos.length} archivos
            </span>
          </div>
        </section>

        {/* Árbol */}
        <section className="glass rounded-2xl p-4">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-sm text-slate-400">
              <i className="fa-solid fa-spinner fa-spin mr-2 text-gold" />
              Cargando mapa...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Sin resultados.
            </div>
          ) : (
            <div>{renderTree(tree, 0)}</div>
          )}
        </section>
      </div>

      {modalDoc && (
        <DocumentoModal documento={modalDoc} onClose={() => setModalDoc(null)} />
      )}
    </main>
  );
}
