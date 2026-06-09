import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface PrendaInput {
  nombre: string;
  tipo?: string;
  marca?: string;
  colorPrincipal?: string;
  colorSecundario?: string;
  corte?: string;
  tejido?: string;
  estampado?: string;
  detalles?: string;
}

async function main() {
  // 1. Seed Dimensions (Ensure all new brands, types, etc. exist)
  const tipos = [
    "Camiseta", "Camisa", "Jersey", "Sudadera", "Pantalón",
    "Calzoncillo", "Calcetín", "Bañador", "Abrigo", "Chaqueta",
    "Equipación Pucela", "Polo", "Chanclas", "Zapatillas", "Zapatos", "Cinturón",
    "Americana", "Traje"
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
    "Zara", "Uniqlo", "Boss", "Lagareta", "Ogs", "OGs", "Kappa", "Reebok", "Otro",
    "WAWA", "HUF", "Río de Janeiro", "Verstappen", "Scalpers", "Silbon",
    "Havaianas", "Crocs", "Primark", "Valladolid"
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

  // 2. Fetch all dimensions to map names to IDs
  const [tiposDb, cortesDb, coloresDb, estampadosDb, tejidosDb, marcasDb, ubicacionesDb] =
    await Promise.all([
      prisma.dimTipoPrenda.findMany(),
      prisma.dimCorte.findMany(),
      prisma.dimColor.findMany(),
      prisma.dimEstampado.findMany(),
      prisma.dimTejido.findMany(),
      prisma.dimMarca.findMany(),
      prisma.dimUbicacion.findMany(),
    ]);

  const getTipoId = (nombre?: string) =>
    nombre ? tiposDb.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase())?.id ?? null : null;
  const getCorteId = (nombre?: string) =>
    nombre ? cortesDb.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase())?.id ?? null : null;
  const getColorId = (nombre?: string) =>
    nombre ? coloresDb.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase())?.id ?? null : null;
  const getEstampadoId = (nombre?: string) =>
    nombre ? estampadosDb.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase())?.id ?? null : null;
  const getTejidoId = (nombre?: string) =>
    nombre ? tejidosDb.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase())?.id ?? null : null;
  const getMarcaId = (nombre?: string) =>
    nombre ? marcasDb.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase())?.id ?? null : null;

  const madridId = ubicacionesDb.find((x) => x.nombre === "Madrid")?.id;
  if (!madridId) {
    throw new Error("No se encontró la ubicación 'Madrid' en la base de datos.");
  }

  // 3. Clear existing garments
  console.log("Eliminando todas las prendas existentes...");
  await prisma.fPrenda.deleteMany({});

  // 4. Seed garments in Madrid Wardrobe
  const prendasAInsertar: PrendaInput[] = [
    // Pantalones
    { nombre: "Pantalón largo negro (Zara)", tipo: "Pantalón", marca: "Zara", colorPrincipal: "Negro", corte: "Pantalón Largo", estampado: "Liso" },
    { nombre: "Pantalón largo azul (Zara)", tipo: "Pantalón", marca: "Zara", colorPrincipal: "Azul", corte: "Pantalón Largo", estampado: "Liso" },
    { nombre: "Pantalón largo azul (Uniqlo)", tipo: "Pantalón", marca: "Uniqlo", colorPrincipal: "Azul", corte: "Pantalón Largo", estampado: "Liso" },
    { nombre: "Pantalón beige (Uniqlo)", tipo: "Pantalón", marca: "Uniqlo", colorPrincipal: "Beige", corte: "Pantalón Largo", estampado: "Liso" },
    { nombre: "Pantalón corto verde (Uniqlo)", tipo: "Pantalón", marca: "Uniqlo", colorPrincipal: "Verde", corte: "Pantalón Corto", estampado: "Liso" },
    { nombre: "Pantalón corto a rayas (Uniqlo)", tipo: "Pantalón", marca: "Uniqlo", corte: "Pantalón Corto", estampado: "Rayas Claro" },
    { nombre: "Pantalón corto verde (Decathlon)", tipo: "Pantalón", marca: "Decathlon", colorPrincipal: "Verde", corte: "Pantalón Corto", estampado: "Liso" },
    { nombre: "Pantalón corto negro (Decathlon)", tipo: "Pantalón", marca: "Decathlon", colorPrincipal: "Negro", corte: "Pantalón Corto", estampado: "Liso" },
    { nombre: "Pantalón largo de chándal (Nike)", tipo: "Pantalón", marca: "Nike", corte: "Pantalón Largo", tejido: "Chándal", estampado: "Liso" },
    { nombre: "Pantalón largo de chándal (Primark)", tipo: "Pantalón", marca: "Primark", corte: "Pantalón Largo", tejido: "Chándal", estampado: "Liso" },
    { nombre: "Pantalón verde de portero (Valladolid)", tipo: "Pantalón", marca: "Valladolid", colorPrincipal: "Verde", corte: "Pantalón Largo", detalles: "Pantalón de portero" },

    // Camisetas y Polos
    { nombre: "Camiseta blanca (WAWA)", tipo: "Camiseta", marca: "WAWA", colorPrincipal: "Blanco", corte: "Manga Corta", estampado: "Liso" },
    { nombre: "Camiseta blanca AIRSIM (Uniqlo)", tipo: "Camiseta", marca: "Uniqlo", colorPrincipal: "Blanco", corte: "Manga Corta", detalles: "AIRSIM", estampado: "Liso" },
    { nombre: "Camiseta azul AIRSIM (Uniqlo)", tipo: "Camiseta", marca: "Uniqlo", colorPrincipal: "Azul", corte: "Manga Corta", detalles: "AIRSIM", estampado: "Liso" },
    { nombre: "Camiseta Louvre (Uniqlo)", tipo: "Camiseta", marca: "Uniqlo", detalles: "Colección Louvre" },
    { nombre: "Camiseta de manga larga verde airsim (Uniqlo)", tipo: "Camiseta", marca: "Uniqlo", colorPrincipal: "Verde", corte: "Manga Larga", detalles: "AIRSIM", estampado: "Liso" },
    { nombre: "Camiseta blanca cuadro (Lagareta)", tipo: "Camiseta", marca: "Lagareta", colorPrincipal: "Blanco", corte: "Manga Corta", detalles: "Cuadros" },
    { nombre: "Camiseta blanca (Lagareta)", tipo: "Camiseta", marca: "Lagareta", colorPrincipal: "Blanco", corte: "Manga Corta", estampado: "Liso" },
    { nombre: "Camiseta blanca (OGs)", tipo: "Camiseta", marca: "OGs", colorPrincipal: "Blanco", corte: "Manga Corta", estampado: "Liso" },
    { nombre: "Camiseta blanca (Adidas)", tipo: "Camiseta", marca: "Adidas", colorPrincipal: "Blanco", corte: "Manga Corta", estampado: "Liso" },
    { nombre: "Camiseta blanca (Decathlon)", tipo: "Camiseta", marca: "Decathlon", colorPrincipal: "Blanco", corte: "Manga Corta", estampado: "Liso" },
    { nombre: "Camiseta blanca (HUF)", tipo: "Camiseta", marca: "HUF", colorPrincipal: "Blanco", corte: "Manga Corta", estampado: "Liso" },
    { nombre: "Camiseta verde (Río de Janeiro)", tipo: "Camiseta", marca: "Río de Janeiro", colorPrincipal: "Verde", corte: "Manga Corta", estampado: "Liso" },
    { nombre: "Camiseta (Verstappen)", tipo: "Camiseta", marca: "Verstappen" },
    { nombre: "Camiseta gris (Scalpers)", tipo: "Camiseta", marca: "Scalpers", colorPrincipal: "Gris", corte: "Manga Corta", estampado: "Liso" },
    { nombre: "Polo negro (Boss)", tipo: "Polo", marca: "Boss", colorPrincipal: "Negro", corte: "Manga Corta", estampado: "Liso" },
    { nombre: "Polo gris (Boss)", tipo: "Polo", marca: "Boss", colorPrincipal: "Gris", corte: "Manga Corta", estampado: "Liso" },

    // Camisas y Trajes
    { nombre: "Camisa blanca (Zara)", tipo: "Camisa", marca: "Zara", colorPrincipal: "Blanco", corte: "Manga Larga", estampado: "Liso" },
    { nombre: "Camisa blanca (Uniqlo)", tipo: "Camisa", marca: "Uniqlo", colorPrincipal: "Blanco", corte: "Manga Larga", estampado: "Liso" },
    { nombre: "Camisa verde", tipo: "Camisa", colorPrincipal: "Verde", corte: "Manga Larga", estampado: "Liso" },
    { nombre: "Camisa roja a cuadros", tipo: "Camisa", colorPrincipal: "Rojo", corte: "Manga Larga", detalles: "A cuadros" },
    { nombre: "Americana de traje (Zara)", tipo: "Americana", marca: "Zara", detalles: "Americana de traje" },
    { nombre: "Traje completo (Uniqlo)", tipo: "Traje", marca: "Uniqlo", detalles: "Traje completo" },

    // Jerséis
    { nombre: "Jersey (Boss)", tipo: "Jersey", marca: "Boss", corte: "Manga Larga", estampado: "Liso" },
    { nombre: "Jersey beige (Uniqlo)", tipo: "Jersey", marca: "Uniqlo", colorPrincipal: "Beige", corte: "Manga Larga", estampado: "Liso" },
    { nombre: "Jersey a rayas (Silbon)", tipo: "Jersey", marca: "Silbon", corte: "Manga Larga", estampado: "Rayas Claro" },
    { nombre: "Jersey de chándal azul (Decathlon)", tipo: "Jersey", marca: "Decathlon", colorPrincipal: "Azul", corte: "Manga Larga", tejido: "Chándal", estampado: "Liso" },
    { nombre: "Jersey de chándal gris (Decathlon)", tipo: "Jersey", marca: "Decathlon", colorPrincipal: "Gris", corte: "Manga Larga", tejido: "Chándal", estampado: "Liso" },

    // Calzado
    { nombre: "Chanclas Havaianas", tipo: "Chanclas", marca: "Havaianas" },
    { nombre: "Chanclas Crocs grises", tipo: "Chanclas", marca: "Crocs", colorPrincipal: "Gris" },
    { nombre: "Zapatillas Reebok blancas", tipo: "Zapatillas", marca: "Reebok", colorPrincipal: "Blanco" },
    { nombre: "Zapatillas Adidas", tipo: "Zapatillas", marca: "Adidas" },
    { nombre: "Zapatos de traje negros", tipo: "Zapatos", colorPrincipal: "Negro", detalles: "Zapatos de traje" },
    { nombre: "Zapato de traje marrón", tipo: "Zapatos", colorPrincipal: "Marrón", detalles: "Zapato de traje" },

    // Accesorios
    { nombre: "Cinturón marrón", tipo: "Cinturón", colorPrincipal: "Marrón" },
  ];

  console.log(`Creando ${prendasAInsertar.length} prendas en el armario de Madrid...`);

  for (const p of prendasAInsertar) {
    await prisma.fPrenda.create({
      data: {
        nombre: p.nombre,
        idTipo: getTipoId(p.tipo),
        idMarca: getMarcaId(p.marca),
        idColorPrincipal: getColorId(p.colorPrincipal),
        idCorte: getCorteId(p.corte),
        idTejido: getTejidoId(p.tejido),
        idEstampado: getEstampadoId(p.estampado),
        idUbicacion: madridId,
        detalles: p.detalles || null,
      },
    });
  }

  console.log("Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());