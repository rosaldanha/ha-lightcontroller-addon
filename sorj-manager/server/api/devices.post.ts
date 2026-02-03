import { defineEventHandler, readBody } from "h3";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { EsphomeConfig, ESPSCHEMA } from "~/utils/EsphomeConfig";

const magicComment = "#!sorj-net.lightcontroller";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const configDir = config.public.esphomeConfigFolder;

    if (!configDir) {
      throw new Error("Configuration folder is not defined.");
    }

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const body = await readBody<EsphomeConfig>(event);

    if (!body || !body.substitutions || !body.substitutions.device_name) {
      throw new Error("Invalid EsphomeConfig object received.");
    }

    // The fromObject static method cleans up the object and ensures all classes are correctly instantiated.
    // When we receive the object from the client, it's a plain JSON object.
    const configInstance = EsphomeConfig.fromObject(body);

    // js-yaml can't dump functions or complex class instances correctly without custom representers.
    // A simple way to ensure we only dump data properties is to serialize and deserialize.
    const plainObject = JSON.parse(JSON.stringify(configInstance));

    const yamlString = yaml.dump(plainObject, {
      schema: ESPSCHEMA,
      noRefs: true,
      sortKeys: false,
    });

    const finalYaml = magicComment + "\n" + yamlString;
    const deviceName = configInstance.substitutions.device_name;
    const filePath = path.join(configDir, `${deviceName}.yaml`);

    fs.writeFileSync(filePath, finalYaml, "utf-8");

    return { success: true, message: `Configuration for ${deviceName} saved.`, path: filePath };

  } catch (error: any) {
    console.error("Error saving device configuration:", error);
    event.res.statusCode = 500;
    return { success: false, message: error.message };
  }
});
