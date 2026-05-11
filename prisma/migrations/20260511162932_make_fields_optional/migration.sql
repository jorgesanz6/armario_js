-- DropForeignKey
ALTER TABLE "F_Prendas" DROP CONSTRAINT "F_Prendas_ID_Color_Principal_fkey";

-- DropForeignKey
ALTER TABLE "F_Prendas" DROP CONSTRAINT "F_Prendas_ID_Marca_fkey";

-- DropForeignKey
ALTER TABLE "F_Prendas" DROP CONSTRAINT "F_Prendas_ID_Tipo_fkey";

-- DropForeignKey
ALTER TABLE "F_Prendas" DROP CONSTRAINT "F_Prendas_ID_Ubicacion_fkey";

-- AlterTable
ALTER TABLE "F_Prendas" ALTER COLUMN "ID_Tipo" DROP NOT NULL,
ALTER COLUMN "ID_Marca" DROP NOT NULL,
ALTER COLUMN "ID_Ubicacion" DROP NOT NULL,
ALTER COLUMN "ID_Color_Principal" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Tipo_fkey" FOREIGN KEY ("ID_Tipo") REFERENCES "Dim_TipoPrenda"("ID_Tipo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Marca_fkey" FOREIGN KEY ("ID_Marca") REFERENCES "Dim_Marca"("ID_Marca") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Ubicacion_fkey" FOREIGN KEY ("ID_Ubicacion") REFERENCES "Dim_Ubicacion"("ID_Ubicacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Color_Principal_fkey" FOREIGN KEY ("ID_Color_Principal") REFERENCES "Dim_Color"("ID_Color") ON DELETE SET NULL ON UPDATE CASCADE;
