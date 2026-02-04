import { defineEventHandler, readBody } from "h3";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { EsphomeConfig, ESPSCHEMA } from "../../utils/EsphomeConfig";
import { MagicComment } from "../../utils/Constants";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    // Correctly access the public runtime config variable
    const configDir = config.esphomeConfigFolder;

    if (!configDir) {
      throw new Error("Configuration folder is not defined in runtime config.");
    }

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Use the EsphomeConfig type for the request body
    console.log("**************** EVENT DIRECT PRINT **********************");
    console.log(event);
    const body = await readBody<EsphomeConfig>(event);

    if (!body || !body.substitutions || !body.substitutions.device_name) {
      throw new Error("Invalid EsphomeConfig object received.");
    }

    const dataToDump = body;

    // Manually reconstruct the 'packages' property with EsphomeInclude instances
    // if (dataToDump.packages) {
    //   for (const key in dataToDump.packages) {
    //     const pkg = dataToDump.packages[key] as any;

    //     if (pkg.data && typeof pkg.data === "string") {
    //       // Handles scalar includes: base: !include path/to/file.yaml
    //       dataToDump.packages[key] = new EsphomeInclude(pkg.data);
    //     } else {
    //       // Handles mapping includes: po1: !include { file: ..., vars: ... }
    //       const includeData = {
    //         file: pkg.file,
    //         vars: pkg.vars,
    //       };
    //       dataToDump.packages[key] = new EsphomeInclude(includeData);
    //     }
    //   }
    // }
    const yamlString = yaml.dump(dataToDump, {
      schema: ESPSCHEMA,
      //styles: { "!include": "original" },
      lineWidth: -1,
      noRefs: true,
      replacer: (key, value) => {
        if (
          value == null ||
          key.startsWith("_") ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return undefined;
        } else {
          return value;
        }
      },
    });
    const finalYaml = MagicComment + "\n" + yamlString;
    const deviceName = dataToDump.substitutions.device_name;
    const filePath = path.join(configDir, `${deviceName}.yaml`);

    fs.writeFileSync(filePath, finalYaml, "utf-8");

    return {
      success: true,
      message: `Configuration for ${deviceName} saved.`,
      path: filePath,
    };
  } catch (error: any) {
    console.error("Error saving device configuration:", error);
    event.res.statusCode = 500;
    return { success: false, message: error.message };
  }
});
