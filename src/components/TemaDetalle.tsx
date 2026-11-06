"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Documento, PuntoSGC } from "@/types/models";

const estadoClasses: Record<PuntoSGC["estado"], string> = {
  Pendiente: "border-slate-400/25 bg-slate-400/10 text-slate-300",
  "En curso": "border-blue-400/30 bg-blue-400/10 text-blue-300",
  Bloqueado: "border-red-400/30 bg-red-400/10 text-red-300",
  Completado: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

const tipoIcon: Record<Documento["tipo"], string> = {
  pdf: "fa-file-pdf",
  imagen: "fa-file-image",
  otro: "fa-file",
};

interface Props {
  id: string;
}

export default function TemaDetalle({ id }: Props) {
  const [punto, setPunto] = useState<PuntoSGC | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [ruta, setRuta] = useState("");
  const [version, setVersion] = useState("1.0");
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const fetchTema = useCallback(async () => {
    const [agendaRes, docsRes, sessionRes] = await Promise.all([
      fetch("/api/agenda"),
      fetch("/api/documentos"),
      fetch("/api/session"),
    ]);
    const agenda = agendaRes.ok ? await agendaRes.json() : { puntos: [] };
    const docs = docsRes.ok ? await docsRes.json() : { documentos: [] };
    const session = sessionRes.ok
      ? await sessionRes.json()
      : { authenticated: false };

    const encontrado =
      ((agenda.puntos ?? []) as PuntoSGC[]).find((p) => p.id === id) ?? null;

    return {
      punto: encontrado,
      documentos: (docs.documentos ?? []) as Documento[],
      categorias: (docs.categorias ?? []) as string[],
      auth: Boolean(session.authenticated),
    };
  }, [id]);

  useEffect(() => {
    let activo = true;
    fetchTema()
      .then((data) => {
        if (!activo) return;
        setPunto(data.punto);
        setDocumentos(data.documentos);
        setCategorias(data.categorias);
        setAuth(data.auth);
        setCategoria((prev) => prev || data.punto?.categoria || "");
      })
      .catch(() => {
        if (activo) setError("No se pudo cargar la información del tema.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, [fetchTema]);

  const recargar = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTema();
      setPunto(data.punto);
      setDocumentos(data.documentos);
      setCategorias(data.categorias);
      setAuth(data.auth);
    } catch {
      setError("No se pudo cargar la información del tema.");
    } finally {
      setLoading(false);
    }
  }, [fetchTema]);

  const docsDelTema = useMemo(() => {
    if (!punto) return [] as Documento[];
    const ids = new Set(punto.documentosIds ?? []);
    return documentos.filter((d) => d.puntoId === punto.id || ids.has(d.id));
  }, [documentos, punto]);

  const anexar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (!nombre.trim()) {
      setMensaje({ type: "error", text: "Ingresá un nombre para el documento" });
      return;
    }
    if (!ruta.trim()) {
      setMensaje({
        type: "error",
        text: "Ingresá la ruta del archivo en el compartido o una URL",
      });
      return;
    }

    setEnviando(true);
    setMensaje({ type: "info", text: "Anexando documento..." });
    try {
      const res = await fetch("/api/anexar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puntoId: id,
          nombre,
          ruta,
          version,
          categoria,
          descripcion,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) setAuth(false);
        setMensaje({
          type: "error",
          text: data.error || "No se pudo anexar el documento",
        });
        return;
      }

      setNombre("");
      setRuta("");
      setDescripcion("");
      setVersion("1.0");
      setMensaje({ type: "success", text: "Documento anexado correctamente" });
      await recargar();
    } catch {
      setMensaje({ type: "error", text: "Error de conexión al anexar" });
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-[#9fb0c9]">
          <i
            className="fa-solid fa-spinner fa-spin text-gold"
            aria-hidden="true"
          />
          Cargando tema...
        </span>
      </main>
    );
  }

  if (error || !punto) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <i
          className="fa-solid fa-triangle-exclamation text-3xl text-gold"
          aria-hidden="true"
        />
        <p className="text-white">
          {error ?? "No se encontró el tema solicitado."}
        </p>
        <Link
          href="/"
          className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
        >
          Volver al portal
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#02040a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#9fb0c9] transition-colors hover:text-white"
          >
            <i
              className="fa-solid fa-arrow-left text-gold"
              aria-hidden="true"
            />
            Volver al portal
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            {punto.id}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Ficha del tema */}
        <section className="glass rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7f99]">
                Tema {punto.id}
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {punto.titulo}
              </h1>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${estadoClasses[punto.estado]}`}
            >
              {punto.estado}
            </span>
          </div>

          {punto.descripcion && (
            <p className="mt-4 text-sm leading-relaxed text-[#9fb0c9]">
              {punto.descripcion}
            </p>
          )}

          <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Categoría
              </dt>
              <dd className="mt-1 text-[#c7d2e3]">{punto.categoria || "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Plantas
              </dt>
              <dd className="mt-1 text-[#c7d2e3]">
                {punto.plantas?.length ? punto.plantas.join(" · ") : "General"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Responsable
              </dt>
              <dd className="mt-1 text-[#c7d2e3]">
                {punto.responsable || "A definir"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Prioridad
              </dt>
              <dd className="mt-1 capitalize text-[#c7d2e3]">
                {punto.prioridad}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Fecha compromiso
              </dt>
              <dd className="mt-1 text-[#c7d2e3]">
                {punto.fechaCompromiso?.slice(0, 10) || "Sin definir"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Última actualización
              </dt>
              <dd className="mt-1 text-[#c7d2e3]">
                {punto.fechaActualizacion
                  ? new Date(punto.fechaActualizacion).toLocaleString("es-AR")
                  : "—"}
              </dd>
            </div>
          </dl>

          {punto.notas && (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f7f99]">
                Notas
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-[#c7d2e3]">
                {punto.notas}
              </p>
            </div>
          )}
        </section>

        {/* Documentos anexados */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-white">
              Documentos anexados
            </h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-[#9fb0c9]">
              {docsDelTema.length}
            </span>
          </div>

          {docsDelTema.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <i
                className="fa-solid fa-folder-open mb-3 text-3xl text-gold/60"
                aria-hidden="true"
              />
              <p className="text-sm text-[#9fb0c9]">
                Este tema todavía no tiene documentos anexados.
              </p>
            </div>
          ) : (
            <ul className="glass divide-y divide-white/[0.06] rounded-2xl">
              {docsDelTema.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/documentos/${d.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <i
                        className={`fa-solid ${tipoIcon[d.tipo]} `}
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
                      Abrir
                      <i
                        className="fa-solid fa-chevron-right ml-1 text-[10px]"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Anexar (solo admin) */}
        <section className="mt-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold text-white">
              Anexar documento
            </h2>
            {!auth ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#9fb0c9]">
                <i className="fa-solid fa-lock text-gold" aria-hidden="true" />
                Necesitás iniciar sesión como administrador para anexar
                documentos.
                <Link
                  href="/administracion"
                  className="font-semibold text-gold hover:text-amber-200"
                >
                  Iniciar sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={anexar} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Nombre del documento
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Certificado balanza 01/2026"
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Ruta en el compartido o URL
                  </label>
                  <input
                    type="text"
                    value={ruta}
                    onChange={(e) => setRuta(e.target.value)}
                    placeholder={"\\\\SRV-FALPAT\\SGC\\P001\\certificado.pdf"}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                  <p className="mt-1 text-[10px] text-[#6f7f99]">
                    Se acepta PDF o imagen dentro de la carpeta configurada, o
                    una URL https.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    list="categorias-tema"
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                  <datalist id="categorias-tema">
                    {categorias.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Versión
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                {mensaje && (
                  <div
                    className={`md:col-span-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      mensaje.type === "success"
                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                        : mensaje.type === "info"
                          ? "border-blue-400/25 bg-blue-400/10 text-blue-300"
                          : "border-red-400/25 bg-red-400/10 text-red-300"
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        mensaje.type === "success"
                          ? "fa-circle-check"
                          : mensaje.type === "info"
                            ? "fa-circle-info"
                            : "fa-triangle-exclamation"
                      }`}
                      aria-hidden="true"
                    />
                    {mensaje.text}
                  </div>
                )}

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={enviando}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <i
                      className={`fa-solid ${enviando ? "fa-spinner fa-spin" : "fa-paperclip"}`}
                      aria-hidden="true"
                    />
                    {enviando ? "Anexando..." : "Anexar documento"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Historial */}
        <section className="mt-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-white">
              Historial de cambios
            </h2>
            {punto.historial?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
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
              <p className="py-4 text-center text-sm text-[#6f7f99]">
                Sin historial de cambios aún.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}