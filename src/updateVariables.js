const fs = require('fs');

for (let i = 1; i <= 101; i++) {
  const startCode = 10000001 + (i - 1) * 3000;
  const endCode = startCode + 2999; // Ajusta o valor final

  const filename = `index${i}.ts`;

  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      console.error(`Erro ao ler o arquivo ${filename}: ${err}`);
      return;
    }

    // Atualiza as variáveis no conteúdo do arquivo
    data = data.replace(/const startCode = \d+;/, `const startCode = ${startCode};`);
    data = data.replace(/const endCode = \d+;/, `const endCode = ${endCode};`);

    fs.writeFile(filename, data, 'utf8', (err) => {
      if (err) {
        console.error(`Erro ao escrever o arquivo ${filename}: ${err}`);
      } else {
        console.log(`Variáveis atualizadas em ${filename}`);
      }
    });
  });
}
