import { XAI_API_BASE, XAI_MODELS } from "@/lib/constants";

interface XAIImageResponse {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

export async function generateDreamImage(prompt: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  // xAI image endpoint does not currently accept OpenAI-style `size`.
  // Keep payload minimal for compatibility.
  let res = await fetch(`${XAI_API_BASE}/images/generations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: XAI_MODELS.image,
      prompt,
    }),
  });

  // Backward-compatible fallback: if model requires fewer args, retry with just prompt.
  if (!res.ok) {
    const firstBody = await res.text().catch(() => "");
    if (firstBody.includes("Argument not supported") || firstBody.includes("not supported")) {
      res = await fetch(`${XAI_API_BASE}/images/generations`, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt }),
      });
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Image generation failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as XAIImageResponse;
  const first = data.data?.[0];

  if (first?.url) {
    return first.url;
  }

  if (first?.b64_json) {
    return `data:image/png;base64,${first.b64_json}`;
  }

  throw new Error("Image generation returned no image URL.");
}

interface XAIVideoCreateResponse {
  request_id?: string;
}

interface XAIVideoResultResponse {
  status?: "pending" | "done" | "failed" | string;
  progress?: number;
  error?: {
    message?: string;
  };
  video?: {
    url?: string;
    duration?: number;
  };
}

export async function generateDreamVideoFromImage(imageUrl: string, prompt: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const create = await fetch(`${XAI_API_BASE}/videos/generations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: XAI_MODELS.video,
      prompt,
      image: {
        url: imageUrl,
      },
    }),
  });

  if (!create.ok) {
    const body = await create.text().catch(() => "");
    throw new Error(`Video generation failed (${create.status}): ${body}`);
  }

  const createData = (await create.json()) as XAIVideoCreateResponse;
  if (!createData.request_id) {
    throw new Error("Video generation failed: missing request_id.");
  }

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(`${XAI_API_BASE}/videos/${createData.request_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!poll.ok) {
      const body = await poll.text().catch(() => "");
      throw new Error(`Video polling failed (${poll.status}): ${body}`);
    }

    const current = (await poll.json()) as XAIVideoResultResponse;
    if (current.status === "done" && current.video?.url) {
      return current.video.url;
    }

    if (current.status === "failed") {
      throw new Error(current.error?.message || "Video generation failed.");
    }
  }

  throw new Error("Video generation timed out. Please try again.");
}
