import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateDreamAction } from "@/lib/actions/dreams";
import { DreamForm } from "@/components/dreams/DreamForm";

interface EditDreamPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditDreamPage({ params, searchParams }: EditDreamPageProps) {
  const { id } = await params;
  const { error: errorMsg } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: dream } = await supabase
    .from("dreams")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!dream) notFound();

  const boundUpdate = updateDreamAction.bind(null, dream.id);

  return (
    <div className="space-y-5">
      <Link
        href={`/dreams/${dream.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-foreground/65 transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dream
      </Link>

      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <h1 className="font-script text-4xl italic text-cosmic-gold">Edit Dream</h1>
        <p className="mt-2 text-sm text-foreground/70">Update the details of this dream entry.</p>
      </section>

      {errorMsg ? (
        <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {errorMsg}
        </p>
      ) : null}

      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <DreamForm action={boundUpdate} defaultValues={dream} submitLabel="Update dream" />
      </section>
    </div>
  );
}
