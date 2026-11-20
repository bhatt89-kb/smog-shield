import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smog Shield AI – Breathe safer this winter",
  description:
    "Personalised low-emission routines, indoor air hacks and sustainable swaps for families facing winter smog.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <header role="banner" className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-2xl font-bold">🛡️ Smog Shield AI</p>
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