import React, { createContext, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  ttlMs: number;
};

type ToastContextValue = {
  push: (t: Omit<Toast, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function remove(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function push(t: Omit<Toast, "id">) {
    const id = uid();
    const toast: Toast = { ...t, id };
    setToasts((prev) => [toast, ...prev].slice(0, 5));

    window.setTimeout(() => remove(id), toast.ttlMs);
  }

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message, title) => push({ type: "success", message, title, ttlMs: 2200 }),
      error: (message, title) => push({ type: "error", message, title, ttlMs: 3500 }),
      info: (message, title) => push({ type: "info", message, title, ttlMs: 2600 }),
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* container */}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} role="status">
            <div className="toast__content">
              {t.title && <div className="toast__title">{t.title}</div>}
              <div className="toast__message">{t.message}</div>
            </div>
            <button className="toast__close" onClick={() => remove(t.id)} aria-label="Close">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
