import { defineNuxtConfig } from "nuxt/config";

// sorj-manager/nuxt.config.ts
export default defineNuxtConfig({
  // 1. SPA Mode: Renderização apenas no navegador
  ssr: false,
  define: {
    __VUE_PROD_DEVTOOLS__: "true",
  },
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],

  app: {
    // AQUI ESTÁ O SEGREDO: Ponto e barra.
    // Isso fará o HTML gerar: window.__NUXT__.config={... baseURL:"./"}
    baseURL: "./",
    cdnURL: "./",

    // Mantemos o padrão para não confundir o Vite
  },
  runtimeConfig: {
    // Chaves aqui são PRIVADAS (disponíveis apenas em server/api)
    esphomeConfigFolder: "error",
    supervisorToken: "error",
    supervisorUrl: "http://supervisor/core/api",
    // Se precisar no frontend (vue), coloque dentro de public:
    public: {
      supervisorToken: "error",
      wssUrl: "error",
    },
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
