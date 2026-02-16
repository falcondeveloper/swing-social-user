// import { NextResponse } from "next/server";
// import {
//   RekognitionClient,
//   CompareFacesCommand,
//   DetectFacesCommand,
// } from "@aws-sdk/client-rekognition";

// const rekognitionClient = new RekognitionClient({
//   region: process.env.AWS_REGION!,
// });

// const BUCKET = process.env.S3_BUCKET_NAME!;

// export async function POST(req: Request) {
//   console.log("🔥 VERIFY-SELFIE API HIT");
//   try {
//     const body = await req.json();
//     const { avatarKey, selfieKey, userId } = body;

//     if (!avatarKey || !selfieKey) {
//       return NextResponse.json(
//         {
//           ok: false,
//           reason: "MISSING_S3_KEYS",
//           message: "avatarKey and selfieKey are required",
//         },
//         { status: 400 },
//       );
//     }

//     /* ----------------------------------
//        1️⃣ DETECT FACE ON SELFIE
//     ---------------------------------- */

//     const detectResponse = await rekognitionClient.send(
//       new DetectFacesCommand({
//         Image: {
//           S3Object: {
//             Bucket: BUCKET,
//             Name: selfieKey,
//           },
//         },
//         Attributes: ["ALL"],
//       }),
//     );

//     const faces = detectResponse.FaceDetails ?? [];

//     if (faces.length === 0)
//       return NextResponse.json({
//         ok: false,
//         message: "No face detected",
//       });

//     if (faces.length > 2)
//       return NextResponse.json({
//         ok: false,
//         message: "Too many faces detected (max 2 allowed)",
//       });

//     const face = faces[0];

//     if (face.EyesOpen?.Value === false)
//       return NextResponse.json({
//         ok: false,
//         message: "Eyes are closed in selfie",
//       });

//     if (face.Sunglasses?.Value)
//       return NextResponse.json({
//         ok: false,
//         message: "Sunglasses detected",
//       });

//     if (face.Confidence && face.Confidence < 90)
//       return NextResponse.json({
//         ok: false,
//         message: `Low face confidence (${face.Confidence.toFixed(1)}%)`,
//       });

//     /* ----------------------------------
//        2️⃣ COMPARE FACES (Avatar vs Selfie)
//     ---------------------------------- */

//     const compare = await rekognitionClient.send(
//       new CompareFacesCommand({
//         SourceImage: {
//           S3Object: {
//             Bucket: BUCKET,
//             Name: avatarKey,
//           },
//         },
//         TargetImage: {
//           S3Object: {
//             Bucket: BUCKET,
//             Name: selfieKey,
//           },
//         },
//         SimilarityThreshold: 70,
//       }),
//     );

//     const match = compare.FaceMatches?.[0];

//     if (!match)
//       return NextResponse.json({
//         ok: false,
//         message: "Face does not match avatar",
//         similarity: 0,
//       });

//     /* ----------------------------------
//        3️⃣ SUCCESS
//     ---------------------------------- */

//     return NextResponse.json({
//       ok: true,
//       match: true,
//       similarity: match.Similarity,
//       confidence: match.Face?.Confidence,
//       userId,
//     });
//   } catch (err: any) {
//     console.error("AWS ERROR:", err);

//     return NextResponse.json(
//       {
//         ok: false,
//         message: err.name || err.message || "AWS Rekognition failed",
//         aws: err,
//       },
//       { status: 500 },
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import {
//   RekognitionClient,
//   CompareFacesCommand,
//   DetectFacesCommand,
// } from "@aws-sdk/client-rekognition";

// const rekognitionClient = new RekognitionClient({
//   region: process.env.AWS_REGION!,
// });

// const BUCKET = process.env.S3_BUCKET_NAME!;

// export async function POST(req: Request) {

//   try {
//     const body = await req.json();
//     const { avatarKey, selfieKey, userId } = body;

//     if (!avatarKey || !selfieKey) {
//       return NextResponse.json(
//         {
//           ok: false,
//           reason: "MISSING_S3_KEYS",
//           message: "avatarKey and selfieKey are required",
//         },
//         { status: 400 },
//       );
//     }

//     const detectResponse = await rekognitionClient.send(
//       new DetectFacesCommand({
//         Image: {
//           S3Object: {
//             Bucket: BUCKET,
//             Name: selfieKey,
//           },
//         },
//         Attributes: ["ALL"],
//       }),
//     );

//     const faces = detectResponse.FaceDetails ?? [];

//     if (faces.length === 0) {
//       return NextResponse.json({
//         ok: false,
//         message: "No face detected",
//       });
//     }

//     if (faces.length > 2) {
//       return NextResponse.json({
//         ok: false,
//         message: "Too many faces detected (max 2 allowed)",
//       });
//     }

//     const hasValidFace = faces.some(
//       (face) =>
//         face.Confidence &&
//         face.Confidence >= 85 &&
//         face.EyesOpen?.Value !== false &&
//         !face.Sunglasses?.Value,
//     );

//     if (!hasValidFace) {
//       return NextResponse.json({
//         ok: false,
//         message: "No valid face detected for verification",
//       });
//     }

//     const compare = await rekognitionClient.send(
//       new CompareFacesCommand({
//         SourceImage: {
//           S3Object: {
//             Bucket: BUCKET,
//             Name: avatarKey,
//           },
//         },
//         TargetImage: {
//           S3Object: {
//             Bucket: BUCKET,
//             Name: selfieKey,
//           },
//         },
//         SimilarityThreshold: 70,
//       }),
//     );

//     const matches = compare.FaceMatches ?? [];

//     if (matches.length === 0) {
//       return NextResponse.json({
//         ok: false,
//         message: "No matching face found",
//         similarity: 0,
//       });
//     }

//     const bestMatch = matches.reduce((prev, curr) =>
//       (curr.Similarity ?? 0) > (prev.Similarity ?? 0) ? curr : prev,
//     );

//     return NextResponse.json({
//       ok: true,
//       match: true,
//       verifiedBy: "ONE_FACE_MATCH",
//       similarity: bestMatch.Similarity,
//       confidence: bestMatch.Face?.Confidence,
//       userId,
//     });
//   } catch (err: any) {
//     console.error("AWS ERROR:", err);

//     return NextResponse.json(
//       {
//         ok: false,
//         message: err.name || err.message || "AWS Rekognition failed",
//       },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import {
  RekognitionClient,
  CompareFacesCommand,
  DetectFacesCommand,
} from "@aws-sdk/client-rekognition";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION!,
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
});

const BUCKET = process.env.S3_BUCKET_NAME!;

async function deleteFromS3(key: string) {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
  } catch (err) {
    console.error("Failed to delete S3 object:", key, err);
  }
}

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

    // const compare = await rekognitionClient.send(
    //   new CompareFacesCommand({
    //     SourceImage: {
    //       S3Object: {
    //         Bucket: BUCKET,
    //         Name: avatarKey,
    //       },
    //     },
    //     TargetImage: {
    //       S3Object: {
    //         Bucket: BUCKET,
    //         Name: selfieKey,
    //       },
    //     },
    //     SimilarityThreshold: 65,
    //     QualityFilter: "AUTO",
    //   }),
    // );

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

    // await Promise.all([deleteFromS3(avatarKey), deleteFromS3(selfieKey)]);

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
