// server/api/monitor-entities.get.ts
import { defineEventHandler } from "h3";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { EsphomeConfig, ESPSCHEMA } from "~/utils/EsphomeConfig";
import { ha } from "~/server/utils/ha";
import { useRuntimeConfig } from "#imports";

export function get_monitored_entities(): string[] {
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

  const template = `
    {% set ns = namespace(entities=[]) %}
    {% for device in devices %}
      {% for i in range(1, 17) %}
        {% set entity_id = 'binary_sensor.' ~ device ~ '_pi' ~ i %}
        {% if states[entity_id] is defined %}
          {% set ns.entities = ns.entities + [entity_id] %}
        {% endif %}
      {% endfor %}
    {% endfor %}
    {{ ns.entities | tojson }}
  `;

  // This is a bit of a hack to pass the devices to the template.
  // The `runTemplate` function only takes a string.
  // So I'm adding the devices as a variable in the template itself.
  const templateWithDevices = `{% set devices = ${JSON.stringify(deviceNames)} %}\n${template}`;

  try {
    const entities = await ha.runTemplate(templateWithDevices);
    return entities;
  } catch (error) {
    console.error("Error getting entities from Home Assistant:", error);
    return [];
  }
}
