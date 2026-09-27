// Explicit opt-in only. Uses the shared usage callback and deadline, no text-route assumptions.
import { callModel } from "./modelClient.js";
export function financeVision(
  env: (key: string) => string,
  deadline: number,
  onUsage: any,
) {
  if (env("FINANCE_VISION_VERIFIED") !== "true") return undefined;
  const url = env("FINANCE_VISION_URL"),
    model = env("FINANCE_VISION_MODEL"),
    apiKey = env("FINANCE_VISION_API_KEY");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (
    parsed.protocol !== "https:" ||
    !model ||
    !apiKey ||
    !env("FINANCE_VISION_ALLOWED_ORIGINS").split(",").includes(parsed.origin)
  )
    return undefined;
  return (messages: any[]) =>
    callModel({
      url,
      apiKey,
      model,
      provider: "finance-vision",
      messages,
      effort: "low",
      deadline,
      onUsage,
    });
}
