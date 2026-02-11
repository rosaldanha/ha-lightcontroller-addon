import { defineEventHandler, getQuery, createError } from "h3";
import { ha } from "../utils/ha";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const entityIdAction = query.entityIdAction as string;

  if (!entityIdAction) {
    throw createError({
      statusCode: 400,
      statusMessage: "Query parameter 'entityIdAction' is required",
    });
  }

  try {
    // Construct the Home Assistant template. The entity ID must be in quotes.
    const template = `{{ states('${entityIdAction}') }}`;

    // Use the utility to run the template
    const result = await ha.runTemplate(template);

    // The result from ha.runTemplate might already be parsed if it's JSON,
    // but for `states()`, it's typically a simple string.
    // We can return it directly.
    return result;
  } catch (error: any) {
    console.error(
      `[API Error] Failed to render template for entity: ${entityIdAction}`,
      error.message,
    );

    // Forward a structured error to the client
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to communicate with Home Assistant: ${error.data?.message || error.message}`,
    });
  }
});
