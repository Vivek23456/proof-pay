import { NetworkPackets } from "./network-packets";

/**
 * Site-wide ambient layer. Renders behind every page (z-index -10, pointer
 * events disabled) so it never blocks interaction. Motion components:
 *
 *   1. Two large blurry gradient orbs that drift slowly across the viewport.
 *   2. A glowing SVG "network globe" — meridians + parallels with pulsing
 *      green data hubs on its surface — that rotates over a minute.
 *   3. A subtle dot grid that gives the site a faint tech texture.
 *   4. Periodic "payment packets" — bright dots with glowing trails that
 *      shoot across the screen at varied angles, like money flying through
 *      the network.
 *
 * All effects are pure CSS / SMIL animations — no JS, no reflow,
 * GPU-friendly transforms only.
 */

// Fixed positions (in the globe's 200×200 SVG viewBox) for the pulsing
// data nodes — picked to spread evenly around the visible sphere face.
const GLOBE_NODES: Array<{ x: number; y: number }> = [
  { x: 72, y: 58 },
  { x: 138, y: 70 },
  { x: 95, y: 100 },
  { x: 60, y: 130 },
  { x: 145, y: 130 },
  { x: 95, y: 160 },
];
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Subtle dot grid — gives the dark background a faint depth without
          competing with content. */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(124, 92, 255, 0.35) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, black 35%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 35%, transparent 75%)",
        }}
      />

      {/* Drifting gradient orbs — accent + success. Big, blurred, semi-
          transparent so they breathe color into the page without screaming. */}
      <div
        className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full blur-[120px] opacity-50 animate-orb-a"
        style={{
          background:
            "radial-gradient(circle at center, rgba(124, 92, 255, 0.55), rgba(124, 92, 255, 0) 70%)",
        }}
      />
      <div
        className="absolute -bottom-40 -right-32 h-[560px] w-[560px] rounded-full blur-[120px] opacity-40 animate-orb-b"
        style={{
          background:
            "radial-gradient(circle at center, rgba(62, 207, 142, 0.5), rgba(62, 207, 142, 0) 70%)",
        }}
      />

      {/* Slow-rotating "network globe" — desktop-only. Anchored to the right
          edge and vertically centred, sized to ~90vh and pushed ~18% of its
          width off-screen so the visible portion fills roughly the right
          half of the viewport. White data nodes pulse on the surface; the
          whole sphere is wrapped in a drop-shadow that bleeds a purple
          haze into the right side of every page.

          Hidden on mobile (`hidden md:block`) — the SVG, drop-shadow filter
          and 12 SMIL animations were the biggest source of mobile lag. */}
      <div
        className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-[18%] h-[90vh] w-[90vh] opacity-[0.5] animate-slow-spin"
        style={{
          filter: "drop-shadow(0 0 100px rgba(124, 92, 255, 0.32))",
        }}
      >
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          <defs>
            {/* Inner sphere glow — top-left highlight, fading out. Sells the
                3D-ish depth of the globe without fully filling it. */}
            <radialGradient id="globe-inner" cx="38%" cy="38%" r="72%">
              <stop offset="0%" stopColor="rgba(124, 92, 255, 0.32)" />
              <stop offset="55%" stopColor="rgba(124, 92, 255, 0.08)" />
              <stop offset="100%" stopColor="rgba(124, 92, 255, 0)" />
            </radialGradient>
            {/* Soft halo for the data-node pulses. */}
            <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>

          {/* Inner glow fill */}
          <circle cx="100" cy="100" r="98" fill="url(#globe-inner)" />

          {/* Outer rim — brighter than the lat/long lines, frames the sphere. */}
          <circle
            cx="100"
            cy="100"
            r="98"
            fill="none"
            stroke="#7c5cff"
            strokeOpacity="0.85"
            strokeWidth="0.7"
          />

          {/* Parallels (latitude lines) — ellipses with varying Y radius. */}
          {[15, 30, 50, 70, 85].map((r) => (
            <ellipse
              key={`p-${r}`}
              cx="100"
              cy="100"
              rx="98"
              ry={r}
              fill="none"
              stroke="#7c5cff"
              strokeOpacity="0.55"
              strokeWidth="0.5"
            />
          ))}

          {/* Meridians (longitude lines) — ellipses rotated through the sphere. */}
          {[0, 30, 60, 90, 120, 150].map((deg) => (
            <ellipse
              key={`m-${deg}`}
              cx="100"
              cy="100"
              rx={Math.abs(Math.cos((deg * Math.PI) / 180) * 98) || 0.5}
              ry="98"
              fill="none"
              stroke="#7c5cff"
              strokeOpacity="0.55"
              strokeWidth="0.5"
            />
          ))}

          {/* Pulsing data nodes — white "merchant hubs" scattered on the
              sphere. Each is two layered circles: a soft halo (Gaussian
              blur) and a bright core. SMIL animations stagger the pulses
              so they fire at different times and the surface always has
              activity somewhere. */}
          {GLOBE_NODES.map((n, i) => (
            <g key={`node-${i}`}>
              <circle
                cx={n.x}
                cy={n.y}
                r="3"
                fill="#ffffff"
                opacity="0.4"
                filter="url(#node-glow)"
              >
                <animate
                  attributeName="opacity"
                  values="0.15;0.6;0.15"
                  dur="3s"
                  begin={`${i * 0.5}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="2.5;5;2.5"
                  dur="3s"
                  begin={`${i * 0.5}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={n.x} cy={n.y} r="1.1" fill="#ffffff">
                <animate
                  attributeName="opacity"
                  values="0.75;1;0.75"
                  dur="3s"
                  begin={`${i * 0.5}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </svg>
      </div>

      {/* Recurring payment packets streaking across the viewport — bright
          dots with glowing trails that read clearly against the dark bg. */}
      <NetworkPackets />
    </div>
  );
}
