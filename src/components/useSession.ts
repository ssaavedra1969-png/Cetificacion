"use client";

import { useEffect, useState } from "react";
import type { Rol } from "@/types/models";

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  plantas: string[];
}

interface SessionResponse {
  authenticated: boolean;
  user?: SessionUser;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json() as Promise<SessionResponse>)
      .then((data) => {
        if (!activo) return;
        setUser(data.authenticated && data.user ? data.user : null);
      })
      .catch(() => {
        if (activo) setUser(null);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const canEdit = user?.rol === "admin" || user?.rol === "editor";

  return { user, loading, canEdit };
}
