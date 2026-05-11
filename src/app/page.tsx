import { getPrendas, getDimensiones, getDashboard } from "@/lib/actions";
import GaleriaPrendas from "@/components/GaleriaPrendas";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [prendas, dimensiones, dashboard] = await Promise.all([
    getPrendas(),
    getDimensiones(),
    getDashboard(),
  ]);

  const madridId = dimensiones.ubicaciones.find((u) => u.nombre === "Madrid")?.id ?? 0;
  const valladolidId = dimensiones.ubicaciones.find((u) => u.nombre === "Valladolid")?.id ?? 0;

  const prendasMadrid = prendas.filter((p) => p.idUbicacion === madridId);
  const prendasValladolid = prendas.filter((p) => p.idUbicacion === valladolidId);
  const prendasTransito = prendas.filter(
    (p) => p.idUbicacion !== madridId && p.idUbicacion !== valladolidId
  );

  return (
    <GaleriaPrendas
      dimensiones={dimensiones}
      prendasMadrid={prendasMadrid}
      prendasValladolid={prendasValladolid}
      prendasTransito={prendasTransito}
      madridId={madridId}
      valladolidId={valladolidId}
      dashboard={dashboard}
    />
  );
}