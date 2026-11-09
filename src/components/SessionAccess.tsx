"use client";

import Link from "next/link";
import { useSession } from "@/components/useSession";

interface Props {
  compact?: boolean;
  className?: string;
}

const base =
  "inline-flex items-center justify-center rounded-full border border-white/10 bg-slate-900/70 font-semibold text-slate-200 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors";

export default function SessionAccess({
  compact = false,
  className = "",
}: Props) {
  const { user, loading, canEdit } = useSession();

  if (loading) return null;

  const size = compact
    ? "h-9 w-9 rounded-lg text-xs"
    : "gap-2 px-3.5 py-2 text-xs";
  const classes = `${base} ${size} ${className}`.trim();

  if (!user) {
    return (
      <Link
        href="/login?next=/administracion"
        aria-label="Acceso"
        title="Acceso"
        className={`${classes} hover:border-amber-400/40 hover:text-amber-200`}
      >
        <i className="fa-solid fa-lock text-[11px]" aria-hidden="true" />
        {!compact && <span>Acceso</span>}
      </Link>
    );
  }

  if (!canEdit) {
    return (
      <span
        aria-label="Modo lectura"
        title="Modo lectura"
        className={`${classes} text-slate-400`}
      >
        <i className="fa-solid fa-book-open text-[11px]" aria-hidden="true" />
        {!compact && <span>Modo lectura</span>}
      </span>
    );
  }

  return (
    <Link
      href="/administracion"
      aria-label="Administración"
      title="Administración"
      className={`${classes} hover:border-amber-400/40 hover:text-amber-200`}
    >
      <i className="fa-solid fa-sliders text-[11px]" aria-hidden="true" />
      {!compact && <span>Administración</span>}
    </Link>
  );
}
