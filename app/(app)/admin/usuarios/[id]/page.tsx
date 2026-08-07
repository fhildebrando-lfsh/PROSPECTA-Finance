import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db/prisma";
import { PersonalDataForm } from "@/components/PersonalDataForm";
import { formatCPF } from "@/lib/validation/cpf";
import { updateUserPersonalData } from "../actions";

/** Admin edita os dados pessoais de qualquer usuário — mesmo formulário de
 * `/minha-conta`, só que com `profileId` explícito em vez da própria sessão. */
export default async function AdminEditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminProfile();
  const { id } = await params;

  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) notFound();

  const supabase = createAdminClient();
  const { data } = await supabase.auth.admin.getUserById(id);
  const email = data.user?.email ?? "—";

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <Link href="/admin/usuarios" className="text-sm text-indigo-300 hover:text-white">
          ← Voltar pra usuários
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-zinc-100">Editar dados pessoais</h1>
        <p className="text-sm text-zinc-500">{email}</p>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <PersonalDataForm
          action={updateUserPersonalData}
          extraFields={{ profileId: profile.id }}
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
  );
}
