import Image from "next/image";

const services = [
  { icon: "fa-flask-vial", label: "Laboratorio propio" },
  { icon: "fa-truck-front", label: "Mixers y bombas" },
  { icon: "fa-trowel-bricks", label: "Entrega en obra" },
];

export default function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-12 sm:px-6 lg:px-8 lg:pt-20 lg:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
          {/* ===== Columna izquierda: copy + CTA ===== */}
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              <i className="fa-solid fa-truck-front" aria-hidden="true" />
              Hormigones · Grupo Falpat SRL
            </span>

            <h1 className="font-display mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Hormigón de calidad
              <span className="mt-1 block text-brand-gradient neon-gold">
                con el mayor respaldo.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#9fb0c9] sm:text-lg">
              Elaboración, venta y entrega de hormigón en obra desde nuestras
              plantas de{" "}
              <span className="font-semibold text-white">Luján y Campana</span>.
              Este portal centraliza el Sistema de Gestión de Calidad: agenda de
              acciones, ensayos de laboratorio y evidencias de cada despacho.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#agenda"
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-6 py-3.5 text-sm font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-8px_rgba(212,175,55,0.75)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#02040a]"
              >
                <i
                  className="fa-solid fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
                Explorar agenda SGC
              </a>

              <a
                href="/documentoteca"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/25 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <i
                  className="fa-solid fa-folder-open text-gold"
                  aria-hidden="true"
                />
                Ver documentoteca
              </a>
            </div>

            {/* Servicios de la empresa */}
            <ul className="mt-6 flex flex-wrap gap-2">
              {services.map((service) => (
                <li
                  key={service.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#c3cfe2]"
                >
                  <i
                    className={`fa-solid ${service.icon} text-[11px] text-gold`}
                    aria-hidden="true"
                  />
                  {service.label}
                </li>
              ))}
            </ul>

            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-[#6f7f99]">
                  Puntos SGC
                </dt>
                <dd className="font-display mt-1 text-2xl font-bold text-white">
                  10
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-[#6f7f99]">
                  Plantas
                </dt>
                <dd className="font-display mt-1 flex items-baseline gap-1.5 text-2xl font-bold text-white">
                  2
                  <span className="text-[10px] font-medium uppercase tracking-wide text-[#6f7f99]">
                    Luján · Campana
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-[#6f7f99]">
                  Trazabilidad
                </dt>
                <dd className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-white">
                  100%
                  <i
                    className="fa-solid fa-circle-check text-base text-emerald-400"
                    aria-hidden="true"
                  />
                </dd>
              </div>
            </dl>
          </div>

          {/* ===== Columna derecha: mockup de la app ===== */}
          <div className="relative animate-rise [animation-delay:120ms]">
            {/* Halo decorativo */}
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-gold/15 via-transparent to-blue-500/20 blur-2xl"
            />

            {/* Tarjeta mockup */}
            <div className="glass relative rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/logo-falpat.png"
                    alt="Grupo Falpat Hormigones"
                    width={160}
                    height={83}
                    className="h-8 w-auto"
                    priority
                  />
                  <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-[#7f8ea8] sm:inline">
                    Panel SGC
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
                  En vivo
                </span>
              </div>

              {/* Mini KPIs */}
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#7f8ea8]">
                    Pendientes
                  </p>
                  <p className="font-display mt-1 text-xl font-bold text-amber-300">
                    10
                  </p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#7f8ea8]">
                    En curso
                  </p>
                  <p className="font-display mt-1 text-xl font-bold text-blue-300">
                    0
                  </p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#7f8ea8]">
                    Avance
                  </p>
                  <p className="font-display mt-1 text-xl font-bold text-emerald-300">
                    0%
                  </p>
                </div>
              </div>

              {/* Barra de avance */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-[#7f8ea8]">
                  <span>Avance general del SGC</span>
                  <span className="font-semibold text-white">0%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/8">
                  <div className="h-full w-[6%] rounded-full bg-gradient-to-r from-gold to-gold-dark" />
                </div>
              </div>

              {/* Lista de puntos */}
              <ul className="mt-4 space-y-2">
                {[
                  {
                    icon: "fa-flask-vial",
                    title: "Muestras de hormigón",
                    pill: "Pendiente",
                    tone: "text-gray-300 border-white/15 bg-white/5",
                  },
                  {
                    icon: "fa-scale-balanced",
                    title: "Calibración de balanzas",
                    pill: "Alta",
                    tone: "text-amber-300 border-amber-400/25 bg-amber-400/10",
                  },
                  {
                    icon: "fa-road",
                    title: "Layout de planta",
                    pill: "Media",
                    tone: "text-blue-300 border-blue-400/25 bg-blue-400/10",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2.5 text-xs text-[#cdd6e6]">
                      <i
                        className={`fa-solid ${item.icon} text-gold/90`}
                        aria-hidden="true"
                      />
                      {item.title}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${item.tone}`}
                    >
                      {item.pill}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] uppercase tracking-wider text-[#6f7f99]">
                <span>Actualizado hoy</span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                  Datos protegidos
                </span>
              </div>
            </div>

            {/* Badge flotante */}
            <div className="absolute -right-3 -top-4 hidden animate-float rounded-xl border border-gold/30 bg-[#0a0e17]/90 px-3.5 py-2.5 shadow-xl backdrop-blur sm:block">
              <div className="flex items-center gap-2">
                <i
                  className="fa-solid fa-certificate text-gold"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#7f8ea8]">
                    Certificación
                  </p>
                  <p className="text-xs font-semibold text-white">En curso</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
