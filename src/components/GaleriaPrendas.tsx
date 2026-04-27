"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import FormularioPrenda, { type PrendaExistente } from "./FormularioPrenda";
import { moverPrenda, eliminarPrenda } from "@/lib/actions";

type Prenda = PrendaExistente;

type Dimensiones = {
  tipos: { id: number; nombre: string }[];
  cortes: { id: number; nombre: string }[];
  colores: { id: number; nombre: string }[];
  estampados: { id: number; nombre: string }[];
  tejidos: { id: number; nombre: string }[];
  marcas: { id: number; nombre: string }[];
  ubicaciones: { id: number; nombre: string }[];
};

interface Props {
  dimensiones: Dimensiones;
  prendasMadrid: Prenda[];
  prendasValladolid: Prenda[];
  prendasTransito: Prenda[];
  madridId: number;
  valladolidId: number;
}

function TarjetaPrenda({
  prenda,
  destinoId,
  destinoNombre,
  onMover,
  onEliminar,
  onEditar,
}: {
  prenda: Prenda;
  destinoId: number;
  destinoNombre: string;
  onMover: (id: number, destinoId: number) => void;
  onEliminar: (id: number) => void;
  onEditar: (p: Prenda) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showActions, setShowActions] = useState(false);

  const etiquetas = [
    prenda.tipo.nombre,
    prenda.corte?.nombre,
    prenda.marca.nombre,
    prenda.colorPrincipal.nombre,
    prenda.estampado?.nombre,
    prenda.tejido?.nombre,
    prenda.colorSecundario?.nombre,
  ].filter(Boolean) as string[];

  return (
    <div
      className="group relative cursor-pointer rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md"
      onClick={() => setShowActions(!showActions)}
    >
      <div className="relative aspect-square bg-gray-100">
        <Image
          src={prenda.urlImagen}
          alt={prenda.tipo.nombre}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-gray-900 truncate">
          {prenda.tipo.nombre} - {prenda.marca.nombre}
        </p>
        <div className="mt-1 flex flex-wrap gap-0.5">
          {etiquetas.slice(1, 4).map((e) => (
            <span
              key={e}
              className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
            >
              {e}
            </span>
          ))}
        </div>
      </div>

      {showActions && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 p-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startTransition(() => onMover(prenda.id, destinoId));
            }}
            disabled={isPending}
            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Mover a {destinoNombre}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditar(prenda);
            }}
            className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Eliminar esta prenda?")) {
                startTransition(() => onEliminar(prenda.id));
              }
            }}
            disabled={isPending}
            className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Eliminar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(false);
            }}
            className="w-full rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/30"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

export default function GaleriaPrendas({
  dimensiones,
  prendasMadrid,
  prendasValladolid,
  prendasTransito,
  madridId,
  valladolidId,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editPrenda, setEditPrenda] = useState<Prenda | null>(null);

  function handleMover(id: number, destinoId: number) {
    moverPrenda(id, destinoId);
  }

  function handleEliminar(id: number) {
    eliminarPrenda(id);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">Inventario Ropa</h1>
          <button
            onClick={() => {
              setEditPrenda(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nueva
          </button>
        </div>
      </header>

      {/* Columnas Armarios */}
      <main className="mx-auto max-w-5xl px-4 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Madrid */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <h2 className="text-base font-semibold text-gray-800">Madrid</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {prendasMadrid.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {prendasMadrid.map((p) => (
                <TarjetaPrenda
                  key={p.id}
                  prenda={p}
                  destinoId={valladolidId}
                  destinoNombre="Valladolid"
                  onMover={handleMover}
                  onEliminar={handleEliminar}
                  onEditar={(prenda) => {
                    setEditPrenda(prenda);
                    setShowForm(true);
                  }}
                />
              ))}
              {prendasMadrid.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-gray-400">
                  Vacío
                </p>
              )}
            </div>
          </section>

          {/* Valladolid */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              <h2 className="text-base font-semibold text-gray-800">Valladolid</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {prendasValladolid.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {prendasValladolid.map((p) => (
                <TarjetaPrenda
                  key={p.id}
                  prenda={p}
                  destinoId={madridId}
                  destinoNombre="Madrid"
                  onMover={handleMover}
                  onEliminar={handleEliminar}
                  onEditar={(prenda) => {
                    setEditPrenda(prenda);
                    setShowForm(true);
                  }}
                />
              ))}
              {prendasValladolid.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-gray-400">
                  Vacío
                </p>
              )}
            </div>
          </section>
        </div>

        {/* En tránsito */}
        {prendasTransito.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <h2 className="text-base font-semibold text-gray-800">En tránsito</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {prendasTransito.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {prendasTransito.map((p) => (
                <TarjetaPrenda
                  key={p.id}
                  prenda={p}
                  destinoId={madridId}
                  destinoNombre="Madrid"
                  onMover={handleMover}
                  onEliminar={handleEliminar}
                  onEditar={(prenda) => {
                    setEditPrenda(prenda);
                    setShowForm(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal formulario */}
      {showForm && (
        <FormularioPrenda
          dimensiones={dimensiones}
          prenda={editPrenda}
          onClose={() => {
            setShowForm(false);
            setEditPrenda(null);
          }}
        />
      )}
    </div>
  );
}