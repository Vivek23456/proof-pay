import { ImageResponse } from "next/og";

/**
 * Dynamic favicon. Next.js 14 App Router auto-injects this as
 * `<link rel="icon">` on every page. The mark mirrors the brand badge
 * rendered in `components/proofpay/nav.tsx`: a purple gradient square with
 * Lucide's BadgeCheck glyph in white.
 */

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c5cff 0%, #4a3ab8 100%)",
          borderRadius: 7,
        }}
      >
        {/* lucide BadgeCheck — identical to the Nav badge mark */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
