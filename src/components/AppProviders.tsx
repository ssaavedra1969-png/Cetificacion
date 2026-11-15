"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";

interface ToastItem {
  id: number;
  text: string;
}

interface AppCtx {
  auditMode: boolean;
  setAuditMode: (v: boolean) => void;
  showToast: (text: string) => void;
  toasts: ToastItem[];
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [auditMode, setAuditMode] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  return (
    <Ctx.Provider value={{ auditMode, setAuditMode, showToast, toasts }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-xl border border-emerald-400/30 bg-[#0a0f1e]/95 px-4 py-2.5 text-sm font-medium text-emerald-300 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-rise"
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProviders");
  return c;
}
