"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#02040a] px-6 text-center text-white">
      <h1 className="text-2xl font-bold text-[#d4af37]">Algo salió mal</h1>
      <p className="max-w-md text-sm text-[#8b9bb4]">
        Ocurrió un error al cargar esta sección del portal.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-sm font-semibold text-[#d4af37] transition-colors hover:bg-[#d4af37]/20"
      >
        Reintentar
      </button>
    </main>
  );
}