import Link from "next/link";
import { Moon, Stars } from "lucide-react";
import { StarfieldBackground } from "@/components/starfield/StarfieldBackground";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-cosmic">
      <StarfieldBackground />

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-1">
        <div className="absolute -left-20 top-8 h-80 w-80 rounded-full bg-cosmic-nebula/20 blur-[100px]" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-cosmic-teal/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center justify-center px-6 py-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-cosmic-gold hover:text-cosmic-gold-light">
          <Moon className="h-5 w-5" aria-hidden="true" />
          <span className="font-script text-2xl italic">{APP_NAME}</span>
        </Link>

        {children}

        <p className="mt-8 inline-flex items-center gap-2 text-xs text-foreground/50">
          <Stars className="h-3.5 w-3.5" aria-hidden="true" />
          Your session is protected by Supabase Auth + RLS
        </p>
      </div>
    </main>
  );
}
