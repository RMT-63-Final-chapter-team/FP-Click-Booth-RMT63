import { NextResponse } from "next/server";
import { Photo, UploadBody } from "@/type";
import errorHandler from "@/helpers/errHandler";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { PhotoModel } from "@/db/models/PhotoModel";
import { UserModel } from "@/db/models/UserModel";
import streamifier from "streamifier";
import { fileTypeFromBuffer } from "file-type";
import { sendWhatsapp } from "@/helpers/fonnte";
import { ObjectId } from "mongodb";

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
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Empty Cloudinary upload result"));
        resolve(result as UploadApiResponse);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// Function to check if image already exists in database
async function findExistingPhoto(userId: string): Promise<Photo | null> {
  try {
    const userIdObj = userId ? new ObjectId(userId) : null;
    console.log("Looking for existing photo for user:", userId);

    const existingPhoto = await PhotoModel.collection().findOne({
      userId: userIdObj,
      url: { $ne: "" }, // Only photos with actual URL (uploaded to cloud)
      // Check for photos uploaded in the last 10 minutes (extended time)
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });

    console.log("Found existing photo:", existingPhoto ? "Yes" : "No");
    return existingPhoto as Photo | null;
  } catch (error) {
    console.warn("Error checking existing photo:", error);
    return null;
  }
}

// Create a simple hash from image data for duplicate detection
function createImageHash(imageData: string): string {
  // Simple hash based on first and last parts of base64 data
  const cleanData = imageData.replace(/^data:image\/\w+;base64,/, "");
  const start = cleanData.substring(0, 100);
  const end = cleanData.substring(cleanData.length - 100);
  return Buffer.from(start + end)
    .toString("base64")
    .substring(0, 20);
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id") ?? "";
    const body = (await req.json()) as UploadBody;

    if (!body?.imageData)
      throw {
        message: "imageData (base64 or data URI) is required",
        status: 400,
      };

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

    // Check if we should skip Cloudinary upload (for booth photos)
    if (body.skipCloudinaryUpload) {
      console.log(
        "Skipping Cloudinary upload for booth photo, saving to DB only"
      );

      // Save directly to database without Cloudinary upload
      const created = await PhotoModel.createPhoto({
        userId: userId ? new ObjectId(userId) : null,
        url: "", // Empty URL since we're not uploading to cloud
        publicId: "",
        frame: body.frame,
        stickers: body.stickers,
        watermark: body.watermark,
        filter: body.filter ?? undefined,
        shots: typeof body.shots === "number" ? body.shots : undefined,
        layout: body.layout ?? undefined,
        images: body.images ?? [],
        enhancedUrl: "",
        aiEnhanced: false,
      });

      return NextResponse.json({
        message: "Photo saved to database successfully",
        photo: created,
        uploaded: false,
        isNewUpload: false,
      });
    }

    //decode image
    const dataUri = normalizeDataUri(body.imageData);
    const match = dataUri.match(/^data:(image\/\w+);base64,([\s\S]+)$/);
    if (!match) throw { message: "Invalid image data URI", status: 400 };

    let base64Payload = match[2].replace(/\s+/g, "").replace(/\\+/g, "");
    base64Payload = base64Payload.replace(/[^A-Za-z0-9+/=]/g, "");
    if (base64Payload.length === 0)
      throw { message: "Invalid image data (empty payload)", status: 400 };
    if (base64Payload.length % 4 !== 0)
      base64Payload = base64Payload.padEnd(
        Math.ceil(base64Payload.length / 4) * 4,
        "="
      );

    const buffer = Buffer.from(base64Payload, "base64");
    if (buffer.length < 8)
      throw {
        message: "Invalid image data (payload too short after decode)",
        status: 400,
      };

    const ft = await fileTypeFromBuffer(buffer);
    if (!ft || !ft.mime?.startsWith("image/"))
      throw { message: "Invalid image file", status: 400 };

    const MAX_BYTES = 5 * 1024 * 1024;
    if (buffer.length > MAX_BYTES)
      throw { message: "Image too large", status: 413 };

    let url: string;
    let publicId: string;
    let created: Photo;
    let isNewUpload = false;

    // Cek apakah ini request untuk share WhatsApp dan sudah ada foto recent
    if (body.sendToWhatsapp) {
      console.log("Processing WhatsApp share request");
      const existingPhoto = await findExistingPhoto(userId);

      if (existingPhoto && existingPhoto.url) {
        // Gunakan foto yang sudah ada untuk share WhatsApp
        url = existingPhoto.url;
        publicId = existingPhoto.publicId || "";
        created = existingPhoto;
        console.log("Using existing photo for WhatsApp share:", url);
      } else {
        // Upload baru jika belum ada foto recent atau foto tidak valid
        console.log("No existing photo found, uploading new for WhatsApp");
        const uploadResult = await uploadBufferToCloudinary(buffer, {
          folder: "click-booth",
          resource_type: "image",
          use_filename: true,
          unique_filename: true,
        });

        if (!uploadResult?.secure_url)
          throw {
            message: "Cloudinary did not return secure_url",
            status: 502,
          };

        url = uploadResult.secure_url;
        publicId = uploadResult.public_id;
        isNewUpload = true;

        // Simpan ke DB juga karena baru upload
        created = await PhotoModel.createPhoto({
          userId: userId ? new ObjectId(userId) : null,
          url,
          publicId,
          frame: body.frame,
          stickers: body.stickers,
          watermark: body.watermark,
          filter: body.filter ?? undefined,
          shots: typeof body.shots === "number" ? body.shots : undefined,
          layout: body.layout ?? undefined,
          images: body.images ?? [],
          enhancedUrl: url,
          aiEnhanced: false,
        });
      }
    } else {
      // Upload baru jika belum ada foto recent
      console.log("No existing photo found, uploading new for cloud save");
      const uploadResult = await uploadBufferToCloudinary(buffer, {
        folder: "click-booth",
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
      });

      if (!uploadResult?.secure_url)
        throw { message: "Cloudinary did not return secure_url", status: 502 };

      url = uploadResult.secure_url;
      publicId = uploadResult.public_id;
      isNewUpload = true;

      // Simpan ke DB
      created = await PhotoModel.createPhoto({
        userId: userId ? new ObjectId(userId) : null,
        url,
        publicId,
        frame: body.frame,
        stickers: body.stickers,
        watermark: body.watermark,
        filter: body.filter ?? undefined,
        shots: typeof body.shots === "number" ? body.shots : undefined,
        layout: body.layout ?? undefined,
        images: body.images ?? [],
        enhancedUrl: url,
        aiEnhanced: false,
      });
      // Untuk save to cloud, cek dulu apakah sudah ada foto recent
      console.log("Processing cloud save request");
    }

    //share ke WhatsApp via fonnte
    let waResult = null;
    if (body.sendToWhatsapp) {
      try {
        let phoneNumber = body.phoneNumber;

        if (!phoneNumber && userId) {
          try {
            const col = UserModel.collection();
            let user = null;
            // try ObjectId lookup first
            try {
              user = await col.findOne({ _id: new ObjectId(userId) });
            } catch {
              user = await col.findOne({ _id: new ObjectId(userId) });
            }
            if (user?.phoneNumber) phoneNumber = String(user.phoneNumber);
          } catch (uErr) {
            console.warn("Failed to lookup user phone:", uErr);
          }
        }

        if (phoneNumber) {
          waResult = await sendWhatsapp(
            phoneNumber,
            `Halo! Ini hasil foto kamu dari ClickBooth! 📸✨\n\n${url}\n\nTerima kasih sudah menggunakan ClickBooth!`
          );
        } else {
          waResult = { error: "No phone number found for user" };
          console.warn(
            "[photos.route] sendToWhatsapp requested but no phone available"
          );
        }
      } catch (waErr) {
        console.error("WA send error:", waErr);
        waResult = {
          error: waErr instanceof Error ? waErr.message : String(waErr),
        };
      }
    }

    const responseMessage = body.sendToWhatsapp
      ? isNewUpload
        ? "Foto berhasil diupload dan dikirim ke WhatsApp!"
        : "Foto berhasil dikirim ke WhatsApp!"
      : isNewUpload
      ? "Foto berhasil diupload dan disimpan ke cloud storage!"
      : "Foto sudah tersimpan di cloud storage!";

    return NextResponse.json(
      {
        message: responseMessage,
        photo: created,
        waResult: body.sendToWhatsapp ? waResult : undefined,
        isNewUpload,
      },
      { status: isNewUpload ? 201 : 200 }
    );
  } catch (error) {
    return errorHandler(error);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mine = url.searchParams.get("mine") === "true";
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") ?? 50), 1),
      200
    );
    const skip = Math.max(Number(url.searchParams.get("skip") ?? 0), 0);
    const userId = req.headers.get("x-user-id") ?? "";

    if (mine && !userId) {
      return NextResponse.json(
        { message: "Missing authentication (x-user-id) for mine=true" },
        { status: 400 }
      );
    }

    const photos = await PhotoModel.list({
      userId: userId || undefined,
      mine,
      limit,
      skip,
    });

    const enhanced = photos.map((p) => {
      const thumbUrl =
        cloudinaryConfigured && p.publicId
          ? cloudinary.url(p.publicId, {
              width: 800,
              crop: "scale",
              quality: "auto",
              fetch_format: "auto",
            })
          : p.url;
      return {
        ...p,
        thumbUrl,
        isOwner: Boolean(userId && p.userId && p.userId.toString() === userId),
      };
    });

    return NextResponse.json({ photos: enhanced }, { status: 200 });
  } catch (error) {
    return errorHandler(error);
  }
}
