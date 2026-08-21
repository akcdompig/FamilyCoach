"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface ToastItem {
  id: number;
  message: string;
  detail?: string;
}

const ToastContext = createContext<{ toast: (message: string, detail?: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, detail?: string) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, detail }]);
    setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="animate-pop pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-lift"
          >
            <span className="text-sm font-medium">{item.message}</span>
            {item.detail ? <span className="text-sm text-white/70">{item.detail}</span> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast moet binnen ToastProvider gebruikt worden");
  return context.toast;
}
