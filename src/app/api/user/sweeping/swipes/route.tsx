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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    let query = `SELECT * FROM public.get_swipescreenhome($1)`;
    const swipeResults = await pool.query(query, [userId]);

    console.log("LocationMessage:", swipeResults?.rows?.[0]?.LocationMessage);



    if (swipeResults?.rows?.length === 0) {
      return NextResponse.json({
        swipes: [],
        message: "No profiles found",
      });
    }

    return NextResponse.json({
      swipes: swipeResults?.rows,
    });
  } catch (error: any) {
    console.error("=== GET SWIPE SCREEN HOME ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error detail:", error.detail);
    console.error("Error hint:", error.hint);
    console.error("Error position:", error.position);
    console.error("Error where:", error.where);
    console.error("Error schema:", error.schema);
    console.error("Error table:", error.table);
    console.error("Error column:", error.column);
    console.error("Error dataType:", error.dataType);
    console.error("Error constraint:", error.constraint);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    console.error("====================================");

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message,
        errorCode: error.code,
        errorDetail: error.detail,
        errorHint: error.hint,
      },
      { status: 500 },
    );
  }
}
