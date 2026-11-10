import { VitalFit } from "@vitalfit/sdk";

const devModeFlag = process.env.NEXT_PUBLIC_DEV_MODE === "true";

// NEXT_PUBLIC_API_URL must include the /v1 prefix, e.g. https://vitalfit-api.onrender.com/v1
export const api = VitalFit.getInstance(devModeFlag, process.env.NEXT_PUBLIC_API_URL);
