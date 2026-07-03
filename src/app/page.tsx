"use client";

import { useRef, useState, useEffect } from "react";
import { SCENARIOS, getScenario } from "@/lib/scenarios";
import type { Scenario, TranscriptBeat, TimelineEvent, Channel } from "@/lib/scenarios";
import { Mascot, type MascotState } from "@/components/Mascot";
import { renderEventCard, type EventCard } from "@/lib/eventDisplay";

type FiredEvent = { beat: TimelineEvent; index: number; posted: boolean | null };
type Mode = "rehearsal" | "real";
type CallView = "digital" | "classic";

const PHONE_W = 340;
const PHONE_H = 760;

type CallIconName = "speaker" | "facetime" | "mute" | "more" | "hangup" | "keypad";

function CallIcon({ name }: { name: CallIconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "speaker":
      return (
        <svg viewBox="0 0 24 24" width="26" height="26" {...common}>
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
          <path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7 7 0 0 1 0 12" />
        </svg>
      );
    case "facetime":
      return (
        <svg viewBox="0 0 24 24" width="26" height="26" {...common}>
          <rect x="3" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none" />
          <path d="M15 10l6-3v10l-6-3" fill="currentColor" stroke="none" />
        </svg>
      );
    case "mute":
      return (
        <svg viewBox="0 0 24 24" width="26" height="26" {...common}>
          <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
          <path d="M6 11a6 6 0 0 0 12 0M12 17v3" />
          <path d="M4 4l16 16" strokeWidth="2.4" />
        </svg>
      );
    case "more":
      return (
        <svg viewBox="0 0 24 24" width="26" height="26">
          <circle cx="5" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="19" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case "hangup":
      return (
        <svg viewBox="0 0 24 24" width="28" height="28">
          <g transform="rotate(135 12 12)">
            <path
              d="M6.6 10.8c3.3-1.6 7.5-1.6 10.8 0 .9.4 1.2 1.1 1 2l-.4 2c-.1.8-.9 1.3-1.7 1.1l-2.4-.5c-.6-.1-1-.6-1.1-1.2l-.2-1.3c-1.3-.4-2.7-.4-4 0l-.2 1.3c-.1.6-.5 1.1-1.1 1.2l-2.4.5c-.8.2-1.6-.3-1.7-1.1l-.4-2c-.2-.9.1-1.6 1-2z"
              fill="currentColor"
            />
          </g>
        </svg>
      );
    case "keypad":
      return (
        <svg viewBox="0 0 24 24" width="26" height="26">
          {[6, 12, 18].map((y) =>
            [6, 12, 18].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="currentColor" />)
          )}
        </svg>
      );
  }
}

const CLASSIC_CALL_ACTIONS: { icon: CallIconName; label: string; danger?: boolean }[] = [
  { icon: "speaker", label: "Haut-parleur" },
  { icon: "facetime", label: "FaceTime" },
  { icon: "mute", label: "Couper le son" },
  { icon: "more", label: "Plus" },
  { icon: "hangup", label: "Raccrocher", danger: true },
  { icon: "keypad", label: "Clavier" },
];

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("rehearsal");
  const [callView, setCallView] = useState<CallView>("digital");
  const [scenarioKey, setScenarioKey] = useState<Scenario["key"] | null>(null);
  const [phase, setPhase] = useState<"pick" | "calling" | "done">("pick");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [eventsFired, setEventsFired] = useState<FiredEvent[]>([]);
  const [channelBanner, setChannelBanner] = useState<{ channel: "whatsapp" | "sms"; card: EventCard } | null>(null);
  const [seekFlash, setSeekFlash] = useState<"back" | "fwd" | null>(null);
  const [channelView, setChannelView] = useState<Channel>("app");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const firedEventIdx = useRef(0);
  const handoffFired = useRef(false);
  const seekFlashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = scenarioKey ? getScenario(scenarioKey) : undefined;

  function resetPlaybackState() {
    setElapsed(0);
    setDuration(0);
    setEventsFired([]);
    setChannelBanner(null);
    firedEventIdx.current = 0;
    handoffFired.current = false;
    if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
  }

  function startScenario(key: Scenario["key"]) {
    const next = getScenario(key);
    setScenarioKey(key);
    resetPlaybackState();
    setChannelView(next?.defaultChannel ?? "app");
    setPhase("calling");
  }

  function backToPicker() {
    audioRef.current?.pause();
    setPhase("pick");
    setScenarioKey(null);
  }

  useEffect(() => {
    if (phase !== "calling" || !audioRef.current) return;
    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.play().catch(() => {
      /* autoplay blocked — presenter can hit the native controls */
    });
  }, [phase, scenarioKey]);

  async function fireHandoff() {
    if (!scenario || handoffFired.current) return;
    handoffFired.current = true;
    // Still genuinely POSTs the end-of-call handoff in real mode (proof the
    // integration works) — the app phone itself now shows the scenario's
    // fixed real preview URL rather than this call's returned link.
    try {
      await fetch("/api/demo/handoff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioKey: scenario.key, real: mode === "real" }),
      });
    } catch {
      /* non-blocking — the app phone doesn't depend on this result */
    }
    setPhase("done");
  }

  function showChannelBanner(channel: "whatsapp" | "sms", card: EventCard) {
    if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    setChannelBanner({ channel, card });
    bannerTimeout.current = setTimeout(() => setChannelBanner(null), 5000);
  }

  function handleTimeUpdate() {
    if (!scenario || !audioRef.current) return;
    const t = audioRef.current.currentTime;
    setElapsed(t);

    while (
      firedEventIdx.current < scenario.timeline.length &&
      scenario.timeline[firedEventIdx.current].t <= t
    ) {
      const beat = scenario.timeline[firedEventIdx.current];
      const index = firedEventIdx.current;
      setEventsFired((prev) => [...prev, { beat, index, posted: mode === "rehearsal" ? false : null }]);
      if (beat.channel === "whatsapp" || beat.channel === "sms") {
        showChannelBanner(beat.channel, renderEventCard(beat.event));
      }
      if (mode === "real") {
        fetch("/api/demo/event", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ event: beat.event, real: true }),
        })
          .then((r) => r.json())
          .then((data) =>
            setEventsFired((prev) =>
              prev.map((e) => (e.index === index ? { ...e, posted: !!data.ok } : e))
            )
          )
          .catch(() =>
            setEventsFired((prev) => prev.map((e) => (e.index === index ? { ...e, posted: false } : e)))
          );
      }
      firedEventIdx.current += 1;
    }
  }

  function skipToEnd() {
    const audio = audioRef.current;
    if (!audio) return;
    const target = (audio.duration || duration || 0) - 0.6;
    if (target > 0) audio.currentTime = target;
  }

  function seekBy(deltaSec: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const total = audio.duration || duration || 0;
    audio.currentTime = Math.min(Math.max(audio.currentTime + deltaSec, 0), Math.max(total - 0.3, 0));
    setSeekFlash(deltaSec < 0 ? "back" : "fwd");
    if (seekFlashTimeout.current) clearTimeout(seekFlashTimeout.current);
    seekFlashTimeout.current = setTimeout(() => setSeekFlash(null), 650);
  }

  function seekToFraction(fraction: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const total = audio.duration || duration || 0;
    if (total <= 0) return;
    audio.currentTime = Math.min(Math.max(fraction, 0), 1) * total;
  }

  const progressPct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  // --- Live transcript derived entirely from audio position (elapsed) so it
  // stays in sync when playing, seeking, or scrubbing. The active utterance
  // reveals word-by-word between its start and the next beat (live-caption
  // style); past lines scroll up, dimmed. TRANSCRIPT_LEAD nudges the reveal a
  // touch after the nominal timestamp so text never runs ahead of the voice.
  const TRANSCRIPT_LEAD = 0.35;
  const transcript = scenario?.transcript ?? [];
  let activeIdx = -1;
  for (let i = 0; i < transcript.length; i++) {
    if (transcript[i].t <= elapsed - TRANSCRIPT_LEAD) activeIdx = i;
    else break;
  }
  const activeBeat = activeIdx >= 0 ? transcript[activeIdx] : null;
  const activeStart = activeBeat ? activeBeat.t + TRANSCRIPT_LEAD : 0;
  const activeEnd =
    activeIdx >= 0
      ? (transcript[activeIdx + 1]?.t ?? (duration || activeStart + 4)) + TRANSCRIPT_LEAD
      : 0;
  const revealFraction =
    phase === "done" ? 1 : activeBeat ? Math.min(1, Math.max(0, (elapsed - activeStart) / Math.max(0.6, activeEnd - activeStart))) : 0;
  // The two lines that precede the active one, for the scrolling history.
  const historyBeats = activeIdx > 0 ? transcript.slice(Math.max(0, activeIdx - 2), activeIdx) : [];
  const mascotLiveState: MascotState =
    phase === "done" ? "happy" : activeBeat ? (activeBeat.speaker === "ia" ? "talking" : "listening") : "listening";

  // The "app" phone only reveals its real page once a genuinely-pushed event
  // fires (revealSelfcare) — not on any dossier update — so it never shows up
  // before the voicebot has actually announced sending something.
  const appRevealed = eventsFired.some((e) => e.beat.channel === "app" && e.beat.revealSelfcare);
  const whatsappEvents = eventsFired.filter((e) => e.beat.channel === "whatsapp");
  const smsEvents = eventsFired.filter((e) => e.beat.channel === "sms");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-10 py-4 bg-white/80 backdrop-blur border-b border-black/5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Mascot size={38} state="idle" />
          <div>
            <div className="font-headline text-axa-blue text-lg leading-tight">Mon Assistant AXA</div>
            <div className="text-xs text-gray-500 leading-tight">Démo — voicebot Genesys → selfcare</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setMode("rehearsal")}
            className={`px-3 py-1.5 rounded-full border transition ${
              mode === "rehearsal"
                ? "bg-axa-blue text-white border-axa-blue"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            Répétition
          </button>
          <button
            onClick={() => setMode("real")}
            className={`px-3 py-1.5 rounded-full border transition ${
              mode === "real"
                ? "bg-axa-red text-white border-axa-red"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            Réel (prod)
          </button>
          {mode === "real" && (
            <span className="text-[11px] text-axa-red/80 max-w-[160px] leading-tight">
              ⚠️ écrit sur mon-axaia.vercel.app
            </span>
          )}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 md:p-10">
        {phase === "pick" && (
          <div>
            <h1 className="font-headline text-axa-blue text-3xl mb-2">Choisir un scénario</h1>
            <p className="text-gray-500 mb-8 max-w-2xl">
              Chaque scénario rejoue un vrai appel enregistré auprès du voicebot AXA, puis déclenche
              le vrai selfcare (Mon AXA / WhatsApp) via l&rsquo;API Genesys ↔ Mon AXA.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => startScenario(s.key)}
                  className="text-left bg-white rounded-2xl shadow-sm border border-black/5 p-5 hover:shadow-lg hover:-translate-y-0.5 transition flex flex-col gap-3"
                >
                  <div>
                    <div className="font-headline text-axa-blue text-xl">{s.title}</div>
                    <div className="text-sm text-gray-500">{s.subject}</div>
                  </div>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    <div>Réf. {s.claimReference}</div>
                    <div>{s.context}</div>
                  </div>
                  <div className="mt-auto inline-flex items-center gap-1.5 text-axa-blue font-semibold text-sm">
                    ▶ Lancer l&rsquo;appel
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {scenario && phase !== "pick" && (
          <div className="flex flex-wrap justify-center gap-8 items-start">
            {/* Phone 1 — call */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-axa-blue/60 uppercase tracking-wide">
                  1 · Conversation vocale
                </div>
                <div className="flex rounded-full bg-axa-blue/10 p-0.5">
                  <button
                    onClick={() => setCallView("digital")}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${
                      callView === "digital" ? "bg-axa-blue text-white" : "text-axa-blue/60"
                    }`}
                  >
                    Digital
                  </button>
                  <button
                    onClick={() => setCallView("classic")}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${
                      callView === "classic" ? "bg-axa-blue text-white" : "text-axa-blue/60"
                    }`}
                  >
                    📞 Tél
                  </button>
                </div>
              </div>
              <PhoneShell statusTone="light">
                <div
                  className="relative w-full h-full flex flex-col overflow-hidden"
                  style={{
                    background:
                      callView === "digital"
                        ? "linear-gradient(180deg, #F6F9FA 0%, #ECEFF7 26%, #D3D5EA 40%, #B9B8DF 52%, #9D9BD0 64%, #837EC4 74%, #6863B8 84%, #4E48AD 94%, #3B2F9F 100%)"
                        : "linear-gradient(180deg, #6E7681 0%, #7A6552 38%, #574031 64%, #33241A 100%)",
                  }}
                >
                  {callView === "digital" && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(120% 72% at 32% 8%, rgba(255,255,255,0.85), rgba(255,255,255,0) 55%)",
                      }}
                    />
                  )}

                  <audio
                    ref={audioRef}
                    src={scenario.audioSrc}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onEnded={fireHandoff}
                    className="hidden"
                  />

                  {/* Invisible edge tap zones (YouTube-style): tap left = −10s, right = +10s */}
                  <button
                    aria-label="Reculer de 10 secondes"
                    title="−10s"
                    onClick={() => seekBy(-10)}
                    className="absolute left-0 top-[15%] bottom-[32%] w-[22%] z-10 cursor-pointer"
                  />
                  <button
                    aria-label="Avancer de 10 secondes"
                    title="+10s"
                    onClick={() => seekBy(10)}
                    className="absolute right-0 top-[15%] bottom-[32%] w-[22%] z-10 cursor-pointer"
                  />
                  {seekFlash && (
                    <div
                      className={`absolute top-[42%] z-30 pointer-events-none ${
                        seekFlash === "back" ? "left-4" : "right-4"
                      }`}
                    >
                      <div className="px-3 py-2 rounded-full bg-black/45 text-white text-sm font-semibold backdrop-blur-sm">
                        {seekFlash === "back" ? "« −10 s" : "+10 s »"}
                      </div>
                    </div>
                  )}

                  {/* Top bar: back arrow (left) + scenario label */}
                  <div className="absolute top-9 inset-x-0 px-3 flex items-center gap-2 z-20">
                    <button
                      onClick={backToPicker}
                      aria-label="Autre scénario"
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none ${
                        callView === "digital"
                          ? "bg-axa-blue/10 hover:bg-axa-blue/20 text-axa-blue"
                          : "bg-white/15 hover:bg-white/25 text-white"
                      }`}
                    >
                      ‹
                    </button>
                    <div
                      className={`text-[10px] uppercase tracking-wider truncate ${
                        callView === "digital" ? "text-axa-blue/50" : "text-white/50"
                      }`}
                    >
                      {scenario.title} · {scenario.customerName}
                    </div>
                  </div>

                  {callView === "digital" ? (
                    <div className="relative z-[1] flex-1 flex flex-col w-full px-5 pt-[52px] pb-3">
                      {/* Avatar centered within the upper half of the screen */}
                      <div className="h-[46%] shrink-0 flex items-center justify-center">
                        <Mascot size={116} state={mascotLiveState} />
                      </div>

                      {/* Live transcript — scrolls up, active line revealed word-by-word */}
                      <div className="flex-1 flex flex-col justify-end text-left gap-2 pb-1 overflow-hidden">
                        {historyBeats.map((beat) => (
                          <TranscriptLine
                            key={beat.t}
                            beat={beat}
                            customerName={scenario.customerName}
                            variant="prev"
                          />
                        ))}
                        {activeBeat ? (
                          <TranscriptLine
                            beat={activeBeat}
                            customerName={scenario.customerName}
                            variant="current"
                            revealFraction={revealFraction}
                          />
                        ) : (
                          <div className="text-white/70 text-lg">Connexion à l&rsquo;assistant…</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-[1] flex-1 flex flex-col items-center w-full px-6 pt-[74px] pb-3 text-center">
                      <div className="text-white/60 text-[15px]">
                        {phase === "done" ? "Appel terminé" : "Appel…"}
                      </div>
                      <div className="text-white text-[38px] font-semibold leading-tight mt-2 tracking-wide">
                        AXA
                      </div>
                      <div className="text-white/50 text-[15px] mt-1">Assistant vocal</div>

                      <div className="flex-1" />

                      <div className="grid grid-cols-3 gap-x-6 gap-y-5 w-full px-3">
                        {CLASSIC_CALL_ACTIONS.map((a) => (
                          <div key={a.label} className="flex flex-col items-center gap-2">
                            <div
                              className={`w-[68px] h-[68px] rounded-full flex items-center justify-center text-white ${
                                a.danger ? "bg-[#F5423B]" : "bg-white/15 backdrop-blur-sm"
                              }`}
                            >
                              <CallIcon name={a.icon} />
                            </div>
                            <div className="text-white/85 text-[12px]">{a.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slim bottom control bar */}
                  <div className="relative z-20 w-full flex items-center gap-2 px-4 pb-4">
                    <span className="text-[10px] text-white/70 w-8 shrink-0">{formatTime(elapsed)}</span>
                    <div
                      className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden cursor-pointer group"
                      title="Cliquer pour naviguer dans l'appel"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        seekToFraction((e.clientX - rect.left) / rect.width);
                      }}
                    >
                      <div
                        className="h-full bg-white/85 group-hover:bg-white transition-[width] duration-200"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/70 w-8 text-right shrink-0">
                      {formatTime(duration || scenario.audioDurationSec)}
                    </span>
                    {phase === "calling" ? (
                      <button
                        onClick={skipToEnd}
                        title="Aller à la fin"
                        className="w-7 h-7 shrink-0 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs flex items-center justify-center"
                      >
                        ⏭
                      </button>
                    ) : (
                      <button
                        onClick={() => startScenario(scenario.key)}
                        title="Rejouer"
                        className="w-7 h-7 shrink-0 rounded-full bg-white text-axa-blue hover:bg-white/90 text-xs flex items-center justify-center font-semibold"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </div>
              </PhoneShell>
            </div>

            {/* Phone 2 — live events */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-axa-blue/60 uppercase tracking-wide">
                2 · Réception des flux
              </div>
              <PhoneShell statusTone="dark">
                <div className="w-full h-full flex flex-col bg-white pt-9 px-4 pb-4">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="font-headline text-axa-blue text-base">Événements en direct</div>
                    {phase === "calling" ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        en direct
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">terminé</span>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {eventsFired.length === 0 && (
                      <div className="text-sm text-gray-400 italic pt-8 text-center">
                        En attente du premier événement…
                      </div>
                    )}
                    {eventsFired.map(({ beat, index, posted }) => {
                      const card = renderEventCard(beat.event);
                      return (
                        <div
                          key={index}
                          className="animate-rise-in rounded-xl border border-black/5 bg-[#F7F8FC] p-2.5 flex gap-2.5"
                        >
                          <div className="text-lg leading-none">{card.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-axa-blue truncate">{card.title}</div>
                            {card.detail && (
                              <div className="text-[11px] text-gray-500 truncate">{card.detail}</div>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-axa-blue/10 text-axa-blue">
                                {beat.channel === "app" ? "Mon AXA" : beat.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                              </span>
                              <span className="text-[9px] text-gray-400">
                                {posted === null
                                  ? "envoi…"
                                  : posted
                                  ? "✓ API réelle"
                                  : mode === "real"
                                  ? "✗ échec"
                                  : "simulation"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PhoneShell>
            </div>

            {/* Phone 3 — selfcare: Mon AXA app / WhatsApp / SMS, switchable */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-axa-blue/60 uppercase tracking-wide">
                  3 · Selfcare
                </div>
                <div className="flex rounded-full bg-axa-blue/10 p-0.5">
                  {(["app", "whatsapp", "sms"] as Channel[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setChannelView(c)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${
                        channelView === c ? "bg-axa-blue text-white" : "text-axa-blue/60"
                      }`}
                    >
                      {c === "app" ? "Mon AXA" : c === "whatsapp" ? "WhatsApp" : "SMS"}
                    </button>
                  ))}
                </div>
              </div>
              <PhoneShell statusTone="light" hideStatusBar={channelView === "app" && appRevealed}>
                <SelfcareScreen
                  scenario={scenario}
                  channelView={channelView}
                  appRevealed={appRevealed}
                  whatsappEvents={whatsappEvents}
                  smsEvents={smsEvents}
                  channelBanner={channelBanner}
                  onSwitchChannel={setChannelView}
                />
              </PhoneShell>
              {channelView === "app" && appRevealed && (
                <a
                  href={scenario.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-axa-blue hover:underline"
                >
                  Ouvrir dans un nouvel onglet ↗
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TranscriptLine({
  beat,
  customerName,
  variant,
  revealFraction = 1,
}: {
  beat: TranscriptBeat;
  customerName: string;
  variant: "current" | "prev";
  revealFraction?: number;
}) {
  const isIa = beat.speaker === "ia";
  const current = variant === "current";

  // Word-by-word reveal for the active line (live-caption effect).
  let shownText = beat.text;
  if (current && revealFraction < 1) {
    const words = beat.text.split(" ");
    const shownCount = Math.max(1, Math.ceil(words.length * revealFraction));
    shownText = words.slice(0, shownCount).join(" ");
  }
  const wrapped = isIa ? shownText : `« ${shownText} »`;

  return (
    <div className={`transition-opacity duration-300 ${current ? "opacity-100" : "opacity-40"}`}>
      <div
        className={`uppercase tracking-wide mb-1 ${current ? "text-[11px]" : "text-[10px]"} ${
          isIa ? "text-white/75" : "text-white/45"
        }`}
      >
        {isIa ? "Assistant AXA" : customerName}
      </div>
      <div
        className={`${isIa ? "font-semibold text-white" : "italic text-white/80"} ${
          current ? "text-[22px] leading-tight" : "text-[13px] leading-snug"
        }`}
      >
        {wrapped}
      </div>
    </div>
  );
}

function PhoneShell({
  children,
  statusTone,
  hideStatusBar = false,
}: {
  children: React.ReactNode;
  statusTone: "light" | "dark";
  // When the content already provides its own status bar (e.g. the real Mon AXA
  // page rendered in an iframe), hide ours so it doesn't stack a white band on
  // top of the app's own blue header.
  hideStatusBar?: boolean;
}) {
  return (
    <div
      className="relative rounded-[2.5rem] border-[6px] border-[#111] bg-[#111] shadow-2xl overflow-hidden shrink-0"
      style={{ width: PHONE_W, height: PHONE_H }}
    >
      {!hideStatusBar && (
        <div
          className={`absolute top-0 inset-x-0 h-8 flex items-center justify-between px-5 text-[11px] z-30 pointer-events-none ${
            statusTone === "light" ? "text-white" : "text-axa-blue"
          }`}
        >
          <span>9:41</span>
          <span>●●●●</span>
        </div>
      )}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

function SelfcareScreen({
  scenario,
  channelView,
  appRevealed,
  whatsappEvents,
  smsEvents,
  channelBanner,
  onSwitchChannel,
}: {
  scenario: Scenario;
  channelView: Channel;
  appRevealed: boolean;
  whatsappEvents: FiredEvent[];
  smsEvents: FiredEvent[];
  channelBanner: { channel: "whatsapp" | "sms"; card: EventCard } | null;
  onSwitchChannel: (c: Channel) => void;
}) {
  return (
    <div className="relative w-full h-full bg-white">
      {/* Accessory banner: alerts that a message just landed on the OTHER channel */}
      {channelBanner && channelBanner.channel !== channelView && (
        <button
          onClick={() => onSwitchChannel(channelBanner.channel)}
          className="absolute top-9 inset-x-2 z-30 text-left w-[calc(100%-1rem)]"
          style={{ animation: "banner-drop 0.3s ease-out" }}
        >
          <div className="flex items-start gap-2 bg-white/95 backdrop-blur rounded-2xl shadow-lg p-2.5 border border-black/5">
            <div className="w-7 h-7 rounded-full bg-axa-blue flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              AXA
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-800 flex items-center gap-1">
                {channelBanner.channel === "whatsapp" ? (
                  <>
                    AXA France <span className="text-[#34B7F1]">✓</span>
                  </>
                ) : (
                  "AXA"
                )}
                <span className="text-gray-400 font-normal ml-auto">
                  {channelBanner.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                </span>
              </div>
              <div className="text-[11px] text-gray-600 truncate">{channelBanner.card.title}</div>
            </div>
          </div>
        </button>
      )}

      {channelView === "app" &&
        (appRevealed ? (
          <iframe
            src={scenario.previewUrl}
            title="Mon AXA — suivi de sinistre"
            className="w-full h-full border-0"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-8 gap-3 bg-[#F3F5FA] pt-8">
            <Mascot size={72} state="idle" />
            <div className="text-sm font-semibold text-axa-blue">En attente de la notification…</div>
            <div className="text-xs text-gray-500 max-w-[240px]">
              Le vrai dossier {scenario.claimReference} s&rsquo;affichera ici dès que le voicebot annonce
              réellement l&rsquo;envoi d&rsquo;une information — pas avant.
            </div>
          </div>
        ))}

      {channelView === "whatsapp" && <WhatsAppThread events={whatsappEvents} />}
      {channelView === "sms" && <SmsThread events={smsEvents} />}
    </div>
  );
}

function WhatsAppThread({ events }: { events: FiredEvent[] }) {
  return (
    <div className="w-full h-full flex flex-col bg-[#0B141A]">
      <div className="flex items-center gap-2 px-4 pt-11 pb-3 bg-[#1F2C34]">
        <div className="w-8 h-8 rounded-full bg-axa-blue flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          AXA
        </div>
        <div>
          <div className="text-white text-sm font-semibold flex items-center gap-1">
            AXA France <span className="text-[#34B7F1] text-xs">✓</span>
          </div>
          <div className="text-[10px] text-white/40">Compte professionnel</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {events.length === 0 ? (
          <div className="text-xs text-white/30 italic text-center pt-10">
            Aucun message WhatsApp pour cet appel.
          </div>
        ) : (
          events.map(({ beat, index }) => {
            const card = renderEventCard(beat.event);
            return (
              <div key={index} className="animate-rise-in bg-[#202C33] rounded-xl rounded-tl-sm p-2.5 max-w-[85%]">
                <div className="text-xs font-semibold text-[#E9EDF0]">{card.title}</div>
                {card.detail && <div className="text-[11px] text-white/60 mt-0.5">{card.detail}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SmsThread({ events }: { events: FiredEvent[] }) {
  return (
    <div className="w-full h-full flex flex-col bg-[#EFEFF4]">
      <div className="flex items-center gap-2 px-4 pt-11 pb-3 bg-white border-b border-black/5">
        <div className="w-8 h-8 rounded-full bg-axa-blue flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          AXA
        </div>
        <div className="text-sm font-semibold text-gray-800">AXA</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {events.length === 0 ? (
          <div className="text-xs text-gray-400 italic text-center pt-10">
            Aucun SMS envoyé pendant cet appel.
          </div>
        ) : (
          events.map(({ beat, index }) => {
            const card = renderEventCard(beat.event);
            return (
              <div
                key={index}
                className="animate-rise-in bg-white rounded-2xl rounded-tl-sm p-2.5 max-w-[85%] shadow-sm border border-black/5"
              >
                <div className="text-xs font-semibold text-gray-800">{card.title}</div>
                {card.detail && <div className="text-[11px] text-gray-500 mt-0.5">{card.detail}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
