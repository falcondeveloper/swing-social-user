"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  SwipeableDrawer,
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
  IconButton,
  Popper,
  PopperProps,
  Drawer,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import * as Yup from "yup";

interface SwipingBlock {
  couples: boolean;
  singleMale: boolean;
  singleFemale: boolean;
}

interface FormDataType {
  city: string;
  travelMode: boolean;
  travelLocation: string;
  swiping: SwipingBlock;
  maxDistance: number;
  distanceChecked: boolean;
  block: SwipingBlock;
}

type PreferencesSheetProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  profileId?: string;
  onSaved?: () => void;
};

type SavedOptionsType = any;

const yourTextFieldSx = {
  mb: 2,
  "& .MuiOutlinedInput-root": {
    color: "white",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
} as const;

const validationSchema = Yup.object({
  city: Yup.string().nullable(),
  travelLocation: Yup.string().when("travelMode", {
    is: true,
    then: (schema) => schema.required("City is required"),
  }),

  maxDistance: Yup.number().min(0).max(150),
});

export default function PreferencesSheet({
  open,
  onOpen,
  onClose,
  profileId,
  onSaved,
}: PreferencesSheetProps) {
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState<boolean>(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [savedOptions, setSavedOptions] = useState<SavedOptionsType | null>(
    null,
  );
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const cityFetchTimer = useRef<number | undefined>(undefined);

  const drawerVh = 75;
  const headerHeight = 60;
  const saveButtonReserve = 96;

  const formik = useFormik<FormDataType>({
    initialValues: {
      city: "",
      travelMode: false,
      travelLocation: "",
      swiping: { couples: false, singleMale: false, singleFemale: false },
      maxDistance: 50,
      distanceChecked: false,
      block: { couples: false, singleMale: false, singleFemale: false },
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!profileId) {
        console.warn("No profileId provided");
        return;
      }
      try {
        setSubmitting(true);
        const payloadValues = {
          ...values,
          maxDistance: values.distanceChecked ? values.maxDistance : 0,
        };

        const response = await fetch("/api/user/preference/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ loginId: profileId, payload: payloadValues }),
        });
        const data = await response.json();
        if (data?.status === 200) {
          onClose();

          try {
            if (typeof onSaved === "function") {
              onSaved();
              setActiveTab(0);
            }
          } catch (err) {
            console.error("onSaved callback error:", err);
            setActiveTab(0);
          }
        } else {
          console.error("Failed to save preferences:", data);
          setActiveTab(0);
        }
      } catch (err) {
        console.error("Submit error:", err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (open) {
      setActiveTab(0);

      if (tabListRef.current) {
        tabListRef.current.scrollLeft = 0;
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!profileId) return;
    (async () => {
      setLoadingPreferences(true);
      try {
        const res = await fetch("/api/user/preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: profileId }),
        });
        const json = await res.json();
        const got = json?.data?.[0]?.get_preferences ?? json?.data ?? null;
        setSavedOptions(got);
      } catch (err) {
        console.error("Error loading preferences:", err);
      } finally {
        setLoadingPreferences(false);
      }
    })();
  }, [open, profileId]);

  const renderTravelMode = () => (
    <>
      <Typography
        variant="subtitle1"
        sx={{
          color: "rgba(255,255,255,0.95)",
          fontWeight: 700,
          mt: 1,
          mb: 2,
          fontSize: 18,
        }}
      >
        Travel Mode
      </Typography>

      <Typography
        sx={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 14,
          mb: 2,
          lineHeight: 1.6,
        }}
      >
        Going somewhere soon? Travel Mode lets you explore and connect with
        people in another city before you arrive.
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={formik.values.travelMode}
            onChange={(e) => {
              const checked = e.target.checked;
              setNested("travelMode", checked);
              if (!checked) {
                setNested("travelLocation", "");
                setCityInput("");
                setOpenCity(false);
              }
            }}
            sx={{
              "& .MuiSvgIcon-root": { fontSize: 26 },
              color: "#e91e63",
              "&.Mui-checked": { color: "#e91e63" },
            }}
          />
        }
        label="Turn on Travel Mode"
        sx={{ color: "white", mb: 1.5 }}
      />

      {formik.values.travelMode && (
        <>
          <Autocomplete
            open={openCity}
            onOpen={() => setOpenCity(true)}
            onClose={() => setOpenCity(false)}
            freeSolo={false}
            options={cityOptions}
            loading={cityLoading}
            inputValue={cityInput}
            value={formik.values.travelLocation}
            onInputChange={(_, value) => setCityInput(value)}
            onChange={(_, value) => {
              setNested("travelLocation", value ?? "");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Choose a city"
                placeholder="Start typing a city name"
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
                      {cityLoading && (
                        <CircularProgress size={16} color="inherit" />
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={yourTextFieldSx}
              />
            )}
          />
        </>
      )}
    </>
  );

  useEffect(() => {
    if (!savedOptions) return;

    const clamp = (n: number, min = 0, max = 150) =>
      Math.max(min, Math.min(max, Number(n ?? 0)));

    formik.setValues({
      city: savedOptions?.CityState ?? savedOptions?.City ?? "",
      travelMode: Number(savedOptions?.TravelMode) === 1,
      travelLocation: savedOptions?.TravelLocation ?? "",
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

  const setNested = (path: string, value: any) => {
    formik.setFieldValue(path, value);
  };

  const handleChangeIndex = (index: number) => {
    setActiveTab(index);
  };

  const renderWhoCanSeeMe = () => {
    const items: { key: keyof SwipingBlock; label: string }[] = [
      { key: "couples", label: "Couples" },
      { key: "singleMale", label: "Single Males" },
      { key: "singleFemale", label: "Single Females" },
    ];

    return (
      <>
        <Typography
          variant="subtitle1"
          sx={{
            color: "rgba(255,255,255,0.9)",
            fontWeight: 700,
            mt: 1,
            mb: 2,
            fontSize: 18,
            lineHeight: 1.3,
          }}
        >
          Who can see me when they are swiping or searching?
        </Typography>

        <Box
          component="fieldset"
          sx={{
            border: "none",
            m: 0,
            p: 0,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.25,
            }}
          >
            {items.map(({ key, label }) => (
              <Box
                key={key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "rgba(255,255,255,0.02)",
                  borderRadius: 1,
                  p: 1,
                  px: 1.25,
                }}
              >
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
                    "& .MuiSvgIcon-root": { fontSize: 28 },
                    color: "#e91e63",
                    "&.Mui-checked": { color: "#e91e63" },
                  }}
                />

                <Box>
                  <Typography
                    sx={{ fontSize: 15, fontWeight: 600, color: "white" }}
                  >
                    {label}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
                  >
                    {key === "couples"
                      ? "Show to couple accounts"
                      : key === "singleMale"
                        ? "Show to single male accounts"
                        : "Show to single female accounts"}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </>
    );
  };

  const renderMaxDistance = () => {
    return (
      <>
        <Typography
          variant="subtitle1"
          sx={{
            color: "rgba(255,255,255,0.95)",
            fontWeight: 700,
            mt: 1,
            mb: 1,
            fontSize: 18,
            lineHeight: 1.3,
          }}
        >
          What is the maximum distance to a profile I want to see during
          swiping? This applies to my current location.
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={formik.values.distanceChecked}
              onChange={(e) => setNested("distanceChecked", e.target.checked)}
              sx={{
                "& .MuiSvgIcon-root": { fontSize: 26 },
                color: "#e91e63",
                "&.Mui-checked": { color: "#e91e63" },
              }}
            />
          }
          label="Max Distance"
          sx={{ color: "white", mb: 1 }}
        />

        {formik.values.distanceChecked && (
          <Box
            sx={{
              mt: 3,
              width: "95%",
              px: { xs: 0.5, sm: 0 },
              boxSizing: "border-box",
            }}
          >
            <Box sx={{ px: 1 }}>
              <Slider
                value={formik.values.maxDistance}
                min={0}
                max={150}
                onChange={(_, value) =>
                  setNested("maxDistance", value as number)
                }
                valueLabelDisplay="on"
                marks={[
                  { value: 0, label: "0" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                  { value: 150, label: "150" },
                ]}
                sx={{
                  color: "#e91e63",
                  "& .MuiSlider-track": {
                    height: 8,
                    borderRadius: 99,
                  },
                  "& .MuiSlider-rail": {
                    height: 8,
                    opacity: 0.18,
                    borderRadius: 99,
                  },
                  "& .MuiSlider-thumb": {
                    width: 22,
                    height: 22,
                    marginTop: "-7px",
                    marginLeft: 0,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                    "&:focus, &:hover, &.Mui-active": {
                      boxShadow: "0 6px 14px rgba(0,0,0,0.45)",
                    },
                  },
                  "& .MuiSlider-mark": {
                    width: 2,
                    height: 8,
                    backgroundColor: "rgba(255,255,255,0.18)",
                  },
                  "& .MuiSlider-markLabel": {
                    top: 28,
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 12,
                  },
                  "& .MuiSlider-valueLabel": {
                    // top: -35,
                    backgroundColor: "#e91e63",
                    color: "white",
                    borderRadius: 6,
                    padding: "2px 6px",
                    fontSize: 12,
                    transform: "none",
                  },
                  touchAction: "pan-y",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 1,
                px: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.7)" }}
              >
                {formik.values.maxDistance} mi
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
              >
                Drag the handle to adjust
              </Typography>
            </Box>
          </Box>
        )}
      </>
    );
  };

  const renderWhoToBlock = () => {
    const items: { key: keyof SwipingBlock; label: string }[] = [
      { key: "couples", label: "Couples" },
      { key: "singleMale", label: "Single Males" },
      { key: "singleFemale", label: "Single Females" },
    ];

    return (
      <>
        <Typography
          variant="subtitle1"
          sx={{
            color: "rgba(255,255,255,0.9)",
            fontWeight: 700,
            mt: 1,
            mb: 2,
            fontSize: 18,
            lineHeight: 1.3,
          }}
        >
          Who should I block when I am swiping?
        </Typography>

        <Box component="fieldset" sx={{ border: "none", m: 0, p: 0 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.25,
            }}
          >
            {items.map(({ key, label }) => (
              <Box
                key={key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "rgba(255,255,255,0.02)",
                  borderRadius: 1,
                  p: 1,
                  px: 1.25,
                }}
              >
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
                    "& .MuiSvgIcon-root": { fontSize: 28 },
                    color: "#e91e63",
                    "&.Mui-checked": { color: "#e91e63" },
                  }}
                />

                <Box>
                  <Typography
                    sx={{ fontSize: 15, fontWeight: 600, color: "white" }}
                  >
                    {label}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
                  >
                    {key === "couples"
                      ? "Block couple accounts from seeing you"
                      : key === "singleMale"
                        ? "Block single male accounts"
                        : "Block single female accounts"}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </>
    );
  };

  function CustomPopper(props: PopperProps) {
    return <Popper {...props} placement="top-start" />;
  }

  const renderLocationToBlock = () => (
    <>
      <Typography
        variant="subtitle1"
        sx={{
          color: "rgba(255,255,255,0.9)",
          fontWeight: 700,
          mt: 1,
          mb: 2,
          fontSize: 18,
          lineHeight: 1.3,
        }}
      >
        Enter the Location to Block
      </Typography>
      <Box>
        <Autocomplete
          id="city-autocomplete"
          open={openCity}
          onOpen={() => setOpenCity(true)}
          onClose={(event, reason) => {
            if (reason === "blur") return;
            setOpenCity(false);
          }}
          disableClearable
          disablePortal
          clearIcon
          PopperComponent={CustomPopper}
          freeSolo
          options={cityOptions}
          loading={cityLoading}
          inputValue={cityInput}
          value={formik.values.city}
          onInputChange={(_, newInput) => setCityInput(newInput)}
          onChange={(_, newValue) => {
            setNested("city", (newValue ?? "") as string);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              name="city"
              variant="outlined"
              label="City"
              autoComplete="address-level2"
              error={formik.touched.city && Boolean(formik.errors.city)}
              helperText={formik.touched.city && formik.errors.city}
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
              sx={yourTextFieldSx}
            />
          )}
        />

        {formik?.values?.city && (
          <Box mt={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                formik.setFieldValue("city", "");
                setCityInput("");

                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }

                setOpenCity(false);
              }}
              sx={{
                borderColor: "rgba(255,255,255,0.4)",
                color: "rgba(255,255,255,0.9)",
                textTransform: "none",
                fontSize: 14,
                px: 2,
                py: 0.5,
                borderRadius: "6px",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.7)",
                },
              }}
            >
              Clear city
            </Button>
          </Box>
        )}
      </Box>
    </>
  );

  const tabContents = [
    { label: "Who to Block", content: renderWhoToBlock() },
    { label: "Travel Mode", content: renderTravelMode() },
    { label: "Max Distance", content: renderMaxDistance() },
    { label: "Block Location", content: renderLocationToBlock() },
    { label: "Who Can See Me", content: renderWhoCanSeeMe() },
  ];

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          height: `${drawerVh}vh`,
          bgcolor: "#0f0f0f",
          color: "#fff",
          px: 2,
          pt: 1,
          pb: 0,
          overflow: "visible",
          touchAction: "pan-y",
        },
      }}
    >
      <Box
        sx={{
          height: headerHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
        }}
      >
        <Box sx={{ width: 40 }} />
        <Box sx={{ display: "flex", justifyContent: "center", flex: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 5,
              borderRadius: 99,
              bgcolor: "rgba(255,255,255,0.3)",
              mt: 0.5,
            }}
          />
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white", width: 40 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1 }} />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: `calc(${drawerVh}vh - ${headerHeight + saveButtonReserve}px)`,
        }}
      >
        <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 1 }}>
          Preferences
        </Typography>

        <Divider sx={{ mb: 2, bgcolor: "#e91e63" }} />

        <Box
          ref={tabListRef}
          sx={{
            overflowX: "auto",
            whiteSpace: "nowrap",
            paddingBottom: "8px",
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": { display: "none" },
          }}
          role="tablist"
          aria-label="Preferences tabs"
        >
          <Box sx={{ display: "inline-flex", gap: "8px" }}>
            {tabContents.map((item, index) => (
              <Box
                key={index}
                onClick={() => handleChangeIndex(index)}
                role="tab"
                aria-selected={activeTab === index}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleChangeIndex(index);
                  }
                }}
                sx={{
                  backgroundColor: activeTab === index ? "#f50057" : "#2d2d2d",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  color: "white",
                  fontWeight: "500",
                  fontSize: "14px",
                  minWidth: "fit-content",
                }}
              >
                {item.label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Tab Content Area */}
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            touchAction: "auto",
            pb: 2,
          }}
        >
          {loadingPreferences ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ animation: "fadeIn 0.3s ease-in-out" }}>
              {tabContents[activeTab].content}
            </Box>
          )}
        </Box>
      </Box>

      {/* Floating Save Button (centered) */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 25,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Box sx={{ pointerEvents: "auto" }}>
          <Button
            onClick={() => formik.handleSubmit()}
            variant="contained"
            sx={{
              width: 66,
              height: 66,
              borderRadius: "999px",
              backgroundColor: "#ffffff",
              color: "#0f0f0f",
              fontWeight: 700,
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
              "&:hover": {
                transform: "translateY(-2px)",
                backgroundColor: "#ffffff",
              },
            }}
            disabled={submitting || formik.isSubmitting}
          >
            {submitting || formik.isSubmitting ? (
              <CircularProgress size={22} sx={{ color: "#0f0f0f" }} />
            ) : (
              "Save"
            )}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
