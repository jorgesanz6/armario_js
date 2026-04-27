import { getPrendas, getDimensiones } from "@/lib/actions";
import GaleriaPrendas from "@/components/GaleriaPrendas";

export default async function Home() {
  const [prendas, dimensiones] = await Promise.all([
    getPrendas(),
    getDimensiones(),
  ]);

  const madridId = dimensiones.ubicaciones.find((u) => u.nombre === "Madrid")!.id;
  const valladolidId = dimensiones.ubicaciones.find((u) => u.nombre === "Valladolid")!.id;

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
    />
  );
}