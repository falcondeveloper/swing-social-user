import { NextResponse } from "next/server";
import { Pool } from "pg";
export const dynamic = "force-dynamic";

const pool = new Pool({
  user: "clark",
  host: "199.244.49.83",
  database: "swingsocialdb",
  password: "Bmw740il#$",
  port: 5432,
});

export async function POST(req: any) {
  const { id, status } = await req.json();

  try {
    const result = await pool.query(
      "SELECT * FROM public.web_update_emailstatus($1, $2)",
      [id, status],
    );

    return NextResponse.json({
      message: "Mobile number verified successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "User Name Update failed",
      },
      { status: 400 },
    );
  }
}
