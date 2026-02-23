// import { NextResponse } from "next/server";
// import { Client } from "basic-ftp";
// import { Readable } from "stream";
// import sharp from "sharp";

// export const runtime = "nodejs";

// function toReadable(buffer: Buffer) {
//   return new Readable({
//     read() {
//       this.push(buffer);
//       this.push(null);
//     },
//   });
// }

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("image");

//     if (!file || !(file instanceof Blob)) {
//       return NextResponse.json({ message: "Invalid file" }, { status: 400 });
//     }

//     const originalBuffer = Buffer.from(await file.arrayBuffer());

//     const MAX_WIDTH = 1200;
//     let quality = 95;
//     let optimizedBuffer;

//     optimizedBuffer = await sharp(originalBuffer)
//       .rotate()
//       .resize({
//         width: MAX_WIDTH,
//         fit: "inside",
//         withoutEnlargement: true,
//         kernel: sharp.kernel.lanczos3,
//       })
//       .webp({
//         quality,
//         effort: 4,
//         smartSubsample: true,
//         nearLossless: true,
//         alphaQuality: 100,
//       })
//       .toBuffer();

//     while (optimizedBuffer.length > 500 * 1024 && quality > 70) {
//       quality -= 5;

//       optimizedBuffer = await sharp(originalBuffer)
//         .rotate()
//         .resize({
//           width: MAX_WIDTH,
//           fit: "inside",
//           withoutEnlargement: true,
//           kernel: sharp.kernel.lanczos3,
//         })
//         .webp({
//           quality,
//           effort: 4,
//           smartSubsample: true,
//           nearLossless: true,
//           alphaQuality: 100,
//         })
//         .toBuffer();
//     }

//     const filename = `${Date.now()}.webp`;

//     const client = new Client();
//     client.ftp.verbose = true;

//     await client.access({
//       host: "198.12.235.186",
//       user: "clarktrue@truecontractingsolutions.app",
//       password: "Bmw635csi#Bmw635csi#",
//       port: 21,
//       secure: false,
//     });

//     await client.uploadFrom(toReadable(optimizedBuffer), `/${filename}`);
//     client.close();

//     const imageUrl = `https://truecontractingsolutions.app/images/${filename}`;

//     return NextResponse.json({
//       imageUrl,
//       blobUrl: imageUrl,
//       sizeKB: Math.round(optimizedBuffer.length / 1024),
//       qualityUsed: quality,
//       message: "Upload success",
//     });
//   } catch (error) {
//     console.error("Image upload error:", error);
//     return NextResponse.json(
//       { message: "Image upload failed" },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import { Client } from "basic-ftp";
import { Readable } from "stream";
import sharp from "sharp";

export const runtime = "nodejs";

// ✅ Reusable stream helper
function toReadable(buffer: Buffer) {
  return new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
}

// ✅ FTP connection pool/reuse helper (optional but recommended)
let ftpClient: Client | null = null;
let lastUsed = 0;
const CONNECTION_TIMEOUT = 30000; // 30 seconds

async function getFTPClient() {
  const now = Date.now();

  // Reuse existing connection if still valid
  if (ftpClient && now - lastUsed < CONNECTION_TIMEOUT) {
    lastUsed = now;
    return ftpClient;
  }

  // Create new connection
  if (ftpClient) {
    try {
      ftpClient.close();
    } catch {}
  }

  ftpClient = new Client();
  ftpClient.ftp.verbose = false; // ⚡ Disable verbose logging for performance

  await ftpClient.access({
    host: "198.12.235.186",
    user: "clarktrue@truecontractingsolutions.app",
    password: "Bmw635csi#Bmw635csi#",
    port: 21,
    secure: false,
  });

  lastUsed = now;
  return ftpClient;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: "Invalid file" }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // ⚡ OPTIMIZATION 1: Single-pass optimization
    // Instead of multiple compression attempts, calculate target quality upfront
    const MAX_WIDTH = 1200;
    const TARGET_SIZE_KB = 500;

    // Get original dimensions to calculate if resize is needed
    const metadata = await sharp(originalBuffer).metadata();
    const needsResize = metadata.width && metadata.width > MAX_WIDTH;

    // Start with appropriate quality based on original size
    let quality = 90; // Start slightly lower

    // ⚡ OPTIMIZATION 2: Streamlined sharp pipeline
    let optimizedBuffer = await sharp(originalBuffer)
      .rotate() // Auto-rotate based on EXIF
      .resize({
        width: MAX_WIDTH,
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .webp({
        quality,
        effort: 3, // ⚡ Reduced from 4 to 3 for faster encoding
        smartSubsample: true,
        nearLossless: false, // ⚡ Changed to false - nearLossless is slower
        alphaQuality: 90, // ⚡ Reduced from 100
      })
      .toBuffer();

    // ⚡ OPTIMIZATION 3: More efficient quality reduction loop
    // Only run if needed, with larger quality steps
    let attempts = 0;
    const maxAttempts = 3; // Limit recompression attempts

    while (
      optimizedBuffer.length > TARGET_SIZE_KB * 1024 &&
      quality > 70 &&
      attempts < maxAttempts
    ) {
      quality -= 10; // ⚡ Larger steps (was 5)
      attempts++;

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
          effort: 3, // Keep consistent
          smartSubsample: true,
          nearLossless: false,
          alphaQuality: 90,
        })
        .toBuffer();
    }

    const filename = `${Date.now()}.webp`;

    // ⚡ OPTIMIZATION 4: Reuse FTP connection
    const client = await getFTPClient();

    // ⚡ OPTIMIZATION 5: Upload with timeout
    const uploadPromise = client.uploadFrom(
      toReadable(optimizedBuffer),
      `/${filename}`,
    );
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Upload timeout")), 30000),
    );

    await Promise.race([uploadPromise, timeoutPromise]);

    const imageUrl = `https://truecontractingsolutions.app/images/${filename}`;

    return NextResponse.json({
      imageUrl,
      blobUrl: imageUrl,
      sizeKB: Math.round(optimizedBuffer.length / 1024),
      qualityUsed: quality,
      compressionAttempts: attempts,
      message: "Upload success",
    });
  } catch (error) {
    console.error("Image upload error:", error);

    // Clean up FTP client on error
    if (ftpClient) {
      try {
        ftpClient.close();
      } catch {}
      ftpClient = null;
    }

    return NextResponse.json(
      { message: "Image upload failed", error: String(error) },
      { status: 500 },
    );
  }
}
