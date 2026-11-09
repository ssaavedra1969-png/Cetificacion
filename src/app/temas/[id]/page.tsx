import { Suspense } from "react";
import TemaPageClient from "@/components/TemaPageClient";

function Cargando() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617]">
      <span className="inline-flex items-center gap-2 text-sm text-[#94a3b8]">
        <i
          className="fa-solid fa-spinner fa-spin text-gold"
          aria-hidden="true"
        />
        Cargando tema...
      </span>
    </main>
  );
}

export default function TemaPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <TemaPageClient />
    </Suspense>
  );
}