"use client";

import { useEffect } from "react";

/**
 * Triggered when a payment confirms. Draws a glowing path across the
 * viewport — purple (customer) on the left, green (chain commitment) on
 * the right — while a bright particle travels along it. Ends with a soft
 * green flare at the destination.
 *
 * The whole choreography lasts 1.8 s and self-dismisses via `onComplete`.
 *
 * Implementation notes:
 *  - The path is a single quadratic Bézier defined as a constant so the
 *    SVG `<path>` (which we draw with `stroke-dashoffset`) and the particle
 *    div (which uses CSS `offset-path`) stay in lockstep.
 *  - Inner canvas is 2400 px wide so it always extends past the viewport
 *    on either side; `overflow-hidden` on the parent crops it.
 */

interface Props {
  show: boolean;
  onComplete: () => void;
}

const ROUTE_PATH = "M 0 320 Q 1200 -40, 2400 80";
const ROUTE_DURATION_MS = 1800;

export function PaymentRoute({ show, onComplete }: Props) {
  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(onComplete, ROUTE_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden animate-route-fade">
      <div className="relative w-[2400px] h-[400px]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 2400 400"
        >
          <defs>
            <linearGradient
              id="route-stroke"
              x1="0"
              y1="0"
              x2="2400"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="rgba(124,92,255,0)" />
              <stop offset="15%" stopColor="rgba(124,92,255,0.9)" />
              <stop offset="50%" stopColor="rgba(255,255,255,1)" />
              <stop offset="85%" stopColor="rgba(62,207,142,0.9)" />
              <stop offset="100%" stopColor="rgba(62,207,142,0)" />
            </linearGradient>
          </defs>

          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="url(#route-stroke)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset="100"
            style={{
              animation:
                "route-draw 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
              filter: "drop-shadow(0 0 8px rgba(124,92,255,0.7))",
            }}
          />
        </svg>

        {/* Glowing particle that travels along the path. CSS offset-path
            consumes the same path string as the SVG. */}
        <div
          className="absolute top-0 left-0 h-4 w-4 rounded-full bg-white shadow-[0_0_30px_10px_rgba(124,92,255,0.85)]"
          style={{
            offsetPath: `path("${ROUTE_PATH}")`,
            offsetDistance: "0%",
            offsetRotate: "0deg",
            animation:
              "route-particle 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />

        {/* Green flare at the endpoint — fires after the particle arrives. */}
        <div
          className="absolute h-32 w-32 rounded-full"
          style={{
            right: 0,
            top: "80px",
            transform: "translate(50%, -50%) scale(0)",
            background:
              "radial-gradient(circle, rgba(62,207,142,0.75) 0%, rgba(62,207,142,0) 70%)",
            opacity: 0,
            animation: "route-burst 0.6s 1.2s ease-out forwards",
          }}
        />
      </div>
    </div>
  );
}
