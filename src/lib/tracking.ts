import type { WebEventType } from "@vitalfit/sdk";
import { api } from "@/lib/sdk-config";

const SESSION_KEY = "vf_funnel_session";

/** Anonymous id that lives for the browser tab session. */
function sessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * HU-ANALYTICS-03: records a step of the web conversion funnel
 * (visit → signup → checkout → purchase). Each step is sent once per session
 * and failures never affect the user flow.
 */
export function trackFunnel(eventType: WebEventType): void {
  const id = sessionId();
  if (!id) {
    return;
  }
  const sentKey = `${SESSION_KEY}:${eventType}`;
  if (sessionStorage.getItem(sentKey)) {
    return;
  }
  sessionStorage.setItem(sentKey, "1");
  api.insights
    .trackWebEvent(id, eventType, window.location.pathname.slice(0, 255))
    .catch(() => sessionStorage.removeItem(sentKey));
}
