import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StarfieldBackground } from "@/components/starfield/StarfieldBackground";
import { SidebarNav } from "@/components/app-shell/SidebarNav";
import { TopHeader } from "@/components/app-shell/TopHeader";
import { getDisplayName } from "@/lib/auth/getDisplayName";

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const displayName = getDisplayName({
    email: user.email,
    userMetadata: user.user_metadata,
  });

  return (
    <main className="relative min-h-dvh overflow-hidden bg-cosmic-radial">
      <StarfieldBackground />
      <SidebarNav />
      <TopHeader userDisplayName={displayName} />

      <section className="relative z-10 px-4 py-8 sm:px-6 lg:pl-80 lg:pr-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </section>
    </main>
  );
}
