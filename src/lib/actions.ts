"use server";

import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function crearPrenda(formData: FormData) {
  const imagenFile = formData.get("imagen") as File | null;
  const existingUrl = formData.get("urlImagen") as string | null;

  let finalUrl = existingUrl || "";

  if (imagenFile && imagenFile.size > 0) {
    const blob = await put(imagenFile.name, imagenFile, {
      access: "public",
    });
    finalUrl = blob.url;
  }

  if (!finalUrl) {
    throw new Error("La imagen es obligatoria");
  }

  const data = {
    idTipo: Number(formData.get("idTipo")),
    idCorte: formData.get("idCorte")
      ? Number(formData.get("idCorte"))
      : null,
    idTejido: formData.get("idTejido")
      ? Number(formData.get("idTejido"))
      : null,
    idMarca: Number(formData.get("idMarca")),
    idUbicacion: Number(formData.get("idUbicacion")),
    idEstampado: formData.get("idEstampado")
      ? Number(formData.get("idEstampado"))
      : null,
    idColorPrincipal: Number(formData.get("idColorPrincipal")),
    idColorSecundario: formData.get("idColorSecundario")
      ? Number(formData.get("idColorSecundario"))
      : null,
    urlImagen: finalUrl,
    detalles: (formData.get("detalles") as string) || null,
  };

  await prisma.fPrenda.create({ data });
  revalidatePath("/");
}

export async function editarPrenda(id: number, formData: FormData) {
  const imagenFile = formData.get("imagen") as File | null;
  const existingUrl = formData.get("urlImagen") as string | null;
  let urlImagen = existingUrl || "";

  if (imagenFile && imagenFile.size > 0) {
    const blob = await put(imagenFile.name, imagenFile, {
      access: "public",
    });
    urlImagen = blob.url;
  }

  const data = {
    idTipo: Number(formData.get("idTipo")),
    idCorte: formData.get("idCorte")
      ? Number(formData.get("idCorte"))
      : null,
    idTejido: formData.get("idTejido")
      ? Number(formData.get("idTejido"))
      : null,
    idMarca: Number(formData.get("idMarca")),
    idUbicacion: Number(formData.get("idUbicacion")),
    idEstampado: formData.get("idEstampado")
      ? Number(formData.get("idEstampado"))
      : null,
    idColorPrincipal: Number(formData.get("idColorPrincipal")),
    idColorSecundario: formData.get("idColorSecundario")
      ? Number(formData.get("idColorSecundario"))
      : null,
    urlImagen,
    detalles: (formData.get("detalles") as string) || null,
  };

  await prisma.fPrenda.update({ where: { id }, data });
  revalidatePath("/");
}

export async function eliminarPrenda(id: number) {
  await prisma.fPrenda.delete({ where: { id } });
  revalidatePath("/");
}

export async function moverPrenda(id: number, idUbicacion: number) {
  await prisma.fPrenda.update({
    where: { id },
    data: { idUbicacion },
  });
  revalidatePath("/");
}