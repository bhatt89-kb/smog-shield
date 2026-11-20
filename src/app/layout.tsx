import type { Metadata } from "next";
import { Montserrat, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import BackgroundRays from "@/components/BackgroundRays";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smog Shield AI – Breathe safer this winter",
  description:
    "Personalised low-emission routines, indoor air hacks and sustainable swaps for families facing winter smog.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${devanagari.variable}`}>
      <body className="min-h-screen antialiased">
        <BackgroundRays />
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <header role="banner" className="mx-auto max-w-4xl px-4 py-6">
          <p className="flex items-center gap-2 text-xl font-semibold tracking-wide">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-violet-300">
  <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" fill="currentColor" />
  <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" fill="currentColor" />
</svg>
            Smog Shield AI
          </p>
        </header>
        <main id="main" className="mx-auto max-w-4xl px-4 pb-16">
          {children}
        </main>
        <footer role="contentinfo" className="mx-auto max-w-4xl px-4 py-8 text-sm text-slate-300">
          Estimates are indicative, not medical advice. Air data: OpenWeather.
        </footer>
      </body>
    </html>
  );
}