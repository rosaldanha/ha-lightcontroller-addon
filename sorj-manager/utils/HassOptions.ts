import fs from "node:fs";

// Função auxiliar para ler o options.json do Home Assistant
const getHassOptions = () => {
    try {
        // O caminho padrão no Hassio é /data/options.json
        if (fs.existsSync("/data/options.json")) {
            const rawData = fs.readFileSync("/data/options.json", "utf-8");
            return JSON.parse(rawData);
        }
    } catch (e) {
        console.warn(
            "Não foi possível ler /data/options.json, usando padrões.",
        );
    }
    return {};
};

export const hassOptions = getHassOptions();
