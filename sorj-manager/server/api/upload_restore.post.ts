// server/api/upload_restore.post.ts
import { defineEventHandler, readMultipartFormData, createError } from "h3";
import { useRuntimeConfig } from "#imports";
import JSZip from "jszip";
import fs from "node:fs/promises";
import path from "node:path";

export default defineEventHandler(async (event) => {
  // 1. Ler o arquivo enviado (Multipart Form Data)
  const config = useRuntimeConfig();
  const parts = await readMultipartFormData(event);

  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
  }

  const zipFile = parts[0]; // Assume que é o primeiro arquivo
  let csvContent = "";
  let yamlRestored = false;

  try {
    // 2. Carregar o ZIP da memória
    const zip = await JSZip.loadAsync(zipFile.data);

    // 3. Iterar sobre os arquivos dentro do ZIP
    // Usamos Promise.all para processar em paralelo
    const promises = Object.keys(zip.files).map(async (filename) => {
      const file = zip.files[filename];
      if (file.dir) return;

      // --- TRATAMENTO DO ARQUIVO YAML ---
      if (filename.endsWith(".yaml")) {
        const content = await file.async("string");

        // Define o caminho seguro.
        // Nota: Aqui confiamos no nome do arquivo dentro do zip.
        // Se quiser forçar o nome do dispositivo atual, precisaria passar o nome no formData.
        const filePath = path.join(config.esphomeConfigFolder, filename);

        // Salva no disco
        await fs.writeFile(filePath, content, "utf-8");
        yamlRestored = true;
        console.log(`[Restore] YAML restored: ${filePath}`);
      }

      // --- TRATAMENTO DO ARQUIVO CSV ---
      else if (filename.endsWith(".csv")) {
        // Apenas lê o conteúdo e guarda na variável para retornar ao front
        csvContent = await file.async("string");
      }
    });

    await Promise.all(promises);

    if (!yamlRestored && !csvContent) {
      throw new Error("Invalid Backup Zip: No YAML or CSV found.");
    }

    // 4. Retorna o conteúdo do CSV para o frontend processar a barra de progresso
    return {
      success: true,
      message: yamlRestored
        ? "YAML configuration updated."
        : "No YAML found in zip.",
      csv_content: csvContent,
    };
  } catch (err: any) {
    console.error("Restore Upload Error:", err);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to process backup file: " + err.message,
    });
  }
});
