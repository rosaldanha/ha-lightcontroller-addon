import { defineEventHandler } from "h3";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const supervisorUrl = config.supervisorUrl;

  const supervisorToken = config.supervisorToken;

  if (!supervisorToken) {
    throw new Error("SUPERVISOR_TOKEN is not defined");
  }

  try {
    const response = await fetch(`${supervisorUrl}/template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supervisorToken}`,
      },
      body: JSON.stringify({ template: "{{ areas() }}" }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch areas from Home Assistant: ${response.statusText}`,
      );
    }

    const areasString = await response.text();
    // The result from HA is a string like "['area1', 'area2']"
    // We need to convert it to a valid JSON array string.
    const jsonString = areasString.replace(/'/g, '"');
    const areas = JSON.parse(jsonString);

    return areas;
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch areas" };
  }
});
