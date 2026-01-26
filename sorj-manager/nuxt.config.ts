// sorj-manager/nuxt.config.ts
export default defineNuxtConfig({
    // 1. SPA Mode (Mantém desativado o SSR para evitar erros de hidratação)
    ssr: false,

    devtools: { enabled: true },
    modules: ["@nuxtjs/tailwindcss"],

    app: {
        // Define a base como relativa
        baseURL: "./",
        // REMOVIDO: buildAssetsDir: 'assets'
        // MOTIVO: Vamos deixar o padrão '_nuxt' para evitar conflitos internos do Vite
    },

    router: {
        options: {
            // Navegação por Hash (#) é obrigatória para Ingress
            hashMode: true,
        },
    },

    // NOVO: Força o Vite a gerar caminhos relativos nos arquivos compilados
    vite: {
        base: "./",
    },

    // Otimizações para evitar erros de payload
    experimental: {
        payloadExtraction: false,
    },

    nitro: {
        preset: "node-server",
    },
});
