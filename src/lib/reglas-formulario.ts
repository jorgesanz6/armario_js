// Reglas condicionales del formulario según Tipo_Prenda
// IDs basados en orden de seed (autoincrement starting at 1)

// Dim_Corte IDs: Manga Larga=1, Manga Corta=2, Pantalón Largo=3, Pantalón Corto=4
export const REGLAS_CORTE: Record<string, number[]> = {
  Camiseta: [1, 2],
  "Pantalón": [3, 4],
};

// Dim_Tejido IDs: Punto=1, Franela=2, Vaquero=3, Chándal=4
export const REGLAS_TEJIDO: Record<string, "solo-vaquero" | "sin-vaquero" | "oculto"> = {
  "Pantalón": "solo-vaquero",
  Jersey: "sin-vaquero",
  Sudadera: "sin-vaquero",
  Chaqueta: "sin-vaquero",
  Camisa: "sin-vaquero",
};

// Dim_Color IDs: Blanco=1, Negro=2, Amarillo=8, Morado=13
export const COLORES_PUCELA = [1, 2, 8, 13];
// Dim_Marca IDs: Kappa=11, Adidas=2, Reebok=12
export const MARCAS_PUCELA = [11, 2, 12];

// Dim_Tejido: Vaquero=3
export const ID_VAQUERO = 3;
// Dim_Estampado: Liso=1
export const ID_ESTAMPADO_LISO = 1;

export function mostrarCorte(tipoNombre: string): boolean {
  return tipoNombre in REGLAS_CORTE;
}

export function cortesPermitidos(tipoNombre: string): number[] | null {
  return REGLAS_CORTE[tipoNombre] ?? null;
}

export function reglaTejido(tipoNombre: string): "solo-vaquero" | "sin-vaquero" | "oculto" {
  return REGLAS_TEJIDO[tipoNombre] ?? "oculto";
}

export function esPucela(tipoNombre: string): boolean {
  return tipoNombre === "Equipación Pucela";
}

export function mostrarEstampado(tipoNombre: string): boolean {
  return !esPucela(tipoNombre);
}

export function mostrarColorSecundario(estampadoNombre: string | null): boolean {
  return estampadoNombre === "Rayas Claro" || estampadoNombre === "Rayas Oscuro";
}