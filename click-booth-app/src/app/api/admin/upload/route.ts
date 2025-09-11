import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Define the upload response type
interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename: string;
  [key: string]: unknown;
}

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderName = formData.get("folderName") as string;

    if (!file) {
      return NextResponse.json(
        {
          msg: "File not found",
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    // main cloudinary upload code
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const res = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderName,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result as CloudinaryUploadResult);
          } else {
            reject(new Error("Upload failed: No result returned"));
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      msg: "File uploaded to cloudinary",
      res,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error in file upload:", error);
    return NextResponse.json(
      {
        msg: "Error in fileupload route",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
