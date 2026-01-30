// server/plugins/hass-config.ts
import fs from "node:fs";

export default defineNitroPlugin((nitroApp) => {
    const config = useRuntimeConfig();

    // Caminho do arquivo de opções do Home Assistant
    const optionsPath = "/data/options.json";

    try {
        if (fs.existsSync(optionsPath)) {
            console.log(
                "⚙️  Detectado ambiente Home Assistant. Carregando opções...",
            );

            const rawData = fs.readFileSync(optionsPath, "utf-8");
            const options = JSON.parse(rawData);

            // Itera sobre cada chave do options.json
            for (const [key, value] of Object.entries(options)) {
                // 1. Injeta na configuração PRIVADA (Server-side)
                // Isso permite acessar via config.nome_da_chave
                config[key] = value;

                // 2. (Opcional) Injeta na configuração PÚBLICA se a chave já existir lá
                // Isso é útil se você quiser expor algo para o Frontend (Vue)
                // Se a chave não existir em 'public' no nuxt.config, ela permanece privada por segurança.
                if (config.public && config.public[key] !== undefined) {
                    config.public[key] = value;
                }
            }

            console.log("✅ Configurações do Add-on injetadas com sucesso!");

            // Debug: Mostra o que foi carregado (cuidado com senhas no log)
            // console.log(options);
        } else {
            console.log(
                "⚠️  options.json não encontrado. Usando valores padrão do nuxt.config (Modo Dev).",
            );
        }
    } catch (err) {
        console.error("❌ Erro ao carregar configurações do HA:", err);
    }
});
