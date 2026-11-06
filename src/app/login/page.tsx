"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        window.location.href = "/administracion";
      } else {
        setError(data.error || "Contraseña incorrecta");
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-gold/10 via-transparent to-blue-600/10 blur-2xl"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
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
          <h1 className="font-display mt-5 text-3xl font-bold tracking-tight text-white">
            Acceso administrativo
          </h1>
          <p className="mt-2 text-sm text-[#9fb0c9]">
            Ingresá la contraseña para administrar el sistema.
          </p>
        </div>

        <div className="glass rounded-2xl p-7">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm text-red-300">
              <i
                className="fa-solid fa-triangle-exclamation"
                aria-hidden="true"
              />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9fb0c9]">
                Contraseña
              </label>
              <div className="relative">
                <i
                  className="fa-solid fa-lock pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6f7f99]"
                  aria-hidden="true"
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#0a0e17] py-2.5 pl-9 pr-3 text-sm text-white placeholder-[#5a6a82] outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-bold text-[#1a1405] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
              ) : (
                <i
                  className="fa-solid fa-arrow-right-to-bracket"
                  aria-hidden="true"
                />
              )}
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-[#6f7f99]">
            Contraseña por defecto:{" "}
            <code className="font-medium text-gold">falpat-admin-2026</code>
          </p>
        </div>
      </div>
    </main>
  );
}
