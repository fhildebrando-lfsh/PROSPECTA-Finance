"use client";

import { useState } from "react";
import { saveHealthSnapshot } from "./actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";
import type { PsfIndicatorResult } from "@/lib/method/psf";

export function SaveSnapshotButton({
  indicators,
}: {
  indicators: {
    organizacao: PsfIndicatorResult;
    endividamento: PsfIndicatorResult;
    liquidez: PsfIndicatorResult;
    protecao: PsfIndicatorResult | null;
    construcao: PsfIndicatorResult | null;
  };
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleClick() {
    setSaving(true);
    try {
      await saveHealthSnapshot(indicators);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button type="button" disabled={saving} onClick={handleClick} className={BTN_SECONDARY}>
      {saved ? "Salvo!" : saving ? "Salvando…" : "Salvar no histórico"}
    </button>
  );
}
