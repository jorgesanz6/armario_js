export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_SIZE_LABEL = "5 MB";
export const MAX_DETALLES_LENGTH = 500;
export const MAX_NOMBRE_LENGTH = 100;

export function validateRequiredId(
  raw: FormDataEntryValue | null,
  fieldName: string,
  errors: string[]
): number | null {
  if (!raw || raw === "" || raw === "0") {
    errors.push(`${fieldName} es obligatorio`);
    return null;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    errors.push(`${fieldName} debe ser un ID valido`);
    return null;
  }
  return n;
}

export function validateOptionalId(
  raw: FormDataEntryValue | null,
  fieldName: string,
  errors: string[]
): number | null {
  if (!raw || raw === "" || raw === "0") return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    errors.push(`${fieldName} debe ser un ID valido`);
    return null;
  }
  return n;
}

export function validateImage(
  file: File | null,
  errors: string[]
): File | null {
  if (!file || file.size === 0) return null;

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    errors.push(`Tipo de imagen no permitido. Solo: JPEG, PNG, WebP`);
    return null;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    errors.push(`La imagen supera el maximo de ${MAX_IMAGE_SIZE_LABEL}`);
    return null;
  }

  return file;
}

export function validateStringLength(
  raw: FormDataEntryValue | null,
  maxLength: number,
  fieldName: string,
  errors: string[]
): string | null {
  if (!raw || typeof raw !== "string" || raw.trim() === "") return null;
  if (raw.length > maxLength) {
    errors.push(`${fieldName} no puede superar ${maxLength} caracteres`);
    return null;
  }
  return raw;
}

export async function verifyIdExists(
  id: number | null,
  model: { findUnique: (args: { where: { id: number } }) => Promise<{ id: number } | null> },
  fieldName: string,
  errors: string[]
): Promise<void> {
  if (id === null) return;
  const record = await model.findUnique({ where: { id } });
  if (!record) {
    errors.push(`${fieldName} no existe`);
  }
}