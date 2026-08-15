"use client";

import { useRef, useTransition } from "react";
import { setFeatureGateKind } from "./actions";

export function GateKindSelect({ featureId, gateKind }: { featureId: string; gateKind: "PLANO" | "METODO" }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form ref={formRef} action={(fd) => startTransition(() => setFeatureGateKind(fd))}>
      <input type="hidden" name="featureId" value={featureId} />
      <select
        name="gateKind"
        defaultValue={gateKind}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5 text-xs text-zinc-100"
      >
        <option value="PLANO">Plano</option>
        <option value="METODO">Método</option>
      </select>
    </form>
  );
}
