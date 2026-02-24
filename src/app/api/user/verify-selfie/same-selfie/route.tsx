import { NextResponse } from "next/server";
import {
  RekognitionClient,
  CompareFacesCommand,
  DetectFacesCommand,
} from "@aws-sdk/client-rekognition";

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION!,
});

const BUCKET = process.env.S3_BUCKET_NAME!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { avatarKey, selfieKey, userId } = body;

    if (!avatarKey || !selfieKey) {
      return NextResponse.json(
        {
          ok: false,
          match: false,
          reason: "MISSING_S3_KEYS",
          message: "avatarKey and selfieKey are required",
        },
        { status: 400 },
      );
    }

    const selfieDetect = await rekognitionClient.send(
      new DetectFacesCommand({
        Image: {
          S3Object: {
            Bucket: BUCKET,
            Name: selfieKey,
          },
        },
        Attributes: ["ALL"],
      }),
    );

    const selfieFaces = selfieDetect.FaceDetails ?? [];

    if (selfieFaces.length === 0 || selfieFaces.length > 2) {
      return NextResponse.json(
        {
          ok: false,
          match: false,
          reason: "INVALID_SELFIE",
          message: "Selfie must contain 1 or 2 faces only",
        },
        { status: 400 },
      );
    }

    const validSelfieFaces = selfieFaces.filter(
      (face) =>
        face.Confidence &&
        face.Confidence >= 85 &&
        face.EyesOpen?.Value !== false &&
        face.Sunglasses?.Value !== true,
    );

    if (validSelfieFaces.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          match: false,
          reason: "BAD_SELFIE_QUALITY",
          message:
            "No clear face found in selfie (eyes closed, sunglasses, or low confidence)",
        },
        { status: 400 },
      );
    }

    const avatarDetect = await rekognitionClient.send(
      new DetectFacesCommand({
        Image: {
          S3Object: {
            Bucket: BUCKET,
            Name: avatarKey,
          },
        },
      }),
    );

    const avatarFaces = avatarDetect.FaceDetails ?? [];

    if (avatarFaces.length === 0 || avatarFaces.length > 2) {
      return NextResponse.json(
        {
          ok: false,
          match: false,
          reason: "INVALID_PROFILE_PHOTO",
          message: "Profile photo must contain 1 or 2 faces only",
        },
        { status: 400 },
      );
    }

    const compare = await rekognitionClient.send(
      new CompareFacesCommand({
        // ✅ Selfie has only ONE face → perfect Source
        SourceImage: {
          S3Object: {
            Bucket: BUCKET,
            Name: selfieKey,
          },
        },

        // ✅ Avatar may have 1 or 2 faces → Rekognition checks ALL
        TargetImage: {
          S3Object: {
            Bucket: BUCKET,
            Name: avatarKey,
          },
        },

        SimilarityThreshold: 65,
        QualityFilter: "AUTO",
      }),
    );

    const matches = compare.FaceMatches ?? [];

    if (!matches.length) {
      return NextResponse.json({
        ok: true,
        match: false,
        verified: false,
        message: "No face in the selfie matches any face in the profile photo",
        similarity: 0,
      });
    }

    const bestMatch = matches.reduce((prev, curr) =>
      (curr.Similarity ?? 0) > (prev.Similarity ?? 0) ? curr : prev,
    );

    return NextResponse.json({
      ok: true,
      match: true,
      verified: true,
      verifiedBy: "ANY_FACE_MATCH",
      similarity: bestMatch.Similarity,
      confidence: bestMatch.Face?.Confidence,
      userId,
    });
  } catch (err: any) {
    console.error("AWS ERROR:", err);

    return NextResponse.json(
      {
        ok: false,
        match: false,
        message: err.message || "AWS Rekognition failed",
      },
      { status: 500 },
    );
  }
}
