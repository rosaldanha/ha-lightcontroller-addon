// sorj-manager/nuxt.config.ts
export default defineNuxtConfig({
    // 1. SPA Mode: Renderização apenas no navegador
    ssr: false,

    devtools: { enabled: true },
    modules: ["@nuxtjs/tailwindcss"],

    app: {
        // AQUI ESTÁ O SEGREDO: Ponto e barra.
        // Isso fará o HTML gerar: window.__NUXT__.config={... baseURL:"./"}
        baseURL: "./",
        cdnURL: "./",

        // Mantemos o padrão para não confundir o Vite
    },

    router: {
        options: {
            // Adiciona o # nas URLs para não quebrar a navegação do HA
            hashMode: true,
        },
    },

    // Configuração explícita para o empacotador (Vite) usar caminhos relativos

    nitro: {
        // Garante que o servidor Node sirva os arquivos corretamente
        preset: "node-server",
    },

    experimental: {
        payloadExtraction: false,
    },
});
