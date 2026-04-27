import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tipos = [
    "Camiseta", "Camisa", "Jersey", "Sudadera", "Pantalón",
    "Calzoncillo", "Calcetín", "Bañador", "Abrigo", "Chaqueta",
    "Equipación Pucela",
  ];
  for (const nombre of tipos) {
    await prisma.dimTipoPrenda.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  const cortes = ["Manga Larga", "Manga Corta", "Pantalón Largo", "Pantalón Corto"];
  for (const nombre of cortes) {
    await prisma.dimCorte.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  const colores = [
    "Blanco", "Negro", "Azul", "Verde", "Gris", "Marrón",
    "Rojo", "Amarillo", "Rosa", "Azul Claro", "Azul Oscuro", "Beige", "Morado",
  ];
  for (const nombre of colores) {
    await prisma.dimColor.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  const estampados = ["Liso", "Rayas Claro", "Rayas Oscuro"];
  for (const nombre of estampados) {
    await prisma.dimEstampado.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  const tejidos = ["Punto", "Franela", "Vaquero", "Chándal"];
  for (const nombre of tejidos) {
    await prisma.dimTejido.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  const marcas = [
    "Nike", "Adidas", "The North Face", "Decathlon", "BjonBorg",
    "Zara", "Uniqlo", "Boss", "Lagareta", "Ogs", "Kappa", "Reebok", "Otro",
  ];
  for (const nombre of marcas) {
    await prisma.dimMarca.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  const ubicaciones = ["Madrid", "Valladolid", "En tránsito"];
  for (const nombre of ubicaciones) {
    await prisma.dimUbicacion.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  console.log("Seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());