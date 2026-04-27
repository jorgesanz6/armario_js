"use server";

import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ActionResult = { success: true } | { success: false; error: string };
export type DashboardData = Record<string, Record<string, number>>;

function toProxyUrl(blobUrl: string): string {
  // Convert blob URL to our proxy route: /api/imagen/[pathname]
  // blobUrl = https://xxx.public.blob.vercel-storage.com/pathname
  // or     = https://xxx.private.blob.vercel-storage.com/pathname
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

function parseId(value: string | File | null): number | null {
  if (!value || value === "") return null;
  const n = Number(value);
  return n > 0 ? n : null;
}

export async function crearPrenda(formData: FormData): Promise<ActionResult> {
  try {
    const imagenFile = formData.get("imagen") as File | null;
    const existingUrl = formData.get("urlImagen") as string | null;

    let finalUrl = existingUrl || "";

    if (imagenFile && imagenFile.size > 0) {
      const blob = await put(imagenFile.name, imagenFile, {
        access: "private",
        addRandomSuffix: true,
      });
    }

    const idTipo = parseId(formData.get("idTipo"));
    const idMarca = parseId(formData.get("idMarca"));
    const idUbicacion = parseId(formData.get("idUbicacion"));
    const idColorPrincipal = parseId(formData.get("idColorPrincipal"));

    if (!idTipo || !idMarca || !idUbicacion || !idColorPrincipal) {
      return { success: false, error: "Faltan campos obligatorios (tipo, marca, ubicación, color principal)" };
    }

    const data = {
      idTipo,
      idCorte: parseId(formData.get("idCorte")),
      idTejido: parseId(formData.get("idTejido")),
      idMarca,
      idUbicacion,
      idEstampado: parseId(formData.get("idEstampado")),
      idColorPrincipal,
      idColorSecundario: parseId(formData.get("idColorSecundario")),
      urlImagen: finalUrl || null,
      detalles: (formData.get("detalles") as string) || null,
    };

    await prisma.fPrenda.create({ data });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function editarPrenda(id: number, formData: FormData): Promise<ActionResult> {
  try {
    const imagenFile = formData.get("imagen") as File | null;
    const existingUrl = formData.get("urlImagen") as string | null;
    let urlImagen = existingUrl || "";

    if (imagenFile && imagenFile.size > 0) {
      const blob = await put(imagenFile.name, imagenFile, {
        access: "private",
        addRandomSuffix: true,
      });
      urlImagen = toProxyUrl(blob.url);
    }

    const data = {
      idTipo: parseId(formData.get("idTipo"))!,
      idCorte: parseId(formData.get("idCorte")),
      idTejido: parseId(formData.get("idTejido")),
      idMarca: parseId(formData.get("idMarca"))!,
      idUbicacion: parseId(formData.get("idUbicacion"))!,
      idEstampado: parseId(formData.get("idEstampado")),
      idColorPrincipal: parseId(formData.get("idColorPrincipal"))!,
      idColorSecundario: parseId(formData.get("idColorSecundario")),
      urlImagen,
      detalles: (formData.get("detalles") as string) || null,
    };

    await prisma.fPrenda.update({ where: { id }, data });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function eliminarPrenda(id: number): Promise<ActionResult> {
  try {
    await prisma.fPrenda.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function moverPrenda(id: number, idUbicacion: number): Promise<ActionResult> {
  try {
    await prisma.fPrenda.update({
      where: { id },
      data: { idUbicacion },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// --- Dimension CRUD ---

export async function agregarDimension(tabla: string, nombre: string): Promise<ActionResult> {
  try {
    switch (tabla) {
      case "tipos": await prisma.dimTipoPrenda.create({ data: { nombre } }); break;
      case "cortes": await prisma.dimCorte.create({ data: { nombre } }); break;
      case "colores": await prisma.dimColor.create({ data: { nombre } }); break;
      case "estampados": await prisma.dimEstampado.create({ data: { nombre } }); break;
      case "tejidos": await prisma.dimTejido.create({ data: { nombre } }); break;
      case "marcas": await prisma.dimMarca.create({ data: { nombre } }); break;
      case "ubicaciones": await prisma.dimUbicacion.create({ data: { nombre } }); break;
      default: return { success: false, error: "Tabla desconocida" };
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function eliminarDimension(tabla: string, id: number): Promise<ActionResult> {
  try {
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