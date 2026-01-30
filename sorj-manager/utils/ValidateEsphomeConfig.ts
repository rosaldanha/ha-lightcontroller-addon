import { EsphomeConfig } from "./EsphomeConfig";

export class IsValid {
  isValid: boolean = false;
  messages: string[] = [];
  constructor(isValid?: boolean, messages?: string[]) {
    if (isValid != undefined) this.isValid = isValid;
    if (messages != undefined) this.messages = messages;
  }
}

export function validateEsphomeConfig(target: EsphomeConfig): IsValid {
  return new IsValid();
}
