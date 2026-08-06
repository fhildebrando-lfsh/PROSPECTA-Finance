"use client";

import { setPlatformAdmin } from "./actions";

export function PlatformAdminToggle({ profileId, isAdmin, label }: { profileId: string; isAdmin: boolean; label: string }) {
  return (
    <form
      action={setPlatformAdmin}
      onSubmit={(e) => {
        const msg = isAdmin
          ? `Remover ${label} como administrador da plataforma?`
          : `Tornar ${label} administrador da plataforma? Isso dá acesso total a todos os workspaces.`;
        if (!confirm(msg)) e.preventDefault();
      }}
    >
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="makeAdmin" value={(!isAdmin).toString()} />
      <button
        type="submit"
        className={isAdmin ? "text-xs text-red-400 hover:text-red-300" : "text-xs text-indigo-300 hover:text-white"}
      >
        {isAdmin ? "remover admin" : "tornar admin"}
      </button>
    </form>
  );
}
