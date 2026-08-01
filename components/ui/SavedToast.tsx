"use client";

import { useRef, useState } from "react";

/** Popup "Salvo" reutilizado por toda tabela com edição em linha (Cadastros). */
export function useSavedToast() {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), 2000);
  }

  const toast = visible ? (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-black/40">
      Salvo
    </div>
  ) : null;

  return { toast, notify };
}
