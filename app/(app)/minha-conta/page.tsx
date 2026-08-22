import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { setActiveWorkspace } from "@/lib/workspace/switch";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { PersonalDataForm } from "@/components/PersonalDataForm";
import { formatCPF } from "@/lib/validation/cpf";
import { identifyPerson } from "@/lib/format";
import { updateMyPersonalData } from "./actions";
import { DeleteAccountForm } from "./DeleteAccountForm";

const ROLE_LABELS: Record<string, string> = {
  TITULAR: "Titular",
  MEMBRO: "Membro",
  LEITURA: "Leitura",
  ADVISOR: "Consultor",
};

export default async function MinhaContaPage() {
  const profile = await requireProfile();

  const ownedMemberships = profile.memberships.filter((m) => m.role === "TITULAR" && m.status === "ACTIVE");
  const soleOwnerWorkspaces: string[] = [];
  for (const m of ownedMemberships) {
    const otherOwner = await prisma.membership.findFirst({
      where: { workspaceId: m.workspaceId, role: "TITULAR", status: "ACTIVE", profileId: { not: profile.id } },
    });
    if (!otherOwner) soleOwnerWorkspaces.push(m.workspace.name);
  }

  const advisorMemberships = profile.memberships.filter((m) => m.role === "ADVISOR" && m.status === "ACTIVE");

  // Identifica cada workspace pelo titular dele (nome + e-mail), não pelo
  // nome do workspace em si — mais fácil de diferenciar quando há vários
  // clientes com nomes de workspace parecidos.
  const workspaceIds = profile.memberships.map((m) => m.workspaceId);
  const [titularMemberships, { data: authData }] = await Promise.all([
    prisma.membership.findMany({
      where: { workspaceId: { in: workspaceIds }, role: "TITULAR", status: "ACTIVE" },
      include: { profile: true },
    }),
    createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const emailByProfileId = new Map(authData.users.map((u) => [u.id, u.email ?? ""]));
  const titularByWorkspaceId = new Map(
    titularMemberships.map((t) => [t.workspaceId, identifyPerson(t.profile.fullName, emailByProfileId.get(t.profileId) ?? "")]),
  );

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Minha conta</h1>
        <p className="text-sm text-zinc-500">{profile.email}</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Dados pessoais</h2>
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <PersonalDataForm
            action={updateMyPersonalData}
            initialValues={{
              fullName: profile.fullName ?? "",
              phone: profile.phone ?? "",
              cpf: profile.cpf ? formatCPF(profile.cpf) : "",
              birthDate: profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : "",
              addressCep: profile.addressCep ?? "",
              addressStreet: profile.addressStreet ?? "",
              addressNumber: profile.addressNumber ?? "",
              addressComplement: profile.addressComplement ?? "",
              addressNeighborhood: profile.addressNeighborhood ?? "",
              addressCity: profile.addressCity ?? "",
              addressState: profile.addressState ?? "",
            }}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Seus usuários do sistema</h2>
        <div className="flex flex-col gap-2">
          {profile.memberships.map((m) => (
            <div key={m.id} className="rounded-lg border border-indigo-900/50 bg-[#131A47] px-3 py-2 text-sm text-zinc-200">
              {titularByWorkspaceId.get(m.workspaceId) ?? m.workspace.name}{" "}
              <span className="text-xs text-zinc-500">· {ROLE_LABELS[m.role] ?? m.role}</span>
            </div>
          ))}
        </div>
      </div>

      {advisorMemberships.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Meus clientes da consultoria</h2>
          <p className="mb-3 text-xs text-zinc-500">
            Entrar num cliente troca seu workspace ativo — você passa a ver e editar os dados dele, igual se fosse a
            própria pessoa. O acesso fica registrado (auditoria).
          </p>
          <div className="flex flex-col gap-2">
            {advisorMemberships.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-indigo-900/50 bg-[#131A47] px-3 py-2"
              >
                <span className="text-sm text-zinc-200">{titularByWorkspaceId.get(m.workspaceId) ?? m.workspace.name}</span>
                <form action={setActiveWorkspace}>
                  <input type="hidden" name="workspaceId" value={m.workspaceId} />
                  <button type="submit" className={BTN_SECONDARY}>
                    Entrar como consultor
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Privacidade e dados</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4 text-sm">
          <span className="text-zinc-400">Baixar meus dados pessoais:</span>
          <a href="/api/me/export?format=json" download className="text-indigo-300 underline hover:text-white">
            JSON
          </a>
          <a href="/api/me/export?format=pdf" download className="text-indigo-300 underline hover:text-white">
            PDF
          </a>
          <Link href="/politica-privacidade" target="_blank" className="text-indigo-300 underline hover:text-white">
            Política de Privacidade
          </Link>
          {/* Registro Nº 105 — o AccessLog era escrito e nunca lido por
              ninguém, inclusive pelo titular, que é o interessado. */}
          <Link href="/minha-conta/acessos" className="text-indigo-300 underline hover:text-white">
            Quem acessou meus dados
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Zona de risco</h2>
        <DeleteAccountForm ownedWorkspaceNames={soleOwnerWorkspaces} />
      </div>
    </div>
  );
}
