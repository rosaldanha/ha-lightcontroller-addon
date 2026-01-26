// server/api/backup.post.ts
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const deviceName = body.deviceName;

    if (!deviceName)
        throw createError({
            statusCode: 400,
            statusMessage: "Device Name required",
        });

    const safeDeviceName = deviceName.toLowerCase().replace(/\s+/g, "_");

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

        {# O filtro join garante que só haja quebra de linha onde tiver dados #}
        {{ result.lines | join('\n') }}
  `;

    // UMA ÚNICA LINHA!
    return await ha.runTemplate(templateQuery);
});
// This values can only be set on firmware.
// {% for i in range(1, 33) %}
//    {% set entity_id = 'sensor.' ~ name ~ '_pi' ~ i ~ 'sw' %}
//    {% if states[entity_id] is defined %}
//       {% set val = states(entity_id) %}
//       {% if val != 'unknown' and val != 'unavailable' %}
//           {# Formata a string com aspas: id;"valor" #}
//           {% set line = entity_id ~ ';"' ~ val ~ '"' %}
//           {# Adiciona na lista #}
//           {% set result.lines = result.lines + [line] %}
//       {% endif %}
//    {% endif %}
// {% endfor %}
