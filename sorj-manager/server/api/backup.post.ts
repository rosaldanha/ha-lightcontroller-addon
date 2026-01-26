// server/api/backup.post.ts
import {
  defineEventHandler,
  readBody,
  createError,
  setResponseHeader,
} from "h3";
import JSZip from "jszip";
import fs from "node:fs/promises";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const deviceName = body.deviceName;

  if (!deviceName)
    throw createError({
      statusCode: 400,
      statusMessage: "Device Name required",
    });

  // Sanitiza o nome (ex: "My Device" -> "my_device") para usar no arquivo e template
  const safeDeviceName = deviceName.toLowerCase().replace(/\s+/g, "_");

  // Inicializa o objeto ZIP
  const zip = new JSZip();

  // =================================================================================
  // TAREFA 1: Gerar o CSV dos Estados (Usando seu Template Jinja2)
  // =================================================================================
  try {
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

    // Executa o template no Home Assistant
    const csvData = await ha.runTemplate(templateQuery);

    // Adiciona o resultado ao ZIP
    if (csvData && typeof csvData === "string" && csvData.length > 0) {
      zip.file(`${safeDeviceName}_states.csv`, csvData);
    } else {
      zip.file(
        "states_info.txt",
        "No entities found or Home Assistant returned empty data.",
      );
    }
  } catch (err: any) {
    console.error("Erro ao gerar CSV:", err);
    zip.file("error_csv.txt", `Error fetching states: ${err.message}`);
  }

  // =================================================================================
  // TAREFA 2: Buscar o arquivo YAML no disco local (/config/esphome)
  // =================================================================================
  try {
    // Caminho padrão onde o Add-on ESPHome salva os arquivos
    // O mapeamento 'map: - config:rw' no config.yaml permite acessar isso.
    const yamlPath = `homeassistant/esphome/${safeDeviceName}.yaml`;

    // Tenta ler o arquivo
    const yamlContent = await fs.readFile(yamlPath, "utf-8");

    // Adiciona ao ZIP
    zip.file(`${safeDeviceName}.yaml`, yamlContent);
  } catch (err: any) {
    console.error("Erro ao ler YAML:", err);
    // Se falhar (arquivo não existe ou sem permissão), adiciona um aviso no ZIP
    zip.file(
      "error_yaml.txt",
      `Could not find config file at homeassistant/esphome/${safeDeviceName}.yaml. \nError: ${err.message}`,
    );
  }

  // =================================================================================
  // TAREFA 3: Finalizar e Enviar o ZIP
  // =================================================================================

  // Gera o buffer binário do ZIP
  const content = await zip.generateAsync({ type: "nodebuffer" });

  // Define os headers para o navegador entender que é um arquivo ZIP para download
  setResponseHeader(event, "Content-Type", "application/zip");
  setResponseHeader(
    event,
    "Content-Disposition",
    `attachment; filename=backup-${safeDeviceName}.zip`,
  );

  return content;
});
