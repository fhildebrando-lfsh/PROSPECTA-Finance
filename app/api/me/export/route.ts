import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth/session";

const ROLE_LABELS: Record<string, string> = {
  TITULAR: "Titular",
  MEMBRO: "Membro",
  LEITURA: "Leitura",
  ADVISOR: "Consultor",
};

/**
 * LGPD Art. 18, V — portabilidade. Baixa os dados pessoais que a própria
 * pessoa forneceu (Profile) em formato estruturado e legível por máquina
 * (JSON). Dados financeiros (lançamentos, carteiras) já têm exportação
 * própria em Lançamentos — não duplicado aqui de propósito.
 */
export async function GET() {
  const profile = await requireProfile();

  const payload = {
    exportadoEm: new Date().toISOString(),
    dadosDaConta: {
      email: profile.email,
      nomeCompleto: profile.fullName,
      telefone: profile.phone,
      cpf: profile.cpf,
      dataDeNascimento: profile.birthDate,
      endereco: {
        cep: profile.addressCep,
        logradouro: profile.addressStreet,
        numero: profile.addressNumber,
        complemento: profile.addressComplement,
        bairro: profile.addressNeighborhood,
        cidade: profile.addressCity,
        uf: profile.addressState,
      },
      cadastradoEm: profile.createdAt,
      politicaDePrivacidadeAceitaEm: profile.privacyPolicyAcceptedAt,
    },
    workspaces: profile.memberships.map((m) => ({
      workspace: m.workspace.name,
      papel: ROLE_LABELS[m.role] ?? m.role,
      desde: m.createdAt,
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="meus-dados-prospecta-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
