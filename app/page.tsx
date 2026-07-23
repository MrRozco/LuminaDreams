/**
 * Landing page — Phase 1 visual showcase.
 * Demonstrates the full cosmic design system: starfield, gradients,
 * typography hierarchy, glass-morphism cards, and CTA buttons.
 * Authentication and routing are wired up in later phases.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Moon, Sparkles, ArrowRight, Brain, Zap, Eye, BookOpen, Film, Database, Search } from "lucide-react";
import { StarfieldBackground } from "@/components/starfield/StarfieldBackground";
import { PricingCards } from "@/components/marketing/PricingCards";

export const metadata: Metadata = {
  title: "Lumina Dreams — AI Dream Journal",
  description:
    "Record your dreams. Receive AI-powered interpretations. Discover the patterns of your subconscious.",
};

/* Feature stories */
const FEATURE_STORIES = [
  {
    eyebrow: "Dream card",
    title: "Interpret and generate visuals from one dream",
    description:
      "Each dream becomes a living record with AI interpretation, symbol analysis, and built-in image or video generation so reflection and creation happen in one place.",
    bullets: [
      {
        icon: Brain,
        title: "Interpretation in context",
        text: "Themes, symbolism, and emotional tone stay attached to the original dream details.",
      },
      {
        icon: Zap,
        title: "Instant visual generation",
        text: "Generate an image directly from the dream card with the same atmosphere and details preserved.",
      },
      {
        icon: Film,
        title: "Video from the same prompt",
        text: "Turn the dream into motion for a more immersive way to revisit what happened.",
      },
    ],
    image: "/dream-card.png",
    alt: "Dream card with interpretation and media generation",
  },
  {
    eyebrow: "Insights",
    title: "Turn multiple dreams into clear patterns",
    description:
      "Insights analyzes your dream history to reveal recurring symbols, emotional cycles, and evolving patterns so your subconscious trends are easy to understand.",
    bullets: [
      {
        icon: Eye,
        title: "Recurring symbol tracking",
        text: "Spot the people, places, objects, and situations that appear again and again.",
      },
      {
        icon: Brain,
        title: "Emotional trend analysis",
        text: "See how mood and emotional intensity shift across your dream history.",
      },
      {
        icon: Sparkles,
        title: "Actionable summaries",
        text: "Get readable takeaways instead of raw data so the patterns actually make sense.",
      },
    ],
    image: "/insights_screenshot.png",
    alt: "Insights dashboard with dream patterns",
  },
  {
    eyebrow: "Library",
    title: "Store every dream and all related data",
    description:
      "The library keeps every dream, interpretation, mood, image, video, and date together so you can search, revisit, and understand your full archive without losing context.",
    bullets: [
      {
        icon: Database,
        title: "All dream data together",
        text: "Entries, interpretations, images, videos, moods, and dates stay linked in one place.",
      },
      {
        icon: Search,
        title: "Easy retrieval",
        text: "Find older dreams faster when you want to revisit a specific symbol or season of life.",
      },
      {
        icon: BookOpen,
        title: "A lasting personal archive",
        text: "Build a dream record that becomes more meaningful the longer you keep using it.",
      },
    ],
    image: "/dream_library.png",
    alt: "Dream library showing stored dreams and data",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh flex flex-col items-center overflow-hidden">
      <StarfieldBackground />

      {/* Ambient nebula overlays */}
      <div className="pointer-events-none fixed inset-0 z-1" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-150 h-150 rounded-full bg-cosmic-nebula/20 blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-125 rounded-full bg-cosmic-purple/10 blur-[140px]" />
        <div className="absolute -bottom-40 -right-20 w-125 h-100 rounded-full bg-cosmic-teal/8 blur-[100px]" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-cosmic-midnight/60 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full">

        {/* Nav */}
        <nav className="w-full flex items-center justify-between px-8 py-5 max-w-6xl mx-auto" aria-label="Main navigation">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-linear-to-br from-cosmic-purple/30 to-cosmic-teal/20 border border-cosmic-purple/35 glow-purple">
              <Moon className="w-4.5 h-4.5 text-cosmic-gold" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <span className="font-script text-xl italic text-cosmic-gold tracking-wide">Lumina Dreams</span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {["Features", "How It Works", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-foreground/60 hover:text-foreground/90 transition-colors duration-200">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden sm:inline-flex text-sm text-foreground/65 hover:text-foreground/90 transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/auth/signup"
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-linear-to-r from-cosmic-nebula to-cosmic-purple text-white text-sm font-medium tracking-wide transition-all duration-300 hover:opacity-90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-purple focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Create your Lumina Dreams account">
              Get started
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center text-center px-6 pt-20 pb-28 max-w-4xl mx-auto" aria-labelledby="hero-heading">
          <div className="mb-7 flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs text-foreground/60 font-medium tracking-widest uppercase">
            <Sparkles className="w-3 h-3 text-cosmic-gold animate-twinkle" aria-hidden="true" />
            Take control of your dreams!
            <Sparkles className="w-3 h-3 text-cosmic-gold animate-twinkle" aria-hidden="true" />
          </div>

          <h1 id="hero-heading" className="font-script text-7xl sm:text-8xl md:text-9xl font-bold text-gradient-gold leading-[0.95] tracking-tight">
            Lumina<br />Dreams
          </h1>

          <p className="mt-8 text-lg sm:text-xl md:text-2xl text-foreground/65 font-light leading-relaxed max-w-2xl tracking-wide">
            Your dreams are trying to tell you something.
            <br className="hidden sm:block" />
            <span className="text-gradient-cosmic font-normal"> Let AI help you listen.</span>
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/auth/signup"
              className="group flex items-center gap-2 px-8 py-4 rounded-full bg-linear-to-r from-cosmic-purple via-cosmic-nebula to-cosmic-teal/80 text-white font-semibold text-base tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cosmic-purple/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-purple focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Start your free dream journal">
              Begin Your Journey
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link href="/auth/login"
              className="px-8 py-4 rounded-full glass-card glass-card-hover text-foreground/75 font-medium text-base tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-purple focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Sign in to your existing account">
              I already have an account
            </Link>
          </div>

          <p className="mt-10 text-xs text-foreground/30 tracking-[0.2em] uppercase">
            Free to start &nbsp;·&nbsp; No credit card required
          </p>
        </section>

        <div className="divider-cosmic w-full max-w-2xl mx-auto mb-20" aria-hidden="true" />

        {/* Features */}
        <section id="features" className="w-full max-w-6xl mx-auto px-6 pb-28" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-center font-script text-3xl sm:text-4xl italic text-foreground/80 mb-12">
            Everything your dream life deserves
          </h2>

          <div className="space-y-8">
            {FEATURE_STORIES.map((item, index) => {
              const textOrder = index % 2 === 0 ? "order-1 md:order-1" : "order-1 md:order-2";
              const imageOrder = index % 2 === 0 ? "order-2 md:order-2" : "order-2 md:order-1";

              return (
                <article key={item.title} className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 md:gap-8">
                  <div className={["flex flex-col justify-center px-1 py-2 sm:px-2", textOrder].join(" ")}>
                    <p className="text-xs uppercase tracking-[0.24em] text-cosmic-purple/85">{item.eyebrow}</p>
                    <h3 className="mt-3 font-script text-2xl sm:text-4xl italic text-cosmic-gold">{item.title}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-foreground/70">{item.description}</p>

                    <ul className="mt-5 space-y-3">
                      {item.bullets.map(({ icon: Icon, title, text }) => (
                        <li key={title} className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cosmic-purple/30 bg-linear-to-br from-cosmic-purple/22 to-cosmic-teal/12 shadow-[0_0_24px_rgba(139,92,246,0.18)]">
                            <Icon className="h-4.5 w-4.5 text-cosmic-purple" strokeWidth={1.7} aria-hidden="true" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-foreground/90">{title}</span>
                            <span className="block text-sm leading-relaxed text-foreground/60">{text}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={["glass-card overflow-hidden rounded-2xl border border-white/10", imageOrder].join(" ")}>
                    <Image
                      src={item.image}
                      alt={item.alt}
                      width={1600}
                      height={1000}
                      className="h-full min-h-52 sm:min-h-64 w-full object-cover"
                      priority={index === 0}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="how-it-works"
          className="w-full max-w-6xl mx-auto px-6 pb-28 scroll-mt-24"
          aria-labelledby="how-it-works-heading"
        >
          <h2
            id="how-it-works-heading"
            className="text-center font-script text-3xl sm:text-4xl italic text-foreground/80 mb-12"
          >
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                title: "Record your dream",
                text: "Capture the title, date, emotions, and every surreal detail while the memory is still vivid.",
              },
              {
                step: "02",
                title: "Receive interpretation",
                text: "Lumina uses AI to surface symbols, emotional themes, and cross-cultural meaning from your entry.",
              },
              {
                step: "03",
                title: "Spot patterns over time",
                text: "As your journal grows, recurring imagery and themes become visible through gentle AI insight.",
              },
            ].map((item) => (
              <article key={item.step} className="glass-card rounded-2xl border border-white/10 p-6">
                <p className="text-xs tracking-[0.3em] uppercase text-cosmic-purple/90">{item.step}</p>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/65">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="w-full max-w-6xl mx-auto px-6 pb-28 scroll-mt-24"
          aria-labelledby="pricing-heading"
        >
          <h2
            id="pricing-heading"
            className="text-center font-script text-3xl sm:text-4xl italic text-foreground/80 mb-12"
          >
            Pricing
          </h2>

          <PricingCards />
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-border/40 py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-cosmic-gold/70" strokeWidth={1.5} aria-hidden="true" />
              <span className="font-script italic text-foreground/40 text-sm">Lumina Dreams</span>
            </div>
            <p className="text-xs text-foreground/30 text-center">
              © {new Date().getFullYear()} Lumina Dreams. Explore your subconscious with care.
            </p>
            <div className="flex gap-6 text-xs text-foreground/35">
              <Link href="/privacy" className="hover:text-foreground/60 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground/60 transition-colors">Terms</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
