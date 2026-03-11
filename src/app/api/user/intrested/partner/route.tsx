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

function calculateDate(age: number): string {
  const currentDate = new Date();
  const year = currentDate.getFullYear() - age;
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const formattedDate = `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year}`;
  return formattedDate;
}

export async function POST(req: any) {
  const {
    pid,
    accounttype,
    gender1,
    age,
    orientation1,
    partnerbirthday,
    partnergender,
    partnerorientation,
  } = await req.json();

  const partnerbirthdayreformat = calculateDate(partnerbirthday);
  const mybirthdayreformat = calculateDate(age);

  try {
    const result = await pool.query(
      "SELECT * FROM public.web_update_gender_partnertest($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [
        pid,
        accounttype,
        gender1,
        orientation1,
        mybirthdayreformat,
        partnerbirthdayreformat,
        partnergender,
        partnerorientation,
        age,
        partnerbirthday,
      ],
    );

    return NextResponse.json({
      message: "Profile updated successfully",
      data: result.rows,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        message: "Profile update failed",
        error: error.message,
      },
      { status: 400 },
    );
  }
}
