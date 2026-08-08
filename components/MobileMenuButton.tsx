"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/components/SidebarContext";

export function MobileMenuButton() {
  const { setMobileOpen } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Abrir menu"
      className="shrink-0 rounded-lg p-2 text-indigo-200 transition-colors hover:bg-indigo-900/50 hover:text-white md:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
