"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * §21 — PWA instalável: banner próprio de instalação em vez de depender só do
 * mini-infobar nativo do navegador. Android/Chrome usa `beforeinstallprompt`
 * (API real de instalação); iOS Safari não expõe essa API, então mostra
 * instrução manual (Compartilhar → Adicionar à Tela de Início).
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIos()) {
      // Adiado para um callback (em vez de setState direto no corpo do efeito) —
      // evita o cascading render que a regra react-hooks/set-state-in-effect aponta.
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    // Sem cooldown persistido de propósito: fechar só esconde nesta visita — se o
    // usuário mudar de ideia, o banner volta a aparecer na próxima vez que abrir
    // /login (ainda não instalado), sem precisar esperar nenhum prazo.
    setVisible(false);
    setShowIosHint(false);
  }

  async function handleInstallClick() {
    if (isIos()) {
      setShowIosHint((v) => !v);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <div className="mb-4 w-full max-w-sm rounded-xl border border-amber-800/50 bg-amber-950/30 p-3 text-sm">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5 shrink-0 text-amber-400" />
        <div className="flex-1">
          <p className="font-medium text-amber-200">Instalar o app</p>
          <p className="text-xs text-amber-300/80">Acesso rápido direto da tela inicial do celular.</p>
        </div>
        <button
          type="button"
          onClick={handleInstallClick}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-amber-400"
        >
          Instalar
        </button>
        <button type="button" onClick={dismiss} aria-label="Fechar" className="text-amber-400/70 hover:text-amber-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      {showIosHint && (
        <p className="mt-2 flex items-center gap-1.5 border-t border-amber-800/50 pt-2 text-xs text-amber-300/80">
          Toque em <Share className="h-3.5 w-3.5" aria-hidden /> Compartilhar e depois em &ldquo;Adicionar à Tela de
          Início&rdquo;.
        </p>
      )}
    </div>
  );
}
