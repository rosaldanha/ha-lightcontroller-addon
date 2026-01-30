// server/api/devices.get.ts
import { defineEventHandler } from "h3";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { EsphomeConfig, ESPSCHEMA } from "~/utils/EsphomeConfig";

export default defineEventHandler(async (event) => {
    // TODO: The path should be '../config/esphome/'. Using 'docs/' for now as it exists.
    // The final path will depend on the execution environment inside Home Assistant.
    // 'process.cwd()' is likely '/home/ricardosaldanha/learn/ha-lightcontroller-addon/sorj-manager'
    const configDir = path.resolve(process.cwd(), "..", "docs");
    const configs: EsphomeConfig[] = [];
    const magicComment = "#light_controller_managed_config";

    try {
        const files = fs.readdirSync(configDir);

        for (const file of files) {
            if (
                path.extname(file) !== ".yaml" &&
                path.extname(file) !== ".yml"
            ) {
                continue;
            }

            const filePath = path.join(configDir, file);
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const firstLine = fileContent.split("\\n")[0].trim();

            if (firstLine === magicComment) {
                try {
                    const data = yaml.load(fileContent, { schema: ESPSCHEMA });
                    if (data && typeof data === "object") {
                        const configInstance = EsphomeConfig.fromObject(data);
                        configs.push(configInstance);
                    }
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
