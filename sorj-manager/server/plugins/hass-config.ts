// server/plugins/hass-config.ts
import fs from "node:fs";

export default defineNitroPlugin((nitroApp) => {
    const config = useRuntimeConfig();
    const optionsPath = "/data/options.json";
    console.log(
        "Sincronizando configurações /data/options.json =>useRuntimeConfig ",
    );
    try {
        if (fs.existsSync(optionsPath)) {
            const rawData = fs.readFileSync(optionsPath, "utf-8");
            const options = JSON.parse(rawData);

            // Itera sobre TODAS as opções que vieram do Home Assistant
            for (const [key, value] of Object.entries(options)) {
                // O SEGREDO ESTÁ AQUI:
                // Verifica se a chave existe no runtimeConfig antes de atribuir.
                // Isso evita o erro "object is not extensible".
                if (Object.prototype.hasOwnProperty.call(config, key)) {
                    // TypeScript pode reclamar aqui porque ele não sabe o tipo exato,
                    // mas em JavaScript/Runtime isso funciona perfeitamente.
                    // @ts-ignore
                    config[key] = value;

                    console.log(`🔄 Config atualizada: ${key} -> ${value}`);
                }
            }

            console.log("✅ Configurações sincronizadas com sucesso.");
        }
    } catch (err) {
        console.error("❌ Erro ao sincronizar configs:", err);
    }
});
