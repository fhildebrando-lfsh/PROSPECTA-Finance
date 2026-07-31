"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireWorkspaceId } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { createInvite } from "@/lib/workspace/invite";
import type { MembershipRole } from "@/app/generated/prisma/enums";

const ROLES: MembershipRole[] = ["MEMBRO", "LEITURA", "TITULAR"];

async function requireTitularOrAdmin(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!profile.isPlatformAdmin && membership?.role !== "TITULAR") {
    throw new ApiError(403, "Só o titular do workspace (ou o administrador) pode convidar membros.");
  }
  return profile;
}

export async function inviteMember(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireTitularOrAdmin(workspaceId);

  const email = String(formData.get("email") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "MEMBRO");
  const role = ROLES.includes(roleRaw as MembershipRole) ? (roleRaw as MembershipRole) : "MEMBRO";
  const phone = String(formData.get("phone") ?? "").trim() || undefined;

  await createInvite(workspaceId, profile.id, email, role, phone);
  revalidatePath("/cadastros/membros");
}

export async function deleteInvite(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  await requireTitularOrAdmin(workspaceId);

  const id = String(formData.get("id") ?? "");
  await prisma.workspaceInvite.deleteMany({ where: { id, workspaceId } });
  revalidatePath("/cadastros/membros");
}
