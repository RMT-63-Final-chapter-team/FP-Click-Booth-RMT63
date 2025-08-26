import { UserModel } from "@/db/models/UserModel";
import { verifyWithJose } from "@/helpers/jwt";
import { cookies } from "next/headers";
import OpenAI from "openai";
export const runtime = "nodejs";

const ALLOWED_SIZES = [
  "auto",
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "512x512",
  "256x256",
] as const;

type ImageSize = (typeof ALLOWED_SIZES)[number];

function parseSize(v: FormDataEntryValue | null): ImageSize {
  return typeof v === "string" &&
    (ALLOWED_SIZES as readonly string[]).includes(v)
    ? (v as ImageSize)
    : "1024x1024";
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const auth = await cookieStore.get("authorization");
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const [type, token] = auth.value.split(" ");

  const payload = await verifyWithJose(token);

  await UserModel.decrementToken(payload.id);

  try {
    if (!process.env.GPT_API_KEY) {
      return new Response("Missing GPT_API_KEY", { status: 500 });
    }

    const form = await req.formData();
    const image = form.get("image") as File | null;
    const prompt = form.get("prompt") as string;
    const size = parseSize(form.get("size")); // ✅ sudah dinarrow ke union ---
    const mask = form.get("mask") as File | null;

    if (!image) return new Response("No image uploaded", { status: 400 });

    const client = new OpenAI({ apiKey: process.env.GPT_API_KEY });
    const res = await client.images.edit({
      model: "gpt-image-1",
      image,
      ...(mask ? { mask } : {}),
      prompt,
      size,
    });

    const item = res.data?.[0];
    if (!item) return new Response("No image generated", { status: 500 });

    if (item.b64_json) {
      const bytes = Buffer.from(item.b64_json, "base64");
      return new Response(bytes, {
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    } else if (item.url) {
      const r = await fetch(item.url);
      if (!r.ok)
        return new Response("Failed to fetch image URL", { status: 502 });
      const arr = await r.arrayBuffer();
      return new Response(arr, {
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }
    return new Response("No image data", { status: 500 });
  } catch (e: unknown) {
    return new Response((e as Error)?.message || "Unknown error", {
      status: 500,
    });
  }
}
