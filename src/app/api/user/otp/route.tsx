import { NextResponse } from "next/server";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import { Pool } from "pg";

const pool = new Pool({
  user: "clark",
  host: "199.244.49.83",
  database: "swingsocialdb",
  password: "Bmw740il#$",
  port: 5432,
});

async function sendErrorEmail(errorMessage: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM "Configuration" WHERE "ConfigName" = $1',
      ["EmailApi"],
    );

    const mailgunKey = result.rows[0]?.ConfigValue;

    if (!mailgunKey) {
      console.error("Mailgun key not found in DB");
      return;
    }

    const mailgun = new Mailgun(FormData);

    const mg = mailgun.client({
      username: "api",
      key: mailgunKey,
    });

    const recipients = [
      // "falconsoftmobile@gmail.com",
      "baldhavansh2505@gmail.com",
      // "latuttle22@gmail.com",
    ];

    await mg.messages.create("swingsocial.co", {
      from: "info@swingsocial.co",
      to: recipients,
      subject: "🚨 SMS OUT OF FUNDS!!!",
      text: `
SMS API ERROR DETECTED

${errorMessage}

MessageCentral Console:
https://console.messagecentral.com/

Credentials:
Email: clark@eldoramountainsoftware.ai
Password: Bmw850csi#

Time: ${new Date().toISOString()}
      `,
    });

    console.log("Error email sent successfully");
  } catch (err) {
    console.error("Failed to send error email:", err);
  }
}

export async function POST(req: Request) {
  try {
    const { phone, countryCode } = await req.json();

    const url = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=${countryCode}&customerId=C-1D4F8A32EDDC472&flowType=SMS&mobileNumber=${phone}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        authToken:
          "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTFENEY4QTMyRUREQzQ3MiIsImlhdCI6MTc1NzYxMTQzNSwiZXhwIjoxOTE1MjkxNDM1fQ.NLmhw0JVFonwwSWBrQj4Sg4m1V1xhGjkZEFeru8HNbBaIbnzcwMpjaxnldccWHqQu4xQ1p3lxhOe07kB2cgBrQ",
      },
    });

    const data = await response.json();

    if (!response.ok || data?.error || data?.status === "FAILED") {
      throw new Error(
        `MessageCentral SEND OTP Error
        Status Code: ${response.status}
Phone: ${phone}
CountryCode: ${countryCode}

Response:
${JSON.stringify(data, null, 2)}`,
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    await sendErrorEmail(error?.message || "Unknown SEND OTP error");
    return NextResponse.json(
      { message: "Failed to send OTP" },
      { status: 400 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const countryCode = searchParams.get("countryCode");
    const mobileNumber = searchParams.get("mobileNumber");
    const verificationId = searchParams.get("verificationId");
    const code = searchParams.get("code");

    if (!countryCode || !mobileNumber || !verificationId || !code) {
      return NextResponse.json(
        { message: "Missing required query params" },
        { status: 400 },
      );
    }

    const url = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=${countryCode}&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=C-1D4F8A32EDDC472&code=${code}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        authToken:
          "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTFENEY4QTMyRUREQzQ3MiIsImlhdCI6MTc1NzYxMTQzNSwiZXhwIjoxOTE1MjkxNDM1fQ.NLmhw0JVFonwwSWBrQj4Sg4m1V1xhGjkZEFeru8HNbBaIbnzcwMpjaxnldccWHqQu4xQ1p3lxhOe07kB2cgBrQ",
      },
    });

    const data = await response.json();

    if (!response.ok || data?.error || data?.status === "FAILED") {
      throw new Error(
        `MessageCentral VERIFY OTP Error

Status Code: ${response.status}
Mobile: ${mobileNumber}
VerificationId: ${verificationId}

Response:
${JSON.stringify(data, null, 2)}`,
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    await sendErrorEmail(error?.message || "Unknown VERIFY OTP error");
    return NextResponse.json(
      { message: "Failed to verify OTP" },
      { status: 400 },
    );
  }
}
