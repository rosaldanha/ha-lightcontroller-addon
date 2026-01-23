import { defineEventHandler } from "h3";
import https from "https";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const supervisorToken =
        config.supervisorToken || process.env.SUPERVISOR_TOKEN;

    // URL da API (Nabu Casa ou Local)
    const haApiUrl = process.env.SUPERVISOR_URL || "http://supervisor/";

    let devices = [];

    if (supervisorToken) {
        try {
            const agent = new https.Agent({ rejectUnauthorized: false });

            // CORREÇÃO: Usamos concatenação (+) em vez de .append()
            const templateQuery = `
        {% set result = namespace(devices=[]) %}

        {% for state in states.sensor %}
          {% if state.entity_id.endswith('_pid') %}

             {% if state.state == 'sorj-net.lightcontroller' or state.state == 'unavailable' or state.state == 'unknown' %}

                {% set dev_id = device_id(state.entity_id) %}

                {% if dev_id %}
                    {% set name = device_attr(dev_id, 'name_by_user') or device_attr(dev_id, 'name') %}
                    {% set model = device_attr(dev_id, 'model') %}

                    {% set is_online = true %}
                    {% if state.state == 'unavailable' or state.state == 'unknown' %}
                        {% set is_online = false %}
                    {% endif %}

                    {% set new_device = {
                      'id': dev_id,
                      'name': name,
                      'model': model,
                      'isOnline': is_online
                    } %}

                    {# AQUI ESTÁ A CORREÇÃO: Somamos a lista com o novo item #}
                    {% set result.devices = result.devices + [new_device] %}
                {% endif %}

             {% endif %}
          {% endif %}
        {% endfor %}

        {{ result.devices | to_json }}
      `;

            const response: any = await $fetch(`${haApiUrl}/template`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${supervisorToken}`,
                    "Content-Type": "application/json",
                },
                body: { template: templateQuery },
                agent: agent,
            });

            if (response) {
                // O retorno às vezes vem como string JSON dependendo da versão da API, garantimos o parse
                devices =
                    typeof response === "string"
                        ? JSON.parse(response)
                        : response;
            }
        } catch (error) {
            console.error("Erro na API Template:", error);
            throw createError({
                statusCode: 500,
                statusMessage: "Erro ao processar template no HA",
            });
        }
    } else {
        // Mock data
        devices = [
            {
                id: "mock1",
                name: "DevTest Mock",
                model: "ESP32",
                isOnline: true,
            },
            {
                id: "mock2",
                name: "Cozinha Mock",
                model: "ESP8266",
                isOnline: false,
            },
        ];
    }

    return devices;
});
