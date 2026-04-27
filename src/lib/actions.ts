"use server";

import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  validateRequiredId,
  validateOptionalId,
  validateImage,
  validateStringLength,
  verifyIdExists,
  MAX_DETALLES_LENGTH,
  MAX_NOMBRE_LENGTH,
} from "@/lib/validation";

export type ActionResult = { success: true } | { success: false; error: string };
export type DashboardData = Record<string, Record<string, number>>;

function toProxyUrl(blobUrl: string): string {
  try {
    const url = new URL(blobUrl);
    const pathname = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
    return `/api/imagen/${pathname}`;
  } catch {
    return blobUrl;
  }
}

// --- Dimension fetchers ---

export async function getDimensiones() {
  const [tipos, cortes, colores, estampados, tejidos, marcas, ubicaciones] =
    await Promise.all([
      prisma.dimTipoPrenda.findMany({ orderBy: { id: "asc" } }),
      prisma.dimCorte.findMany({ orderBy: { id: "asc" } }),
      prisma.dimColor.findMany({ orderBy: { id: "asc" } }),
      prisma.dimEstampado.findMany({ orderBy: { id: "asc" } }),
      prisma.dimTejido.findMany({ orderBy: { id: "asc" } }),
      prisma.dimMarca.findMany({ orderBy: { id: "asc" } }),
      prisma.dimUbicacion.findMany({ orderBy: { id: "asc" } }),
    ]);

  return { tipos, cortes, colores, estampados, tejidos, marcas, ubicaciones };
}

// --- Prendas CRUD ---

export async function getPrendas() {
  return prisma.fPrenda.findMany({
    include: {
      tipo: true,
      corte: true,
      tejido: true,
      marca: true,
      ubicacion: true,
      estampado: true,
      colorPrincipal: true,
      colorSecundario: true,
    },
    orderBy: { id: "desc" },
  });
}

export async function getPrenda(id: number) {
  return prisma.fPrenda.findUnique({
    where: { id },
    include: {
      tipo: true,
      corte: true,
      tejido: true,
      marca: true,
      ubicacion: true,
      estampado: true,
      colorPrincipal: true,
      colorSecundario: true,
    },
  });
}

export async function crearPrenda(formData: FormData): Promise<ActionResult> {
  try {
    await requireAuth();

    const imagenFile = formData.get("imagen") as File | null;
    const existingUrl = formData.get("urlImagen") as string | null;
    let finalUrl = existingUrl || "";

    const errors: string[] = [];
    const validatedImage = validateImage(imagenFile, errors);

    if (validatedImage && validatedImage.size > 0) {
      const blob = await put(validatedImage.name, validatedImage, {
        access: "private",
        addRandomSuffix: true,
      });
      finalUrl = toProxyUrl(blob.url);
    }

    const idTipo = validateRequiredId(formData.get("idTipo"), "Tipo", errors);
    const idMarca = validateRequiredId(formData.get("idMarca"), "Marca", errors);
    const idUbicacion = validateRequiredId(formData.get("idUbicacion"), "Ubicacion", errors);
    const idColorPrincipal = validateRequiredId(formData.get("idColorPrincipal"), "Color principal", errors);
    const idCorte = validateOptionalId(formData.get("idCorte"), "Corte", errors);
    const idTejido = validateOptionalId(formData.get("idTejido"), "Tejido", errors);
    const idEstampado = validateOptionalId(formData.get("idEstampado"), "Estampado", errors);
    const idColorSecundario = validateOptionalId(formData.get("idColorSecundario"), "Color secundario", errors);
    const detalles = validateStringLength(formData.get("detalles"), MAX_DETALLES_LENGTH, "Notas", errors);

    await verifyIdExists(idTipo, prisma.dimTipoPrenda, "Tipo", errors);
    await verifyIdExists(idMarca, prisma.dimMarca, "Marca", errors);
    await verifyIdExists(idUbicacion, prisma.dimUbicacion, "Ubicacion", errors);
    await verifyIdExists(idColorPrincipal, prisma.dimColor, "Color principal", errors);
    await verifyIdExists(idCorte, prisma.dimCorte, "Corte", errors);
    await verifyIdExists(idTejido, prisma.dimTejido, "Tejido", errors);
    await verifyIdExists(idEstampado, prisma.dimEstampado, "Estampado", errors);
    await verifyIdExists(idColorSecundario, prisma.dimColor, "Color secundario", errors);

    if (errors.length > 0) {
      return { success: false, error: errors.join(". ") };
    }

    const data = {
      idTipo: idTipo!,
      idCorte,
      idTejido,
      idMarca: idMarca!,
      idUbicacion: idUbicacion!,
      idEstampado,
      idColorPrincipal: idColorPrincipal!,
      idColorSecundario,
      urlImagen: finalUrl || null,
      detalles,
    };

    await prisma.fPrenda.create({ data });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return { success: false, error: "No autenticado" };
    }
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function editarPrenda(id: number, formData: FormData): Promise<ActionResult> {
  try {
    await requireAuth();

    const imagenFile = formData.get("imagen") as File | null;
    const existingUrl = formData.get("urlImagen") as string | null;
    let urlImagen = existingUrl || "";

    const errors: string[] = [];
    const validatedImage = validateImage(imagenFile, errors);

    if (validatedImage && validatedImage.size > 0) {
      const blob = await put(validatedImage.name, validatedImage, {
        access: "private",
        addRandomSuffix: true,
      });
      urlImagen = toProxyUrl(blob.url);
    }

    const idTipo = validateRequiredId(formData.get("idTipo"), "Tipo", errors);
    const idMarca = validateRequiredId(formData.get("idMarca"), "Marca", errors);
    const idUbicacion = validateRequiredId(formData.get("idUbicacion"), "Ubicacion", errors);
    const idColorPrincipal = validateRequiredId(formData.get("idColorPrincipal"), "Color principal", errors);
    const idCorte = validateOptionalId(formData.get("idCorte"), "Corte", errors);
    const idTejido = validateOptionalId(formData.get("idTejido"), "Tejido", errors);
    const idEstampado = validateOptionalId(formData.get("idEstampado"), "Estampado", errors);
    const idColorSecundario = validateOptionalId(formData.get("idColorSecundario"), "Color secundario", errors);
    const detalles = validateStringLength(formData.get("detalles"), MAX_DETALLES_LENGTH, "Notas", errors);

    await verifyIdExists(idTipo, prisma.dimTipoPrenda, "Tipo", errors);
    await verifyIdExists(idMarca, prisma.dimMarca, "Marca", errors);
    await verifyIdExists(idUbicacion, prisma.dimUbicacion, "Ubicacion", errors);
    await verifyIdExists(idColorPrincipal, prisma.dimColor, "Color principal", errors);
    await verifyIdExists(idCorte, prisma.dimCorte, "Corte", errors);
    await verifyIdExists(idTejido, prisma.dimTejido, "Tejido", errors);
    await verifyIdExists(idEstampado, prisma.dimEstampado, "Estampado", errors);
    await verifyIdExists(idColorSecundario, prisma.dimColor, "Color secundario", errors);

    if (errors.length > 0) {
      return { success: false, error: errors.join(". ") };
    }

    const data = {
      idTipo: idTipo!,
      idCorte,
      idTejido,
      idMarca: idMarca!,
      idUbicacion: idUbicacion!,
      idEstampado,
      idColorPrincipal: idColorPrincipal!,
      idColorSecundario,
      urlImagen,
      detalles,
    };

    await prisma.fPrenda.update({ where: { id }, data });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return { success: false, error: "No autenticado" };
    }
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function eliminarPrenda(id: number): Promise<ActionResult> {
  try {
    await requireAuth();
    await prisma.fPrenda.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return { success: false, error: "No autenticado" };
    }
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function moverPrenda(id: number, idUbicacion: number): Promise<ActionResult> {
  try {
    await requireAuth();
    await prisma.fPrenda.update({
      where: { id },
      data: { idUbicacion },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return { success: false, error: "No autenticado" };
    }
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// --- Dimension CRUD ---

export async function agregarDimension(tabla: string, nombre: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const trimmed = nombre.trim();
    if (!trimmed || trimmed.length > MAX_NOMBRE_LENGTH) {
      return { success: false, error: `Nombre invalido (max ${MAX_NOMBRE_LENGTH} caracteres)` };
    }
    switch (tabla) {
      case "tipos": await prisma.dimTipoPrenda.create({ data: { nombre: trimmed } }); break;
      case "cortes": await prisma.dimCorte.create({ data: { nombre: trimmed } }); break;
      case "colores": await prisma.dimColor.create({ data: { nombre: trimmed } }); break;
      case "estampados": await prisma.dimEstampado.create({ data: { nombre: trimmed } }); break;
      case "tejidos": await prisma.dimTejido.create({ data: { nombre: trimmed } }); break;
      case "marcas": await prisma.dimMarca.create({ data: { nombre: trimmed } }); break;
      case "ubicaciones": await prisma.dimUbicacion.create({ data: { nombre: trimmed } }); break;
      default: return { success: false, error: "Tabla desconocida" };
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return { success: false, error: "No autenticado" };
    }
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function eliminarDimension(tabla: string, id: number): Promise<ActionResult> {
  try {
    await requireAuth();
    switch (tabla) {
      case "tipos": await prisma.dimTipoPrenda.delete({ where: { id } }); break;
      case "cortes": await prisma.dimCorte.delete({ where: { id } }); break;
      case "colores": await prisma.dimColor.delete({ where: { id } }); break;
      case "estampados": await prisma.dimEstampado.delete({ where: { id } }); break;
      case "tejidos": await prisma.dimTejido.delete({ where: { id } }); break;
      case "marcas": await prisma.dimMarca.delete({ where: { id } }); break;
      case "ubicaciones": await prisma.dimUbicacion.delete({ where: { id } }); break;
      default: return { success: false, error: "Tabla desconocida" };
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return { success: false, error: "No autenticado" };
    }
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// --- Dashboard ---

export async function getDashboard() {
  const prendas = await prisma.fPrenda.findMany({
    select: { idTipo: true, idUbicacion: true, tipo: { select: { nombre: true } }, ubicacion: { select: { nombre: true } } },
  });

  const data: DashboardData = {};
  for (const p of prendas) {
    const tipo = p.tipo.nombre;
    const ubi = p.ubicacion.nombre;
    if (!data[tipo]) data[tipo] = {};
    data[tipo][ubi] = (data[tipo][ubi] || 0) + 1;
  }
  return data;
}