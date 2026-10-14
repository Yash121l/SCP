import posthog from "posthog-js";
import type { SessionUser } from "@scp/contracts";

// Public PostHog project key (phc_ keys are write-only client keys and safe to ship).
// VITE_POSTHOG_KEY overrides it and also enables capture on localhost / dev builds.
const envKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const posthogKey = envKey || "phc_oLm8fb7L4CXDqGdJcc7a6boCtR8rVjf6dNx7G995eGdy";
// "/ingest" is the same-origin proxy (functions/ingest/[[path]].ts on Cloudflare Pages).
// The Docker/nginx image has no proxy, so its build sets this to https://us.i.posthog.com.
const apiHost = (import.meta.env.VITE_POSTHOG_API_HOST as string | undefined) || "/ingest";

export const APP_SLUG = "scp";

export function initAnalytics() {
  const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
  if (!envKey && (!import.meta.env.PROD || isLocalhost)) return;

  posthog.init(posthogKey, {
    api_host: apiHost,
    ui_host: "https://us.posthog.com",
    defaults: "2026-08-30",
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: true,
    enable_heatmaps: true,
    capture_dead_clicks: true,
    capture_exceptions: true,
    capture_performance: { web_vitals: true },
    // Student, staff and institution records: mask every input and all text in replays,
    // and keep element text and attributes out of autocapture events.
    mask_all_text: true,
    mask_all_element_attributes: true,
    session_recording: { maskAllInputs: true, maskTextSelector: "*" },
  });
  posthog.register({ app: APP_SLUG });
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}

/** Identify by internal user id only (no email or name), with role and org type for segmenting. */
export function identifyUser(user: SessionUser) {
  if (!posthog.__loaded) return;
  posthog.identify(user.id, {
    roles: user.roles,
    organization_type: user.scope.organizationType,
    organization_id: user.scope.organizationId,
  });
}

export function resetAnalytics() {
  if (!posthog.__loaded) return;
  posthog.reset();
}

type Method = "POST" | "PATCH" | "DELETE";

const createdEvents: Record<string, string> = {
  hubs: "hub_created",
  institutions: "institution_created",
  people: "employee_created",
  projects: "project_created",
  students: "student_created",
};

/**
 * Map a successful write API call to a product event. Only the entity type, ids and
 * status enums are sent, never field values from the payload.
 */
export function trackMutation(method: Method, path: string, payload?: unknown) {
  const segments = path.split("?")[0]!.split("/").filter(Boolean); // ["api", entity, id?, sub?, ...]
  if (segments[0] !== "api" || segments.length < 2) return;
  const entity = segments.slice(1).filter((segment) => !/^[0-9a-f-]{36}$/i.test(segment)).join("_");
  const id = segments.find((segment) => /^[0-9a-f-]{36}$/i.test(segment));
  const status =
    payload && typeof payload === "object" && "status" in payload ? String((payload as { status: unknown }).status) : undefined;

  if (method === "POST" && segments.length === 2 && createdEvents[segments[1]!]) {
    track(createdEvents[segments[1]!]!, {});
  } else if (method === "POST" && entity === "projects_feedback") {
    track("project_feedback_added", { project_id: id });
  } else if (method === "PATCH" && entity === "projects_status") {
    track("project_status_changed", { project_id: id, status });
  } else if (method === "PATCH" && entity === "governance_approvals_decision") {
    track("approval_decided", { approval_id: id, status });
  } else if (method === "PATCH") {
    track("record_updated", { entity, record_id: id });
  } else if (method === "DELETE") {
    track("record_deleted", { entity, record_id: id });
  }
}
