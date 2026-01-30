// server/plugins/load-options.ts
import fs from "node:fs";
import path from "node:path";

export default defineNitroPlugin((nitroApp) => {
    // Ajuste o caminho conforme a estrutura do seu container Docker/Addon
    // Em muitos containers o diretório de trabalho é a raiz do projeto
    const filePath = "/data/options.json";

    console.log("🔄 [Nitro Plugin] Iniciando leitura de opções...");

    if (fs.existsSync(filePath)) {
        try {
            const rawData = fs.readFileSync(filePath, "utf-8");
            const jsonOptions = JSON.parse(rawData);

            // Acessa a configuração de tempo de execução

            // --- ATUALIZAÇÃO MÁGICA ---
            // Aqui sobrescrevemos os valores da configuração carregada na memória
            // com os valores do arquivo JSON.

            for (const key in jsonOptions) {
                const envKey = `NUXT_${key.toUpperCase()}`;
                // Só define se ainda não estiver definido (opcional, mas recomendado para não sobrescrever variáveis do sistema real)
                if (!process.env[envKey]) {
                    process.env[envKey] = String(jsonOptions[key]);
                }
            }

            console.log(
                "✅ [Nitro Plugin] options.json carregado e aplicado no Runtime!",
            );
            // console.log('Config atual:', config.teste) // Debug se precisar
        } catch (e) {
            console.warn("⚠️ [Nitro Plugin] Erro ao ler options.json:", e);
        }
    } else {
        console.log(`ℹ️ [Nitro Plugin] Arquivo não encontrado em: ${filePath}`);
    }
});
