/**
 * Site-wide lighthouse beacon.
 *
 * - A bright dot (the "beacon") is anchored to the viewport's bottom-left
 *   corner.
 * - A narrow triangular beam emanates from the beacon and rotates 360° once
 *   per 8 s, like a real lighthouse.
 * - A handful of scattered "wallet" dots sit around the upper viewport.
 *   Each dot has its own pulse animation with a delay matched (roughly) to
 *   when the beam would cross it, so they appear to flare as the beam
 *   sweeps past — like a radar catching pings.
 *
 * Pure SVG + CSS animation — zero JS work, GPU-friendly, no extra deps.
 */

interface Dot {
  id: string;
  // CSS positioning: percentages from the viewport edges.
  left: string;
  top: string;
  // Animation delay in seconds. Roughly = (45° − dotAngleFromBeacon) / 360 × 8s
  // assuming the beam at rotation 0° points up-right at 45°. Negative values
  // start the animation mid-cycle, which is exactly what we want.
  delay: string;
}

const DOTS: Dot[] = [
  { id: "d1", left: "14%", top: "22%", delay: "-0.6s" },
  { id: "d2", left: "28%", top: "60%", delay: "-1.4s" },
  { id: "d3", left: "44%", top: "30%", delay: "0.1s" },
  { id: "d4", left: "58%", top: "70%", delay: "1.2s" },
  { id: "d5", left: "72%", top: "18%", delay: "0.8s" },
  { id: "d6", left: "82%", top: "55%", delay: "1.9s" },
  { id: "d7", left: "92%", top: "28%", delay: "1.5s" },
  { id: "d8", left: "36%", top: "12%", delay: "-0.2s" },
];

export function LighthouseBeam() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Beacon anchor: bottom-left corner of the viewport. The beam div
          rotates around its bottom-left transform-origin (= the beacon
          point). */}
      <div className="absolute bottom-0 left-0 h-0 w-0">
        {/* Rotating beam wedge. 200vmax square is large enough to extend
            past every screen corner. */}
        <div
          className="absolute origin-[0%_100%] animate-beam-spin"
          style={{
            bottom: 0,
            left: 0,
            width: "200vmax",
            height: "200vmax",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ overflow: "visible" }}
          >
            <defs>
              <linearGradient
                id="lh-beam"
                x1="0"
                y1="100"
                x2="100"
                y2="50"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="rgba(124,92,255,0.55)" />
                <stop offset="60%" stopColor="rgba(124,92,255,0.18)" />
                <stop offset="100%" stopColor="rgba(124,92,255,0)" />
              </linearGradient>
            </defs>
            {/* Narrow wedge: tip at beacon (0,100), wide end on the right
                edge. ~16° spread. */}
            <polygon
              points="0,100 100,42 100,58"
              fill="url(#lh-beam)"
            />
          </svg>
        </div>

        {/* Beacon glow halo — outer soft, then inner bright core. */}
        <div
          className="absolute -bottom-6 -left-6 h-12 w-12 rounded-full blur-md animate-pulse-soft"
          style={{
            background:
              "radial-gradient(circle, rgba(124,92,255,0.85), rgba(124,92,255,0) 70%)",
          }}
        />
        <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-accent shadow-[0_0_24px_6px_rgba(124,92,255,0.7)]" />
      </div>

      {/* Scattered "pings" — wallets across the network. Each flares for
          ~5% of an 8 s cycle; the staggered delays make them appear to
          flicker as the beam rotates over them. */}
      {DOTS.map((d) => (
        <span
          key={d.id}
          className="absolute h-1.5 w-1.5 rounded-full bg-accent animate-beam-flare"
          style={{
            left: d.left,
            top: d.top,
            animationDelay: d.delay,
            filter: "drop-shadow(0 0 4px rgba(124,92,255,0.8))",
          }}
        />
      ))}
    </div>
  );
}
