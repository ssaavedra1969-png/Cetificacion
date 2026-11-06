import { Suspense } from "react";
import DocumentoViewer from "@/components/DocumentoViewer";

function Cargando() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#02040a]">
      <span className="inline-flex items-center gap-2 text-sm text-[#9fb0c9]">
        <i
          className="fa-solid fa-spinner fa-spin text-gold"
          aria-hidden="true"
        />
        Cargando documento...
      </span>
    </main>
  );
}

export default function DocumentoPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <DocumentoViewer />
    </Suspense>
  );
}