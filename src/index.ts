import dotenv from 'dotenv';
import puppeteer from 'puppeteer';

import { PrismaClient } from '@prisma/client';

// 1. Import libSQL and the Prisma libSQL driver adapter
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

dotenv.config();

// 2. Instantiate libSQL
export const libsql = createClient({
  // @ts-expect-error
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

// 3. Instantiate the libSQL driver adapter
const adapter = new PrismaLibSQL(libsql)
// Pass the adapter option to the Prisma Client instance
const prisma = new PrismaClient({ adapter })

// Função para extrair os dados da DOM
async function extractData() {

  // Inicializa o navegador
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  /* Campos com a variável codigoLogradouro 
  esta é a varíavel mais importante da aplicação, 
  pois define qual é a escala abrangida de coleta 
  das informações. É muito importante que o usuário
  se atente para os códigos para que colete os dados
  de uma determinada cidade/bairro corretamente.

  Range de Santos/SP: 
    inicio: 10171839
    fim: 10172801
  */
    const startCode = 10000001 //10000001;
    const endCode = 10000002 //10259000;
  // Array onde as informações de cada objeto serão armazenadas
  const data = []

  // Laço para percorrer o range de endereços selecionado pelo usuário
  for (let code = startCode; code <= endCode; code++) {
    const url = `https://viafacil2.policiamilitar.sp.gov.br/sgsci/Publico/PesquisarAVCBLogradouro.aspx?codigoLogradouro=${code}&codigoMunicipio=&endereco=&bairro=&numero=&tipo=`;

    await page.goto(url);
    await page.waitForSelector('script');
    
    // Irá buscar o script que inclui as informações na DOM
    const scriptContent = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent && script.textContent.includes("inicializarMapa")) {
          return script.textContent;
        }
      }
      return null;
    });
    
    if (scriptContent === null) {
      console.log(`Não foi possível encontrar o script para o código ${code}. Pulando para o próximo.`);
      continue;
    }
    
    // Faz a seleção dos dados dentro da DOM
    const regex = /criarMarcador\('(.*?)', '(.*?)', (.*?)', '(.*?)', (.*?)', '(.*?)', (.*?)', '(.*?)', (.*?)', '(.*?)', (.*?)', '(.*?)'\);/gim;

    const matches = scriptContent.matchAll(regex);
    
    // Para cada dado encontrado, distribui para o campo correto
    for (const match of matches) {
      const entries = {
        codigoLogradouro: code,
        rua: match[1],
        numero: match[2],
        bairro: match[3],
        cidade: match[4],
        numeroAVCB: match[5],
        dataVigencia: match[6],
        item1: match[7],
        item2: match[8],
        data2: match[9],
        tipoImovel: match[10],
        item3: match[11],
      };
      data.push(entries);
    }
}

  await browser.close();

  return data;
}

// Função para remover aspas simples dos dados
function removeSingleQuotes(data: any[]) {
  return data.map((item) => ({
    rua: item.rua.replace(/'/g, ''),
    numero: item.numero.replace(/'/g, ''),
    bairro: item.bairro.replace(/'/g, ''),
    cidade: item.cidade.replace(/'/g, ''),
    numeroAVCB: item.numeroAVCB.replace(/'/g, ''),
    dataVigencia: item.dataVigencia.replace(/'/g, ''),
    item1: item.item1.replace(/'/g, ''),
    item2: item.item2.replace(/'/g, ''),
    data2: item.data2.replace(/'/g, ''),
    tipoImovel: item.tipoImovel.replace(/'/g, ''),
    item3: item.item3.replace(/'/g, ''),
    codigoLogradouro: item.codigoLogradouro
  }));
}

async function main() {
  try {
    let inseridos = 0;
    let atualizados = 0;
    let pulados = 0;

    const data = await extractData();
    const updatedData = removeSingleQuotes(data);

    for (const item of updatedData) {
      const existingEntry = await prisma.dados.findUnique({
        where: { numeroAVCB: item.numeroAVCB },
      });

      if (existingEntry) {
        if (existingEntry.dataVigencia !== item.dataVigencia) {
          await prisma.dados.update({
            where: { numeroAVCB: item.numeroAVCB },
            data: {
              codigoLogradouro: item.codigoLogradouro,
              rua: item.rua,
              numero: item.numero,
              bairro: item.bairro,
              cidade: item.cidade,
              dataVigencia: item.dataVigencia,
              item1: item.item1,
              item2: item.item2,
              data2: item.data2,
              tipoImovel: item.tipoImovel,
              item3: item.item3,
            },
          });
          atualizados++;
        } else {
          pulados++;
        }
      } else {
        await prisma.dados.create({
          data: {
            codigoLogradouro: item.codigoLogradouro,
            rua: item.rua,
            numero: item.numero,
            bairro: item.bairro,
            cidade: item.cidade,
            numeroAVCB: item.numeroAVCB,
            dataVigencia: item.dataVigencia,
            item1: item.item1,
            item2: item.item2,
            data2: item.data2,
            tipoImovel: item.tipoImovel,
            item3: item.item3,
          },
        });
        inseridos++;
      }
    }

    console.log('Dados inseridos/atualizados com sucesso.');
    console.log(`Inseridos: ${inseridos}`);
    console.log(`Atualizados: ${atualizados}`);
    console.log(`Pulados: ${pulados}`);

    process.exit(0);
  } catch (error) {
    console.error('Ocorreu um erro:', error);

    process.exit(1);
  }
}

main();