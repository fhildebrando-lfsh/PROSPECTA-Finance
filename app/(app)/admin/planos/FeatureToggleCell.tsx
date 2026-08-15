"use client";

import { useRef, useTransition } from "react";
import { togglePlanFeature } from "./actions";

/** Checkbox que submete sozinho ao mudar — matriz feature × plano de `/admin/planos`. */
export function FeatureToggleCell({ planId, featureId, enabled }: { planId: string; featureId: string; enabled: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(fd) => startTransition(() => togglePlanFeature(fd))}
      className="flex items-center justify-center"
    >
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="featureId" value={featureId} />
      <input type="hidden" name="enabled" value={(!enabled).toString()} />
      <input
        type="checkbox"
        checked={enabled}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        className="h-4 w-4 accent-indigo-500"
      />
    </form>
  );
}
