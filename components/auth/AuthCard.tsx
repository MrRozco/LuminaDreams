import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, footer, children }: AuthCardProps) {
  return (
    <section
      className="glass-card glass-card-hover w-full max-w-md rounded-2xl border border-white/10 p-6 md:p-8"
      aria-label={title}
    >
      <header className="mb-6 space-y-2 text-center">
        <h1 className="font-script text-4xl italic text-cosmic-gold">{title}</h1>
        <p className="text-sm text-foreground/65">{subtitle}</p>
      </header>

      {children}

      {footer ? <footer className="mt-6 text-center text-sm text-foreground/70">{footer}</footer> : null}
    </section>
  );
}
