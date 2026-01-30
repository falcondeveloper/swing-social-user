import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: "clark",
  host: "199.244.49.83",
  database: "swingsocialdb",
  password: "Bmw740il#$",
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function POST(req: Request) {
  let client;
  try {
    const { user_id } = await req.json();
    const result = await pool.query(
      `SELECT public.get_user_avatar($1::uuid) AS avatar;`,
      [user_id],
    );

    const avatar = result.rows?.[0]?.avatar ?? null;

    return NextResponse.json({ success: true, avatar }, { status: 200 });
  } catch (err) {
    console.error("get_user_avatar error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
