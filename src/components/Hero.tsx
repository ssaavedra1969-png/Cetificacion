"use client";

import Link from "next/link";
import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const highlights = [
  { icon: "fa-shield-halved", label: "Trazabilidad ISO 9001" },
  { icon: "fa-industry", label: "Luján + Campana" },
  { icon: "fa-folder-tree", label: "Documentación centralizada" },
];

const mockStatuses = [
  { label: "Completados", value: 12, tone: "bg-emerald-400" },
  { label: "En curso", value: 5, tone: "bg-cyan-400" },
  { label: "Pendientes", value: 4, tone: "bg-amber-400" },
];

const mockRows = [
  {
    title: "Registro de calibración",
    state: "Completado",
    classes: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  },
  {
    title: "Plan de muestreo 2026",
    state: "En curso",
    classes: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  },
  {
    title: "Layout de Luján",
    state: "Pendiente",
    classes: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  },
];

export default function Hero() {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    cardRef.current?.style.setProperty("--rx", `${y * -7}deg`);
    cardRef.current?.style.setProperty("--ry", `${x * 9}deg`);
  };

  const resetTilt = () => {
    cardRef.current?.style.setProperty("--rx", "0deg");
    cardRef.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <section className="relative overflow-hidden border-b border-slate-800/80 bg-slate-950">
      <div
        className="hero-glow pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_45%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <div className="animate-rise min-w-0">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            Grupo Falpat SRL · Sistema de Gestión de la Calidad
          </span>

          <h1 className="font-display mt-6 max-w-2xl text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-metal">Certificación industrial</span>{" "}
            <span className="text-metal-warm neon-gold">
              sin margen de error.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Centralizá la agenda de certificación, los documentos críticos y el
            avance de cada tema de{" "}
            <span className="font-semibold text-slate-100">
              Grupo Falpat SRL
            </span>{" "}
            en un solo tablero. Menos planillas sueltas, más control operativo
            para las plantas de Luján y Campana.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {highlights.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.8)] backdrop-blur-xl"
              >
                <i
                  className={`fa-solid ${item.icon} text-[11px] text-amber-400`}
                  aria-hidden="true"
                />
                {item.label}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#agenda"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_16px_40px_-12px_rgba(245,158,11,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-12px_rgba(245,158,11,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <span
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                aria-hidden="true"
              />
              <i
                className="fa-solid fa-list-check transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                aria-hidden="true"
              />
              Ver agenda
              <i
                className="fa-solid fa-arrow-right text-xs transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>

            <Link
              href="/documentoteca"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-200 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <i
                className="fa-solid fa-folder-open text-amber-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                aria-hidden="true"
              />
              Explorar Documentoteca
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:justify-self-end">
          <div
            className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_45%,rgba(245,158,11,0.32),rgba(234,88,12,0.14)_38%,transparent_70%)] blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-amber-300/30 via-white/5 to-orange-500/20 opacity-80 blur-[2px]"
            aria-hidden="true"
          />

          <div className="animate-float">
            <div
              ref={cardRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={resetTilt}
              onPointerCancel={resetTilt}
              style={{
                transform:
                  "perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
              }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_45px_120px_-35px_rgba(0,0,0,1)] backdrop-blur-2xl transition-transform duration-300 ease-out will-change-transform sm:p-5"
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.09),transparent_45%)]"
                aria-hidden="true"
              />

              <div className="relative flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Panel SGC
                </span>
              </div>

              <div className="relative mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-400/80">
                    Certificación en curso
                  </p>
                  <p className="font-display mt-1 text-lg font-bold text-slate-100">
                    Planta Campana
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 shadow-[0_0_18px_-6px_rgba(16,185,129,0.7)]">
                  <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  En línea
                </span>
              </div>

              <div className="relative mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-200">
                    Avance general
                  </span>
                  <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                    76%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                </div>
              </div>

              <div className="relative mt-3 grid grid-cols-3 gap-2">
                {mockStatuses.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-white/10 bg-slate-950/50 p-2.5"
                  >
                    <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${item.tone}`}
                      />
                      {item.label}
                    </span>
                    <p className="font-display mt-1 text-lg font-bold text-slate-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="relative mt-3 space-y-2">
                {mockRows.map((row) => (
                  <div
                    key={row.title}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-slate-950/40 px-3 py-2"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <i
                        className="fa-solid fa-file-lines text-[10px] text-slate-500"
                        aria-hidden="true"
                      />
                      <span className="truncate text-[11px] font-medium text-slate-300">
                        {row.title}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${row.classes}`}
                    >
                      {row.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -left-3 top-14 hidden rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-[10px] font-medium text-slate-300 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:block">
            <i
              className="fa-solid fa-shield-halved mr-1.5 text-emerald-400"
              aria-hidden="true"
            />
            ISO 9001
          </div>
          <div className="pointer-events-none absolute -right-3 bottom-16 hidden rounded-xl border border-amber-400/20 bg-slate-900/80 px-3 py-2 text-[10px] font-medium text-amber-200 shadow-[0_18px_40px_-18px_rgba(245,158,11,0.45)] backdrop-blur-xl sm:block">
            <i
              className="fa-solid fa-bolt mr-1.5 text-amber-400"
              aria-hidden="true"
            />
            Datos en tiempo real
          </div>
        </div>
      </div>
    </section>
  );
}
