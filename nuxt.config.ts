// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: ["@nuxtjs/tailwindcss"],
    // runtimeConfig: {
    //     // Chaves privadas (disponíveis apenas nas rotas server/api/*)
    //     // Se você deixar string vazia, ele tenta ler de process.env.SUPERVISOR_TOKEN
    //     supervisorToken: "",
    //     haApiUrl: "https://n2zzkqhzfnhgu451hculm83lnknh8mii.ui.nabu.casa/api",
    //     // Chaves públicas (disponíveis no .vue / frontend)
    //     public: {
    //         // Exemplo: apiBase: '/api'
    //     },
    // },

    app: {
        head: {
            title: "LightController Manager",
            meta: [
                {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1",
                },
                { charset: "utf-8" },
            ],
            bodyAttrs: {
                // Garante o fundo escuro padrão estilo ESPHome
                class: "bg-[#1c1c1c] text-gray-100",
            },
        },
    },
});
