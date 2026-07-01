"use client";

export type MascotState = "idle" | "listening" | "thinking" | "talking" | "happy";

// Exact recreation of the official mark, extracted from the real source file
// (Mon AXA IA/Agent Conversationnel IA AXA folder/Assistant IA AXA - Vecto.svg):
// the "Shape_sparkle" clip path + the "Bouche"/"Oeil_D"/"Oeil_G" face paths,
// on the original 1080x1080 viewBox. Brand gradient: #000094 (bottom-left) →
// #400D82 (center) → #FE364D (top-right), sampled from the source PNG.
//
// Idle motion (float + gentle rock + breathe + blink) and the warm ambient
// glow are reproduced from Star-A1.mp4 (voice mode, 0:31+): the avatar smiles,
// floats and rocks a couple of degrees. "talking" swaps the smile for an
// animated mouth; the small header logo ("idle") stays a static face-less mark.
const SPARKLE_PATH =
  "M1025.3,941.9c11,49.6-33.2,93.7-82.7,82.7l-387.2-86.2c-9.9-2.2-20.2-2.2-30.1,0l-387.2,86.2c-49.5,11-93.7-33.2-82.7-82.7l86.2-387.2c2.2-9.9,2.2-20.2,0-30.1L55.4,137.4c-11-49.5,33.2-93.7,82.7-82.7l380,84.6,7.2,1.6c9.9,2.2,20.2,2.2,30.1,0l14.1-3.1,373.1-83.1c49.6-11,93.7,33.2,82.7,82.7l-86.2,387.2c-2.2,9.9-2.2,20.2,0,30.1l86.2,387.2Z";
const BOUCHE_PATH =
  "M482.2,629.7c32.1,10.9,95,3.2,147.3-42.9,5-4.4,12.8-2.5,15.3,3.7l11.9,29.6c1.9,4.8.5,10.3-3.5,13.6-62.3,52.4-141.5,68.2-198.6,39.5-5.4-2.7-6.9-9.7-3.2-14.5l20-25.8c2.5-3.3,6.9-4.5,10.8-3.2Z";
const OEIL_D_PATH =
  "M699.8,417.4c0,30.7-25.7,61-68.3,99.7h0c-3.4-4.1-34.8-53.2-16.6-98.6,18.2-45.4,85-52.7,84.9-1Z";
const OEIL_G_PATH =
  "M476.3,417.4c0,30.7-25.7,61-68.3,99.7h0c-3.4-4.1-34.8-53.2-16.6-98.6,18.2-45.4,85-52.7,84.9-1Z";

export function Mascot({ state = "idle", size = 120 }: { state?: MascotState; size?: number }) {
  const talking = state === "talking";
  const listening = state === "listening";
  const thinking = state === "thinking";
  const isIdle = state === "idle";
  const showSmile = !talking && !isIdle; // listening / thinking / happy → resting smile

  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
      {!isIdle && (
        <span
          className="absolute inset-[-24%] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 52% 56%, rgba(254,54,77,0.28), rgba(64,13,130,0.16) 46%, transparent 72%)",
            animation:
              listening || talking
                ? "halo-pulse 1.8s ease-in-out infinite"
                : "glow-drift 5s ease-in-out infinite",
          }}
        />
      )}
      <svg
        viewBox="0 0 1080 1080"
        width={size}
        height={size}
        role="img"
        aria-label="Assistant AXA"
        style={{
          transformOrigin: "50% 56%",
          animation: isIdle
            ? undefined
            : `mascot-float ${thinking ? 4 : 5.5}s ease-in-out infinite`,
        }}
      >
        <defs>
          <linearGradient id="mascotGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000094" />
            <stop offset="55%" stopColor="#400D82" />
            <stop offset="100%" stopColor="#FE364D" />
          </linearGradient>
        </defs>

        <path d={SPARKLE_PATH} fill="url(#mascotGradient)" />

        {/* eyes — present in every face state; blink while resting */}
        {!isIdle && (
          <g
            style={
              talking
                ? undefined
                : { transformOrigin: "540px 467px", animation: "mascot-blink 5.5s ease-in-out infinite" }
            }
          >
            <path d={OEIL_G_PATH} fill="#fff" />
            <path d={OEIL_D_PATH} fill="#fff" />
          </g>
        )}

        {showSmile && <path d={BOUCHE_PATH} fill="#fff" />}

        {talking && (
          <ellipse
            cx="540"
            cy="660"
            rx="58"
            ry="34"
            fill="#fff"
            style={{ transformOrigin: "540px 660px", animation: "mascot-talk 0.9s ease-in-out infinite" }}
          />
        )}
      </svg>
    </div>
  );
}
