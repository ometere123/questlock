import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "QuestLock — Proof-Powered Quest Rewards",
  description:
    "Rewards should follow proof, not farming. Submit GitHub proof, pass deterministic checks, receive on-chain attestation and gasless reward.",
  openGraph: {
    title: "QuestLock",
    description: "Proof-powered quest rewards on Base Sepolia.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
