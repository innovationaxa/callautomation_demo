import type { ClaimEvent } from "./scenarios";

export type EventCard = { icon: string; title: string; detail?: string };
type DisplayableEvent = Omit<ClaimEvent, "eventId" | "occurredAt">;

function fmtDate(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} à ${time}`;
}

export function renderEventCard(event: DisplayableEvent): EventCard {
  switch (event.type) {
    case "status_changed":
      return {
        icon: "🚩",
        title: event.title,
        detail: event.dueLabel ? `Échéance : ${event.dueLabel}` : undefined,
      };
    case "document_available":
      return {
        icon: "📄",
        title: event.title,
        detail: event.available
          ? "Disponible maintenant"
          : `Bientôt disponible${event.dueLabel ? " · " + event.dueLabel : ""}`,
      };
    case "document_requested":
      return { icon: "📤", title: event.title, detail: event.hint };
    case "document_received":
      return {
        icon: "✅",
        title: event.title,
        detail: event.receiptId ? `Accusé ${event.receiptId}` : undefined,
      };
    case "appointment_proposed":
    case "appointment_confirmed":
      return {
        icon: "📅",
        title: event.title,
        detail: [event.label, fmtDate(event.dateTime) ?? event.window, event.place]
          .filter(Boolean)
          .join(" · "),
      };
    case "coverage_info":
      return { icon: "🛡️", title: event.title, detail: event.explanation };
    case "payment_update":
      return {
        icon: "💶",
        title: event.title,
        detail: [event.amount, event.dueLabel].filter(Boolean).join(" · "),
      };
    case "benefit_offered":
      return {
        icon: "🎁",
        title: event.title,
        detail: [event.label, event.amountPerDay ? event.amountPerDay + "/j" : undefined]
          .filter(Boolean)
          .join(" · "),
      };
    case "summary":
      return {
        icon: "📝",
        title: event.title,
        detail: (event.summaryPoints ?? []).join(" · "),
      };
    case "transfer_to_agent":
      return { icon: "↗️", title: event.title, detail: event.reason };
    case "advisor_assigned":
      return {
        icon: "🧑‍💼",
        title: event.title,
        detail: [event.advisorName, event.advisorRole].filter(Boolean).join(" · "),
      };
    default:
      return { icon: "ℹ️", title: event.title, detail: event.description };
  }
}
