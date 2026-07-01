export type Channel = "app" | "whatsapp";

export type TranscriptBeat = {
  t: number; // seconds from call start
  speaker: "ia" | "client";
  text: string;
};

// Flat envelope matching the real Genesys <-> Mon AXA contract
// (src/types/genesysEvents.ts, cf. docs/genesys-integration.md).
// Genesys emits flat JSON only — no nested objects.
export type ClaimEvent = {
  eventId: string;
  type:
    | "status_changed"
    | "document_available"
    | "document_requested"
    | "document_received"
    | "appointment_proposed"
    | "appointment_confirmed"
    | "coverage_info"
    | "payment_update"
    | "benefit_offered"
    | "summary"
    | "transfer_to_agent"
    | "advisor_assigned"
    | "custom";
  occurredAt: string;
  claim_reference: string;
  title: string;
  description?: string;
  status?: "declaration" | "evaluation" | "reparation" | "indemnisation" | "cloture";
  sequence?: number;
  claim_vehicle?: string;
  dueDate?: string;
  dueLabel?: string;
  notify_enabled?: boolean;
  recipient?: "client" | "gestionnaire" | "both";
  client_hasActiveAccount?: boolean;
  client_preferredChannel?: "sms" | "whatsapp" | "email";
  actionLabel?: string;
  actionDeepLink?: string;
  // type-specific (all flat, per §3 of the spec)
  documentId?: string;
  docType?: string;
  available?: boolean;
  label?: string;
  hint?: string;
  receiptId?: string;
  appointmentId?: string;
  category?: "reparation" | "expertise" | "conseil";
  dateTime?: string;
  place?: string;
  mode?: "agence" | "distance" | "telephone";
  window?: string;
  interlocuteur?: string;
  motif?: string;
  partnerName?: string;
  partnerPhone?: string;
  coveredInFull?: boolean;
  deductible?: string;
  outOfPocket?: string;
  advanceRequired?: boolean;
  directSettlement?: boolean;
  liability?: "engagee" | "non_engagee" | "partielle";
  explanation?: string;
  amount?: string;
  paymentStatus?: "valide" | "vire" | "en_cours" | "recu";
  account?: string;
  valueDate?: string;
  amountPerDay?: string;
  maxDays?: number;
  conditions?: string;
  benefitStatus?: "proposee" | "activee" | "refusee";
  summaryPoints?: string[];
  intent?: "franchise" | "paiement" | "expertise" | "pieces" | "autre";
  outcome?: "oriente_selfcare" | "transfere_gestionnaire" | "resolu_vocal";
  final?: boolean;
  reason?: string;
  advisorName?: string;
  advisorRole?: string;
  advisorAgency?: string;
  advisorPhone?: string;
};

// The channel Mon AXA's notification service would resolve to for this beat
// (in-app is the default/priority channel; WhatsApp when there's no active
// in-app session or the client expressed that preference — cf. §4/§4bis).
export type TimelineEvent = {
  t: number; // seconds from call start, when this event fires
  channel: Channel;
  event: Omit<ClaimEvent, "eventId" | "occurredAt">;
};

export type Scenario = {
  key: "franchise" | "paiement" | "expertise" | "pieces";
  title: string;
  subject: string;
  customerName: string;
  claimReference: string;
  // Short contextual detail shown under the claim reference (partner,
  // vehicle, or document — whichever was actually mentioned in the call;
  // left honest rather than inventing a car model when none was said).
  context: string;
  audioSrc: string;
  audioDurationSec: number;
  // Fixed, pre-built real page on mon-axaia.vercel.app for this scenario —
  // shown live in the app phone once the call ends. Franchise points at the
  // resolved claim dossier; the others at the locked-screen push-notification
  // simulation (/notif/{token}) that leads into it.
  previewUrl: string;
  defaultChannel: Channel;
  transcript: TranscriptBeat[];
  timeline: TimelineEvent[];
};

// Real caller across all four recordings (Mon AXA IA/Démos Agent Vocal
// (ASM)/*.m4a), transcribed with Whisper — cf. the live prototype data at
// mon-axaia.vercel.app/api/events, which already used this same name.
export const CUSTOMER_NAME = "Yasmin Brikci Nigassa";
export const CUSTOMER_TITLE = "Mademoiselle";

export const SCENARIOS: Scenario[] = [
  {
    key: "franchise",
    title: "Franchise",
    subject: "Bris de glace — franchise",
    customerName: CUSTOMER_NAME,
    claimReference: "SIN-2026-06018",
    context: "Réparateur : Carglass",
    audioSrc: "/audio/franchise.m4a",
    audioDurationSec: 159,
    previewUrl: "https://mon-axaia.vercel.app/sinistre/suivi/claim-franchise",
    defaultChannel: "app",
    // Transcribed verbatim (Whisper, small model) from Franchise.m4a.
    transcript: [
      { t: 0, speaker: "ia", text: "Bonjour mademoiselle Brikci Nigassa, je suis votre assistant AXA en charge du suivi de sinistre. Je vous informe que cet appel est enregistré afin d'améliorer la qualité de nos services. Comment puis-je vous aider aujourd'hui ?" },
      { t: 13, speaker: "client", text: "Oui bonjour, j'ai contacté Carglass pour mon bris de glace et il me parle d'une franchise à payer. Pourtant je suis assurée tous risques." },
      { t: 22, speaker: "ia", text: "Je comprends votre interrogation. Si je reformule, Carglass vous a indiqué que vous auriez une franchise à payer dans le cadre du remplacement de votre pare-brise, c'est bien cela ?" },
      { t: 35, speaker: "client", text: "Oui c'est ça, et il me dit que ça va me coûter 200 euros." },
      { t: 41, speaker: "ia", text: "Je vous confirme qu'il n'y a aucune franchise à votre charge sur ce sinistre bris de glace." },
      { t: 49, speaker: "client", text: "Ok donc j'ai rien à payer ?" },
      { t: 51, speaker: "ia", text: "Exactement. AXA prend en charge l'intégralité de la réparation." },
      { t: 60, speaker: "client", text: "Oui mais du coup je fais comment avec Carglass parce qu'il pense que j'ai une franchise, je sais pas comment faire." },
      { t: 65, speaker: "ia", text: "Je comprends, il y a dû avoir une erreur. Je vais m'assurer que Carglass dispose bien de la bonne information. Avez-vous déjà un rendez-vous prévu pour la réparation ?" },
      { t: 81, speaker: "client", text: "Non." },
      { t: 83, speaker: "ia", text: "D'accord. Êtes-vous actuellement chez le réparateur ?" },
      { t: 89, speaker: "client", text: "Oui je suis chez Carglass là." },
      { t: 92, speaker: "ia", text: "Très bien. Vous pouvez prendre rendez-vous directement avec Carglass sur place." },
      { t: 100, speaker: "client", text: "Ok mais vous pouvez m'envoyer une confirmation écrite de la prise en charge ?" },
      { t: 107, speaker: "ia", text: "Souhaitez-vous que je vous envoie une confirmation écrite de cette prise en charge ? Vous pourrez la présenter si besoin." },
      { t: 113, speaker: "client", text: "Oui je veux bien." },
      { t: 121, speaker: "ia", text: "Parfait, c'est envoyé. Vous avez dû recevoir une notification pour vous permettre d'y accéder." },
      { t: 129, speaker: "client", text: "Oui j'ai bien la notif, merci." },
      { t: 134, speaker: "ia", text: "Vous trouverez également sur votre espace le résumé de notre échange. Je reste disponible si besoin. Excellente journée mademoiselle Brikci Nigassa." },
      { t: 152, speaker: "client", text: "Merci." },
    ],
    timeline: [
      {
        t: 42,
        channel: "app",
        event: {
          type: "coverage_info",
          claim_reference: "SIN-2026-06018",
          title: "Aucune franchise sur ce sinistre",
          coveredInFull: true,
          deductible: "0 €",
          advanceRequired: false,
          directSettlement: true,
          partnerName: "Carglass",
          explanation: "Bris de glace : AXA prend en charge l'intégralité de la réparation.",
        },
      },
      {
        t: 122,
        channel: "app",
        event: {
          type: "document_available",
          claim_reference: "SIN-2026-06018",
          title: "Confirmation de prise en charge disponible",
          description: "À présenter chez Carglass si besoin.",
          documentId: "doc-pec-001",
          docType: "confirmation_prise_en_charge",
          available: true,
          notify_enabled: true,
          recipient: "client",
        },
      },
      {
        t: 135,
        channel: "app",
        event: {
          type: "summary",
          claim_reference: "SIN-2026-06018",
          title: "Compte rendu de votre appel",
          summaryPoints: [
            "Vous vous interrogiez sur une franchise annoncée par Carglass (200 €).",
            "Aucune franchise n'est à votre charge — AXA prend en charge l'intégralité de la réparation.",
            "Une confirmation écrite de prise en charge a été mise à disposition sur votre espace.",
          ],
          intent: "franchise",
          outcome: "oriente_selfcare",
          final: true,
        },
      },
    ],
  },
  {
    key: "paiement",
    title: "Paiement",
    subject: "Délai de règlement",
    customerName: CUSTOMER_NAME,
    claimReference: "SIN-2026-05014",
    context: "Peugeot 208",
    audioSrc: "/audio/paiement.m4a",
    audioDurationSec: 134,
    previewUrl: "https://mon-axaia.vercel.app/notif/9X4K-PAIEMENT",
    defaultChannel: "app",
    // Transcribed verbatim (Whisper, small model) from UC Paiement.m4a.
    transcript: [
      { t: 0, speaker: "ia", text: "Bonjour mademoiselle Brikci Nigassa, je suis votre assistant AXA en charge du suivi de votre indemnisation pour les dégâts sur votre Peugeot 208. Je vous informe que cet appel est enregistré afin d'améliorer la qualité de nos services. Comment puis-je vous aider aujourd'hui ?" },
      { t: 15, speaker: "client", text: "Oui bonjour, je vous ai envoyé la facture du garage et je veux savoir sous quel délai je vais recevoir le règlement." },
      { t: 27, speaker: "ia", text: "Je comprends votre situation, ce n'est jamais confortable de devoir avancer une somme importante. Je vais vérifier votre dossier immédiatement." },
      { t: 37, speaker: "ia", text: "Je viens de vérifier votre dossier : il est complet et validé. Vous allez recevoir un remboursement de 2 700 euros, correspondant à l'intégralité des réparations, car votre responsabilité n'est pas engagée." },
      { t: 48, speaker: "ia", text: "Le paiement a déjà été déclenché sur votre compte se terminant par 456. Vous recevrez le virement sous 48 heures." },
      { t: 56, speaker: "client", text: "C'est-à-dire vendredi, c'est bien ça ?" },
      { t: 62, speaker: "ia", text: "Oui, vous devriez disposer des fonds à cette échéance." },
      { t: 67, speaker: "client", text: "Ok, et si je n'ai pas les fonds, je fais quoi ?" },
      { t: 74, speaker: "ia", text: "Je vois que vous avez un espace client actif : vous pouvez y accéder pour visualiser le règlement ainsi que le résumé de notre conversation." },
      { t: 85, speaker: "client", text: "Très bien, donc je regarderai directement sur mon espace client." },
      { t: 91, speaker: "ia", text: "Avez-vous besoin d'autres informations concernant votre dossier ou votre indemnisation ?" },
      { t: 97, speaker: "client", text: "Non, mais je fais comment pour accéder à mon espace client ?" },
      { t: 103, speaker: "ia", text: "Un moment s'il vous plaît. Malheureusement, je n'ai pas pu vérifier l'état de votre espace client. Vous pouvez visiter le site web d'AXA et suivre les instructions pour vous connecter. Si vous avez des difficultés, contactez notre service client." },
      { t: 120, speaker: "client", text: "Je veux bien que vous me mettiez en relation avec le service client." },
      { t: 127, speaker: "ia", text: "Je vous transfère vers un gestionnaire." },
      { t: 130, speaker: "client", text: "Merci." },
    ],
    timeline: [
      {
        t: 38,
        channel: "app",
        event: {
          type: "payment_update",
          claim_reference: "SIN-2026-05014",
          title: "Votre règlement de 2 700 € est validé",
          amount: "2 700 €",
          paymentStatus: "vire",
          account: "Compte ···456",
          dueLabel: "sous 48 heures",
          liability: "non_engagee",
          notify_enabled: true,
          recipient: "client",
        },
      },
      {
        t: 104,
        channel: "app",
        event: {
          type: "summary",
          claim_reference: "SIN-2026-05014",
          title: "Compte rendu de votre appel",
          summaryPoints: [
            "Dossier complet, règlement de 2 700 € validé et déclenché — virement sous 48h.",
            "Difficulté pour accéder à l'espace client Mon AXA.",
            "Mise en relation avec un gestionnaire pour vous accompagner.",
          ],
          intent: "paiement",
          outcome: "transfere_gestionnaire",
          final: true,
        },
      },
      {
        t: 128,
        channel: "whatsapp",
        event: {
          type: "transfer_to_agent",
          claim_reference: "SIN-2026-05014",
          title: "Un conseiller va vous recontacter",
          reason: "Difficulté d'accès à l'espace client Mon AXA",
          notify_enabled: true,
          recipient: "client",
        },
      },
    ],
  },
  {
    key: "expertise",
    title: "Expertise",
    subject: "Suivi d'expertise",
    customerName: CUSTOMER_NAME,
    claimReference: "SIN-2026-06020",
    context: "Expertise réalisée à distance",
    audioSrc: "/audio/expertise.m4a",
    audioDurationSec: 128,
    previewUrl: "https://mon-axaia.vercel.app/notif/EX5L-EXPERTISE",
    defaultChannel: "app",
    // Transcribed verbatim (Whisper, small model) from Expertise.m4a.
    transcript: [
      { t: 0, speaker: "client", text: "Oui, bonjour, je veux savoir quand est-ce que ma voiture va être expertisée ? On devait me rappeler hier, mais je n'ai rien eu." },
      { t: 19, speaker: "ia", text: "Je comprends. Je suis désolée pour ce manque de suivi. Je vais vous donner une visibilité claire sur votre dossier." },
      { t: 28, speaker: "ia", text: "L'expertise est en cours de traitement aujourd'hui. Elle sera réalisée à distance par un expert, à partir des éléments transmis par votre garagiste." },
      { t: 36, speaker: "client", text: "Ok, pourtant des photos ont été prises par le dépanneur." },
      { t: 42, speaker: "ia", text: "Vous avez raison, le dépanneur a transmis un premier niveau d'information. L'expert a toutefois besoin des photos du garagiste pour finaliser son analyse et établir le chiffrage officiel." },
      { t: 54, speaker: "client", text: "Ok, ça va prendre combien de temps, tout ça ?" },
      { t: 59, speaker: "ia", text: "Les photos seront envoyées aujourd'hui. Il faut compter trois jours ouvrés pour que le rapport d'expertise soit finalisé." },
      { t: 69, speaker: "client", text: "Ok, et je vais recevoir un appel de l'expert ou comment ça se passe ?" },
      { t: 77, speaker: "ia", text: "L'expert pourra vous contacter si besoin d'informations complémentaires. De votre côté, vous pourriez être sollicitée pour fournir vos factures d'entretien ou votre contrôle technique." },
      { t: 87, speaker: "ia", text: "Vous serez notifiée dès que le chiffrage sera disponible, consultable sur votre espace client, ainsi que les étapes à venir." },
      { t: 100, speaker: "ia", text: "Avez-vous d'autres questions concernant votre dossier ?" },
      { t: 105, speaker: "client", text: "Non, c'est clair. Je vous remercie de votre patience." },
      { t: 115, speaker: "ia", text: "Très bien, je reste disponible si besoin. Je vous souhaite une excellente journée mademoiselle Brikci Nigassa." },
      { t: 122, speaker: "client", text: "Merci." },
    ],
    timeline: [
      {
        t: 30,
        channel: "app",
        event: {
          type: "status_changed",
          claim_reference: "SIN-2026-06020",
          title: "Votre dossier passe en évaluation",
          status: "evaluation",
          dueLabel: "sous 3 jours ouvrés",
          notify_enabled: true,
          recipient: "client",
        },
      },
      {
        t: 88,
        channel: "app",
        event: {
          type: "document_available",
          claim_reference: "SIN-2026-06020",
          title: "Rapport d'expertise bientôt disponible",
          documentId: "doc-exp-001",
          docType: "rapport_expertise",
          available: false,
          dueLabel: "sous 3 jours ouvrés",
          notify_enabled: true,
          recipient: "client",
        },
      },
      {
        t: 116,
        channel: "app",
        event: {
          type: "summary",
          claim_reference: "SIN-2026-06020",
          title: "Compte rendu de votre appel",
          summaryPoints: [
            "Vous vouliez un point sur l'expertise de votre véhicule.",
            "Expertise en cours, réalisée à distance à partir des éléments du garagiste.",
            "Rapport attendu sous 3 jours ouvrés, consultable sur votre espace client.",
          ],
          intent: "expertise",
          outcome: "oriente_selfcare",
          final: true,
        },
      },
    ],
  },
  {
    key: "pieces",
    title: "Pièces",
    subject: "Dépôt de devis",
    customerName: CUSTOMER_NAME,
    claimReference: "SIN-2026-06022",
    context: "Devis transmis par e-mail",
    audioSrc: "/audio/pieces.m4a",
    audioDurationSec: 140,
    previewUrl: "https://mon-axaia.vercel.app/notif/PC7Q-PIECES",
    defaultChannel: "app",
    // Transcribed verbatim (Whisper, small model) from Pièce.m4a.
    transcript: [
      { t: 0, speaker: "client", text: "Oui bonjour, j'ai envoyé un devis par mail hier et je voulais savoir si vous l'avez bien reçu." },
      { t: 19, speaker: "ia", text: "Un tout petit instant. Je comprends votre demande. Si je reformule : vous avez envoyé votre document par e-mail et vous souhaitez savoir s'il a bien été reçu et rattaché à votre dossier, c'est bien cela ?" },
      { t: 32, speaker: "client", text: "Oui c'est bien ça." },
      { t: 33, speaker: "ia", text: "Je comprends mieux. Dans ce cas, votre document n'a peut-être pas pu être automatiquement rattaché à votre dossier. Le plus simple est de le déposer directement dans votre espace client sécurisé." },
      { t: 50, speaker: "client", text: "Ok, et vous pouvez me dire comment faire ?" },
      { t: 53, speaker: "ia", text: "Pour aller plus vite, je peux vous envoyer un lien sécurisé pour déposer votre document. Vous pourrez ainsi le transmettre directement dans votre dossier." },
      { t: 65, speaker: "client", text: "Ok, je veux bien le lien s'il vous plaît." },
      { t: 82, speaker: "client", text: "Oui je veux bien le lien." },
      { t: 84, speaker: "ia", text: "Quel est votre canal de communication préféré pour recevoir le lien de dépôt ? Par SMS ou par un autre moyen ?" },
      { t: 98, speaker: "client", text: "Le SMS me va bien." },
      { t: 121, speaker: "client", text: "Très bien, je vais me débrouiller, merci." },
      { t: 128, speaker: "client", text: "Non, merci." },
    ],
    timeline: [
      {
        t: 34,
        channel: "app",
        event: {
          type: "document_requested",
          claim_reference: "SIN-2026-06022",
          title: "Déposez votre devis de réparation",
          documentId: "devis-001",
          label: "Devis de réparation",
          hint: "Votre e-mail n'a pas pu être rattaché automatiquement au dossier",
          notify_enabled: true,
          recipient: "client",
        },
      },
      {
        t: 99,
        channel: "app",
        event: {
          type: "custom",
          claim_reference: "SIN-2026-06022",
          title: "Lien de dépôt envoyé par SMS",
          description: "Canal choisi par la cliente pendant l'appel.",
          client_preferredChannel: "sms",
          notify_enabled: true,
          recipient: "client",
        },
      },
      {
        t: 122,
        channel: "app",
        event: {
          type: "summary",
          claim_reference: "SIN-2026-06022",
          title: "Compte rendu de votre appel",
          summaryPoints: [
            "Votre devis envoyé par e-mail n'avait pas pu être rattaché au dossier.",
            "Un lien de dépôt sécurisé vous a été envoyé par SMS, à votre demande.",
          ],
          intent: "pieces",
          outcome: "oriente_selfcare",
          final: true,
        },
      },
    ],
  },
];

export function getScenario(key: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.key === key);
}
