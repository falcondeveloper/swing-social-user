"use client";

import { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
  Slider,
  CircularProgress,
  TextField,
  Autocomplete,
  Button,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Loader from "@/commonPage/Loader";

interface SwipingBlock {
  couples: boolean;
  singleMale: boolean;
  singleFemale: boolean;
}

interface FormDataType {
  city: string;
  swiping: SwipingBlock;
  maxDistance: number;
  distanceChecked: boolean;
  block: SwipingBlock;
  travelMode: boolean;
  travelLocation: string;
}

type SavedOptionsType = any;

const validationSchema = Yup.object({
  city: Yup.string().nullable(),
  maxDistance: Yup.number().min(0).max(150),
  travelMode: Yup.boolean(),
  travelLocation: Yup.string().when("travelMode", {
    is: true,
    then: (schema) =>
      schema.required(
        "Travel location is required when travel mode is enabled",
      ),
    otherwise: (schema) => schema.nullable(),
  }),
});

export default function Preferences() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);

  const [cityLoading, setCityLoading] = useState(false);
  const [travelCityLoading, setTravelCityLoading] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState<boolean>(true);
  const [openCity, setOpenCity] = useState(false);
  const [openTravelCity, setOpenTravelCity] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [travelCityOptions, setTravelCityOptions] = useState<string[]>([]);
  const [savedOptions, setSavedOptions] = useState<SavedOptionsType | null>(
    null,
  );
  const [cityInput, setCityInput] = useState<string>("");
  const [travelCityInput, setTravelCityInput] = useState<string>("");

  const cityFetchTimer = useRef<number | undefined>(undefined);
  const travelCityFetchTimer = useRef<number | undefined>(undefined);

  const formik = useFormik<FormDataType>({
    initialValues: {
      city: "",
      swiping: { couples: false, singleMale: false, singleFemale: false },
      maxDistance: 50,
      distanceChecked: false,
      block: { couples: false, singleMale: false, singleFemale: false },
      travelMode: false,
      travelLocation: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = values;
        setSubmitting(true);

        const response = await fetch("/api/user/preference/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ loginId: profileId, payload }),
        });

        const data = await response.json();

        if (data?.status === 200) {
          router.push("/members");
        } else {
          console.error("Failed to save preferences:", data?.message || data);
        }
      } catch (error) {
        console.error("Submit error:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedProfileId = localStorage.getItem("logged_in_profile");
    setProfileId(storedProfileId);
    if (storedProfileId) {
      handleGetPreferences(storedProfileId);
    } else {
      setLoadingPreferences(false);
    }
  }, []);

  useEffect(() => {
    if (!savedOptions) return;

    const clamp = (n: number, min = 0, max = 150) =>
      Math.max(min, Math.min(max, Number(n ?? 0)));

    formik.setValues({
      city: savedOptions?.CityState ?? savedOptions?.City ?? "",
      swiping: {
        couples: Number(savedOptions?.Couples) === 1,
        singleMale: Number(savedOptions?.SingleMales) === 1,
        singleFemale: Number(savedOptions?.SingleFemales) === 1,
      },
      maxDistance: clamp(savedOptions?.Distance ?? formik.values.maxDistance),
      distanceChecked: Number(savedOptions?.UseDistance) === 1,
      block: {
        couples: Number(savedOptions?.BlockCouples) === 1,
        singleMale: Number(savedOptions?.BlockSingleMales) === 1,
        singleFemale: Number(savedOptions?.BlockSingleFemales) === 1,
      },
      travelMode: Number(savedOptions?.TravelMode) === 1,
      travelLocation: savedOptions?.TravelLocation ?? "",
    });
  }, [savedOptions]);

  useEffect(() => {
    if (!openCity) {
      setCityOptions([]);
      return;
    }

    if (!cityInput || cityInput.trim() === "") {
      setCityOptions([]);
      return;
    }

    setCityLoading(true);
    if (cityFetchTimer.current) window.clearTimeout(cityFetchTimer.current);

    cityFetchTimer.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/user/city?city=${encodeURIComponent(cityInput)}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        const cities: any[] = json?.cities ?? [];
        const unique = Array.from(
          new Set(cities.map((c) => (c?.City ?? c?.city ?? "").trim())),
        ).filter(Boolean);
        setCityOptions(unique);
      } catch (err) {
        console.error("Error fetching cities:", err);
        setCityOptions([]);
      } finally {
        setCityLoading(false);
      }
    }, 500);

    return () => {
      if (cityFetchTimer.current) {
        window.clearTimeout(cityFetchTimer.current);
      }
    };
  }, [cityInput, openCity]);

  // Travel City autocomplete
  useEffect(() => {
    if (!openTravelCity) {
      setTravelCityOptions([]);
      return;
    }

    if (!travelCityInput || travelCityInput.trim() === "") {
      setTravelCityOptions([]);
      return;
    }

    setTravelCityLoading(true);
    if (travelCityFetchTimer.current)
      window.clearTimeout(travelCityFetchTimer.current);

    travelCityFetchTimer.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/user/city?city=${encodeURIComponent(travelCityInput)}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        const cities: any[] = json?.cities ?? [];
        const unique = Array.from(
          new Set(cities.map((c) => (c?.City ?? c?.city ?? "").trim())),
        ).filter(Boolean);
        setTravelCityOptions(unique);
      } catch (err) {
        console.error("Error fetching travel cities:", err);
        setTravelCityOptions([]);
      } finally {
        setTravelCityLoading(false);
      }
    }, 500);

    return () => {
      if (travelCityFetchTimer.current) {
        window.clearTimeout(travelCityFetchTimer.current);
      }
    };
  }, [travelCityInput, openTravelCity]);

  const handleGetPreferences = async (userId: string | null) => {
    if (!userId) return;
    try {
      setLoadingPreferences(true);
      const checkResponse = await fetch("/api/user/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });

      const checkData = await checkResponse.json();
      const got =
        checkData?.data?.[0]?.get_preferences ?? checkData?.data ?? null;
      setSavedOptions(got);
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const setNested = (path: string, value: any) => {
    formik.setFieldValue(path, value);
  };

  if (loadingPreferences) {
    return (
      <>
        <Box
          sx={{
            height: "100dvh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#121212",
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Loader />
          </Box>
        </Box>
      </>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={formik.handleSubmit}
      sx={{
        padding: { xs: 2, sm: 3, md: 4, lg: 10 },
      }}
    >
      <Button
        onClick={() => router.back()}
        startIcon={<ArrowLeft />}
        sx={{
          textTransform: "none",
          color: "rgba(255, 255, 255, 0.7)",
          textAlign: "center",
          minWidth: "auto",
          fontSize: "16px",
          fontWeight: "medium",
          "&:hover": {
            color: "#fff",
            backgroundColor: "rgba(255,255,255,0.08)",
          },
        }}
      >
        Back
      </Button>

      <Typography variant="h4" align="center" gutterBottom color="white">
        Preferences
      </Typography>
      <Divider sx={{ mb: 3, bgcolor: "#e91e63" }} />

      {/* Swiping Preferences */}
      <Typography variant="h6" gutterBottom color="white">
        Who can see me when they are swiping or searching?
      </Typography>
      <Box>
        {(["couples", "singleMale", "singleFemale"] as const).map((key) => {
          const label =
            key === "couples"
              ? "Couples"
              : key === "singleMale"
                ? "Single Males"
                : "Single Females";
          return (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  name={`swiping.${key}`}
                  checked={(formik.values.swiping as any)[key]}
                  onChange={(e) =>
                    setNested(
                      `swiping.${key}`,
                      (e.target as HTMLInputElement).checked,
                    )
                  }
                  sx={{
                    color: "#e91e63",
                    "&.Mui-checked": { color: "#e91e63" },
                  }}
                />
              }
              label={label}
              sx={{ color: "white" }}
            />
          );
        })}
      </Box>

      {/* Distance */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }} color="white">
        What is the maximum distance to a profile I want to see during swiping?
        This applies to my current location.
      </Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={formik.values.distanceChecked}
            onChange={(e) => setNested("distanceChecked", e.target.checked)}
            sx={{ color: "#e91e63", "&.Mui-checked": { color: "#e91e63" } }}
          />
        }
        label="Max Distance"
        sx={{ color: "white" }}
      />

      {formik.values.distanceChecked && (
        <Box
          sx={{
            mt: 2,
            width: { xs: "100%", sm: 400, md: 500 },
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Slider
              value={formik.values.maxDistance}
              min={0}
              max={150}
              onChange={(_, value) => setNested("maxDistance", value as number)}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: "0 mi" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
                { value: 150, label: "150" },
              ]}
              sx={{
                color: "#e91e63",
                "& .MuiSlider-thumb": { borderRadius: "50%" },
                "& .MuiSlider-markLabel": { color: "white" },
              }}
            />
          </Box>

          <Box sx={{ minWidth: 72, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "white" }}>
              {formik.values.maxDistance} mi
            </Typography>
          </Box>
        </Box>
      )}

      {/* Travel Mode */}
      {/* <Typography variant="h6" gutterBottom sx={{ mt: 4 }} color="white">
        Travel Mode
      </Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={formik.values.travelMode}
            onChange={(e) => {
              const isChecked = e.target.checked;
              setNested("travelMode", isChecked);
              // Clear travel location when unchecking travel mode
              if (!isChecked) {
                setNested("travelLocation", "");
              }
            }}
            sx={{ color: "#e91e63", "&.Mui-checked": { color: "#e91e63" } }}
          />
        }
        label="Enable Travel Mode"
        sx={{ color: "white" }}
      />

      {formik.values.travelMode && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom color="white">
            Enter your travel destination
          </Typography>
          <Autocomplete
            id="autocomplete-travel-city"
            open={openTravelCity}
            onOpen={() => setOpenTravelCity(true)}
            onClose={() => setOpenTravelCity(false)}
            freeSolo
            options={travelCityOptions}
            loading={travelCityLoading}
            inputValue={travelCityInput}
            value={formik.values.travelLocation}
            onInputChange={(_, newInput) => setTravelCityInput(newInput)}
            onChange={(_, newValue) => {
              setNested("travelLocation", (newValue ?? "") as string);
            }}
            onBlur={() => formik.setFieldTouched("travelLocation", true)}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : String(option ?? "")
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="filled"
                label="Travel Location"
                required={formik.values.travelMode}
                error={
                  formik.touched.travelLocation &&
                  Boolean(formik.errors.travelLocation)
                }
                helperText={
                  formik.touched.travelLocation && formik.errors.travelLocation
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {travelCityLoading ? (
                        <CircularProgress color="inherit" size={15} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  backgroundColor: "#2a2a2a",
                  input: { color: "#fff" },
                  mb: 3,
                  borderRadius: "4px",
                  "& .MuiFormHelperText-root": {
                    color: "#f44336",
                  },
                }}
              />
            )}
          />
        </Box>
      )} */}

      {/* Blocking Preferences */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }} color="white">
        Who should I block when I am swiping?
      </Typography>
      <Box>
        {(["couples", "singleMale", "singleFemale"] as const).map((key) => {
          const label =
            key === "couples"
              ? "Couples"
              : key === "singleMale"
                ? "Single Males"
                : "Single Females";
          return (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  name={`block.${key}`}
                  checked={(formik.values.block as any)[key]}
                  onChange={(e) =>
                    setNested(
                      `block.${key}`,
                      (e.target as HTMLInputElement).checked,
                    )
                  }
                  sx={{
                    color: "#e91e63",
                    "&.Mui-checked": { color: "#e91e63" },
                  }}
                />
              }
              label={label}
              sx={{ color: "white" }}
            />
          );
        })}
      </Box>

      {/* City */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }} color="white">
        Enter the Location to Block
      </Typography>
      <Box>
        <Autocomplete
          id="autocomplete-city"
          open={openCity}
          onOpen={() => setOpenCity(true)}
          onClose={() => setOpenCity(false)}
          freeSolo
          options={cityOptions}
          loading={cityLoading}
          inputValue={cityInput}
          value={formik.values.city}
          onInputChange={(_, newInput) => setCityInput(newInput)}
          onChange={(_, newValue) => {
            setNested("city", (newValue ?? "") as string);
          }}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : String(option ?? "")
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="filled"
              label="City"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {cityLoading ? (
                      <CircularProgress color="inherit" size={15} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                backgroundColor: "#2a2a2a",
                input: { color: "#fff" },
                mb: 3,
                borderRadius: "4px",
              }}
            />
          )}
        />
      </Box>

      {/* Submit Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          mt: 4,
        }}
      >
        <Button
          type="submit"
          variant="contained"
          disabled={formik.isSubmitting}
          sx={{
            textTransform: "none",
            backgroundColor: "#f50057",
            color: "#fff",
            px: 4,
            py: 1.4,
            minWidth: 100,
            fontSize: 16,
            fontWeight: 700,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,

            "&:hover": {
              backgroundColor: "#c51162",
              transform: "translateY(-1px)",
            },

            "&:active": {
              transform: "translateY(0)",
            },

            "&.Mui-disabled": {
              backgroundColor: "#f50057",
              opacity: 0.7,
              color: "#fff",
            },
          }}
        >
          {formik.isSubmitting ? (
            <>
              <CircularProgress
                size={18}
                thickness={5}
                sx={{ color: "#fff" }}
              />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </Box>
    </Box>
  );
}
