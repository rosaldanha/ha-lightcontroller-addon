// server/utils/ha.ts
import https from "https";

class HomeAssistantClient {
    private agent: https.Agent;

    constructor() {
        // Inicializa o agente SSL uma única vez
        this.agent = new https.Agent({ rejectUnauthorized: false });
    }

    // Getter inteligente: Pega a configuração ATUAL no momento que for usada
    private get credentials() {
        const config = useRuntimeConfig();

        const token =
            config.supervisorToken || process.env.SUPERVISOR_TOKEN || "";

        let rawUrl = process.env.SUPERVISOR_URL || "http://supervisor";
        // Remove barra no final
        const baseUrl = rawUrl.replace(/\/$/, "");

        return { token, baseUrl };
    }

    async request<T>(endpoint: string, options: any = {}): Promise<T> {
        // Pega as credenciais agora (Lazy Load)
        const { token, baseUrl } = this.credentials;

        if (!token) {
            // Se não tiver token, nem tenta conectar (evita erros de rede desnecessários)
            throw new Error("MISSING_TOKEN");
        }

        try {
            return await $fetch<T>(`${baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...options.headers,
                },
                agent: this.agent,
            });
        } catch (error: any) {
            // Re-lança o erro para ser tratado por quem chamou
            throw error;
        }
    }

    async runTemplate(template: string): Promise<any> {
        try {
            const response = await this.request<string | object>(
                "/api/template",
                {
                    method: "POST",
                    body: { template },
                },
            );

            if (typeof response === "string") {
                try {
                    return JSON.parse(response);
                } catch (e) {
                    return response;
                }
            }
            return response;
        } catch (error: any) {
            // Se o erro for falta de token, retorna null para o frontend usar o Mock
            if (error.message === "MISSING_TOKEN") throw error;
            console.error(`Erro no Template HA:`, error.message);
            throw error;
        }
    }
}

export const ha = new HomeAssistantClient();
