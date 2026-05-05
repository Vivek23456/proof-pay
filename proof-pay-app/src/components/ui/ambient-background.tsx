import { LighthouseBeam } from "./lighthouse-beam";

/**
 * Site-wide ambient layer. Renders behind every page (z-index -10, pointer
 * events disabled) so it never blocks interaction. Motion components:
 *
 *   1. Two large blurry gradient orbs that drift slowly across the viewport.
 *   2. A faint SVG "globe" — meridians + parallels — that rotates over a minute.
 *   3. A subtle dot grid that gives the site a faint tech texture.
 *   4. A lighthouse beacon at the bottom-left whose beam sweeps the page,
 *      with scattered "pings" that flare as the beam passes (radar feel).
 *
 * All effects are pure CSS animations driven by tailwind keyframes — no JS,
 * no reflow, GPU-friendly transforms only.
 */
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

      {/* Slow-rotating "globe" anchored bottom-right. Pure SVG: a sphere drawn
          as meridians + parallels, with a faint accent stroke. Spins once per
          minute — perceptible but never demands attention. */}
      <div className="absolute -right-40 -bottom-40 h-[480px] w-[480px] opacity-[0.18] animate-slow-spin md:h-[640px] md:w-[640px]">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          <defs>
            <radialGradient id="globe-fade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#7c5cff" stopOpacity="0.6" />
            </radialGradient>
          </defs>

          {/* Outer rim */}
          <circle
            cx="100"
            cy="100"
            r="98"
            fill="none"
            stroke="url(#globe-fade)"
            strokeWidth="0.6"
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
              strokeOpacity="0.35"
              strokeWidth="0.4"
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
              strokeOpacity="0.35"
              strokeWidth="0.4"
            />
          ))}
        </svg>
      </div>

      {/* Lighthouse beacon (bottom-left) + sweeping beam + scattered pings. */}
      <LighthouseBeam />
    </div>
  );
}
