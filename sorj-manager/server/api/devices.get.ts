// server/api/devices.get.ts
import { defineEventHandler } from "h3";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { EsphomeConfig, ESPSCHEMA } from "../../utils/EsphomeConfig";
import { useRuntimeConfig } from "#imports";
import { MagicComment } from "../../utils/Constants";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  //console.log(config);
  const configDir = config.esphomeConfigFolder;
  //console.log(configDir);
  const configs: EsphomeConfig[] = [];

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
      if (firstLine === MagicComment) {
        try {
          const data: EsphomeConfig = yaml.load(fs.readFileSync(filePath), {
            schema: ESPSCHEMA,
          });
          configs.push(data);
          // if (data && typeof data === "object") {
          //   const configInstance = EsphomeConfig.fromObject(data);
          //   configs.push(configInstance);
          // }
        } catch (e) {
          console.error(`Error parsing YAML file ${file}:`, e);
          // Optionally, decide if you want to throw an error or just skip the file
        }
      }
    }
    return configs;
  } catch (error) {
    console.error(`Failed to read config directory ${configDir}:`, error);
    // If the directory doesn't exist or there's a reading error, return an empty array.
    // This is more graceful for the frontend than throwing an error.
    return [];
  }
});
