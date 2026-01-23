import { defineEventHandler, readBody } from "h3";
import https from "https";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const supervisorToken =
        config.supervisorToken || process.env.SUPERVISOR_TOKEN;
    const haApiUrl =
        "https://n2zzkqhzfnhgu451hculm83lnknh8mii.ui.nabu.casa/api";

    const body = await readBody(event);
    const deviceName = body.deviceName;

    if (!deviceName) {
        throw createError({
            statusCode: 400,
            statusMessage: "Nome do dispositivo é obrigatório",
        });
    }

    // Sanitiza o nome (ex: "My Device" -> "my_device")
    const safeDeviceName = deviceName.toLowerCase().replace(/\s+/g, "_");

    if (supervisorToken) {
        try {
            const agent = new https.Agent({ rejectUnauthorized: false });

            // CORREÇÃO: Usamos uma lista (namespace) e join('\n') no final
            // Isso elimina os espaços em branco gerados pelo loop
            const templateQuery = `
        {% set name = '${safeDeviceName}' %}
        {% set result = namespace(lines=[]) %}

        {% for i in range(1, 33) %}
           {% set entity_id = 'text.' ~ name ~ '_pi' ~ i ~ 'action' %}

           {% if states[entity_id] is defined %}
              {% set val = states(entity_id) %}

              {% if val != 'unknown' and val != 'unavailable' %}
                  {# Formata a string com aspas: id;"valor" #}
                  {% set line = entity_id ~ ';"' ~ val ~ '"' %}

                  {# Adiciona na lista #}
                  {% set result.lines = result.lines + [line] %}
              {% endif %}
           {% endif %}
        {% endfor %}
        {% for i in range(1, 33) %}
           {% set entity_id = 'sensor.' ~ name ~ '_pi' ~ i ~ 'sw' %}

           {% if states[entity_id] is defined %}
              {% set val = states(entity_id) %}

              {% if val != 'unknown' and val != 'unavailable' %}
                  {# Formata a string com aspas: id;"valor" #}
                  {% set line = entity_id ~ ';"' ~ val ~ '"' %}

                  {# Adiciona na lista #}
                  {% set result.lines = result.lines + [line] %}
              {% endif %}
           {% endif %}
        {% endfor %}


        {# O filtro join garante que só haja quebra de linha onde tiver dados #}
        {{ result.lines | join('\n') }}
      `;

            const response = await $fetch(`${haApiUrl}/template`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${supervisorToken}`,
                    "Content-Type": "application/json",
                },
                body: { template: templateQuery },
                agent: agent,
            });

            return response;
        } catch (error) {
            console.error("Erro ao gerar backup:", error);
            throw createError({
                statusCode: 500,
                statusMessage: "Erro ao comunicar com HA para backup",
            });
        }
    }

    // Mock corrigido para o novo formato
    return `text.${safeDeviceName}_pi1action;"local://po1"\ntext.${safeDeviceName}_pi2action;"100"\ntext.${safeDeviceName}_pi3action;"ON"`;
});
