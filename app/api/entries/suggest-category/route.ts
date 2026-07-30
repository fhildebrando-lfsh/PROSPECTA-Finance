import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";

/**
 * §12 — "se o usuário digitou 'Padaria' 40 vezes, 1.Alimentação/Padaria vem
 * pré-selecionado". Repetição exata do texto da descrição (case-insensitive),
 * não busca aproximada — é o que o exemplo da especificação descreve.
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();
    const description = new URL(request.url).searchParams.get("description")?.trim();
    if (!description) return NextResponse.json({ suggestion: null });

    const rows = await prisma.entry.groupBy({
      by: ["categoryId", "subcategoryId"],
      where: { workspaceId, description: { equals: description, mode: "insensitive" } },
      _count: true,
      orderBy: { _count: { categoryId: "desc" } },
      take: 1,
    });

    const top = rows[0];
    if (!top) return NextResponse.json({ suggestion: null });

    return NextResponse.json({
      suggestion: { categoryId: top.categoryId, subcategoryId: top.subcategoryId },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
