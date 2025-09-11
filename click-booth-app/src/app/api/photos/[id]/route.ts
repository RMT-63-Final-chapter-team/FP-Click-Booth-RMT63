import { NextRequest, NextResponse } from "next/server";
import errorHandler from "@/helpers/errHandler";
import { PhotoModel } from "@/db/models/PhotoModel";
import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUD_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUD_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const cloudinaryConfigured = !!(
  CLOUD_NAME &&
  CLOUD_API_KEY &&
  CLOUD_API_SECRET
);
if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET,
  });
}

// GET /api/photos/:id
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const photo = await PhotoModel.findById(id);
    if (!photo)
      return NextResponse.json({ message: "Photo not found" }, { status: 404 });

    const thumbUrl =
      cloudinaryConfigured && photo.publicId
        ? cloudinary.url(photo.publicId, {
            width: 800,
            crop: "scale",
            quality: "auto",
            fetch_format: "auto",
          })
        : photo.url;

    return NextResponse.json(
      { photo: { ...photo, thumbUrl } },
      { status: 200 }
    );
  } catch (err) {
    return errorHandler(err);
  }
}

// PATCH /api/photos/:id  -- update metadata (owner only)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const userId = req.headers.get("x-user-id") ?? "";
    if (!userId)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );

    const { id } = await context.params;
    const existing = await PhotoModel.findById(id);
    if (!existing)
      return NextResponse.json({ message: "Photo not found" }, { status: 404 });

    if (!existing.userId || existing.userId.toString() !== userId) {
      return NextResponse.json(
        { message: "Forbidden: not the owner" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const allowedKeys = new Set([
      "frame",
      "stickers",
      "watermark",
      "filter",
      "shots",
      "layout",
    ]);
    const payload: Record<string, unknown> = {};
    for (const key of Object.keys(body || {})) {
      if (allowedKeys.has(key)) payload[key] = body[key];
    }
    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { message: "No updatable fields provided" },
        { status: 400 }
      );
    }

    const updated = await PhotoModel.updatePhoto(id, payload);
    if (!updated)
      return NextResponse.json(
        { message: "Failed to update photo" },
        { status: 500 }
      );

    return NextResponse.json(
      { message: "Photo updated", photo: updated },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/photos/:id  -- delete photo (owner only)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const userId = req.headers.get("x-user-id") ?? "";
    if (!userId)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );

    const { id } = await context.params;
    const existing = await PhotoModel.findById(id);
    if (!existing)
      return NextResponse.json({ message: "Photo not found" }, { status: 404 });

    if (!existing.userId || existing.userId.toString() !== userId) {
      return NextResponse.json(
        { message: "Forbidden: not the owner" },
        { status: 403 }
      );
    }

    const publicId = existing.publicId;
    if (cloudinaryConfigured && publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.warn(
          "cloudinary destroy failed for",
          publicId,
          (e as Error)?.message ?? e
        );
      }
    }

    const ok = await PhotoModel.deleteById(id);
    if (!ok)
      return NextResponse.json(
        { message: "Failed to delete photo" },
        { status: 500 }
      );

    return NextResponse.json({ message: "Photo deleted" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
