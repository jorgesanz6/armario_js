"use client";

import { useState, useTransition } from "react";
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
  idTipo: number;
  idCorte: number | null;
  idTejido: number | null;
  idMarca: number;
  idUbicacion: number;
  idEstampado: number | null;
  idColorPrincipal: number;
  idColorSecundario: number | null;
  urlImagen: string;
  detalles: string | null;
  tipo: { id: number; nombre: string };
  corte: { id: number; nombre: string } | null;
  tejido: { id: number; nombre: string } | null;
  marca: { id: number; nombre: string };
  ubicacion: { id: number; nombre: string };
  estampado: { id: number; nombre: string } | null;
  colorPrincipal: { id: number; nombre: string };
  colorSecundario: { id: number; nombre: string } | null;
}

interface FormProps {
  dimensiones: Dimensiones;
  prenda?: PrendaExistente | null;
  onClose: () => void;
}

export default function FormularioPrenda({ dimensiones, prenda, onClose }: FormProps) {
  const [isPending, startTransition] = useTransition();
  const [idTipo, setIdTipo] = useState<number>(prenda?.idTipo ?? 0);
  const [idCorte, setIdCorte] = useState<number | null>(prenda?.idCorte ?? null);
  const [idTejido, setIdTejido] = useState<number | null>(prenda?.idTejido ?? null);
  const [idMarca, setIdMarca] = useState<number>(prenda?.idMarca ?? 0);
  const [idUbicacion, setIdUbicacion] = useState<number>(prenda?.idUbicacion ?? 0);
  const [idEstampado, setIdEstampado] = useState<number | null>(prenda?.idEstampado ?? null);
  const [idColorPrincipal, setIdColorPrincipal] = useState<number>(prenda?.idColorPrincipal ?? 0);
  const [idColorSecundario, setIdColorSecundario] = useState<number | null>(prenda?.idColorSecundario ?? null);
  const [detalles, setDetalles] = useState<string>(prenda?.detalles ?? "");
  const [urlImagen, setUrlImagen] = useState<string>(prenda?.urlImagen ?? "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  function handleTipoChange(newId: number) {
    setIdTipo(newId);
    const newNombre = dimensiones.tipos.find((t) => t.id === newId)?.nombre ?? "";
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

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null);
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
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        action={handleSubmit}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {prenda ? "Editar prenda" : "Nueva prenda"}
        </h2>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Imagen */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Foto de la prenda {!prenda && "*"}
          </label>
          {urlImagen && (
            <div className="mb-2">
              <img src={urlImagen} alt="Preview" className="h-20 w-20 rounded object-cover" />
            </div>
          )}
          <input
            type="file"
            name="imagen"
            accept="image/*"
            required={!prenda && !urlImagen}
            className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
          <input type="hidden" name="urlImagen" value={urlImagen} />
        </div>

        {/* Tipo */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tipo de prenda *
          </label>
          <select
            name="idTipo"
            value={idTipo}
            onChange={(e) => handleTipoChange(Number(e.target.value))}
            className={selectClass}
            required
          >
            <option value={0}>Seleccionar...</option>
            {dimensiones.tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Corte */}
        {showCorte && (
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Corte *
            </label>
            <select
              name="idCorte"
              value={idCorte ?? 0}
              onChange={(e) => setIdCorte(Number(e.target.value) || null)}
              className={selectClass}
              required
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
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tejido *
            </label>
            <select
              name="idTejido"
              value={idTejido ?? 0}
              onChange={(e) => setIdTejido(Number(e.target.value) || null)}
              className={selectClass}
              required
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
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Estampado *
            </label>
            <select
              name="idEstampado"
              value={idEstampado ?? 0}
              onChange={(e) =>
                handleEstampadoChange(Number(e.target.value) || null)
              }
              className={selectClass}
              required
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

        {/* Color Principal */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Color principal *
          </label>
          <select
            name="idColorPrincipal"
            value={idColorPrincipal}
            onChange={(e) => setIdColorPrincipal(Number(e.target.value))}
            className={selectClass}
            required
          >
            <option value={0}>Seleccionar...</option>
            {coloresPrincipales.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Color Secundario */}
        {showColorSecundario && (
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Color secundario *
            </label>
            <select
              name="idColorSecundario"
              value={idColorSecundario ?? 0}
              onChange={(e) =>
                setIdColorSecundario(Number(e.target.value) || null)
              }
              className={selectClass}
              required
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

        {/* Marca */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Marca *
          </label>
          <select
            name="idMarca"
            value={idMarca}
            onChange={(e) => setIdMarca(Number(e.target.value))}
            className={selectClass}
            required
          >
            <option value={0}>Seleccionar...</option>
            {marcasOpts.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Ubicación */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ubicación *
          </label>
          <select
            name="idUbicacion"
            value={idUbicacion}
            onChange={(e) => setIdUbicacion(Number(e.target.value))}
            className={selectClass}
            required
          >
            <option value={0}>Seleccionar...</option>
            {dimensiones.ubicaciones.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Detalles */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Detalles
          </label>
          <textarea
            name="detalles"
            value={detalles}
            onChange={(e) => setDetalles(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="Notas opcionales..."
          />
        </div>

        {/* Hidden fields para campos ocultos */}
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
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Guardando..." : prenda ? "Guardar cambios" : "Crear prenda"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}