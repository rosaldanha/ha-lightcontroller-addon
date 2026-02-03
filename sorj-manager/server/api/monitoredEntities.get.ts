// server/api/monitor-entities.get.ts
import { defineEventHandler } from "h3";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { EsphomeConfig, ESPSCHEMA } from "~/utils/EsphomeConfig";
import { ha } from "~/server/utils/ha";
import { useRuntimeConfig } from "#imports";

export const getMonitoredEntities = async (): Promise<string[]> => {
  const config = useRuntimeConfig();
  const configDir = config.esphomeConfigFolder;
  const deviceNames: string[] = [];
  const magicComment = "#light_controller_managed_config";

  if (!configDir) {
    console.warn(
      "ESPHOME_CONFIG_DIR environment variable is not set. No configs will be loaded.",
    );
    return [];
  }

  try {
    const files = fs.readdirSync(configDir);
    for (const file of files) {
      if (path.extname(file) !== ".yaml" && path.extname(file) !== ".yml") {
        continue;
      }
      const filePath = path.join(configDir, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const firstLine = fileContent.split("\n")[0].trim();
      if (firstLine === magicComment) {
        try {
          const data = yaml.load(fileContent, { schema: ESPSCHEMA });
          if (data && typeof data === "object") {
            const configInstance = EsphomeConfig.fromObject(data);
            if (configInstance.substitutions.device_name) {
              deviceNames.push(configInstance.substitutions.device_name);
            }
          }
        } catch (e) {
          console.error(`Error parsing YAML file ${file}:`, e);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to read config directory ${configDir}:`, error);
    return [];
  }

  if (deviceNames.length === 0) {
    return [];
  }

  // const template = `
  //   {% set ns = namespace(entities=[]) %}
  //   {% for device in devices %}
  //     {% for i in range(1, 17) %}
  //       {% set entity_id = 'binary_sensor.' ~ device ~ '_pi' ~ i %}
  //       {% if states[entity_id] is defined %}
  //         {% set ns.entities = ns.entities + [entity_id] %}
  //       {% endif %}
  //     {% endfor %}
  //   {% endfor %}
  //   {{ ns.entities | tojson }}
  // `;
  const template = `
    {% set base_devices_list = ${JSON.stringify(deviceNames)} %}
    {% set todos_esphome = integration_entities('esphome') | map('device_id') | unique | list %}
    {% set ns = namespace(todos_lightcontrollers=[]) %}
    {# 1. Criando a lista de IDs corretamente #}
    {% for dname in base_devices_list -%}
      {# Convertendo o nome para ID antes de salvar na lista #}
      {% set pai_id = device_id(dname) %}
      {% set dispositivos_filtrados = todos_esphome | select('is_device_attr', 'via_device_id', pai_id) | list %}
      {# Agora salvamos apenas IDs na lista #}
      {% set ns.todos_lightcontrollers = ns.todos_lightcontrollers + [pai_id] + dispositivos_filtrados %}
    {%- endfor %}
    {# 2. Loop de extração de entidades #}
    {% set et = namespace(todas_entidades=[])%}
    {% for did in ns.todos_lightcontrollers if did is not none -%}
       {# Se quiser filtrar, certifique-se que o dispositivo TEM binary_sensor #}
       {% set entidades = device_entities(did) | select('match', 'binary_sensor') | list %}
       {% set et.todas_entidades = et.todas_entidades + entidades %}
    {% endfor -%}
    {{ et.todas_entidades | tojson }}
    `;

  try {
    const entities = await ha.runTemplate(template);
    return entities;
  } catch (error) {
    console.error("Error getting entities from Home Assistant:", error);
    return [];
  }
};
