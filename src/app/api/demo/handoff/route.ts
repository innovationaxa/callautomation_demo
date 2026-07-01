import { NextRequest, NextResponse } from "next/server";
import { postHandoff, type HandoffTranscriptLine } from "@/lib/monaxaia-client";
import { getScenario } from "@/lib/scenarios";

const INTENT_LABELS: Record<string, string> = {
  franchise: "Garanties / franchise",
  paiement: "Règlement / indemnisation",
  expertise: "Suivi d'expertise",
  pieces: "Dépôt d'une pièce",
};

const OUTCOME_LABELS: Record<string, string> = {
  oriente_selfcare: "Orienté vers le selfcare",
  transfere_gestionnaire: "Transfert vers un conseiller, avec le contexte",
  resolu_vocal: "Résolu directement par téléphone",
};

// Triggers the real end-of-call handoff. Returns a genuine, working link
// that opens the actual Mon AXA claim dossier (résumé, transcript, suivi).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const scenario = body?.scenarioKey ? getScenario(body.scenarioKey) : undefined;
  if (!scenario) {
    return NextResponse.json({ ok: false, error: "unknown scenario" }, { status: 400 });
  }

  const finalBeat = scenario.timeline.find((e) => e.event.type === "summary");
  const outcome = finalBeat?.event.outcome ?? "oriente_selfcare";
  const summaryPoints = finalBeat?.event.summaryPoints ?? [scenario.subject];
  const espaceClientActive = scenario.key !== "paiement";

  const handoffToken = `DEMO-${scenario.key.toUpperCase()}-${Date.now().toString(36)}`;

  if (body.real !== true) {
    // Rehearsal mode — no production write, no real link.
    return NextResponse.json({ ok: true, real: false, token: handoffToken, link: null });
  }

  const transcript: HandoffTranscriptLine[] = scenario.transcript.map((b) => ({
    role: b.speaker === "ia" ? "agent" : "client",
    text: b.text,
  }));

  const result = await postHandoff({
    handoffToken,
    intent: scenario.key,
    intentLabel: INTENT_LABELS[scenario.key],
    title: scenario.subject,
    startedAt: new Date().toISOString(),
    agentName: "Assistant AXA",
    claim_reference: scenario.claimReference,
    claim_vehicle: scenario.context,
    outcome,
    outcomeLabel: OUTCOME_LABELS[outcome] ?? OUTCOME_LABELS.oriente_selfcare,
    summaryPoints,
    transcript,
    continuationPrompt: `Je fais suite à mon appel au sujet de : ${scenario.subject} (réf. ${scenario.claimReference}).`,
    espaceClientActive,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, real: true, error: "handoff_failed", status: result.status });
  }

  return NextResponse.json({ ok: true, real: true, token: result.token, link: result.link });
}
