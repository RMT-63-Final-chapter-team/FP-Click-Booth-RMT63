import { NextResponse } from "next/server";
import { Photo, UploadBody } from "@/type";
import errorHandler from "@/helpers/errHandler";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { PhotoModel } from "@/db/models/PhotoModel";
import streamifier from "streamifier";
import { fileTypeFromBuffer } from "file-type";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUD_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUD_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const cloudinaryConfigured = !!(CLOUD_NAME && CLOUD_API_KEY && CLOUD_API_SECRET);
if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET
  });
}

function normalizeDataUri(data: string) {
  const s = String(data).trim();
  const match = s.match(/^data:(image\/\w+);base64,([\s\S]+)$/);
  if (match) {
    return `data:${match[1]};base64,${match[2].replace(/\s+/g, "")}`;
  }
  const cleaned = s
    .replace(/\\r|\\n/g, "")
    .replace(/\\+/g, "")
    .replace(/\s+/g, "");
  return `data:image/jpeg;base64,${cleaned}`;
}

async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: Record<string, unknown> = {}
): Promise<UploadApiResponse> {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options as any, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Empty Cloudinary upload result"));
      resolve(result as UploadApiResponse);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id") ?? "";
    const body = (await req.json()) as UploadBody;
    if (!body?.imageData)
      throw { message: "imageData (base64 or data URI) is required", status: 400 };

    const isGuest = !userId;
    if (isGuest && body.downloadOnly) {
      const dataUri = normalizeDataUri(body.imageData);
      return NextResponse.json(
        { message: "Guest image ready for download", downloadDataUrl: dataUri },
        { status: 200 }
      );
    }
    if (isGuest && !body.downloadOnly)
      throw { message: "Guests cannot upload to server", status: 403 };
    if (!cloudinaryConfigured)
      throw { message: "Cloudinary not configured on server", status: 500 };

    const dataUri = normalizeDataUri(body.imageData);
    const match = dataUri.match(/^data:(image\/\w+);base64,([\s\S]+)$/);
    if (!match) throw { message: "Invalid image data URI", status: 400 };

    let base64Payload = match[2].replace(/\s+/g, "").replace(/\\+/g, "");
    base64Payload = base64Payload.replace(/[^A-Za-z0-9+/=]/g, "");
    if (base64Payload.length === 0)
      throw { message: "Invalid image data (empty payload)", status: 400 };
    if (base64Payload.length % 4 !== 0)
      base64Payload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, "=");

    const buffer = Buffer.from(base64Payload, "base64");
    if (buffer.length < 8)
      throw { message: "Invalid image data (payload too short after decode)", status: 400 };

    const ft = await fileTypeFromBuffer(buffer);
    if (!ft || !ft.mime?.startsWith("image/")) throw { message: "Invalid image file", status: 400 };

    const MAX_BYTES = 5 * 1024 * 1024;
    if (buffer.length > MAX_BYTES) throw { message: "Image too large", status: 413 };

    const uploadResult = await uploadBufferToCloudinary(buffer, {
      folder: "click-booth",
      resource_type: "image",
      use_filename: true,
      unique_filename: true
    });

    if (!uploadResult?.secure_url)
      throw { message: "Cloudinary did not return secure_url", status: 502 };
    const url = uploadResult.secure_url;
    const publicId = uploadResult.public_id;

    const created: Photo = await PhotoModel.createPhoto({
      userId: userId || null,
      url,
      publicId,
      frame: body.frame,
      stickers: body.stickers,
      watermark: body.watermark,
      enhancedUrl: url,
      aiEnhanced: false
    });

    const waShareUrl = userId
      ? `https://wa.me/?text=${encodeURIComponent(`Check out my photo: ${url}`)}`
      : null;
    return NextResponse.json(
      { message: "Photo uploaded and saved", photo: created, waShareUrl },
      { status: 201 }
    );
  } catch (error) {
    return errorHandler(error);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mine = url.searchParams.get("mine") === "true";
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);
    const skip = Math.max(Number(url.searchParams.get("skip") ?? 0), 0);
    const userId = req.headers.get("x-user-id") ?? "";

    if (mine && !userId) {
      return NextResponse.json(
        { message: "Missing authentication (x-user-id) for mine=true" },
        { status: 400 }
      );
    }

    const photos = await PhotoModel.list({ userId: userId || undefined, mine, limit, skip });

    const enhanced = photos.map((p) => {
      const thumbUrl =
        cloudinaryConfigured && p.publicId
          ? cloudinary.url(p.publicId, {
              width: 800,
              crop: "scale",
              quality: "auto",
              fetch_format: "auto"
            })
          : p.url;
      return {
        ...p,
        thumbUrl,
        isOwner: Boolean(userId && p.userId && p.userId === userId)
      };
    });

    return NextResponse.json({ photos: enhanced }, { status: 200 });
  } catch (error) {
    return errorHandler(error);
  }
}
