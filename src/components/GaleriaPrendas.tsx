"use client";

import { useState, useTransition, useRef, useCallback, useEffect, useMemo, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FormularioPrenda, { type PrendaExistente } from "./FormularioPrenda";
import { moverPrenda, eliminarPrenda } from "@/lib/actions";
import type { DashboardData } from "@/lib/actions";
import { agregarDimension, eliminarDimension } from "@/lib/actions";

type Prenda = PrendaExistente;
type DimensionTable = "tipos" | "cortes" | "colores" | "estampados" | "tejidos" | "marcas" | "ubicaciones";
type SortBy = "reciente" | "marca" | "tipo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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

// --- Toast ---
type Toast = { id: number; msg: string; type: "ok" | "err" };
let toastCounter = 0;

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-opacity animate-in fade-in ${
          t.type === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>{t.msg}</div>
      ))}
    </div>
  );
}

// --- Loading skeleton ---
function Skeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="h-6 w-24 rounded bg-muted animate-pulse" />
          <div className="h-6 w-6 rounded bg-muted animate-pulse" />
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-2">
          <div className="h-8 w-full rounded-lg bg-muted animate-pulse" />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {["Madrid", "Valladolid"].map((city) => (
            <section key={city}>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
              </div>
              <div className="space-y-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-full rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

// --- DetallePrenda ---
function DetallePrenda({
  prenda, destinoId, destinoNombre, onMover, onEliminar, onEditar, onClose,
}: {
  prenda: Prenda; destinoId: number; destinoNombre: string;
  onMover: (id: number, destinoId: number) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
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
            <button onClick={() => startTransition(async () => { await onMover(prenda.id, destinoId); onClose(); })} disabled={isPending}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              Mover a {destinoNombre}
            </button>
            <button onClick={() => onEditar(prenda)} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600">Editar</button>
            <button onClick={() => { if (confirm("Eliminar?")) startTransition(async () => { await onEliminar(prenda.id); onClose(); }); }} disabled={isPending}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">X</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sidebar ---
function Sidebar({ dimensiones, dashboard, onClose, filtroTipo, setFiltroTipo, sortBy, setSortBy, onExport }: {
  dimensiones: Dimensiones; dashboard: DashboardData; onClose: () => void;
  filtroTipo: number | null; setFiltroTipo: (id: number | null) => void;
  sortBy: SortBy; setSortBy: (s: SortBy) => void;
  onExport: () => void;
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
  const sortOptions: { value: SortBy; label: string }[] = [
    { value: "reciente", label: "Reciente" },
    { value: "tipo", label: "Tipo" },
    { value: "marca", label: "Marca" },
  ];

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
          <h3 className="mb-2 text-sm font-semibold text-card-foreground">Ordenar por</h3>
          <div className="flex gap-1">
            {sortOptions.map((opt) => (
              <button key={opt.value} onClick={() => { setSortBy(opt.value); onClose(); }}
                className={`rounded px-2 py-0.5 text-xs ${sortBy === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {opt.label}
              </button>
            ))}
          </div>
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

        <div className="border-b border-border p-4">
          <button onClick={onExport}
            className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-card-foreground hover:bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 15a.75.75 0 0 1 .75.75v2.25h14.25v-2.25a.75.75 0 0 1 1.5 0v2.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-2.25a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
            </svg>
            Exportar CSV
          </button>
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

// --- PrendaCard (memoized) ---
const PrendaCard = memo(function PrendaCard({ prenda, destinoId, onMover, onOpenDetail, isTransit }: {
  prenda: Prenda; destinoId: number;
  onMover: (id: number, destinoId: number) => void;
  onOpenDetail: (p: Prenda) => void;
  isTransit?: boolean;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const pressStarted = useRef(false);

  const startPress = useCallback(() => {
    pressStarted.current = true;
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
    if (pressStarted.current && !longPressTriggered.current) {
      onMover(prenda.id, destinoId);
    }
    pressStarted.current = false;
  }, [prenda, destinoId, onMover]);

  return (
    <button
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      className={`w-full flex items-center justify-between rounded-lg bg-card border px-3 py-2.5 text-left shadow-sm active:scale-[0.98] transition-transform select-none ${
        isTransit ? "border-dashed border-amber-400 dark:border-amber-600" : "border-border"
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {prenda.urlImagen && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0 text-primary/60">
            <path d="m1.5 1.5 21 21m-2.1-5.56L15.75 9.3V5.25a.75.75 0 0 0-.75-.75H9.75a.75.75 0 0 0-.75.75v.005L5.06 1.32A.75.75 0 0 1 5.25 1.5h13.5a.75.75 0 0 1 .75.75v13.5c0 .14-.04.278-.1.39ZM3.68 5.32 1.5 3.14m0 0L3.68 5.32m0 0a.75.75 0 0 0-.18.48v13.5a.75.75 0 0 0 .75.75h13.5c.18 0 .344-.063.473-.168M1.5 3.14l2.18 2.18" />
          </svg>
        )}
        <span className="text-sm font-medium text-card-foreground truncate">{prenda.tipo.nombre}</span>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{prenda.marca.nombre}</span>
    </button>
  );
});

// --- Main component ---
export default function GaleriaPrendas({
  dimensiones, prendasMadrid, prendasValladolid, prendasTransito, madridId, valladolidId, dashboard,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editPrenda, setEditPrenda] = useState<Prenda | null>(null);
  const [detallePrenda, setDetallePrenda] = useState<Prenda | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<number | null>(null);
  const [preselectedUbicacion, setPreselectedUbicacion] = useState<number>(madridId);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("reciente");
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isPending, startTransition] = useTransition();
  const [optimisticMovers, setOptimisticMovers] = useState<Map<number, number>>(new Map());
  const router = useRouter();
  const mainRef = useRef<HTMLElement>(null);
  const touchStartY = useRef(0);

  // PWA install prompt
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("install_dismissed");
      if (!dismissed) setShowInstall(true);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function addToast(msg: string, type: "ok" | "err" = "ok") {
    const id = ++toastCounter;
    setToasts((prev) => [...prev.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }

  async function handleMover(id: number, destinoId: number) {
    setOptimisticMovers((prev) => new Map(prev).set(id, destinoId));
    startTransition(async () => {
      const result = await moverPrenda(id, destinoId);
      setOptimisticMovers((prev) => { const m = new Map(prev); m.delete(id); return m; });
      if (result.success) {
        // silent success
      } else {
        addToast(result.error, "err");
      }
    });
  }

  async function handleEliminar(id: number) {
    startTransition(async () => {
      const result = await eliminarPrenda(id);
      if (result.success) {
        addToast("Eliminado");
      } else {
        addToast(result.error, "err");
      }
    });
  }

  // Apply optimistic moves to the lists
  function applyOptimistic(prendas: Prenda[], targetUbicacion: number): Prenda[] {
    const movedIn: Prenda[] = [];
    for (const [id, destId] of optimisticMovers) {
      if (destId === targetUbicacion) {
        const p = prendasMadrid.find((x) => x.id === id) ??
                  prendasValladolid.find((x) => x.id === id) ??
                  prendasTransito.find((x) => x.id === id);
        if (p) movedIn.push({ ...p, idUbicacion: destId, ubicacion: dimensiones.ubicaciones.find((u) => u.id === destId)! });
      }
    }
    const movedOutIds = new Set(
      [...optimisticMovers.entries()].filter(([, d]) => d !== targetUbicacion).map(([id]) => id)
    );
    return [...movedIn, ...prendas.filter((p) => !movedOutIds.has(p.id) && !optimisticMovers.has(p.id))];
  }

  function filterAndSort(prendas: Prenda[]) {
    let result = prendas;
    if (filtroTipo) result = result.filter((p) => p.idTipo === filtroTipo);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter((p) =>
        p.tipo.nombre.toLowerCase().includes(q) || p.marca.nombre.toLowerCase().includes(q)
      );
    }
    const sorted = [...result];
    switch (sortBy) {
      case "marca":
        sorted.sort((a, b) => a.marca.nombre.localeCompare(b.marca.nombre));
        break;
      case "tipo":
        sorted.sort((a, b) => a.tipo.nombre.localeCompare(b.tipo.nombre));
        break;
      default:
        break;
    }
    return sorted;
  }

  const madrid = useMemo(() => filterAndSort(applyOptimistic(prendasMadrid, madridId)),
    [prendasMadrid, madridId, filtroTipo, searchText, sortBy, optimisticMovers]);
  const valladolid = useMemo(() => filterAndSort(applyOptimistic(prendasValladolid, valladolidId)),
    [prendasValladolid, valladolidId, filtroTipo, searchText, sortBy, optimisticMovers]);
  const transito = useMemo(() => filterAndSort(applyOptimistic(prendasTransito, -1)),
    [prendasTransito, filtroTipo, searchText, sortBy, optimisticMovers]);
  const filtroNombre = filtroTipo ? dimensiones.tipos.find((t) => t.id === filtroTipo)?.nombre : null;

  // Pull-to-refresh
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const getEl = () => mainRef.current;
    function onTouchStart(e: TouchEvent) {
      const m = getEl();
      if (m && m.scrollTop === 0) touchStartY.current = e.touches[0].clientY;
    }
    function onTouchEnd(e: TouchEvent) {
      if (pullRefreshing || isPending) return;
      const m = getEl();
      const diff = e.changedTouches[0].clientY - touchStartY.current;
      if (m && diff > 80 && m.scrollTop === 0) {
        setPullRefreshing(true);
        router.refresh();
        setTimeout(() => setPullRefreshing(false), 1200);
      }
    }
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullRefreshing, isPending, router]);

  function exportCSV() {
    const all = [...prendasMadrid, ...prendasValladolid, ...prendasTransito];
    const header = "Tipo,Marca,Color,Corte,Tejido,Estampado,Ubicacion,Detalles";
    const rows = all.map((p) =>
      [
        p.tipo.nombre, p.marca.nombre, p.colorPrincipal.nombre,
        p.corte?.nombre ?? "", p.tejido?.nombre ?? "",
        p.estampado?.nombre ?? "", p.ubicacion.nombre,
        `"${p.detalles?.replace(/"/g, '""') ?? ""}"`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `armario_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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

  function handleInstall() {
    if (!installEvent) return;
    installEvent.prompt();
    installEvent.userChoice.then(() => {
      setInstallEvent(null);
      setShowInstall(false);
    });
  }

  if (!mounted) return <Skeleton />;

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
            {isPending && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-primary animate-spin">
                <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.926.521 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.909Z" clipRule="evenodd" />
              </svg>
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
        {/* Search bar */}
        <div className="mx-auto max-w-5xl px-4 pb-2">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
              <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar tipo o marca..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
            {searchText && (
              <button onClick={() => setSearchText("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">x</button>
            )}
          </div>
        </div>
      </header>

      {/* PWA Install banner */}
      {showInstall && (
        <div className="mx-auto max-w-5xl px-4 py-2">
          <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-4 py-2">
            <span className="text-sm text-primary">Instalar Armario en tu dispositivo</span>
            <div className="flex items-center gap-2">
              <button onClick={handleInstall} className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Instalar</button>
              <button onClick={() => { setShowInstall(false); localStorage.setItem("install_dismissed", "1"); }} className="text-muted-foreground hover:text-foreground text-xs">x</button>
            </div>
          </div>
        </div>
      )}

      <main ref={mainRef} className="mx-auto max-w-5xl px-4 py-4">
        {/* Pull-to-refresh indicator */}
        {pullRefreshing && (
          <div className="flex items-center justify-center py-2 text-xs text-muted-foreground animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1 animate-spin">
              <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.926.521 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.909Z" clipRule="evenodd" />
            </svg>
            Actualizando...
          </div>
        )}
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
              <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-base font-semibold text-foreground">En transito</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{transito.length}</span>
            </div>
            <div className="space-y-1.5">
              {transito.map((p) => (
                <PrendaCard key={p.id} prenda={p} destinoId={madridId} onMover={handleMover} onOpenDetail={setDetallePrenda} isTransit />
              ))}
            </div>
          </section>
        )}
      </main>

      <ToastContainer toasts={toasts} />

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
          filtroTipo={filtroTipo} setFiltroTipo={setFiltroTipo}
          sortBy={sortBy} setSortBy={setSortBy} onExport={exportCSV} />
      )}
      {showForm && (
        <FormularioPrenda dimensiones={dimensiones} prenda={editPrenda} ubicacionId={editPrenda ? editPrenda.idUbicacion : preselectedUbicacion}
          onClose={() => { setShowForm(false); setEditPrenda(null); }} />
      )}
    </div>
  );
}