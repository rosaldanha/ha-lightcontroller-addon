import { defineNuxtConfig } from "nuxt/config";
import fs from "node:fs";

// Função auxiliar para ler o options.json do Home Assistant
const getHassOptions = () => {
  try {
    // O caminho padrão no Hassio é /data/options.json
    if (fs.existsSync("/data/options.json")) {
      const rawData = fs.readFileSync("/data/options.json", "utf-8");
      console.log(rawData);
      console.log(JSON.parse(rawData));
      return JSON.parse(rawData);
    }
  } catch (e) {
    console.warn("Não foi possível ler /data/options.json, usando padrões.");
  }
  return {};
};
const hassOptions = getHassOptions();

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
  runtimeConfig: {
    // Chaves aqui são PRIVADAS (disponíveis apenas em server/api)
    esphomeConfigFolder:
      process.env.ESPHOME_CONFIG_DIR ||
      hassOptions.esphomeConfigFolder ||
      "error",

    // Se precisar no frontend (vue), coloque dentro de public:
    public: {
      // ...
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
