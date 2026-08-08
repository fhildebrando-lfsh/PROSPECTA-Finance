"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextValue {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/** Estado do menu lateral no mobile (drawer) — compartilhado entre o botão
 * hambúrguer no header e o `Sidebar` em si, que vivem em pontos diferentes
 * da árvore. No desktop o `Sidebar` ignora esse estado (sempre visível). */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <SidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar precisa estar dentro de um SidebarProvider.");
  return ctx;
}
