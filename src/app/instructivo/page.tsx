"use client";

import { useEffect, useState } from "react";
import Markdown from "@/components/Markdown";

const META = [
  { label: "Sitio", value: "certificacion.vercel.app", icon: "fa-globe" },
  { label: "Versión", value: "1.0 · Nov 2026", icon: "fa-code-branch" },
  { label: "Empresa", value: "Grupo Falpat S.R.L.", icon: "fa-building" },
  { label: "Norma", value: "ISO 9001:2026", icon: "fa-certificate" },
];

const ROLES = [
  { rol: "Lector", ver: true, subir: false, temas: false, plan: false, eliminar: false },
  { rol: "Editor", ver: true, subir: true, temas: true, plan: true, eliminar: false },
  { rol: "Administrador", ver: true, subir: true, temas: true, plan: true, eliminar: true },
];

function Check({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${ok ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
      <i className={`fa-solid ${ok ? "fa-check" : "fa-xmark"} text-[11px]`} aria-hidden="true" />
    </span>
  );
}

const NAV = [
  { id: "sec-acceso", label: "1. Acceso" },
  { id: "sec-navegacion", label: "2. Navegación" },
  { id: "sec-roles", label: "Roles" },
  { id: "sec-documentoteca", label: "3. Documentoteca" },
  { id: "sec-administracion", label: "4. Administración" },
  { id: "sec-plan", label: "5. Plan" },
  { id: "sec-mapa", label: "6. Mapa SGC" },
  { id: "sec-limites", label: "7. Buenas prácticas" },
  { id: "sec-problemas", label: "8. Problemas" },
];

function Card({ id, n, icon, title, children, span = false }: { id: string; n: string; icon: string; title: string; children: React.ReactNode; span?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onExpand = () => setOpen(true);
    const onCollapse = () => setOpen(false);
    window.addEventListener("instructivo:expand", onExpand);
    window.addEventListener("instructivo:collapse", onCollapse);
    return () => {
      window.removeEventListener("instructivo:expand", onExpand);
      window.removeEventListener("instructivo:collapse", onCollapse);
    };
  }, []);
  return (
    <section id={id} className={`glass rounded-2xl p-6 scroll-mt-20 card-hover ${span ? "lg:col-span-2" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-4 flex w-full items-center gap-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 font-mono-code text-sm font-bold text-gold">{n}</span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-gold">
          <i className={`fa-solid ${icon} text-sm`} aria-hidden="true" />
        </span>
        <h2 className="flex-1 text-lg font-bold text-white">{title}</h2>
        <i className={`fa-solid ${open ? "fa-chevron-down" : "fa-chevron-right"} text-xs text-gold`} aria-hidden="true" />
      </button>
      {open && children}
    </section>
  );
}

export default function InstructivoPage() {
  const [md, setMd] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/manual.md", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => setMd(t))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              <i className="fa-solid fa-book" aria-hidden="true" />
              Manual de usuario
            </span>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Instructivo de uso del Portal SGC
            </h1>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Guía detallada de acceso, roles, permisos, documentoteca, administración, plan de trabajo y mapa SGC.
            </p>
          </div>
        </header>

        {/* Metadata bar */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {META.map((m) => (
            <div key={m.label} className="glass flex items-center gap-3 rounded-xl px-4 py-3 card-hover">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-gold">
                <i className={`fa-solid ${m.icon} text-sm`} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">{m.label}</p>
                <p className="truncate font-mono-code text-sm font-semibold text-gold">{m.value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Quick nav chips */}
        <nav className="flex flex-wrap gap-2">
          {NAV.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-gold/40 hover:text-gold">
              {c.label}
            </a>
          ))}
        </nav>

        <div className="mb-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("instructivo:expand"))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#94a3b8] hover:text-white"
          >
            Expandir todo
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("instructivo:collapse"))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#94a3b8] hover:text-white"
          >
            Contraer todo
          </button>
        </div>

        {/* Grid */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* 01 Acceso */}
          <Card id="sec-acceso" n="01" icon="fa-right-to-bracket" title="Acceso al sistema">
            <ol className="space-y-2 text-[13px] text-slate-200">
              <li className="flex gap-2"><span className="font-bold text-gold">1.</span> Ingresá a <code className="rounded bg-white/10 px-1 font-mono-code text-gold">certificacion.vercel.app</code></li>
              <li className="flex gap-2"><span className="font-bold text-gold">2.</span> Hacé clic en <strong>Ingresar</strong> (esquina superior derecha).</li>
              <li className="flex gap-2"><span className="font-bold text-gold">3.</span> Ingresá tu usuario y contraseña.</li>
              <li className="flex gap-2"><span className="font-bold text-gold">4.</span> La sesión se mantiene mediante cookie segura <code className="rounded bg-white/10 px-1 font-mono-code text-gold">sgc_session</code>.</li>
            </ol>
          </Card>

          {/* 02 Navegación */}
          <Card id="sec-navegacion" n="02" icon="fa-compass" title="Navegación">
            <ul className="space-y-1.5 text-[13px] text-slate-200">
              <li><strong className="text-white">Inicio</strong> — panel principal con accesos rápidos.</li>
              <li><strong className="text-white">Documentoteca SGC</strong> — repositorio central de documentos.</li>
              <li><strong className="text-white">Mapa SGC</strong> — mapa de procesos + árbol de documentos.</li>
              <li><strong className="text-white">Plan de Trabajo</strong> — línea de tiempo (Gantt) de implementación ISO 9001:2026.</li>
              <li><strong className="text-white">Administración</strong> — gestión de temas y documentos (solo editores/admin).</li>
              <li><strong className="text-white">Instructivo</strong> — este manual.</li>
            </ul>
          </Card>

          {/* Roles y permisos — full width */}
          <section id="sec-roles" className="glass rounded-2xl p-6 scroll-mt-20 card-hover lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 font-mono-code text-sm font-bold text-gold">R</span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-gold">
                <i className="fa-solid fa-user-shield text-sm" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">Roles y permisos</h2>
                <p className="text-[11px] text-[#64748b]">Permisos por rol sobre documentos, temas, plan y eliminación.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-4 py-3 text-left font-semibold text-gold">Rol</th>
                    <th className="px-4 py-3 text-center font-semibold text-gold">Ver docs</th>
                    <th className="px-4 py-3 text-center font-semibold text-gold">Subir/editar</th>
                    <th className="px-4 py-3 text-center font-semibold text-gold">Temas</th>
                    <th className="px-4 py-3 text-center font-semibold text-gold">Plan</th>
                    <th className="px-4 py-3 text-center font-semibold text-gold">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map((r) => (
                    <tr key={r.rol} className="border-b border-white/[0.06] transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-semibold text-white">{r.rol}</td>
                      <td className="px-4 py-3 text-center"><Check ok={r.ver} /></td>
                      <td className="px-4 py-3 text-center"><Check ok={r.subir} /></td>
                      <td className="px-4 py-3 text-center"><Check ok={r.temas} /></td>
                      <td className="px-4 py-3 text-center"><Check ok={r.plan} /></td>
                      <td className="px-4 py-3 text-center"><Check ok={r.eliminar} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid gap-2 text-[12px] text-[#94a3b8] sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <strong className="text-white">Plantas:</strong> Campana, Luján, General. Un editor solo modifica documentos de sus plantas asignadas (o General).
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <strong className="text-white">Admin:</strong> acceso total, incluyendo eliminar documentos y temas.
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <strong className="text-white">Sin permiso:</strong> HTTP 403 "No tenés permisos para modificar documentos".
              </div>
            </div>
          </section>

          {/* 03 Documentoteca — full width */}
          <Card id="sec-documentoteca" n="03" icon="fa-folder-open" title="Documentoteca SGC" span>
            <p className="mb-3 text-[12px] text-[#64748b]">URL: /documentoteca</p>
            <div className="grid gap-4 md:grid-cols-3 text-[13px] text-slate-200">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <strong className="text-white">Consultar:</strong> 10 categorías, buscador por nombre/categoría/planta/responsable, filtros por planta y tipo de archivo.
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <strong className="text-white">Acciones:</strong> 👁 Ver · 📄 PDF · ⬇ Descargar · ✏ Editar · 📦 Obsoletos · 🗑 Eliminar.
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <strong className="text-white">Editar:</strong> clic en ✏ → Administración con formulario cargado. Reemplazar archivo (máx. 4 MB) o pegar enlace externo (Drive).
              </div>
            </div>
          </Card>

          {/* 04 Administración */}
          <Card id="sec-administracion" n="04" icon="fa-sliders" title="Administración SGC">
            <p className="mb-3 text-[12px] text-[#64748b]">URL: /administracion (requiere editor o admin)</p>
            <div className="space-y-2 text-[13px] text-slate-200">
              <div><strong className="text-white">Temas:</strong> grilla de tarjetas (P001..P028). Clic para editar. + Adjuntar doc sube un documento vinculado. + Nuevo tema crea uno nuevo.</div>
              <div><strong className="text-white">Documentos:</strong> subir (arrastrar o explorar, máx. 4 MB), editar, eliminar (solo admin), filtros por búsqueda/planta/tipo.</div>
              <div><strong className="text-white">Enlace externo:</strong> si el archivo supera 4 MB o está en Drive, pegá la URL pública en "O enlace externo".</div>
            </div>
          </Card>

          {/* 05 Plan de Trabajo */}
          <Card id="sec-plan" n="05" icon="fa-chart-gantt" title="Plan de Trabajo">
            <p className="mb-3 text-[12px] text-[#64748b]">URL: /plan</p>
            <div className="space-y-2 text-[13px] text-slate-200">
              <div><strong className="text-white">Lectura:</strong> KPIs (avance, terminadas, en curso, pendientes, bloqueadas, atrasadas). Sección "Atención" (atrasadas + esta semana). Bloques colapsables con tareas. Gantt arriba con barras, hoy, leyenda.</div>
              <div><strong className="text-white">Edición (editores/admin):</strong> "Editar estructura" (tabla). Edición rápida por tarea (modal ✏). Marcar terminada (✓). Ciclar estado (clic en píldora).</div>
              <div><strong className="text-white">Permisos:</strong> ver todos; editar solo editores/admin.</div>
            </div>
          </Card>

          {/* 06 Mapa SGC */}
          <Card id="sec-mapa" n="06" icon="fa-sitemap" title="Mapa SGC">
            <p className="mb-3 text-[12px] text-[#64748b]">URL: /mapa</p>
            <div className="space-y-2 text-[13px] text-slate-200">
              <div><strong className="text-white">Mapa de procesos:</strong> tarjetas de procesos estratégicos, realización y apoyo. Clic para filtrar el árbol por código.</div>
              <div><strong className="text-white">Filtros (chips):</strong> Todos, Manual, Documentos de Calidad, etc. El árbol siempre muestra todos; el filtro marca en cyan los que coinciden y atenúa el resto.</div>
              <div><strong className="text-white">Botón Limpiar:</strong> restablece categoría y búsqueda. Búsqueda por código, nombre o carpeta.</div>
            </div>
          </Card>

          {/* 07 Límites */}
          <Card id="sec-limites" n="07" icon="fa-triangle-exclamation" title="Carga de documentos — límites y buenas prácticas">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-[13px] text-slate-200">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <strong className="text-white">Tamaño máx.:</strong> 4 MB por subida (límite de Vercel).
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <strong className="text-white">Tipos:</strong> PDF, Word, Excel, imágenes (png/jpg/webp/gif).
              </div>
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-200">
                <strong>Archivos grandes:</strong> subí a Drive y pegá el enlace en "O enlace externo".
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <strong className="text-white">Documentos actuales:</strong> 450, todos accesibles desde /api/files.
              </div>
            </div>
          </Card>

          {/* 08 Solución de problemas — full width */}
          <Card id="sec-problemas" n="08" icon="fa-wrench" title="Solución de problemas" span>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-3 py-2 text-left font-semibold text-gold">Problema</th>
                    <th className="px-3 py-2 text-left font-semibold text-gold">Causa</th>
                    <th className="px-3 py-2 text-left font-semibold text-gold">Solución</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  <tr className="border-b border-white/[0.06]"><td className="px-3 py-2">"No tenés permisos..."</td><td className="px-3 py-2">Rol lector o planta no asignada</td><td className="px-3 py-2">Pedí al admin el rol/planta correcta.</td></tr>
                  <tr className="border-b border-white/[0.06]"><td className="px-3 py-2">Botón ✏ no aparece</td><td className="px-3 py-2">Rol lector</td><td className="px-3 py-2">Iniciá sesión como editor/admin.</td></tr>
                  <tr className="border-b border-white/[0.06]"><td className="px-3 py-2">"Archivo supera 4 MB"</td><td className="px-3 py-2">Archivo muy grande</td><td className="px-3 py-2">Usá enlace externo (Drive) o comprimí.</td></tr>
                  <tr className="border-b border-white/[0.06]"><td className="px-3 py-2">No se abre el editor</td><td className="px-3 py-2">Navegación SPA</td><td className="px-3 py-2">Recargá Administración; se abre con ?doc=.</td></tr>
                  <tr className="border-b border-white/[0.06]"><td className="px-3 py-2">Plan no guarda</td><td className="px-3 py-2">Sesión expirada</td><td className="px-3 py-2">Volbé a ingresar.</td></tr>
                  <tr><td className="px-3 py-2">"Sin resultados" en Mapa</td><td className="px-3 py-2">Filtro restrictivo</td><td className="px-3 py-2">Usá "Limpiar".</td></tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* 9. Respaldos */}
        <Card id="sec-respaldos" n="09" icon="fa-database" title="Respaldos y versionado" span>
          <div className="space-y-2 text-[13px] text-slate-200">
            <p>Código y documentos versionados en GitHub: <code className="rounded bg-white/10 px-1 font-mono-code text-gold">github.com/ssaavedra1969-png/Cetificacion</code></p>
            <p>Ramas: <strong className="text-white">main</strong> (producción), <strong className="text-white">desarrollo</strong> (preview).</p>
            <p>Respaldos locales: carpeta <code className="rounded bg-white/10 px-1 font-mono-code text-gold">Manuales/</code> (original, no modificar).</p>
          </div>
        </Card>

        {/* Manual completo (markdown) colapsable */}
        <details className="glass rounded-2xl">
          <summary className="cursor-pointer list-none px-6 py-4 text-sm font-semibold text-gold">
            <i className="fa-solid fa-file-lines mr-2" aria-hidden="true" />
            Ver manual completo (texto original)
          </summary>
          <div className="border-t border-white/10 px-6 py-4">
            {loading && <p className="text-[#94a3b8]">Cargando…</p>}
            {error && <p className="text-rose-300">Error: {error}</p>}
            {!loading && !error && <Markdown source={md} />}
          </div>
        </details>
      </div>
    </main>
  );
}
