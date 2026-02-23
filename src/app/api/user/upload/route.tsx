import { NextResponse } from "next/server";
import { Client } from "basic-ftp";
import { Readable } from "stream";
import sharp from "sharp";

export const runtime = "nodejs";

function toReadable(buffer: Buffer) {
  return new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: "Invalid file" }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    const MAX_WIDTH = 1200;
    let quality = 95;
    let optimizedBuffer;

    optimizedBuffer = await sharp(originalBuffer)
      .rotate()
      .resize({
        width: MAX_WIDTH,
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .webp({
        quality,
        effort: 4,
        smartSubsample: true,
        nearLossless: true,
        alphaQuality: 100,
      })
      .toBuffer();

    while (optimizedBuffer.length > 500 * 1024 && quality > 70) {
      quality -= 5;

      optimizedBuffer = await sharp(originalBuffer)
        .rotate()
        .resize({
          width: MAX_WIDTH,
          fit: "inside",
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3,
        })
        .webp({
          quality,
          effort: 4,
          smartSubsample: true,
          nearLossless: true,
          alphaQuality: 100,
        })
        .toBuffer();
    }

    const filename = `${Date.now()}.webp`;

    const client = new Client();
    client.ftp.verbose = true;

    await client.access({
      host: "198.12.235.186",
      user: "clarktrue@truecontractingsolutions.app",
      password: "Bmw635csi#Bmw635csi#",
      port: 21,
      secure: false,
    });

    await client.uploadFrom(toReadable(optimizedBuffer), `/${filename}`);
    client.close();

    const imageUrl = `https://truecontractingsolutions.app/images/${filename}`;

    return NextResponse.json({
      imageUrl,
      blobUrl: imageUrl,
      sizeKB: Math.round(optimizedBuffer.length / 1024),
      qualityUsed: quality,
      message: "Upload success",
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { message: "Image upload failed" },
      { status: 500 },
    );
  }
}
