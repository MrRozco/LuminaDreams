"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Moon, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_NAV_ITEMS } from "@/components/app-shell/nav";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { signOut } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  userDisplayName?: string | null;
}

export function TopHeader({ userDisplayName }: TopHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-cosmic-midnight/60 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:pl-80 lg:pr-8">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-foreground/80 lg:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/dreams/new"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-linear-to-r from-cosmic-nebula via-cosmic-purple to-cosmic-teal/80 px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-purple"
            >
              Log Dream
            </Link>

            <form action={signOut} className="hidden sm:block">
              <LogoutButton className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 px-3 text-sm text-foreground/80 transition hover:bg-white/8 hover:text-foreground disabled:opacity-60" />
            </form>

            <span className="hidden xl:inline text-xs text-foreground/55">{userDisplayName}</span>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              aria-label="Close mobile navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              id="mobile-nav-panel"
              className="fixed left-0 top-0 z-40 h-dvh w-72 border-r border-white/10 bg-cosmic-midnight/95 p-4 backdrop-blur-md lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 250, damping: 30 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 px-1 text-cosmic-gold">
                <Moon className="h-5 w-5" aria-hidden="true" />
                <span className="font-script text-2xl italic">{APP_NAME}</span>
              </div>

              <nav className="space-y-1" aria-label="Mobile navigation">
                {APP_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                        active ? "bg-cosmic-purple/20 text-foreground" : "text-foreground/75 hover:bg-white/5"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <form action={signOut} className="mt-6 border-t border-white/10 pt-4">
                <LogoutButton className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/20 px-3 text-sm text-foreground/85 transition hover:bg-white/8 hover:text-foreground disabled:opacity-60" />
              </form>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
