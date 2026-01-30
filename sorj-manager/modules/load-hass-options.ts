// modules/load-options.ts
import { defineNuxtModule } from "@nuxt/kit";
import fs from "node:fs";
import path from "node:path";

export default defineNuxtModule({
    meta: {
        name: "load-options-json",
    },
    setup(options, nuxt) {
        const filePath = "/data/options.json"; //path.resolve(nuxt.options.rootDir, 'options.json')

        if (fs.existsSync(filePath)) {
            try {
                const rawData = fs.readFileSync(filePath, "utf-8");
                const jsonOptions = JSON.parse(rawData);

                // Aqui está o segredo: Em vez de mexer no process.env,
                // nós injetamos direto na configuração do Nuxt!

                // 1. Atualiza runtimeConfig (Server-side)
                nuxt.options.runtimeConfig = {
                    ...nuxt.options.runtimeConfig,
                    ...jsonOptions, // Injeta as chaves do JSON aqui
                };

                // 2. Se quiser expor algo público, teria que filtrar ou definir explicitamente
                // Exemplo: nuxt.options.runtimeConfig.public.teste = jsonOptions.teste

                console.log(
                    "✅ [Module] options.json injetado no runtimeConfig",
                );
            } catch (e) {
                console.warn("⚠️ [Module] Erro ao ler options.json:", e);
            }
        }
    },
});
