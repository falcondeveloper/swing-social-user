// import { NextResponse } from "next/server";
// import { Pool } from "pg";
// export const dynamic = "force-dynamic";

// const pool = new Pool({
//   user: "clark",
//   host: "199.244.49.83",
//   database: "swingsocialdb",
//   password: "Bmw740il#$",
//   port: 5432,
// });

// export async function POST(req: any) {
//   const { loginId, payload } = await req.json();

//   // Swiping visibility
//   const qCouples = payload.swiping.couples === true ? 1 : 0;
//   const qSingleMales = payload.swiping.singleMale === true ? 1 : 0;
//   const qSingleFemales = payload.swiping.singleFemale === true ? 1 : 0;

//   // Blocking
//   const qblockCouples = payload.block.couples === true ? 1 : 0;
//   const qblocksinglemales = payload.block.singleMale === true ? 1 : 0;
//   const qblocksinglefemales = payload.block.singleFemale === true ? 1 : 0;

//   // Travel Mode
//   const qTravelMode = payload.travelMode === true ? 1 : 0;
//   const qCity = payload.travelLocation;

//   // Distance
//   const qdinstance = payload?.maxDistance;
//   const quseDistance = payload.distanceChecked === true ? 1 : 0;
//   const qcityState = payload.city;

//   console.log("qTravelMode", qTravelMode);
//   console.log("qCity", qCity);

//   try {
//     const result = await pool.query(
//       "SELECT * FROM public.insert_preference($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)",
//       [
//         loginId,
//         qCouples,
//         qSingleMales,
//         qSingleFemales,
//         0,
//         qblockCouples,
//         qblocksinglemales,
//         qblocksinglefemales,
//         qcityState,
//         quseDistance,
//         qdinstance,
//         qTravelMode,
//         qCity,
//       ],
//     );

//     if (result.rows[0]) {
//       return NextResponse.json({
//         message: "Your preference is updated successfully!",
//         status: 200,
//       });
//     } else {
//       throw new Error("Sorry, your updating is failed!");
//     }
//   } catch (error: any) {
//     // Print detailed error information
//     console.error("=== DATABASE ERROR ===");
//     console.error("Error message:", error.message);
//     console.error("Error code:", error.code);
//     console.error("Error detail:", error.detail);
//     console.error("Error hint:", error.hint);
//     console.error("Error stack:", error.stack);
//     console.error("Full error object:", JSON.stringify(error, null, 2));
//     console.error("=====================");

//     return NextResponse.json({
//       message: "Sorry, your updating is failed!",
//       error: error.message,
//       errorCode: error.code,
//       errorDetail: error.detail,
//       errorHint: error.hint,
//       status: 400,
//     });
//   }
// }

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

const getCoordinatesFromLocation = async (
  location: string,
): Promise<{ latitude: number; longitude: number } | null> => {
  const apiKey = "AIzaSyBEr0k_aQ_Sns6YbIQ4UBxCUTdPV9AhdF0";

  if (!location || location.trim() === "") {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`,
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return {
        latitude: lat,
        longitude: lng,
      };
    }

    console.error("No results found or status not OK:", data);
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};

export async function POST(req: any) {
  const { loginId, payload } = await req.json();

  // Swiping visibility
  const qCouples = payload.swiping.couples === true ? 1 : 0;
  const qSingleMales = payload.swiping.singleMale === true ? 1 : 0;
  const qSingleFemales = payload.swiping.singleFemale === true ? 1 : 0;

  // Blocking
  const qblockCouples = payload.block.couples === true ? 1 : 0;
  const qblocksinglemales = payload.block.singleMale === true ? 1 : 0;
  const qblocksinglefemales = payload.block.singleFemale === true ? 1 : 0;

  // Travel Mode
  const qTravelMode = payload.travelMode === true ? 1 : 0;
  const qCity = payload.travelLocation || "";

  // Distance
  const qdinstance = payload?.maxDistance;
  const quseDistance = payload.distanceChecked === true ? 1 : 0;
  const qcityState = payload.city;

  // Geocode travel location if travel mode is enabled
  let travelLatitude = null;
  let travelLongitude = null;

  if (qTravelMode === 1 && qCity && qCity.trim() !== "") {
    console.log("Geocoding travel location:", qCity);

    const coords = await getCoordinatesFromLocation(qCity);

    if (coords) {
      travelLatitude = coords.latitude;
      travelLongitude = coords.longitude;
      console.log("Geocoded coordinates:", travelLatitude, travelLongitude);
    } else {
      console.warn("Failed to geocode travel location:", qCity);
      return NextResponse.json({
        message:
          "Failed to geocode travel location. Please try a different location.",
        error: "Geocoding failed",
        status: 400,
      });
    }
  }

  console.log("qTravelMode", qTravelMode);
  console.log("qCity", qCity);
  console.log("travelLatitude", travelLatitude);
  console.log("travelLongitude", travelLongitude);

  try {
    const result = await pool.query(
      "SELECT * FROM public.insert_preference($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)",
      [
        loginId,
        qCouples,
        qSingleMales,
        qSingleFemales,
        0,
        qblockCouples,
        qblocksinglemales,
        qblocksinglefemales,
        qcityState,
        quseDistance,
        qdinstance,
        qTravelMode,
        qCity,
        travelLatitude,
        travelLongitude,
      ],
    );

    if (result.rows[0]) {
      return NextResponse.json({
        message: "Your preference is updated successfully!",
        status: 200,
      });
    } else {
      throw new Error("Sorry, your updating is failed!");
    }
  } catch (error: any) {
    console.error("=== DATABASE ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error detail:", error.detail);
    console.error("Error hint:", error.hint);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    console.error("=====================");

    return NextResponse.json({
      message: "Sorry, your updating is failed!",
      error: error.message,
      errorCode: error.code,
      errorDetail: error.detail,
      errorHint: error.hint,
      status: 400,
    });
  }
}
