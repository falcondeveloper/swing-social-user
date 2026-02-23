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

// Keep a global connection cache for consecutive uploads (like avatar then banner)
let cachedClient: Client | null = null;
let clientTimeout: NodeJS.Timeout | null = null;

async function getFTPClient() {
  if (cachedClient && !cachedClient.closed) {
    // Reset the auto-close timeout
    if (clientTimeout) clearTimeout(clientTimeout);
    clientTimeout = setTimeout(() => {
      cachedClient?.close();
      cachedClient = null;
    }, 60000); // Keep alive for 60s
    return cachedClient;
  }

  const client = new Client();
  // client.ftp.verbose = true;
  await client.access({
    host: "198.12.235.186",
    user: "clarktrue@truecontractingsolutions.app",
    password: "Bmw635csi#Bmw635csi#",
    port: 21,
    secure: false,
  });

  cachedClient = client;
  clientTimeout = setTimeout(() => {
    client.close();
    cachedClient = null;
  }, 60000);

  return client;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: "Invalid file" }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // Start FTP connection in parallel with image check
    const ftpPromise = getFTPClient();

    let optimizedBuffer = originalBuffer;
    let qualityUsed = 100;

    // FAST-PASS: If the client already sent a reasonable-sized WebP, don't re-process it!
    // This saves several seconds of CPU time.
    const isAlreadyOptimized = file.type === "image/webp" && originalBuffer.length < 300 * 1024;

    if (!isAlreadyOptimized) {
      // Only process if it's too large or wrong format
      optimizedBuffer = await sharp(originalBuffer)
        .rotate()
        .resize({
          width: 1000, // Reduced from 1200 for faster transfer
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 75, // Good balance
          effort: 0, // Fastest compression
        })
        .toBuffer();
      qualityUsed = 75;
    }

    const filename = `${Date.now()}.webp`;
    const client = await ftpPromise;

    // Use a stream if possible for large buffers, but for small ones uploadFrom is fine
    await client.uploadFrom(toReadable(optimizedBuffer), `/${filename}`);

    const imageUrl = `https://truecontractingsolutions.app/images/${filename}`;

    return NextResponse.json({
      imageUrl,
      blobUrl: imageUrl,
      sizeKB: Math.round(optimizedBuffer.length / 1024),
      qualityUsed,
      message: "Upload success",
      fastPass: isAlreadyOptimized
    });
  } catch (error) {
    console.error("Image upload error:", error);
    if (cachedClient) {
      cachedClient.close();
      cachedClient = null;
    }
    return NextResponse.json(
      { message: "Image upload failed" },
      { status: 500 },
    );
  }
}
