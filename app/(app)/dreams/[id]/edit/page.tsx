import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateDreamAction } from "@/lib/actions/dreams";
import { deleteDreamImageAction } from "@/lib/actions/media";
import { DreamForm } from "@/components/dreams/DreamForm";

interface EditDreamPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}

function inferStoragePathFromLegacyUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/dream-images/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;

    const path = parsed.pathname.slice(idx + marker.length);
    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}

export default async function EditDreamPage({ params, searchParams }: EditDreamPageProps) {
  const { id } = await params;
  const { error: errorMsg, success } = await searchParams;

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

  const { data: images } = await supabase
    .from("dream_images")
    .select("id, url, storage_path, created_at")
    .eq("dream_id", dream.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const resolvedImages = await Promise.all(
    (images ?? []).map(async (image) => {
      const storagePath = image.storage_path ?? inferStoragePathFromLegacyUrl(image.url);

      if (!storagePath) {
        return { id: image.id, url: image.url };
      }

      const { data, error: signedError } = await supabase.storage
        .from("dream-images")
        .createSignedUrl(storagePath, 60 * 60);

      if (signedError || !data?.signedUrl) {
        return { id: image.id, url: image.url };
      }

      return { id: image.id, url: data.signedUrl };
    }),
  );

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

      {success ? (
        <p className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </p>
      ) : null}

      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <DreamForm action={boundUpdate} defaultValues={dream} submitLabel="Update dream" />
      </section>

      {resolvedImages.length > 0 ? (
        <section className="glass-card rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-foreground">Generated images</h2>
          <p className="mt-1 text-sm text-foreground/65">Delete images you no longer want attached to this dream.</p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {resolvedImages.map((image) => {
              const boundDelete = deleteDreamImageAction.bind(null, dream.id, image.id);

              return (
                <div key={image.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/4">
                  <a href={image.url} target="_blank" rel="noreferrer" className="block">
                    <Image
                      src={image.url}
                      alt="AI-generated dream visual"
                      width={1200}
                      height={864}
                      className="h-48 w-full object-cover"
                    />
                  </a>
                  <form action={boundDelete} className="p-3">
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
                    >
                      Delete image
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
