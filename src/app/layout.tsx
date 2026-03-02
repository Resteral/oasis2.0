import type { Metadata } from 'next';
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OasisUnited | Connect & Order",
  description: "The premium platform for business connections and ordering.",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

import PayPalProvider from "@/components/PayPalProvider";
import PwaPrompt from "@/components/PwaPrompt";
import GlobalNav from "@/components/GlobalNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans`}>
        <PayPalProvider>
          {children}
          <GlobalNav />
          <PwaPrompt />
        </PayPalProvider>
      </body>
    </html>
  );
}
