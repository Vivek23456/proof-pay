import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ProofPay — portable reputation for Solana merchants",
  description:
    "Pay any Solana merchant in USDC. Earn a portable on-chain attestation. Get an auto-applied discount at the next merchant that trusts your history.",
};

// Explicit viewport: Next 14's default omits initial-scale=1, which makes iOS
// Safari render at desktop width and zoom out — root cause of "site looks tiny
// on mobile". Setting initialScale=1 forces correct device-relative sizing.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b0d12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <AmbientBackground />
        <Providers>{children}</Providers>
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}
