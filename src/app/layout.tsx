import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(196,154,74,0.10),transparent_26%),radial-gradient(circle_at_88%_0%,rgba(120,141,173,0.12),transparent_24%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(158,173,192,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(158,173,192,0.08)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(circle_at_top,white,transparent_74%)]" />
          <SiteHeader />
          <main className="relative z-10 flex-1 py-14 sm:py-16 lg:py-20">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
