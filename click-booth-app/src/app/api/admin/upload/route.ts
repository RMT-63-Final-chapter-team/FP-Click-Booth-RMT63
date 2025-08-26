import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderName = formData.get("folderName") as string;

    if (!file) {
      NextResponse.json({
        msg: "File not found",
        statusCode: 404,
      });
    } else {
      // main cloudinary upload code
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const res = await new Promise<any>((res, rej) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folderName,
          },
          (error, result) => {
            if (error) rej(error);
            else res(result as any);
          }
        );
        uploadStream.end(buffer);
      });

      return NextResponse.json({
        msg: "File uploaded to cloudinary",
        res,
        statusCode: 200,
      });
    }
  } catch (error) {
    NextResponse.json({
      msg: "Error in fileupload route",
      statusCode: 500,
    });
  }
}
