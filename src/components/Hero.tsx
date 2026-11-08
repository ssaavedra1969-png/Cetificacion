import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div
        className="hero-glow pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              <i className="fa-solid fa-certificate" aria-hidden="true" />
              Sistema de Gestión de la Calidad
            </span>
            <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Portal SGC
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9fb0c9] sm:text-base">
              Agenda de certificación y documentoteca de{" "}
              <span className="font-semibold text-white">Grupo Falpat SRL</span>{" "}
              para las plantas de Luján y Campana.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="#agenda"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <i className="fa-solid fa-list-check" aria-hidden="true" />
              Ver agenda
            </a>
            <Link
              href="/documentoteca"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/25 hover:bg-white/10"
            >
              <i
                className="fa-solid fa-folder-open text-gold"
                aria-hidden="true"
              />
              Documentoteca
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
