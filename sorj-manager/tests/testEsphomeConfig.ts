import {
  EsphomeDevice,
  EsphomeConfig,
  ESPSCHEMA,
  OutputPortLight,
  OutputPortSwitch,
} from "../utils/EsphomeConfig";
import yaml, { Schema } from "js-yaml";
import fs from "fs";

try {
  const doc: EsphomeConfig = yaml.load(
    fs.readFileSync("./kinconya16_0101.yaml"),
    {
      schema: ESPSCHEMA,
    },
  );
  console.log(doc);
  console.log(yaml.dump(doc, { schema: ESPSCHEMA }));
} catch (e) {
  console.log(e);
}

// const esp: EsphomeConfig = new EsphomeConfig(
//   "kincony1",
//   "00:00:00:00:00",
//   "172.18.5.5",
//   "cozinha",
// );
// esp.esphome.devices = [
//   new EsphomeDevice("sw-01", "sw-01", "cozinha"),
//   new EsphomeDevice("sw-03", "sw-03", "varanda"),
//   new EsphomeDevice("luzes_cozinha", "Luzes Cozinha", "cozinha"),
// ];
// esp.packages["po1"] = new OutputPortSwitch("po1", "boiler");
// esp.packages["po2"] = new OutputPortLight(
//   "po2",
//   "copa",
//   "luzes_cozinha",
//   "",
//   2,
// );
// const yamlString = yaml.dump(esp, {
//   schema: ESPSCHEMA,
//   noRefs: true,
//   sortKeys: false,
//   styles: { "!include": "original" },
//   replacer: (key, value) => {
//     if (
//       value == null ||
//       key.startsWith("_") ||
//       (Array.isArray(value) && value.length === 0)
//     ) {
//       return undefined;
//     } else {
//       return value;
//     }
//   },
// });

// console.log("-------------  javascript object print ---------------------");
// console.log(esp);
// console.log("-------------  yaml print ---------------------");
// console.log(yamlString);
