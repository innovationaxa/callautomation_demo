import type { ClaimEvent, Scenario } from "./scenarios";

const BASE = process.env.MONAXAIA_API_BASE ?? "https://mon-axaia.vercel.app";
const API_KEY = process.env.MONAXAIA_API_KEY ?? "";

// ---------------------------------------------------------------------------
// Two real, already-deployed endpoints on the AXA Services Maroc accelerathon
// project (docs/genesys-integration.md + docs/genesys-events.md):
//
// 1. POST /api/handoff — the SHIPPED end-of-call flow. Returns a real,
//    working { link } that opens the genuine Mon AXA claim dossier (résumé,
//    transcript, suivi, création de compte if needed). This is what we use
//    to prove the demo end-to-end against production, not a mock.
// 2. POST /api/events  — the granular real-time event stream (target
//    evolution, partially wired). Feeds the dossier's timeline/cards when
//    the app reads it. We post it too, best-effort, for extra richness.
// ---------------------------------------------------------------------------

export type HandoffTranscriptLine = { role: "agent" | "client"; text: string };

export type HandoffPayload = {
  handoffToken: string;
  intent: Scenario["key"];
  intentLabel: string;
  title: string;
  startedAt: string;
  agentName: string;
  claim_reference: string;
  claim_vehicle?: string;
  outcome: "resolu_vocal" | "oriente_selfcare" | "transfere_gestionnaire";
  outcomeLabel: string;
  summaryPoints: string[];
  transcript: HandoffTranscriptLine[];
  continuationPrompt?: string;
  espaceClientActive: boolean;
};

export type HandoffResult =
  | { ok: true; token: string; link: string }
  | { ok: false; status: number; error?: string };

export async function postHandoff(payload: HandoffPayload): Promise<HandoffResult> {
  try {
    const res = await fetch(`${BASE}/api/handoff`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      return { ok: false, status: res.status, error: data?.error };
    }
    return { ok: true, token: data.token, link: data.link };
  } catch {
    return { ok: false, status: 0 };
  }
}

// Best-effort: posts the granular ClaimEvent stream. Failures are swallowed —
// the handoff link above is the load-bearing part of the demo.
export async function postClaimEvents(events: ClaimEvent[]): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${BASE}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ events }),
      cache: "no-store",
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
