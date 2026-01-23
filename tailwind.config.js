/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [],
    theme: {
        extend: {
            colors: {
                // Cores aproximadas da interface do ESPHome
                esphome: {
                    bg: "#1c1c1c",
                    card: "#2b2b2b",
                    header: "#212121",
                    accent: "#03a9f4", // Azul dos botões
                    success: "#4caf50", // Verde online
                    error: "#f44336", // Vermelho offline
                },
            },
        },
    },
    plugins: [],
};
