import Link from "next/link";

export default function Hero() {
  return (
    <div className="relative">
      <span className="inline-flex max-w-full items-start rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-[10px] font-light uppercase leading-relaxed tracking-wider text-slate-300 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:text-[11px]">
        <span className="mr-2 text-amber-400">•</span> GRUPO FALPAT SRL ·
        REPOSITORIO CENTRAL DE CERTIFICACIONES
      </span>

      <h1 className="font-display mt-6 w-full text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.6rem]">
        <span className="text-metal">Respaldo técnico y</span>{" "}
        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          validez normativa
        </span>{" "}
        <span className="text-metal">en un solo lugar.</span>
      </h1>

      <p className="mt-6 w-full text-base leading-relaxed text-slate-400 sm:text-lg">
        {
          "Accedé, gestioná y validá de forma centralizada toda la documentación oficial, normas IRAM y sistemas de gestión integrados de Grupo Falpat SRL. Menos burocracia, más transparencia técnica y control operativo inmediato para las plantas de Luján y Campana."
        }
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/documentoteca"
          className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 px-7 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <span
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            aria-hidden="true"
          />
          <span className="relative">Explorar Documentación</span>
          <i
            className="fa-solid fa-folder-open relative text-base transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
            aria-hidden="true"
          />
        </Link>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <i
              className="fa-solid fa-shield-halved text-emerald-400/80"
              aria-hidden="true"
            />
            Normas IRAM
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i
              className="fa-solid fa-circle-check text-amber-400/80"
              aria-hidden="true"
            />
            ISO 9001
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i
              className="fa-solid fa-industry text-cyan-400/80"
              aria-hidden="true"
            />
            Luján + Campana
          </span>
        </div>
      </div>
    </div>
  );
}
