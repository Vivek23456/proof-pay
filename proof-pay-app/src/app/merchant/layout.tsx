import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merchant dashboard",
};

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
