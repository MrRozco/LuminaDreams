import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { APP_NAME } from "@/lib/constants";

/* ─── Google Fonts ─────────────────────────────────────────────── */

/**
 * Inter: primary UI font for all body text, navigation, labels.
 * We expose it as the --font-inter CSS variable for @theme mapping.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

/**
 * Playfair Display: flowing serif used exclusively for dream titles
 * and key insight headings — loaded in both normal and italic styles.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
  preload: true,
});

/* ─── Metadata ────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "AI-powered cosmic dream journal. Record your dreams, receive deep AI interpretation, and uncover the patterns of your subconscious mind.",
  keywords: [
    "dream journal",
    "AI dream interpretation",
    "lucid dreaming",
    "dream analysis",
    "subconscious",
    "dream meanings",
    "AI journaling",
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: APP_NAME,
    description:
      "AI-powered cosmic dream journal. Interpret your dreams, visualize their imagery, and understand your mind.",
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description:
      "AI-powered cosmic dream journal. Interpret your dreams, visualize their imagery, and understand your mind.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a0f2e" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

/* ─── Root Layout ─────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
     * suppressHydrationWarning prevents React from warning about the
     * `class` attribute mismatch caused by next-themes injecting "dark"
     * on the server vs. what the client first renders.
     */
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
