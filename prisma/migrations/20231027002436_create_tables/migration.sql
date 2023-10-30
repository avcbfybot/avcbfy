-- CreateTable
CREATE TABLE "Dados" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoLogradouro" INTEGER NOT NULL,
    "rua" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "numeroAVCB" TEXT NOT NULL,
    "dataVigencia" TEXT NOT NULL,
    "item1" TEXT NOT NULL,
    "item2" TEXT NOT NULL,
    "data2" TEXT NOT NULL,
    "tipoImovel" TEXT NOT NULL,
    "item3" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Dados_numeroAVCB_key" ON "Dados"("numeroAVCB");
