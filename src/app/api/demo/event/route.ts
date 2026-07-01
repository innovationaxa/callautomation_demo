import { NextRequest, NextResponse } from "next/server";
import { postClaimEvents } from "@/lib/monaxaia-client";
import type { ClaimEvent } from "@/lib/scenarios";

// Fires a single granular ClaimEvent to the real /api/events endpoint.
// Fire-and-forget from the client's point of view: the UI already reflects
// this beat locally (from the scenario timeline), this call is what makes
// it genuinely real rather than merely displayed.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.event) {
    return NextResponse.json({ ok: false, error: "missing event" }, { status: 400 });
  }
  if (body.real !== true) {
    // Rehearsal mode — do not touch the shared production event log.
    return NextResponse.json({ ok: true, posted: false });
  }

  const event: ClaimEvent = {
    ...body.event,
    eventId: `demo-${body.event.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: new Date().toISOString(),
  };

  const result = await postClaimEvents([event]);
  return NextResponse.json({ ok: result.ok, posted: true });
}
