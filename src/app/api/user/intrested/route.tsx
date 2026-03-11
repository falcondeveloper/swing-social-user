import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

// PostgreSQL pool connection setup
const pool = new Pool({
  user: "clark",
  host: "199.244.49.83",
  database: "swingsocialdb",
  password: "Bmw740il#$",
  port: 5432,
});

function calculateDate(age: number): string {
  const currentDate = new Date();
  const year = currentDate.getFullYear() - age;
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const formattedDate = `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year}`;
  return formattedDate;
}

export async function POST(req: any) {
  const { pid, accounttype, age, orientation1 } = await req.json();

  console.log("==========>");
  console.log(age);

  const birthdayFormat = calculateDate(age);

  try {
    const result = await pool.query(
      "SELECT * FROM public.web_update_accounttypetest($1, $2, $3, $4, $5)",
      [pid, accounttype, birthdayFormat, age, orientation1],
    );
    ``;

    console.log(result);

    return NextResponse.json({
      message: "Profile created successfully",
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
