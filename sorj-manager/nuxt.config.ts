// sorj-manager/nuxt.config.ts
export default defineNuxtConfig({
    // 1. DESATIVA O SSR: Isso evita que o servidor tente adivinhar URLs.
    // O app será renderizado 100% no navegador do usuário.
    ssr: false,

    devtools: { enabled: true },
    modules: ["@nuxtjs/tailwindcss"],

    app: {
        // Força caminhos relativos
        baseURL: "./",
        buildAssetsDir: "assets",
    },

    router: {
        options: {
            // 2. MODO HASH: Usa URLs tipo 'index.html#/device'
            // Isso impede que o Home Assistant pense que você está trocando de página
            hashMode: true,
        },
    },

    nitro: {
        preset: "node-server",
    },

    // Garante que o build entenda que é relativo
    experimental: {
        payloadExtraction: false,
    },
});
