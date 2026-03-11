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
  Stack,
  Chip,
} from "@mui/material";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Eye,
  EyeOff,
  Plane,
  Settings2,
} from "lucide-react";
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

const styledTextFieldSx = {
  mb: 2,
  "& .MuiOutlinedInput-root": {
    color: "white",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(255,45,85,0.5)" },
    "&.Mui-focused fieldset": { borderColor: "#FF2D55", borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#FF2D55" },
  "& .MuiFormHelperText-root": { color: "#f44336" },
} as const;

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      p: { xs: 2, sm: 2.5 },
      mb: 2.5,
      borderRadius: "16px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    {children}
  </Box>
);

const SectionTitle = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "10px",
        background: "linear-gradient(135deg, #FF2D55, #7000FF)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>
      {children}
    </Typography>
  </Stack>
);

const CheckboxItem = ({
  label,
  subtitle,
  checked,
  onChange,
}: {
  label: string;
  subtitle: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <Box
    onClick={() => onChange(!checked)}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      p: 1.5,
      borderRadius: "12px",
      border: checked
        ? "1px solid rgba(255,45,85,0.4)"
        : "1px solid rgba(255,255,255,0.06)",
      background: checked ? "rgba(255,45,85,0.08)" : "rgba(255,255,255,0.02)",
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        border: "1px solid rgba(255,45,85,0.3)",
        background: "rgba(255,45,85,0.05)",
      },
    }}
  >
    <Checkbox
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      sx={{
        p: 0,
        color: "rgba(255,255,255,0.3)",
        "&.Mui-checked": { color: "#FF2D55" },
        "& .MuiSvgIcon-root": { fontSize: 22 },
      }}
    />
    <Box>
      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>
        {subtitle}
      </Typography>
    </Box>
  </Box>
);

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
        setSubmitting(true);
        const response = await fetch("/api/user/preference/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loginId: profileId, payload: values }),
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
    if (storedProfileId) handleGetPreferences(storedProfileId);
    else setLoadingPreferences(false);
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
    if (!openCity || !cityInput?.trim()) {
      setCityOptions([]);
      return;
    }
    setCityLoading(true);
    if (cityFetchTimer.current) window.clearTimeout(cityFetchTimer.current);
    cityFetchTimer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/user/city?city=${encodeURIComponent(cityInput)}`,
        );
        const json = await res.json();
        const unique = Array.from(
          new Set((json?.cities ?? []).map((c: any) => (c?.City ?? "").trim())),
        ).filter(Boolean) as string[];
        setCityOptions(unique);
      } catch {
        setCityOptions([]);
      } finally {
        setCityLoading(false);
      }
    }, 500);
    return () => {
      if (cityFetchTimer.current) window.clearTimeout(cityFetchTimer.current);
    };
  }, [cityInput, openCity]);

  useEffect(() => {
    if (!openTravelCity || !travelCityInput?.trim()) {
      setTravelCityOptions([]);
      return;
    }
    setTravelCityLoading(true);
    if (travelCityFetchTimer.current)
      window.clearTimeout(travelCityFetchTimer.current);
    travelCityFetchTimer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/user/city?city=${encodeURIComponent(travelCityInput)}`,
        );
        const json = await res.json();
        const unique = Array.from(
          new Set((json?.cities ?? []).map((c: any) => (c?.City ?? "").trim())),
        ).filter(Boolean) as string[];
        setTravelCityOptions(unique);
      } catch {
        setTravelCityOptions([]);
      } finally {
        setTravelCityLoading(false);
      }
    }, 500);
    return () => {
      if (travelCityFetchTimer.current)
        window.clearTimeout(travelCityFetchTimer.current);
    };
  }, [travelCityInput, openTravelCity]);

  const handleGetPreferences = async (userId: string) => {
    try {
      setLoadingPreferences(true);
      const res = await fetch("/api/user/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      const data = await res.json();
      setSavedOptions(data?.data?.[0]?.get_preferences ?? data?.data ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const setNested = (path: string, value: any) =>
    formik.setFieldValue(path, value);

  if (loadingPreferences) {
    return (
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
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
        color: "#fff",
      }}
    >
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        sx={{
          maxWidth: 680,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 4 },
        }}
      >
        <Stack direction="row" alignItems="center" mb={3} spacing={1}>
          <Button
            onClick={() => router.back()}
            startIcon={<ArrowLeft size={18} />}
            sx={{
              textTransform: "none",
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              fontWeight: 500,
              borderRadius: "10px",
              px: 1.5,
              py: 0.8,
              minWidth: "auto",
              "&:hover": {
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.06)",
              },
            }}
          >
            Back
          </Button>
        </Stack>

        <Stack alignItems="center" mb={3}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF2D55, #7000FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1.5,
            }}
          >
            <Settings2 size={24} color="#fff" />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: "#fff", letterSpacing: 0.3 }}
          >
            Preferences
          </Typography>
          <Typography
            sx={{
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.4)",
              mt: 0.5,
            }}
          >
            Customize who you see and who sees you
          </Typography>
        </Stack>

        {/* <Box
          sx={{
            height: "1.5px",
            background:
              "linear-gradient(90deg, transparent, #FF2D55, #7000FF, transparent)",
            mb: 3,
            borderRadius: 99,
          }}
        /> */}

        <Divider
          sx={{
            mb: 3,
            background: "linear-gradient(90deg, #FF2D55, #7000FF)",
            height: "2px",
            border: "none",
          }}
        />

        {/* ── Section 1: Who to Block ── */}
        <SectionCard>
          <SectionTitle icon={<EyeOff size={16} color="#fff" />}>
            Who should I block when swiping?
          </SectionTitle>
          <Stack spacing={1.2}>
            {(
              [
                {
                  key: "couples",
                  label: "Couples",
                  sub: "Block couple accounts from viewing you",
                },
                {
                  key: "singleMale",
                  label: "Single Males",
                  sub: "Block single male accounts",
                },
                {
                  key: "singleFemale",
                  label: "Single Females",
                  sub: "Block single female accounts",
                },
              ] as const
            ).map(({ key, label, sub }) => (
              <CheckboxItem
                key={key}
                label={label}
                subtitle={sub}
                checked={formik.values.block[key]}
                onChange={(val) => setNested(`block.${key}`, val)}
              />
            ))}
          </Stack>
        </SectionCard>

        {/* ── Section 2: Travel Mode ── */}
        <SectionCard>
          <SectionTitle icon={<Plane size={16} color="#fff" />}>
            Travel Mode
          </SectionTitle>

          <Typography
            sx={{
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.5)",
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            Going somewhere? Connect with people in another city before you
            arrive.
          </Typography>

          <CheckboxItem
            label="Enable Travel Mode"
            subtitle="Browse profiles from a different location"
            checked={formik.values.travelMode}
            onChange={(val) => {
              setNested("travelMode", val);
              if (!val) {
                setNested("travelLocation", "");
                setTravelCityInput("");
              }
            }}
          />

          {formik.values.travelMode && (
            <Box sx={{ mt: 2 }}>
              <Autocomplete
                open={openTravelCity}
                onOpen={() => setOpenTravelCity(true)}
                onClose={() => setOpenTravelCity(false)}
                freeSolo
                options={travelCityOptions}
                loading={travelCityLoading}
                inputValue={travelCityInput}
                value={formik.values.travelLocation}
                onInputChange={(_, v) => setTravelCityInput(v)}
                onChange={(_, v) =>
                  setNested("travelLocation", (v ?? "") as string)
                }
                onBlur={() => formik.setFieldTouched("travelLocation", true)}
                getOptionLabel={(o) =>
                  typeof o === "string" ? o : String(o ?? "")
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Travel Destination"
                    placeholder="Start typing a city..."
                    required={formik.values.travelMode}
                    error={
                      formik.touched.travelLocation &&
                      Boolean(formik.errors.travelLocation)
                    }
                    helperText={
                      formik.touched.travelLocation &&
                      formik.errors.travelLocation
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
                    sx={styledTextFieldSx}
                  />
                )}
              />
            </Box>
          )}
        </SectionCard>

        {/* ── Section 3: Max Distance ── */}
        <SectionCard>
          <SectionTitle icon={<MapPin size={16} color="#fff" />}>
            Maximum Distance
          </SectionTitle>

          <CheckboxItem
            label="Enable Max Distance"
            subtitle="Filter profiles by distance from your location"
            checked={formik.values.distanceChecked}
            onChange={(val) => setNested("distanceChecked", val)}
          />

          {formik.values.distanceChecked && (
            <Box sx={{ mt: 3, px: 1 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography
                  sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}
                >
                  Distance range
                </Typography>
                <Chip
                  label={`${formik.values.maxDistance} mi`}
                  size="small"
                  sx={{
                    background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    height: 24,
                  }}
                />
              </Stack>
              <Slider
                value={formik.values.maxDistance}
                min={0}
                max={150}
                onChange={(_, value) =>
                  setNested("maxDistance", value as number)
                }
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: "0" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                  { value: 150, label: "150 mi" },
                ]}
                sx={{
                  color: "#FF2D55",
                  "& .MuiSlider-track": { height: 6, borderRadius: 99 },
                  "& .MuiSlider-rail": {
                    height: 6,
                    opacity: 0.15,
                    borderRadius: 99,
                  },
                  "& .MuiSlider-thumb": {
                    width: 20,
                    height: 20,
                    boxShadow: "0 4px 12px rgba(255,45,85,0.4)",
                    "&:hover": { boxShadow: "0 4px 16px rgba(255,45,85,0.6)" },
                  },
                  "& .MuiSlider-markLabel": {
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 11,
                  },
                  "& .MuiSlider-valueLabel": {
                    background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                    borderRadius: 6,
                    fontSize: 12,
                  },
                }}
              />
            </Box>
          )}
        </SectionCard>

        {/* ── Section 4: Block Location ── */}
        <SectionCard>
          <SectionTitle icon={<MapPin size={16} color="#fff" />}>
            Block a Location
          </SectionTitle>
          <Typography
            sx={{
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.5)",
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            Hide profiles from a specific city or region.
          </Typography>
          <Autocomplete
            open={openCity}
            onOpen={() => setOpenCity(true)}
            onClose={() => setOpenCity(false)}
            freeSolo
            options={cityOptions}
            loading={cityLoading}
            inputValue={cityInput}
            value={formik.values.city}
            onInputChange={(_, v) => setCityInput(v)}
            onChange={(_, v) => setNested("city", (v ?? "") as string)}
            getOptionLabel={(o) =>
              typeof o === "string" ? o : String(o ?? "")
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="City to Block"
                placeholder="Search for a city..."
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
                sx={styledTextFieldSx}
              />
            )}
          />
          {formik.values.city && (
            <Button
              size="small"
              onClick={() => {
                setNested("city", "");
                setCityInput("");
              }}
              sx={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "12px",
                textTransform: "none",
                mt: -1,
                "&:hover": { color: "#fff" },
              }}
            >
              Clear city
            </Button>
          )}
        </SectionCard>

        {/* ── Section 5: Who Can See Me ── */}
        <SectionCard>
          <SectionTitle icon={<Eye size={16} color="#fff" />}>
            Who can see me when swiping?
          </SectionTitle>
          <Stack spacing={1.2}>
            {(
              [
                {
                  key: "couples",
                  label: "Couples",
                  sub: "Show to couple accounts",
                },
                {
                  key: "singleMale",
                  label: "Single Males",
                  sub: "Show to single male accounts",
                },
                {
                  key: "singleFemale",
                  label: "Single Females",
                  sub: "Show to single female accounts",
                },
              ] as const
            ).map(({ key, label, sub }) => (
              <CheckboxItem
                key={key}
                label={label}
                subtitle={sub}
                checked={formik.values.swiping[key]}
                onChange={(val) => setNested(`swiping.${key}`, val)}
              />
            ))}
          </Stack>
        </SectionCard>

        {/* ── Save Button ── */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 4 }}>
          <Button
            type="submit"
            disabled={formik.isSubmitting}
            sx={{
              px: 6,
              py: 1.5,
              borderRadius: "14px",
              fontSize: "1rem",
              fontWeight: 800,
              textTransform: "none",
              color: "#fff",
              background: "linear-gradient(90deg, #FF2D55, #7000FF)",
              border: "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.2s ease",
              "&:hover": {
                opacity: 0.9,
                transform: "translateY(-1px)",
              },
              "&:active": { transform: "translateY(0)" },
              "&.Mui-disabled": {
                background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                opacity: 0.5,
                color: "#fff",
              },
            }}
          >
            {formik.isSubmitting ? (
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <CircularProgress
                  size={18}
                  thickness={5}
                  sx={{ color: "#fff" }}
                />
                <span>Saving…</span>
              </Stack>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
