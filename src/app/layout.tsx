import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteFrame } from "@/components/site-frame";
import "./globals.css";

const uiFont = localFont({
  src: [
    {
      path: "./fonts/segoeui.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/segoeuib.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-ui",
  display: "swap",
});

const editorialFont = localFont({
  src: [
    {
      path: "./fonts/georgia.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/georgiab.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-editorial",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FV Finance Lab",
    template: "%s | FV Finance Lab",
  },
  description:
    "FV Finance Lab is a frontend-first finance tools platform for options, risk, bonds, and future analytical projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${uiFont.variable} ${editorialFont.variable}`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
