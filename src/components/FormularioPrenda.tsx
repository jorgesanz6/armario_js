"use client";

import { useState, useTransition, useRef } from "react";
import {
  crearPrenda,
  editarPrenda,
  getDimensiones,
  type ActionResult,
} from "@/lib/actions";
import {
  mostrarCorte,
  cortesPermitidos,
  reglaTejido,
  esPucela,
  mostrarEstampado,
  mostrarColorSecundario,
  COLORES_PUCELA,
  MARCAS_PUCELA,
  ID_VAQUERO,
  ID_ESTAMPADO_LISO,
} from "@/lib/reglas-formulario";

type Dimensiones = Awaited<ReturnType<typeof getDimensiones>>;

export interface PrendaExistente {
  id: number;
  idTipo: number | null;
  idCorte: number | null;
  idTejido: number | null;
  idMarca: number | null;
  idUbicacion: number | null;
  idEstampado: number | null;
  idColorPrincipal: number | null;
  idColorSecundario: number | null;
  urlImagen: string | null;
  detalles: string | null;
  nombre: string | null;
  tipo: { id: number; nombre: string } | null;
  corte: { id: number; nombre: string } | null;
  tejido: { id: number; nombre: string } | null;
  marca: { id: number; nombre: string } | null;
  ubicacion: { id: number; nombre: string } | null;
  estampado: { id: number; nombre: string } | null;
  colorPrincipal: { id: number; nombre: string } | null;
  colorSecundario: { id: number; nombre: string } | null;
}

interface FormProps {
  dimensiones: Dimensiones;
  prenda?: PrendaExistente | null;
  ubicacionId: number;
  onClose: () => void;
}

export default function FormularioPrenda({ dimensiones, prenda, ubicacionId, onClose }: FormProps) {
  const [isPending, startTransition] = useTransition();
  const [showDetalles, setShowDetalles] = useState(false);
  const [idTipo, setIdTipo] = useState<number | null>(prenda?.idTipo ?? null);
  const [idCorte, setIdCorte] = useState<number | null>(prenda?.idCorte ?? null);
  const [idTejido, setIdTejido] = useState<number | null>(prenda?.idTejido ?? null);
  const [idMarca, setIdMarca] = useState<number | null>(prenda?.idMarca ?? null);
  const [idEstampado, setIdEstampado] = useState<number | null>(prenda?.idEstampado ?? null);
  const [idColorPrincipal, setIdColorPrincipal] = useState<number | null>(prenda?.idColorPrincipal ?? null);
  const [idColorSecundario, setIdColorSecundario] = useState<number | null>(prenda?.idColorSecundario ?? null);
  const [detalles, setDetalles] = useState<string>(prenda?.detalles ?? "");
  const [nombre, setNombre] = useState<string>(prenda?.nombre ?? "");
  const [urlImagen, setUrlImagen] = useState<string>(prenda?.urlImagen ?? "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tipoNombre = dimensiones.tipos.find((t) => t.id === idTipo)?.nombre ?? "";
  const pucela = esPucela(tipoNombre);
  const showCorte = !pucela && mostrarCorte(tipoNombre);
  const showTejido = !pucela && reglaTejido(tipoNombre) !== "oculto";
  const showEstampado = !pucela && mostrarEstampado(tipoNombre);
  const estampadoNombre = dimensiones.estampados.find((e) => e.id === idEstampado)?.nombre ?? null;
  const showColorSecundario = !pucela && mostrarColorSecundario(estampadoNombre);

  const tejidoRegla = reglaTejido(tipoNombre);
  const cortesOpts = cortesPermitidos(tipoNombre);

  // Filtrar opciones según reglas
  const cortesFiltrados = cortesOpts
    ? dimensiones.cortes.filter((c) => cortesOpts.includes(c.id))
    : [];
  const tejidosFiltrados =
    tejidoRegla === "solo-vaquero"
      ? dimensiones.tejidos.filter((t) => t.id === ID_VAQUERO)
      : tejidoRegla === "sin-vaquero"
        ? dimensiones.tejidos.filter((t) => t.id !== ID_VAQUERO)
        : dimensiones.tejidos;
  const coloresPrincipales = pucela
    ? dimensiones.colores.filter((c) => COLORES_PUCELA.includes(c.id))
    : dimensiones.colores;
  const marcasOpts = pucela
    ? dimensiones.marcas.filter((m) => MARCAS_PUCELA.includes(m.id))
    : dimensiones.marcas;

  function handleTipoChange(newId: number | null) {
    setIdTipo(newId);
    const newNombre = newId ? dimensiones.tipos.find((t) => t.id === newId)?.nombre ?? "" : "";
    // Reset campos condicionales
    if (!mostrarCorte(newNombre)) setIdCorte(null);
    if (reglaTejido(newNombre) === "oculto") setIdTejido(null);
    if (!mostrarEstampado(newNombre)) setIdEstampado(null);
    if (esPucela(newNombre)) {
      setIdCorte(null);
      setIdTejido(null);
      setIdEstampado(null);
    }
  }

  function handleEstampadoChange(newId: number | null) {
    setIdEstampado(newId);
    if (newId === ID_ESTAMPADO_LISO) {
      setIdColorSecundario(null);
    }
  }

  async function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null);

    // Compress image before submitting
    const imageFile = formData.get("imagen") as File | null;
    if (imageFile && imageFile.size > 0) {
      try {
        const compressed = await compressImage(imageFile);
        formData.set("imagen", compressed);
      } catch {
        // If compression fails, send original
      }
    }

    startTransition(async () => {
      let result: ActionResult;
      if (prenda) {
        result = await editarPrenda(prenda.id, formData);
      } else {
        result = await crearPrenda(formData);
      }
      if (result.success) {
        onClose();
      } else {
        setErrorMsg(result.error);
      }
    });
  }

  const selectClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground";

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        action={handleSubmit}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-card-foreground">
          {prenda ? "Editar prenda" : "Nueva prenda"}
        </h2>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Imagen */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-card-foreground">
            Foto de la prenda
          </label>
          {urlImagen && (
            <div className="mb-2">
              <img src={urlImagen} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-border" />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.setAttribute("capture", "environment");
                  fileRef.current.click();
                }
              }}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
              </svg>
              Camara
            </button>
            <button
              type="button"
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.removeAttribute("capture");
                  fileRef.current.click();
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-card-foreground hover:bg-muted"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.5V6h18v10.5l-4.5-3-4.5 4.5-4.5-3-4.5 3Z" clipRule="evenodd" />
              </svg>
              Galeria
            </button>
          </div>
          {/* Single hidden file input - capture attr toggled by buttons */}
          <input
            ref={fileRef}
            type="file"
            name="imagen"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <input type="hidden" name="urlImagen" value={urlImagen} />
        </div>

        {/* Nombre */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-card-foreground">
            Nombre de la prenda
          </label>
          <input
            type="text"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={tipoNombre ? `${tipoNombre.toLowerCase()} ...` : "camiseta azul, pantalon vaquero..."}
            className={inputClass}
          />
        </div>

        {/* Tipo */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-card-foreground">
            Tipo de prenda
          </label>
          <select
            name="idTipo"
            value={idTipo ?? ""}
            onChange={(e) => handleTipoChange(e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          >
            <option value="">Seleccionar...</option>
            {dimensiones.tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Color Principal */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-card-foreground">
            Color principal
          </label>
          <select
            name="idColorPrincipal"
            value={idColorPrincipal ?? ""}
            onChange={(e) => setIdColorPrincipal(e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          >
            <option value="">Seleccionar...</option>
            {coloresPrincipales.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Marca */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-card-foreground">
            Marca
          </label>
          <select
            name="idMarca"
            value={idMarca ?? ""}
            onChange={(e) => setIdMarca(e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          >
            <option value="">Seleccionar...</option>
            {marcasOpts.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* + Detalles */}
        <div className="mb-3">
          <button type="button" onClick={() => setShowDetalles(!showDetalles)}
            className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
            + Detalles
            <span className="text-xs">{showDetalles ? "−" : "+"}</span>
          </button>
          {showDetalles && (
            <div className="mt-2 space-y-3">
              {/* Corte */}
              {showCorte && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">
                    Corte
                  </label>
                  <select
                    name="idCorte"
                    value={idCorte ?? 0}
                    onChange={(e) => setIdCorte(Number(e.target.value) || null)}
                    className={selectClass}
                  >
                    <option value={0}>Seleccionar...</option>
                    {cortesFiltrados.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tejido */}
              {showTejido && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">
                    Tejido
                  </label>
                  <select
                    name="idTejido"
                    value={idTejido ?? 0}
                    onChange={(e) => setIdTejido(Number(e.target.value) || null)}
                    className={selectClass}
                  >
                    <option value={0}>Seleccionar...</option>
                    {tejidosFiltrados.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Estampado */}
              {showEstampado && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">
                    Estampado
                  </label>
                  <select
                    name="idEstampado"
                    value={idEstampado ?? 0}
                    onChange={(e) =>
                      handleEstampadoChange(Number(e.target.value) || null)
                    }
                    className={selectClass}
                  >
                    <option value={0}>Seleccionar...</option>
                    {dimensiones.estampados.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Color Secundario */}
              {showColorSecundario && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">
                    Color secundario
                  </label>
                  <select
                    name="idColorSecundario"
                    value={idColorSecundario ?? 0}
                    onChange={(e) =>
                      setIdColorSecundario(Number(e.target.value) || null)
                    }
                    className={selectClass}
                  >
                    <option value={0}>Seleccionar...</option>
                    {dimensiones.colores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">
                  Notas
                </label>
                <textarea
                  name="detalles"
                  value={detalles}
                  onChange={(e) => setDetalles(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  placeholder="Notas opcionales..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Hidden fields */}
        <input type="hidden" name="idUbicacion" value={ubicacionId} />
        {!showCorte && <input type="hidden" name="idCorte" value="" />}
        {!showTejido && <input type="hidden" name="idTejido" value="" />}
        {!showEstampado && <input type="hidden" name="idEstampado" value="" />}
        {!showColorSecundario && (
          <input type="hidden" name="idColorSecundario" value="" />
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Guardando..." : prenda ? "Guardar cambios" : "Crear prenda"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-card-foreground hover:opacity-90"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
