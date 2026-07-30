import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { accept } from "./actions";

const ROLE_LABELS: Record<string, string> = { TITULAR: "Titular", MEMBRO: "Membro", LEITURA: "Leitura" };

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const profile = await requireProfile();

  const invite = await prisma.workspaceInvite.findUnique({ where: { token }, include: { workspace: true } });

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
      <h1 className="text-lg font-semibold text-zinc-100">Convite</h1>

      {!invite && <p className="text-sm text-red-400">Convite não encontrado.</p>}

      {invite && invite.acceptedAt && <p className="text-sm text-zinc-400">Este convite já foi aceito.</p>}

      {invite && !invite.acceptedAt && profile.email?.trim().toLowerCase() !== invite.email && (
        <p className="text-sm text-amber-400">
          Este convite foi enviado para <strong>{invite.email}</strong>, mas você está logado como{" "}
          <strong>{profile.email}</strong>. Entre com a conta correta pra aceitar.
        </p>
      )}

      {invite && !invite.acceptedAt && profile.email?.trim().toLowerCase() === invite.email && (
        <>
          <p className="text-sm text-zinc-300">
            Você foi convidado pra entrar no workspace <strong>{invite.workspace.name}</strong> como{" "}
            <strong>{ROLE_LABELS[invite.role] ?? invite.role}</strong>.
          </p>
          <form action={accept}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
            >
              Aceitar convite
            </button>
          </form>
        </>
      )}
    </div>
  );
}
