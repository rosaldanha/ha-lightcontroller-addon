// server/api/devices.get.ts
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
    // NÃO PRECISA MAIS DE IMPORTS DE CONFIG OU HTTPS!
    // O objeto 'ha' já está disponível globalmente graças ao server/utils

    // Lógica do Template (igual ao anterior)
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
                {% set new_device = { 'id': dev_id, 'name': name, 'model': model, 'isOnline': is_online } %}
                {% set result.devices = result.devices + [new_device] %}
            {% endif %}
         {% endif %}
      {% endif %}
    {% endfor %}
    {{ result.devices | to_json }}
  `;

    try {
        // OLHA COMO FICOU SIMPLES:
        return await ha.runTemplate(templateQuery);
    } catch (error) {
        // Se falhar (ex: sem token local), retornamos mock
        console.warn("Falha ao conectar no HA, usando Mock:", error);
        return [
            {
                id: "mock1",
                name: "DevTest Mock (Via Class)",
                model: "ESP32",
                isOnline: true,
            },
            {
                id: "mock2",
                name: "Cozinha Mock (Via Class)",
                model: "ESP8266",
                isOnline: false,
            },
        ];
    }
});
