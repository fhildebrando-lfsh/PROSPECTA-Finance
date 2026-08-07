import { NextResponse, type NextRequest } from "next/server";
import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toExportRow } from "@/lib/entries/export-row";
import { buildMyDataPdf } from "@/lib/me/export-pdf";

const ROLE_LABELS: Record<string, string> = {
  TITULAR: "Titular",
  MEMBRO: "Membro",
  LEITURA: "Leitura",
  ADVISOR: "Consultor",
};

/**
 * LGPD Art. 18, V — portabilidade. Baixa os dados pessoais que a própria
 * pessoa forneceu (Profile) e também os lançamentos financeiros dela — dado
 * financeiro pessoal também é dado pessoal, protegido pela lei. Não inclui
 * workspaces onde a pessoa é só ADVISOR: aquele lançamento é dado do
 * cliente, não da pessoa que está exportando. `?format=pdf` gera versão
 * legível por humano; padrão (`json`) é o formato legível por máquina.
 */
export async function GET(request: NextRequest) {
  const profile = await requireProfile();
  const format = new URL(request.url).searchParams.get("format") === "pdf" ? "pdf" : "json";

  const ownWorkspaceIds = profile.memberships
    .filter((m) => m.status === "ACTIVE" && m.role !== "ADVISOR")
    .map((m) => m.workspaceId);

  const [entries, natureLabels] = await Promise.all([
    prisma.entry.findMany({
      where: { workspaceId: { in: ownWorkspaceIds } },
      include: { wallet: true, category: true, subcategory: true, responsible: true, status: true, recurrence: true },
      orderBy: { dueDate: "desc" },
    }),
    prisma.natureLabel.findMany(),
  ]);
  const natureLabelByCode = new Map(natureLabels.map((n) => [n.code, n.labelPt]));
  const lancamentos = entries.map((e) => toExportRow(e, natureLabelByCode));

  const dadosDaConta = {
    email: profile.email,
    nomeCompleto: profile.fullName,
    telefone: profile.phone,
    cpf: profile.cpf,
    dataDeNascimento: profile.birthDate,
    addressCep: profile.addressCep,
    addressStreet: profile.addressStreet,
    addressNumber: profile.addressNumber,
    addressComplement: profile.addressComplement,
    addressNeighborhood: profile.addressNeighborhood,
    addressCity: profile.addressCity,
    addressState: profile.addressState,
    cadastradoEm: profile.createdAt,
    politicaDePrivacidadeAceitaEm: profile.privacyPolicyAcceptedAt,
  };

  const workspaces = profile.memberships.map((m) => ({
    workspace: m.workspace.name,
    papel: ROLE_LABELS[m.role] ?? m.role,
    desde: m.createdAt,
  }));

  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    const pdf = await buildMyDataPdf({ dadosDaConta, workspaces, lancamentos });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="meus-dados-prospecta-${dateStamp}.pdf"`,
      },
    });
  }

  const payload = {
    exportadoEm: new Date().toISOString(),
    dadosDaConta: {
      email: dadosDaConta.email,
      nomeCompleto: dadosDaConta.nomeCompleto,
      telefone: dadosDaConta.telefone,
      cpf: dadosDaConta.cpf,
      dataDeNascimento: dadosDaConta.dataDeNascimento,
      endereco: {
        cep: dadosDaConta.addressCep,
        logradouro: dadosDaConta.addressStreet,
        numero: dadosDaConta.addressNumber,
        complemento: dadosDaConta.addressComplement,
        bairro: dadosDaConta.addressNeighborhood,
        cidade: dadosDaConta.addressCity,
        uf: dadosDaConta.addressState,
      },
      cadastradoEm: dadosDaConta.cadastradoEm,
      politicaDePrivacidadeAceitaEm: dadosDaConta.politicaDePrivacidadeAceitaEm,
    },
    workspaces,
    lancamentos,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="meus-dados-prospecta-${dateStamp}.json"`,
    },
  });
}
