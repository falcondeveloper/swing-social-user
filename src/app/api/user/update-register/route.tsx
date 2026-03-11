import { NextResponse } from "next/server";
import { Pool } from "pg";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const pool = new Pool({
  user: "clark",
  host: "199.244.49.83",
  database: "swingsocialdb",
  password: "Bmw740il#$",
  port: 5432,
});

const SALT_SIZE = 16;
const HASH_ALGORITHM_NAME = "sha256";
const VERSION = 1;

const hashPasswordWithSalt = (password: string, salt: Buffer): Buffer => {
  const hash = crypto.createHash(HASH_ALGORITHM_NAME);
  hash.update(salt);
  hash.update(Buffer.from(password, "utf8"));
  return hash.digest();
};

const generateSalt = (byteLength: number): Buffer => {
  return crypto.randomBytes(byteLength);
};

const hashPassword = (password: string): string => {
  const salt = generateSalt(SALT_SIZE);
  const hash = hashPasswordWithSalt(password, salt);
  const combined = Buffer.concat([Buffer.from([VERSION]), salt, hash]);
  return combined.toString("base64");
};

function extractName(userName: string) {
  const parts = userName.trim().split(" ");
  return {
    first_name: parts[0],
    last_name: parts[1] || "",
  };
}

export async function PUT(req: any) {
  try {
    const { profileIdToUse, email, city, password, phone, userName, user_name } =
      await req.json();

    if (!profileIdToUse) {
      return NextResponse.json(
        { message: "Invalid profileId" },
        { status: 400 },
      );
    }

    const { first_name, last_name } = extractName(userName);

    // 🔹 Hash password only if provided
    let hashedPassword: string | null = null;
    if (password && password.trim() !== "") {
      hashedPassword = hashPassword(password);
    }

    // 🔹 Get UserId safely (alias fixes casing issue)
    const profileRes = await pool.query(
      `SELECT "UserId" as "userId"
       FROM "UserProfiles"
       WHERE "Id" = $1`,
      [profileIdToUse],
    );

    if (profileRes.rowCount === 0) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 },
      );
    }

    const userId: string = profileRes.rows[0].userId;

    // 🔹 Update Users table
    if (hashedPassword) {
      await pool.query(
        `
        UPDATE "Users"
        SET "Email"=$1,
            "FirstName"=$2,
            "LastName"=$3,
            "Phone"=$4,
            "Password"=$5
        WHERE "Id"=$6
        `,
        [email, first_name, last_name, phone, hashedPassword, userId],
      );
    } else {
      await pool.query(
        `
        UPDATE "Users"
        SET "Email"=$1,
            "FirstName"=$2,
            "LastName"=$3,
            "Phone"=$4
        WHERE "Id"=$5
        `,
        [email, first_name, last_name, phone, userId],
      );
    }

    // 🔹 Update UserProfiles table
    await pool.query(
      `
      UPDATE "UserProfiles"
      SET "Username"=$1,
          "Location"=$2
      WHERE "Id"=$3
      `,
      [user_name, city, profileIdToUse],
    );

    return NextResponse.json({
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json(
      { message: "Update failed", error: error.message },
      { status: 500 },
    );
  }
}
