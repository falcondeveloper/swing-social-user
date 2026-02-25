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
