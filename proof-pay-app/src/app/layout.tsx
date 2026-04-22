import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ProofPay — portable reputation for Solana merchants",
  description:
    "Pay any Solana merchant in USDC. Earn a portable on-chain attestation. Get an auto-applied discount at the next merchant that trusts your history.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}
