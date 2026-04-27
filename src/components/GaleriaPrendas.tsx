"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import Image from "next/image";
import FormularioPrenda, { type PrendaExistente } from "./FormularioPrenda";
import { moverPrenda, eliminarPrenda } from "@/lib/actions";
import type { DashboardData } from "@/lib/actions";
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
  prenda, destinoId, destinoNombre, onMover, onEliminar, onEditar, onClose,
}: {
  prenda: Prenda; destinoId: number; destinoNombre: string;
  onMover: (id: number, destinoId: number) => void;
  onEliminar: (id: number) => void;
  onEditar: (p: Prenda) => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const etiquetas = [
    prenda.corte?.nombre, prenda.estampado?.nombre, prenda.tejido?.nombre,
    prenda.colorSecundario ? `${prenda.colorPrincipal.nombre} / ${prenda.colorSecundario.nombre}` : prenda.colorPrincipal.nombre,
  ].filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-card shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {prenda.urlImagen && (
          <div className="relative aspect-square bg-muted">
            <Image src={prenda.urlImagen} alt={prenda.tipo.nombre} fill className="object-cover" sizes="400px" />
          </div>
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-card-foreground">{prenda.tipo.nombre} — {prenda.marca.nombre}</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {etiquetas.map((e) => (
              <span key={e} className="inline-block rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{e}</span>
            ))}
          </div>
          {prenda.detalles && <p className="mt-2 text-sm text-muted-foreground">{prenda.detalles}</p>}
          <p className="mt-2 text-xs text-muted-foreground">Ubicacion: {prenda.ubicacion.nombre}</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => startTransition(async () => { await onMover(prenda.id, destinoId); })} disabled={isPending}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              Mover a {destinoNombre}
            </button>
            <button onClick={() => onEditar(prenda)} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600">Editar</button>
            <button onClick={() => { if (confirm("Eliminar?")) startTransition(async () => { await onEliminar(prenda.id); }); }} disabled={isPending}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">X</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ dimensiones, dashboard, onClose, filtroTipo, setFiltroTipo }: {
  dimensiones: Dimensiones; dashboard: DashboardData; onClose: () => void;
  filtroTipo: number | null; setFiltroTipo: (id: number | null) => void;
}) {
  const [section, setSection] = useState<"dashboard" | "gestion" | null>(null);
  const [dimTable, setDimTable] = useState<DimensionTable>("tipos");
  const [newNombre, setNewNombre] = useState("");
  const [isPending, startTransition] = useTransition();

  const dimLabels: Record<DimensionTable, string> = {
    tipos: "Tipos", cortes: "Cortes", colores: "Colores", estampados: "Estampados",
    tejidos: "Tejidos", marcas: "Marcas", ubicaciones: "Ubicaciones",
  };
  const currentItems = dimensiones[dimTable];

  function handleAdd() {
    if (!newNombre.trim()) return;
    startTransition(async () => { await agregarDimension(dimTable, newNombre.trim()); setNewNombre(""); });
  }
  function handleDelete(id: number) {
    startTransition(async () => { await eliminarDimension(dimTable, id); });
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="w-72 h-full bg-card shadow-xl overflow-y-auto border-r border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-bold text-card-foreground">Menu</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">x</button>
        </div>

        <div className="border-b border-border p-4">
          <h3 className="mb-2 text-sm font-semibold text-card-foreground">Filtrar por tipo</h3>
          <button onClick={() => { setFiltroTipo(null); onClose(); }}
            className={`mb-1 block w-full text-left rounded px-2 py-1 text-sm ${filtroTipo === null ? "bg-primary text-primary-foreground" : "text-card-foreground hover:bg-muted"}`}>
            Todos
          </button>
          {dimensiones.tipos.map((t) => (
            <button key={t.id} onClick={() => { setFiltroTipo(t.id); onClose(); }}
              className={`mb-1 block w-full text-left rounded px-2 py-1 text-sm ${filtroTipo === t.id ? "bg-primary text-primary-foreground" : "text-card-foreground hover:bg-muted"}`}>
              {t.nombre}
            </button>
          ))}
        </div>

        <div className="border-b border-border p-4">
          <button onClick={() => setSection(section === "dashboard" ? null : "dashboard")}
            className="flex w-full items-center justify-between text-sm font-semibold text-card-foreground">
            Dashboard <span className="text-muted-foreground">{section === "dashboard" ? "−" : "+"}</span>
          </button>
          {section === "dashboard" && (
            <div className="mt-2 space-y-2">
              {Object.entries(dashboard).map(([tipo, ubis]) => (
                <div key={tipo} className="rounded-lg bg-muted p-2">
                  <p className="text-xs font-semibold text-card-foreground">{tipo}</p>
                  {Object.entries(ubis).map(([ubi, count]) => (
                    <p key={ubi} className="text-xs text-muted-foreground pl-2">{ubi}: {count}</p>
                  ))}
                </div>
              ))}
              {Object.keys(dashboard).length === 0 && <p className="text-xs text-muted-foreground">Sin datos</p>}
            </div>
          )}
        </div>

        <div className="p-4">
          <button onClick={() => setSection(section === "gestion" ? null : "gestion")}
            className="flex w-full items-center justify-between text-sm font-semibold text-card-foreground">
            Gestionar catalogos <span className="text-muted-foreground">{section === "gestion" ? "−" : "+"}</span>
          </button>
          {section === "gestion" && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1 mb-3">
                {(Object.keys(dimLabels) as DimensionTable[]).map((key) => (
                  <button key={key} onClick={() => setDimTable(key)}
                    className={`rounded px-2 py-0.5 text-xs ${dimTable === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {dimLabels[key]}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 mb-2">
                <input value={newNombre} onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Nuevo..." className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
                <button onClick={handleAdd} disabled={isPending || !newNombre.trim()}
                  className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50">+</button>
              </div>
              <ul className="space-y-1">
                {currentItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded bg-muted px-2 py-1">
                    <span className="text-xs text-card-foreground">{item.nombre}</span>
                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-500 text-xs">x</button>
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

function PrendaCard({ prenda, destinoId, onMover, onOpenDetail }: {
  prenda: Prenda; destinoId: number;
  onMover: (id: number, destinoId: number) => void;
  onOpenDetail: (p: Prenda) => void;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const startPress = useCallback(() => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onOpenDetail(prenda);
    }, 400);
  }, [prenda, onOpenDetail]);

  const endPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!longPressTriggered.current) {
      onMover(prenda.id, destinoId);
    }
  }, [prenda, destinoId, onMover]);

  return (
    <button
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      className="w-full flex items-center justify-between rounded-lg bg-card border border-border px-3 py-2.5 text-left shadow-sm active:scale-[0.98] transition-transform select-none"
    >
      <span className="text-sm font-medium text-card-foreground">{prenda.tipo.nombre}</span>
      <span className="text-xs text-muted-foreground">{prenda.marca.nombre}</span>
    </button>
  );
}

export default function GaleriaPrendas({
  dimensiones, prendasMadrid, prendasValladolid, prendasTransito, madridId, valladolidId, dashboard,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editPrenda, setEditPrenda] = useState<Prenda | null>(null);
  const [detallePrenda, setDetallePrenda] = useState<Prenda | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<number | null>(null);
  const [preselectedUbicacion, setPreselectedUbicacion] = useState<number>(madridId);
  const [, startTransition] = useTransition();

  function handleMover(id: number, destinoId: number) {
    startTransition(async () => { await moverPrenda(id, destinoId); });
  }
  function handleEliminar(id: number) {
    startTransition(async () => { await eliminarPrenda(id); });
  }

  function filterList(prendas: Prenda[]) {
    if (!filtroTipo) return prendas;
    return prendas.filter((p) => p.idTipo === filtroTipo);
  }

  const madrid = filterList(prendasMadrid);
  const valladolid = filterList(prendasValladolid);
  const transito = filterList(prendasTransito);
  const filtroNombre = filtroTipo ? dimensiones.tipos.find((t) => t.id === filtroTipo)?.nombre : null;

  function toggleDark() {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(true)} className="rounded-lg p-1.5 hover:bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-foreground">
                <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-foreground">Armario</h1>
          </div>
          <div className="flex items-center gap-2">
            {filtroNombre && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {filtroNombre}
                <button onClick={() => setFiltroTipo(null)} className="ml-1 opacity-60 hover:opacity-100">x</button>
              </span>
            )}
            <button onClick={toggleDark} className="rounded-lg p-1.5 hover:bg-muted" title="Modo oscuro">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-foreground dark:hidden">
                <path fillRule="evenodd" d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Zm-9.25-6.5a.75.75 0 0 0-1.06-.04A7.5 7.5 0 0 0 12 19.25a.75.75 0 0 0 .55-1.26A6 6 0 0 1 12.75 5.81a.75.75 0 0 0 0-1.31Z" clipRule="evenodd" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-foreground hidden dark:block">
                <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM12 18.75a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75Zm-7.28-2.47a.75.75 0 0 1 1.06 1.06l-1.59 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.59ZM2.25 12a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm15.22-5.28a.75.75 0 0 1 1.06-1.06l1.59 1.59a.75.75 0 1 1-1.06 1.06l-1.59-1.59Zm1.59 10.84a.75.75 0 1 1-1.06 1.06l-1.59-1.59a.75.75 0 1 1 1.06-1.06l1.59 1.59ZM18.75 12a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H19.5a.75.75 0 0 1-.75-.75Z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4">
        <p className="mb-3 text-xs text-muted-foreground">Toca para mover · Deja pulsado para ver detalle</p>
        <div className="grid grid-cols-2 gap-3">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <h2 className="text-base font-semibold text-foreground">Madrid</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{madrid.length}</span>
              <button onClick={() => { setEditPrenda(null); setPreselectedUbicacion(madridId); setShowForm(true); }}
                className="ml-auto rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground hover:opacity-90">+</button>
            </div>
            <div className="space-y-1.5">
              {madrid.map((p) => (
                <PrendaCard key={p.id} prenda={p} destinoId={valladolidId} onMover={handleMover} onOpenDetail={setDetallePrenda} />
              ))}
              {madrid.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Vacio</p>}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              <h2 className="text-base font-semibold text-foreground">Valladolid</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{valladolid.length}</span>
              <button onClick={() => { setEditPrenda(null); setPreselectedUbicacion(valladolidId); setShowForm(true); }}
                className="ml-auto rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground hover:opacity-90">+</button>
            </div>
            <div className="space-y-1.5">
              {valladolid.map((p) => (
                <PrendaCard key={p.id} prenda={p} destinoId={madridId} onMover={handleMover} onOpenDetail={setDetallePrenda} />
              ))}
              {valladolid.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Vacio</p>}
            </div>
          </section>
        </div>

        {transito.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <h2 className="text-base font-semibold text-foreground">En transito</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{transito.length}</span>
            </div>
            <div className="space-y-1.5">
              {transito.map((p) => (
                <PrendaCard key={p.id} prenda={p} destinoId={madridId} onMover={handleMover} onOpenDetail={setDetallePrenda} />
              ))}
            </div>
          </section>
        )}
      </main>

      {detallePrenda && (
        <DetallePrenda prenda={detallePrenda}
          destinoId={detallePrenda.idUbicacion === madridId ? valladolidId : madridId}
          destinoNombre={detallePrenda.idUbicacion === madridId ? "Valladolid" : "Madrid"}
          onMover={handleMover} onEliminar={handleEliminar}
          onEditar={(p) => { setDetallePrenda(null); setEditPrenda(p); setShowForm(true); }}
          onClose={() => setDetallePrenda(null)} />
      )}
      {showSidebar && (
        <Sidebar dimensiones={dimensiones} dashboard={dashboard} onClose={() => setShowSidebar(false)}
          filtroTipo={filtroTipo} setFiltroTipo={setFiltroTipo} />
      )}
      {showForm && (
        <FormularioPrenda dimensiones={dimensiones} prenda={editPrenda} ubicacionId={editPrenda ? editPrenda.idUbicacion : preselectedUbicacion}
          onClose={() => { setShowForm(false); setEditPrenda(null); }} />
      )}
    </div>
  );
}