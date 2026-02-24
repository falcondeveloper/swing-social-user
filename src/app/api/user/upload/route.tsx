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

// let cachedClient: Client | null = null;
// let clientTimeout: NodeJS.Timeout | null = null;

// async function getFTPClient() {
//   if (cachedClient && !cachedClient.closed) {
//     if (clientTimeout) clearTimeout(clientTimeout);
//     clientTimeout = setTimeout(() => {
//       cachedClient?.close();
//       cachedClient = null;
//     }, 60000);
//     return cachedClient;
//   }

//   const client = new Client();
//   await client.access({
//     host: "198.12.235.186",
//     user: "clarktrue@truecontractingsolutions.app",
//     password: "Bmw635csi#Bmw635csi#",
//     port: 21,
//     secure: false,
//   });

//   cachedClient = client;
//   clientTimeout = setTimeout(() => {
//     client.close();
//     cachedClient = null;
//   }, 60000);

//   return client;
// }

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("image");

//     if (!file || !(file instanceof Blob)) {
//       return NextResponse.json({ message: "Invalid file" }, { status: 400 });
//     }

//     const originalBuffer = Buffer.from(await file.arrayBuffer());

//     const ftpPromise = getFTPClient();

//     let optimizedBuffer = originalBuffer;
//     let qualityUsed = 100;

//     const isAlreadyOptimized =
//       file.type === "image/webp" && originalBuffer.length < 300 * 1024;

//     if (!isAlreadyOptimized) {
//       optimizedBuffer = await sharp(originalBuffer)
//         .rotate()
//         .resize({
//           width: 1000,
//           fit: "inside",
//           withoutEnlargement: true,
//         })
//         .webp({
//           quality: 75,
//           effort: 0,
//         })
//         .toBuffer();
//       qualityUsed = 75;
//     }

//     const filename = `${Date.now()}.webp`;
//     const client = await ftpPromise;

//     await client.uploadFrom(toReadable(optimizedBuffer), `/${filename}`);

//     const imageUrl = `https://truecontractingsolutions.app/images/${filename}`;

//     return NextResponse.json({
//       imageUrl,
//       blobUrl: imageUrl,
//       sizeKB: Math.round(optimizedBuffer.length / 1024),
//       qualityUsed,
//       message: "Upload success",
//       fastPass: isAlreadyOptimized,
//     });
//   } catch (error) {
//     console.error("Image upload error:", error);
//     if (cachedClient) {
//       cachedClient.close();
//       cachedClient = null;
//     }
//     return NextResponse.json(
//       { message: "Image upload failed" },
//       { status: 500 },
//     );
//   }
// }

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

// let cachedClient: Client | null = null;
// let clientTimeout: NodeJS.Timeout | null = null;

// async function getFTPClient() {
//   if (cachedClient && !cachedClient.closed) {
//     if (clientTimeout) clearTimeout(clientTimeout);
//     clientTimeout = setTimeout(() => {
//       cachedClient?.close();
//       cachedClient = null;
//     }, 60000);
//     return cachedClient;
//   }

//   const client = new Client();
//   await client.access({
//     host: "198.12.235.186",
//     user: "clarktrue@truecontractingsolutions.app",
//     password: "Bmw635csi#Bmw635csi#",
//     port: 21,
//     secure: false,
//   });

//   cachedClient = client;
//   clientTimeout = setTimeout(() => {
//     client.close();
//     cachedClient = null;
//   }, 60000);

//   return client;
// }

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("image");

//     if (!file || !(file instanceof Blob)) {
//       return NextResponse.json({ message: "Invalid file" }, { status: 400 });
//     }

//     const originalBuffer = Buffer.from(await file.arrayBuffer());

//     const ftpPromise = getFTPClient();

//     let optimizedBuffer = originalBuffer;
//     let qualityUsed = 100;

//     const isAlreadyOptimized =
//       file.type === "image/webp" && originalBuffer.length < 300 * 1024;

//     if (!isAlreadyOptimized) {
//       optimizedBuffer = await sharp(originalBuffer)
//         .rotate()
//         .resize({
//           width: 1000,
//           fit: "inside",
//           withoutEnlargement: true,
//         })
//         .webp({
//           quality: 75,
//           effort: 0,
//         })
//         .toBuffer();
//       qualityUsed = 75;
//     }

//     const filename = `${Date.now()}.webp`;
//     const client = await ftpPromise;

//     await client.uploadFrom(toReadable(optimizedBuffer), `/${filename}`);

//     const imageUrl = `https://truecontractingsolutions.app/images/${filename}`;

//     return NextResponse.json({
//       imageUrl,
//       blobUrl: imageUrl,
//       sizeKB: Math.round(optimizedBuffer.length / 1024),
//       qualityUsed,
//       message: "Upload success",
//       fastPass: isAlreadyOptimized,
//     });
//   } catch (error) {
//     console.error("Image upload error:", error);
//     if (cachedClient) {
//       cachedClient.close();
//       cachedClient = null;
//     }
//     return NextResponse.json(
//       { message: "Image upload failed" },
//       { status: 500 },
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import { Client } from "basic-ftp";
// import { Readable } from "stream";

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

//     const buffer = Buffer.from(await (file as Blob).arrayBuffer());
//     const filename = `${Date.now()}.jpg`;

//     const client = new Client();
//     client.ftp.verbose = true;

//     await client.access({
//       host: "198.12.235.186",
//       user: "clarktrue@truecontractingsolutions.app",
//       password: "Bmw635csi#Bmw635csi#",
//       port: 21,
//       secure: false,
//     });

//     const remoteDir = "/";
//     await client.ensureDir(remoteDir);
//     await client.uploadFrom(toReadable(buffer), `/${filename}`);
//     client.close();

//     const imageUrl = `https://truecontractingsolutions.app/images/${filename}`;

//     return NextResponse.json({
//       imageUrl,
//       blobUrl: imageUrl,
//       message: "Upload success",
//     });
//   } catch (error) {
//     console.error("FTP Upload error:", error);
//     return NextResponse.json(
//       { message: "Image upload via FTP failed", error },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import { Client } from "basic-ftp";
import { Readable } from "stream";

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

    const buffer = Buffer.from(await (file as Blob).arrayBuffer());
    const filename = `${Date.now()}.jpg`;

    const client = new Client();
    client.ftp.verbose = true;

    await client.access({
      host: "198.12.235.186",
      user: "clarktrue@truecontractingsolutions.app",
      password: "Bmw635csi#Bmw635csi#",
      port: 21,
      secure: false,
    });

    const remoteDir = "/";
    await client.ensureDir(remoteDir);
    await client.uploadFrom(toReadable(buffer), `/${filename}`);
    client.close();

    const imageUrl = `https://truecontractingsolutions.app/images/${filename}`;

    return NextResponse.json({
      imageUrl,
      blobUrl: imageUrl,
      message: "Upload success",
    });
  } catch (error) {
    console.error("FTP Upload error:", error);
    return NextResponse.json(
      { message: "Image upload via FTP failed", error },
      { status: 500 },
    );
  }
}
