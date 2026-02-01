// env-loader.js
const fs = require("fs");

const optionsPath = "/data/options.json";

try {
  if (fs.existsSync(optionsPath)) {
    const rawData = fs.readFileSync(optionsPath, "utf8");
    const data = JSON.parse(rawData);

    Object.keys(data).forEach((key) => {
      // 1. Converte chave para MAIÚSCULA
      const upperKey = key.toUpperCase();
      // 2. Adiciona o prefixo NUXT_
      const envName = `${upperKey}`;

      // 3. Pega o valor e garante que é string
      let value = data[key];
      if (typeof value !== "string") {
        value = JSON.stringify(value);
      }

      // 4. Escapa aspas simples para não quebrar o comando shell
      // Exemplo: O'Neil vira O'\''Neil
      const safeValue = value.replace(/'/g, "'\\''");

      // 5. Imprime o comando de export
      console.log(`export ${key}='${safeValue}'`);
    });
  }
} catch (error) {
  // Em caso de erro (JSON inválido, permissão, etc), apenas loga no stderr
  // para não quebrar o eval, mas avisa o usuário.
  console.error("Erro ao processar options.json:", error.message);
}
