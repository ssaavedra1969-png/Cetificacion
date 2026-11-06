import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#02040a] px-6 text-center text-white">
      <h1 className="text-5xl font-bold text-[#d4af37]">404</h1>
      <p className="max-w-md text-sm text-[#8b9bb4]">
        La página que buscas no existe.
      </p>
      <Link
        href="/"
        className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-sm font-semibold text-[#d4af37] transition-colors hover:bg-[#d4af37]/20"
      >
        Volver al inicio
      </Link>
    </main>
  );
}