-- CreateTable
CREATE TABLE "Dim_TipoPrenda" (
    "ID_Tipo" SERIAL NOT NULL,
    "Tipo_Prenda" TEXT NOT NULL,

    CONSTRAINT "Dim_TipoPrenda_pkey" PRIMARY KEY ("ID_Tipo")
);

-- CreateTable
CREATE TABLE "Dim_Corte" (
    "ID_Corte" SERIAL NOT NULL,
    "Corte" TEXT NOT NULL,

    CONSTRAINT "Dim_Corte_pkey" PRIMARY KEY ("ID_Corte")
);

-- CreateTable
CREATE TABLE "Dim_Color" (
    "ID_Color" SERIAL NOT NULL,
    "Color" TEXT NOT NULL,

    CONSTRAINT "Dim_Color_pkey" PRIMARY KEY ("ID_Color")
);

-- CreateTable
CREATE TABLE "Dim_Estampado" (
    "ID_Estampado" SERIAL NOT NULL,
    "Estampado" TEXT NOT NULL,

    CONSTRAINT "Dim_Estampado_pkey" PRIMARY KEY ("ID_Estampado")
);

-- CreateTable
CREATE TABLE "Dim_Tejido" (
    "ID_Tejido" SERIAL NOT NULL,
    "Tejido" TEXT NOT NULL,

    CONSTRAINT "Dim_Tejido_pkey" PRIMARY KEY ("ID_Tejido")
);

-- CreateTable
CREATE TABLE "Dim_Marca" (
    "ID_Marca" SERIAL NOT NULL,
    "Marca" TEXT NOT NULL,

    CONSTRAINT "Dim_Marca_pkey" PRIMARY KEY ("ID_Marca")
);

-- CreateTable
CREATE TABLE "Dim_Ubicacion" (
    "ID_Ubicacion" SERIAL NOT NULL,
    "Ubicacion" TEXT NOT NULL,

    CONSTRAINT "Dim_Ubicacion_pkey" PRIMARY KEY ("ID_Ubicacion")
);

-- CreateTable
CREATE TABLE "F_Prendas" (
    "ID_Prenda" SERIAL NOT NULL,
    "ID_Tipo" INTEGER NOT NULL,
    "ID_Corte" INTEGER,
    "ID_Tejido" INTEGER,
    "ID_Marca" INTEGER NOT NULL,
    "ID_Ubicacion" INTEGER NOT NULL,
    "ID_Estampado" INTEGER,
    "ID_Color_Principal" INTEGER NOT NULL,
    "ID_Color_Secundario" INTEGER,
    "URL_Imagen" TEXT NOT NULL,
    "Detalles" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "F_Prendas_pkey" PRIMARY KEY ("ID_Prenda")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dim_TipoPrenda_Tipo_Prenda_key" ON "Dim_TipoPrenda"("Tipo_Prenda");

-- CreateIndex
CREATE UNIQUE INDEX "Dim_Corte_Corte_key" ON "Dim_Corte"("Corte");

-- CreateIndex
CREATE UNIQUE INDEX "Dim_Color_Color_key" ON "Dim_Color"("Color");

-- CreateIndex
CREATE UNIQUE INDEX "Dim_Estampado_Estampado_key" ON "Dim_Estampado"("Estampado");

-- CreateIndex
CREATE UNIQUE INDEX "Dim_Tejido_Tejido_key" ON "Dim_Tejido"("Tejido");

-- CreateIndex
CREATE UNIQUE INDEX "Dim_Marca_Marca_key" ON "Dim_Marca"("Marca");

-- CreateIndex
CREATE UNIQUE INDEX "Dim_Ubicacion_Ubicacion_key" ON "Dim_Ubicacion"("Ubicacion");

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Tipo_fkey" FOREIGN KEY ("ID_Tipo") REFERENCES "Dim_TipoPrenda"("ID_Tipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Corte_fkey" FOREIGN KEY ("ID_Corte") REFERENCES "Dim_Corte"("ID_Corte") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Tejido_fkey" FOREIGN KEY ("ID_Tejido") REFERENCES "Dim_Tejido"("ID_Tejido") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Marca_fkey" FOREIGN KEY ("ID_Marca") REFERENCES "Dim_Marca"("ID_Marca") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Ubicacion_fkey" FOREIGN KEY ("ID_Ubicacion") REFERENCES "Dim_Ubicacion"("ID_Ubicacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Estampado_fkey" FOREIGN KEY ("ID_Estampado") REFERENCES "Dim_Estampado"("ID_Estampado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Color_Principal_fkey" FOREIGN KEY ("ID_Color_Principal") REFERENCES "Dim_Color"("ID_Color") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F_Prendas" ADD CONSTRAINT "F_Prendas_ID_Color_Secundario_fkey" FOREIGN KEY ("ID_Color_Secundario") REFERENCES "Dim_Color"("ID_Color") ON DELETE SET NULL ON UPDATE CASCADE;
