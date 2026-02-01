import { defineEventHandler, readBody, createError } from "h3";
import { useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const { entity_id, value } = body;

  if (!entity_id || value === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: "Entity ID and Value required",
    });
  }

  // O objeto 'ha' vem do server/utils/ha.ts
  try {
    // Chama o serviço do Home Assistant para definir o valor
    // Domínio: text, Serviço: set_value
    await ha.request("/services/text/set_value", {
      method: "POST",
      body: {
        entity_id: entity_id,
        value: value,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error(`Restore failed for ${entity_id}:`, error.message);
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to update ${entity_id}`,
      data: error.message,
    });
  }
});
