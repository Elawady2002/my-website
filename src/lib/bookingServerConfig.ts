export function getAppsScriptUrl(): string {
  const raw = (process.env.GOOGLE_APPS_SCRIPT_URL || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (
      parsed.protocol === "https:" &&
      parsed.hostname === "script.google.com" &&
      parsed.pathname.startsWith("/macros/s/")
    ) {
      return parsed.toString();
    }
    return "";
  } catch {
    return "";
  }
}

export function getWebhookSecret(): string {
  return (process.env.BOOKING_WEBHOOK_SECRET || "").trim();
}
