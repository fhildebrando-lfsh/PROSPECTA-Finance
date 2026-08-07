import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { isValidCPF } from "@/lib/validation/cpf";

export interface PersonalDataInput {
  fullName: string;
  phone: string;
  cpf: string;
  birthDate: string; // yyyy-mm-dd (valor cru de <input type="date">)
  addressCep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
}

export function personalDataFromFormData(formData: FormData): PersonalDataInput {
  const get = (name: string) => String(formData.get(name) ?? "").trim();
  return {
    fullName: get("fullName"),
    phone: get("phone"),
    cpf: get("cpf"),
    birthDate: get("birthDate"),
    addressCep: get("addressCep"),
    addressStreet: get("addressStreet"),
    addressNumber: get("addressNumber"),
    addressComplement: get("addressComplement"),
    addressNeighborhood: get("addressNeighborhood"),
    addressCity: get("addressCity"),
    addressState: get("addressState"),
  };
}

/** Todos os campos são opcionais — string vazia sempre vira `null` (é assim
 * que "limpar um campo" funciona: some do formulário, salva vazio). */
export async function updatePersonalData(profileId: string, input: PersonalDataInput) {
  const cpfDigits = input.cpf.replace(/\D/g, "");
  if (cpfDigits && !isValidCPF(cpfDigits)) {
    throw new ApiError(400, "CPF inválido.");
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      fullName: input.fullName || null,
      phone: input.phone || null,
      cpf: cpfDigits || null,
      birthDate: input.birthDate ? new Date(`${input.birthDate}T00:00:00Z`) : null,
      addressCep: input.addressCep.replace(/\D/g, "") || null,
      addressStreet: input.addressStreet || null,
      addressNumber: input.addressNumber || null,
      addressComplement: input.addressComplement || null,
      addressNeighborhood: input.addressNeighborhood || null,
      addressCity: input.addressCity || null,
      addressState: input.addressState ? input.addressState.toUpperCase() : null,
    },
  });
}
