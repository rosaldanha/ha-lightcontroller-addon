import yaml from "js-yaml";
import { PackageKind } from "./Constants";

export class EsphomeInclude {
  _packageKind: PackageKind = PackageKind.INCLUDE;
  readonly _isEsphomeInclude: boolean = true;
  constructor(public data: string | object) {}
}

// ======================================= use this =======================================================
// Definição para !include escalar (apenas string)
const includeStringNew = new yaml.Type("!include", {
  kind: "scalar",
  resolve: (object: any) => {
    return typeof object === "string";
  },
  construct: (data: any) => new EsphomeInclude(data),

  // O PREDICATE É A CHAVE: Só usa este tipo se 'data' for string
  predicate: (object: any) => {
    const isFileString = object?.data && typeof object.data === "string";
    return isFileString && object.data.toLowerCase().includes("base.yaml");
  },
  represent: (entry: any) => {
    console.log("REPRESENT_INCLUDESTRINGNEW", JSON.stringify(entry));
    return entry.data;
  },
});
// https://gemini.google.com/share/8b0cf77d2ba9
const includeMappingPorts = new yaml.Type("!include", {
  kind: "mapping",
  resolve: (object: any) => {
    // Verifica se tem a propriedade obrigatória 'file'
    if (object !== null && typeof object.file === "string")
      console.log("RESOLVING...", JSON.stringify(object));
    return object !== null && typeof object.file === "string";
  },
  // testar o tipo e criar aqui. não criar multiplas tags com !include.
  construct: (object: any) => {
    if (object.file.toLowerCase().includes("light_kincony.yaml"))
      return new OutputPortLight(
        object.vars.po_id,
        object.vars.po_name,
        object.vars.po_device,
        object.vars.po_hub_id,
        object.vars.po_ph_id,
      );
    if (object.file.toLowerCase().includes("switch_kincony.yaml"))
      return new OutputPortSwitch(
        object.vars.po_id,
        object.vars.po_name,
        object.vars.po_icon,
        object.vars.po_device_class,
      );
  },
  // O PREDICATE É A CHAVE: Só usa este tipo se 'data' for objeto
  predicate: (object: any) => {
    const isFileString =
      object?.file &&
      typeof object === "object" &&
      typeof object.file === "string";
    if (isFileString)
      console.log(
        "includeMappingPorts IS_FILE_STRING_TRUE: ",
        JSON.stringify(object),
      );
    return isFileString; // o problema está em reconhecer o tipo do objeto no servidor, então preciso testar se existem determinadas variáveis
  },
  represent: (entry: any) => {
    console.log("REPRESENT_includeMappingPorts", JSON.stringify(entry));
    return {
      file: entry.file,
      vars: entry.vars,
    };
  },
});

// const includeMappingSwitch = new yaml.Type("!include", {
//   kind: "mapping",
//   construct: (data: any) =>
//     new OutputPortSwitch(
//       data.id,
//       data.po_name,
//       data.po_icon,
//       data.po_device_class,
//     ),
//   // O PREDICATE É A CHAVE: Só usa este tipo se 'data' for objeto
//   predicate: (object: any) => {
//     const isFileString =
//       object?.file &&
//       typeof object === "object" &&
//       typeof object.file === "string";
//     if (isFileString)
//       console.log(
//         "includeMappingSwitch IS_FILE_STRING_TRUE: ",
//         JSON.stringify(object),
//       );
//     return (
//       isFileString && object.file.toLowerCase().includes("switch_kincony.yaml")
//     ); // o problema está em reconhecer o tipo do objeto no servidor, então preciso testar se existem determinadas variáveis
//   },
//   represent: (entry: any) => {
//     console.log("REPRESENT_includeMappingSwitch", JSON.stringify(entry));
//     return {
//       file: entry.file,
//       vars: entry.vars,
//     };
//   },
// });

export const ESPSCHEMA = yaml.DEFAULT_SCHEMA.extend([
  includeMappingPorts,
  includeStringNew,
]);

//----------------------------- Test with light ------------------------------------------------

export class Substitutions {
  device_name: string = "";
  fixed_mac: string = "";
  device_static_ip: string = "";
  po1device?: string;
  po2device?: string;
  po3device?: string;
  po4device?: string;
  po5device?: string;
  po6device?: string;
  po7device?: string;
  po8device?: string;
  po9device?: string;
  po10device?: string;
  po11device?: string;
  po12device?: string;
  po13device?: string;
  po14device?: string;
  po15device?: string;
  po16device?: string;

  pi1device?: string;
  pi2device?: string;
  pi3device?: string;
  pi4device?: string;
  pi5device?: string;
  pi6device?: string;
  pi7device?: string;
  pi8device?: string;
  pi9device?: string;
  pi10device?: string;
  pi11device?: string;
  pi12device?: string;
  pi13device?: string;
  pi14device?: string;
  pi15device?: string;
  pi16device?: string;

  pi1swstate?: string;
  pi2swstate?: string;
  pi3swstate?: string;
  pi4swstate?: string;
  pi5swstate?: string;
  pi6swstate?: string;
  pi7swstate?: string;
  pi8swstate?: string;
  pi9swstate?: string;
  pi10swstate?: string;
  pi11swstate?: string;
  pi12swstate?: string;
  pi13swstate?: string;
  pi14swstate?: string;
  pi15swstate?: string;
  pi16swstate?: string;

  constructor(deviceName: string, mac: string, ip: string) {
    this.device_name = deviceName;
    this.fixed_mac = mac;
    this.device_static_ip = ip;
  }
}
export abstract class Port {
  abstract readonly file: string;
  abstract _packageKind: PackageKind;
  vars: Record<string, string | number> = {};
  constructor(id: string) {
    //super(id);
    this.vars["po_id"] = id;
  }
}
export class InputPort extends Port {
  readonly file: string = "None";
  _packageKind: PackageKind = PackageKind.NONE;
  //unused, will works only if input has a package to change device class, probably with extends
}
export class OutputPortLight extends Port {
  readonly file: string = "packages/KINCONY-KC868-A16/light_kincony.yaml";
  _packageKind: PackageKind = PackageKind.LIGHT;
  constructor(
    id: string,
    po_name: string,
    po_device: string,
    po_hub_id: string,
    po_ph_id: number,
  ) {
    super(id);
    this._packageKind = PackageKind.LIGHT;

    this.vars["po_name"] = po_name;
    this.vars["po_device"] = po_device;
    this.vars["po_hub_id"] = po_hub_id;
    this.vars["po_ph_id"] = po_ph_id;
  }
}
export class OutputPortSwitch extends Port {
  readonly file: string = "packages/KINCONY-KC868-A16/switch_kincony.yaml";
  _packageKind: PackageKind = PackageKind.SWITCH;
  constructor(
    id: string,
    po_name: string,
    po_icon?: string,
    po_device_class?: string,
  ) {
    super(id);
    this._packageKind = PackageKind.SWITCH;

    this.vars["po_name"] = po_name;
    if (po_device_class) this.vars["po_device_class"] = po_device_class;
    else this.vars["po_device_class"] = "";
    if (po_icon) this.vars["po_icon"] = po_icon;
    else this.vars["po_icon"] = "";
  }
}
export class EsphomeDevice {
  id: string;
  name: string;
  area_id: string;
  constructor(id: string, name: string, area_id: string) {
    this.id = id;
    this.name = name;
    this.area_id = area_id;
  }
}
export class EsphomeSection {
  area: string;
  devices: EsphomeDevice[] = [];
  constructor(area: string) {
    this.area = area;
  }
}
export class EsphomeConfig {
  substitutions: Substitutions;
  packages: Record<string, EsphomeInclude | Port>;
  esphome: EsphomeSection;
  constructor(deviceName: string, mac: string, ip: string, deviceArea: string) {
    this.substitutions = new Substitutions(deviceName, mac, ip);
    this.esphome = new EsphomeSection(deviceArea);
    this.packages = {};
    this.packages["base"] = new EsphomeInclude(
      "packages/KINCONY-KC868-A16/base.yaml",
    );
  }

  public static fromObject(data: any): EsphomeConfig {
    // Create an instance with dummy data, which will be overwritten.
    const config = new EsphomeConfig(
      data.substitutions?.device_name || "",
      data.substitutions?.fixed_mac || "",
      data.substitutions?.device_static_ip || "",
      data.esphome?.area || "",
    );

    // Overwrite substitutions with all data from the file
    Object.assign(config.substitutions, data.substitutions);

    // Overwrite packages
    config.packages = data.packages || {};

    // Overwrite esphome section, ensuring devices are instances of EsphomeDevice
    if (data.esphome && data.esphome.devices) {
      config.esphome.devices = data.esphome.devices.map(
        (d: any) => new EsphomeDevice(d.id, d.name, d.area_id),
      );
    }

    return config;
  }
}
