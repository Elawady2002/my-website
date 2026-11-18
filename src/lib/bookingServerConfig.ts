const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwfxxQuDBzjSIjOQnKbMHuLrcXwgCCsBunTuax0pmOGUqosXXdXxMtJlCvBOCDeDUR0/exec";

export function getAppsScriptUrl(): string {
  return (process.env.GOOGLE_APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL).trim();
}

export function getWebhookSecret(): string {
  return (process.env.BOOKING_WEBHOOK_SECRET || "").trim();
}
