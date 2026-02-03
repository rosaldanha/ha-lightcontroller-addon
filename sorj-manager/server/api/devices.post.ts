import { defineEventHandler, readBody } from "h3";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { EsphomeConfig, ESPSCHEMA } from "~/utils/EsphomeConfig";
import { MagicComment } from "../../utils/Constants";

const magicComment = "#!sorj-net.lightcontroller";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const configDir = config.esphomeConfigFolder;

    if (!configDir) {
      throw new Error("Configuration folder is not defined.");
    }

    if (!fs.existsSync(configDir)) {
      throw new Error("Configuration folder does not exist.");
    }

    const body = await readBody<any>(event);

    if (!body || !body.substitutions || !body.substitutions.device_name) {
      throw new Error("Invalid EsphomeConfig object received.");
    }

    const dataToDump = body;

    // Manually reconstruct the 'packages' property with EsphomeInclude instances
    // This is necessary so that the custom representer in ESPSCHEMA is triggered.
    if (dataToDump.packages) {
      for (const key in dataToDump.packages) {
        const pkg = dataToDump.packages[key];

        // Heuristic to decide how to wrap the data for the !include tag.
        if (pkg.data && typeof pkg.data === "string") {
          // Handles scalar includes like: base: !include path/to/file.yaml
          dataToDump.packages[key] = new EsphomeInclude(pkg.data);
        } else {
          // Handles mapping includes like: po1: !include { file: ..., vars: ... }
          // We create a new object without the extra properties from the client-side model.
          const includeData = {
            file: pkg.file,
            vars: pkg.vars,
          };
          dataToDump.packages[key] = new EsphomeInclude(includeData);
        }
      }
    }

    const yamlString = yaml.dump(dataToDump, {
      schema: ESPSCHEMA,
      noRefs: true,
      sortKeys: false,
    });
    const finalYaml = MagicComment + "\n" + yamlString;
    const deviceName = configInstance.substitutions.device_name;
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
