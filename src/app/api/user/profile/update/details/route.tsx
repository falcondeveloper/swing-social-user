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

export async function POST(req: any) {
  const {
    ProfileId,
    Username,
    Age,
    Gender,
    Location,
    Tagline,
    About,
    BodyType,
    HairColor,
    EyeColor,
    ProfileBanner,
    SwingStyle,
    Avatar,
    AccountType,
    Orientation,
    ProfileImages,
    PrivateImages,
    PartnerAge,
    PartnerGender,
    PartnerBodyType,
    PartnerHairColor,
    PartnerEyeColor,
    PartnerSexualOrientation,
  } = await req.json();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  const birthYear = currentYear - Age;
  const birthDay = new Date(birthYear, currentMonth, currentDate);

  const pBirthYear = currentYear - PartnerAge;
  const pBirthDay = new Date(pBirthYear, currentMonth, currentDate);

  const swingStyleFormatted = Object.keys(SwingStyle)
    .filter((key) => SwingStyle[key])
    .map((key) => `'${key}'`)
    .join(",");

  try {
    const updateUserNameQuery =
      "SELECT * FROM public.web_update_username($1, $2)";
    const updateDetailQuery =
      "SELECT * FROM public.edit_profile_details1($1, $2, $3, $4, $5 ,$6, $7, $8, $9, $10, $11)";
    const updateTaglineQuery =
      "SELECT * FROM public.edit_profile_tagline($1, $2)";
    const updateAboutQuery = "SELECT * FROM public.edit_profile_about($1, $2)";
    const updateAvatarQuery =
      "SELECT * FROM public.edit_profile_avatar($1, $2)";
    const updateBannerQuery =
      "SELECT * FROM public.edit_profile_banner($1, $2)";
    const updateSwingStyleQuery =
      "SELECT * FROM public.edit_profile_swingstyle($1, $2)";
    const updatePartnerQuery =
      "SELECT * FROM public.edit_profile_details2($1, $2, $3, $4, $5 ,$6, $7, $8, $9)";

    const updateUserNameResult = await pool.query(updateUserNameQuery, [
      ProfileId,
      Username,
    ]);

    const updateDetailResult = await pool.query(updateDetailQuery, [
      ProfileId,
      Gender,
      Orientation,
      birthDay,
      BodyType,
      "",
      "",
      HairColor,
      EyeColor,
      AccountType,
      Location,
    ]);

    const updatePartnerResult = await pool.query(updatePartnerQuery, [
      ProfileId,
      PartnerGender,
      PartnerSexualOrientation,
      pBirthDay,
      PartnerBodyType,
      "",
      "",
      PartnerHairColor,
      PartnerEyeColor,
    ]);

    const updateSwingStyleResult = await pool.query(updateSwingStyleQuery, [
      ProfileId,
      swingStyleFormatted,
    ]);

    const updateTaglineResult = await pool.query(updateTaglineQuery, [
      ProfileId,
      Tagline,
    ]);

    const updateAboutResult = await pool.query(updateAboutQuery, [
      ProfileId,
      About,
    ]);

    if (Avatar) {
      const updateAvatarResult = await pool.query(updateAvatarQuery, [
        ProfileId,
        Avatar,
      ]);
    }

    if (ProfileBanner) {
      const updateBannerResult = await pool.query(updateBannerQuery, [
        ProfileId,
        ProfileBanner,
      ]);
    }

    return NextResponse.json({
      message: "Your profile is updated successfully!",
      status: 200,
    });
  } catch (error: any) {
    console.error("PROFILE UPDATE ERROR:", error);

    return NextResponse.json({
      message: "Relationship Category Update failed",
      error: error.message,
      detail: error.detail,
      hint: error.hint,
      code: error.code,
      status: 400,
    });
  }
}
