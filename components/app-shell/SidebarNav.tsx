"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Moon } from "lucide-react";
import { APP_NAV_ITEMS } from "@/components/app-shell/nav";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { signOut } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside
      className={cn("hidden lg:fixed lg:bottom-0 lg:left-0 lg:top-0 lg:z-30 lg:flex lg:w-72 lg:flex-col")}
      aria-label="Primary navigation"
    >
      <div className="relative flex h-full flex-col border-y border-r border-white/10 bg-cosmic-midnight/75 p-4 backdrop-blur-md">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 top-0 w-px bg-linear-to-b from-cosmic-teal/20 via-cosmic-purple/80 to-cosmic-teal/20"
          animate={{ opacity: [0.35, 0.95, 0.35], filter: ["blur(0px)", "blur(1px)", "blur(0px)"] }}
          transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />

        <div className="flex flex-1 flex-col justify-center px-1">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 px-1 text-cosmic-gold">
            <Moon className="h-7 w-7 drop-shadow-[0_0_14px_rgba(212,175,119,0.95)]" aria-hidden="true" />
            <span className="font-script text-3xl leading-6 italic drop-shadow-[0_0_12px_rgba(212,175,119,0.45)]">{APP_NAME}</span>
          </Link>

          <nav className="flex flex-col gap-2 overflow-y-auto">
          {APP_NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <motion.div
                key={item.href}
                className="w-full"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0, y: [0, -1.5, 0] }}
                transition={{
                  opacity: { duration: 0.2, delay: index * 0.04 },
                  x: { duration: 0.2, delay: index * 0.04 },
                  y: { duration: 4.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: index * 0.14 },
                }}
              >
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex w-full items-center justify-start gap-3 rounded-xl px-4 py-3.5 text-base transition-all duration-300",
                    active
                      ? "bg-linear-to-r from-cosmic-purple/25 via-cosmic-nebula/15 to-cosmic-teal/15 text-foreground shadow-[0_0_0_1px_rgba(192,132,252,0.42),0_0_24px_rgba(192,132,252,0.18)]"
                      : "text-foreground/75 hover:-translate-y-0.5 hover:bg-linear-to-r hover:from-cosmic-purple/14 hover:to-cosmic-teal/10 hover:text-foreground hover:shadow-[0_0_18px_rgba(192,132,252,0.18)]"
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="active-nav-pill"
                      className="absolute inset-y-1 left-1 w-1 rounded-full bg-linear-to-b from-cosmic-teal to-cosmic-purple"
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      "h-5 w-5 drop-shadow-[0_0_10px_rgba(103,232,249,0.55)]",
                      active ? "text-cosmic-teal" : "text-cosmic-purple/90"
                    )}
                    aria-hidden="true"
                  />
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
          </nav>

          <form action={signOut} className="mt-6 border-t border-white/10 pt-4">
            <LogoutButton className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/20 px-3 text-sm text-foreground/85 transition hover:bg-white/8 hover:text-foreground disabled:opacity-60" />
          </form>
        </div>
      </div>
    </aside>
  );
}
