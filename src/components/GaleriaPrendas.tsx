"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import FormularioPrenda, { type PrendaExistente } from "./FormularioPrenda";
import { moverPrenda, eliminarPrenda } from "@/lib/actions";
import type { ActionResult, DashboardData } from "@/lib/actions";
import { agregarDimension, eliminarDimension } from "@/lib/actions";

type Prenda = PrendaExistente;

type DimensionTable = "tipos" | "cortes" | "colores" | "estampados" | "tejidos" | "marcas" | "ubicaciones";

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
  dashboard: DashboardData;
}

function DetallePrenda({
  prenda,
  destinoId,
  destinoNombre,
  onMover,
  onEliminar,
  onEditar,
  onClose,
}: {
  prenda: Prenda;
  destinoId: number;
  destinoNombre: string;
  onMover: (id: number, destinoId: number) => void;
  onEliminar: (id: number) => void;
  onEditar: (p: Prenda) => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const etiquetas = [
    prenda.corte?.nombre,
    prenda.estampado?.nombre,
    prenda.tejido?.nombre,
    prenda.colorSecundario ? `${prenda.colorPrincipal.nombre} / ${prenda.colorSecundario.nombre}` : prenda.colorPrincipal.nombre,
  ].filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        {prenda.urlImagen && (
          <div className="relative aspect-square bg-gray-100">
            <Image src={prenda.urlImagen} alt={prenda.tipo.nombre} fill className="object-cover" sizes="400px" />
          </div>
        )}

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {prenda.tipo.nombre} — {prenda.marca.nombre}
          </h3>

          <div className="mt-2 flex flex-wrap gap-1">
            {etiquetas.map((e) => (
              <span key={e} className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {e}
              </span>
            ))}
          </div>

          {prenda.detalles && (
            <p className="mt-2 text-sm text-gray-500">{prenda.detalles}</p>
          )}

          <p className="mt-2 text-xs text-gray-400">Ubicación: {prenda.ubicacion.nombre}</p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => startTransition(() => onMover(prenda.id, destinoId))}
              disabled={isPending}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Mover a {destinoNombre}
            </button>
            <button
              onClick={() => onEditar(prenda)}
              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Editar
            </button>
            <button
              onClick={() => {
                if (confirm("Eliminar esta prenda?")) startTransition(() => onEliminar(prenda.id));
              }}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              X
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  dimensiones,
  dashboard,
  onClose,
  filtroTipo,
  setFiltroTipo,
}: {
  dimensiones: Dimensiones;
  dashboard: DashboardData;
  onClose: () => void;
  filtroTipo: number | null;
  setFiltroTipo: (id: number | null) => void;
}) {
  const [section, setSection] = useState<"dashboard" | "gestion" | null>(null);
  const [dimTable, setDimTable] = useState<DimensionTable>("tipos");
  const [newNombre, setNewNombre] = useState("");
  const [isPending, startTransition] = useTransition();

  const dimLabels: Record<DimensionTable, string> = {
    tipos: "Tipos de prenda",
    cortes: "Cortes",
    colores: "Colores",
    estampados: "Estampados",
    tejidos: "Tejidos",
    marcas: "Marcas",
    ubicaciones: "Ubicaciones",
  };

  const currentItems = dimensiones[dimTable];

  function handleAdd() {
    if (!newNombre.trim()) return;
    startTransition(async () => {
      await agregarDimension(dimTable, newNombre.trim());
      setNewNombre("");
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await eliminarDimension(dimTable, id);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="w-72 h-full bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-bold text-gray-900">Menu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
        </div>

        {/* Filtros */}
        <div className="border-b p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Filtrar por tipo</h3>
          <button
            onClick={() => { setFiltroTipo(null); onClose(); }}
            className={`mb-1 block w-full text-left rounded px-2 py-1 text-sm ${filtroTipo === null ? "bg-blue-100 text-blue-800" : "hover:bg-gray-50"}`}
          >
            Todos
          </button>
          {dimensiones.tipos.map((t) => (
            <button
              key={t.id}
              onClick={() => { setFiltroTipo(t.id); onClose(); }}
              className={`mb-1 block w-full text-left rounded px-2 py-1 text-sm ${filtroTipo === t.id ? "bg-blue-100 text-blue-800" : "hover:bg-gray-50"}`}
            >
              {t.nombre}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        <div className="border-b p-4">
          <button
            onClick={() => setSection(section === "dashboard" ? null : "dashboard")}
            className="flex w-full items-center justify-between text-sm font-semibold text-gray-700"
          >
            Dashboard
            <span className="text-gray-400">{section === "dashboard" ? "−" : "+"}</span>
          </button>
          {section === "dashboard" && (
            <div className="mt-2 space-y-2">
              {Object.entries(dashboard).map(([tipo, ubis]) => (
                <div key={tipo} className="rounded-lg bg-gray-50 p-2">
                  <p className="text-xs font-semibold text-gray-800">{tipo}</p>
                  {Object.entries(ubis).map(([ubi, count]) => (
                    <p key={ubi} className="text-xs text-gray-600 pl-2">
                      {ubi}: {count}
                    </p>
                  ))}
                </div>
              ))}
              {Object.keys(dashboard).length === 0 && (
                <p className="text-xs text-gray-400">Sin datos</p>
              )}
            </div>
          )}
        </div>

        {/* Gestion dimensiones */}
        <div className="p-4">
          <button
            onClick={() => setSection(section === "gestion" ? null : "gestion")}
            className="flex w-full items-center justify-between text-sm font-semibold text-gray-700"
          >
            Gestionar catalogos
            <span className="text-gray-400">{section === "gestion" ? "−" : "+"}</span>
          </button>
          {section === "gestion" && (
            <div className="mt-2">
              {/* Tab selector */}
              <div className="flex flex-wrap gap-1 mb-3">
                {(Object.keys(dimLabels) as DimensionTable[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setDimTable(key)}
                    className={`rounded px-2 py-0.5 text-xs ${dimTable === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    {dimLabels[key]}
                  </button>
                ))}
              </div>

              {/* Add new */}
              <div className="flex gap-1 mb-2">
                <input
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder={`Nuevo ${dimLabels[dimTable].toLowerCase().replace("tipos de prenda", "tipo")}...`}
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <button
                  onClick={handleAdd}
                  disabled={isPending || !newNombre.trim()}
                  className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                >
                  +
                </button>
              </div>

              {/* List */}
              <ul className="space-y-1">
                {currentItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
                    <span className="text-xs text-gray-700">{item.nombre}</span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
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
  dashboard,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editPrenda, setEditPrenda] = useState<Prenda | null>(null);
  const [detallePrenda, setDetallePrenda] = useState<Prenda | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<number | null>(null);

  function handleMover(id: number, destinoId: number) {
    startTransition(async () => { await moverPrenda(id, destinoId); });
  }

  function handleEliminar(id: number) {
    startTransition(async () => { await eliminarPrenda(id); });
  }

  const [isPending, startTransition] = useTransition();

  function filterList(prendas: Prenda[]) {
    if (!filtroTipo) return prendas;
    return prendas.filter((p) => p.idTipo === filtroTipo);
  }

  const madrid = filterList(prendasMadrid);
  const valladolid = filterList(prendasValladolid);
  const transito = filterList(prendasTransito);

  const filtroNombre = filtroTipo ? dimensiones.tipos.find((t) => t.id === filtroTipo)?.nombre : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(true)}
              className="rounded-lg p-1.5 hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-700">
                <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Armario</h1>
          </div>
          <div className="flex items-center gap-2">
            {filtroNombre && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {filtroNombre}
                <button onClick={() => setFiltroTipo(null)} className="ml-1 text-blue-400 hover:text-blue-700">x</button>
              </span>
            )}
            <button
              onClick={() => { setEditPrenda(null); setShowForm(true); }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Nueva
            </button>
          </div>
        </div>
      </header>

      {/* Columns */}
      <main className="mx-auto max-w-5xl px-4 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Madrid */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <h2 className="text-base font-semibold text-gray-800">Madrid</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{madrid.length}</span>
            </div>
            <div className="space-y-1.5">
              {madrid.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDetallePrenda(p)}
                  className="w-full flex items-center justify-between rounded-lg bg-white border border-gray-100 px-3 py-2.5 text-left shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-sm font-medium text-gray-900">{p.tipo.nombre}</span>
                  <span className="text-xs text-gray-500">{p.marca.nombre}</span>
                </button>
              ))}
              {madrid.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Vacio</p>}
            </div>
          </section>

          {/* Valladolid */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              <h2 className="text-base font-semibold text-gray-800">Valladolid</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{valladolid.length}</span>
            </div>
            <div className="space-y-1.5">
              {valladolid.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDetallePrenda(p)}
                  className="w-full flex items-center justify-between rounded-lg bg-white border border-gray-100 px-3 py-2.5 text-left shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-sm font-medium text-gray-900">{p.tipo.nombre}</span>
                  <span className="text-xs text-gray-500">{p.marca.nombre}</span>
                </button>
              ))}
              {valladolid.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Vacio</p>}
            </div>
          </section>
        </div>

        {/* En transito */}
        {transito.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <h2 className="text-base font-semibold text-gray-800">En transito</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{transito.length}</span>
            </div>
            <div className="space-y-1.5">
              {transito.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDetallePrenda(p)}
                  className="w-full flex items-center justify-between rounded-lg bg-white border border-gray-100 px-3 py-2.5 text-left shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-sm font-medium text-gray-900">{p.tipo.nombre}</span>
                  <span className="text-xs text-gray-500">{p.marca.nombre}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Detail overlay */}
      {detallePrenda && (
        <DetallePrenda
          prenda={detallePrenda}
          destinoId={detallePrenda.idUbicacion === madridId ? valladolidId : madridId}
          destinoNombre={detallePrenda.idUbicacion === madridId ? "Valladolid" : "Madrid"}
          onMover={handleMover}
          onEliminar={handleEliminar}
          onEditar={(p) => { setDetallePrenda(null); setEditPrenda(p); setShowForm(true); }}
          onClose={() => setDetallePrenda(null)}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          dimensiones={dimensiones}
          dashboard={dashboard}
          onClose={() => setShowSidebar(false)}
          filtroTipo={filtroTipo}
          setFiltroTipo={setFiltroTipo}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <FormularioPrenda
          dimensiones={dimensiones}
          prenda={editPrenda}
          onClose={() => { setShowForm(false); setEditPrenda(null); }}
        />
      )}
    </div>
  );
}