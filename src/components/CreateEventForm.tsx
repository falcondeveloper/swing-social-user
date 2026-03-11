"use client";

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import {
  Box,
  Container,
  createTheme,
  Paper,
  Step,
  StepLabel,
  Stepper,
  ThemeProvider,
  useMediaQuery,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  Autocomplete,
  Popper,
  PopperProps,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  SnackbarCloseReason,
  Dialog,
  DialogContent,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useFormik, FormikErrors } from "formik";
import * as Yup from "yup";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment, { Moment } from "moment";
import { Editor } from "@tinymce/tinymce-react";
import { EditIcon } from "lucide-react";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { sendErrorEmail } from "@/utils/reportError";
import ProfileImgCheckerModel from "./ProfileImgCheckerModel";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";

const theme = createTheme({
  palette: {
    primary: { main: "#FF2D55", light: "#FF617B", dark: "#CC1439" },
    secondary: { main: "#7000FF", light: "#9B4DFF", dark: "#5200CC" },
    success: { main: "#00D179" },
    background: { default: "#0A0118" },
  },
});

const ParticleField = memo(() => {
  const isMobile = useMediaQuery("(max-width:600px)");

  const particles = useMemo(() => {
    const count = isMobile ? 15 : 50;
    return [...Array(count)].map((_, i) => ({
      id: i,
      size: Math.random() * (isMobile ? 4 : 6) + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * (isMobile ? 15 : 20) + 10,
      delay: -Math.random() * 20,
    }));
  }, [isMobile]);

  return (
    <Box
      sx={{
        position: "absolute",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        opacity: 0.6,
      }}
    >
      {particles.map((particle) => (
        <Box
          key={particle.id}
          sx={{
            position: "absolute",
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: "linear-gradient(45deg, #FF2D55, #7000FF)",
            borderRadius: "50%",
            animation: `float ${particle.duration}s infinite linear`,
            animationDelay: `${particle.delay}s`,
            "@keyframes float": {
              "0%": {
                transform: "translate(0, 0) rotate(0deg)",
                opacity: 0,
              },
              "50%": {
                opacity: 0.8,
              },
              "100%": {
                transform: "translate(100px, -100px) rotate(360deg)",
                opacity: 0,
              },
            },
          }}
        />
      ))}
    </Box>
  );
});

const yourTextFieldSx = {
  mb: 1,
  "& .MuiOutlinedInput-root": {
    color: "white",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
} as const;

const steps = ["Details", "Description", "Media"];

type FormValues = {
  eventName: string;
  category: string;
  startTime: Moment | null;
  endTime: Moment | null;
  venue: string;
  description: string;
  coverPhoto: any | null;
  photos: string[];
  hideVenue: number;
  hideTicketOption: number;
  repeats: {
    type: "none" | "daily" | "weekly" | "monthly";
    interval: number;
    stopCondition: "never" | "date" | "times";
    untilDate: Moment | null;
    times: number;
    weekDays: boolean[];
    monthDay: number;
  };
};

type CityType = {
  id: number;
  City: string;
};

const validationSchema = Yup.object().shape({
  eventName: Yup.string().trim().required("Event name is required"),
  category: Yup.string().trim().required("Please select category"),
  startTime: Yup.mixed()
    .required("Start time is required")
    .test("is-future", "Start must be in the future", function (value) {
      const v = value as Moment | null;
      return v ? moment(v).isAfter(moment()) : false;
    }),
  endTime: Yup.mixed()
    .required("End time is required")
    .test("after-start", "End must be after start", function (value) {
      const v = value as Moment | null;
      const startTime = this.parent.startTime as Moment | null;
      if (!startTime || !v) return true;
      return moment(v).isAfter(moment(startTime));
    }),
  venue: Yup.string().required("Venue is required"),
  description: Yup.string().trim().required("Description is required"),
  coverPhoto: Yup.string().required("Cover photo is required"),
  photos: Yup.array().of(Yup.string()).max(5, "You can upload up to 5 photos"),
});

const MAX_PHOTOS = 3;

const CreateEventForm: React.FC = () => {
  const router = useRouter();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [profileId, setProfileId] = useState<any>();
  const [profileName, setProfileName] = useState<string>("");
  const [email, setEmail] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [message, setMessage] = useState<string>("");
  const [cityLoading, setCityLoading] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [cityOption, setCityOption] = useState<CityType[] | []>([]);
  const [cityInput, setCityInput] = useState<string | "">("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const [stepLoading, setStepLoading] = useState<Record<number, boolean>>({});
  const [stepError, setStepError] = useState<Record<number, string | null>>({});
  const [stepResult, setStepResult] = useState<Record<number, any>>({});
  const [savedAt, setSavedAt] = useState<Record<number, string | null>>({});
  const [previewValues, setPreviewValues] = useState<Partial<FormValues>>({});

  const callApiForStep = async (
    stepIndex: number,
    extra?: { stepData?: any; partialValues?: any }
  ): Promise<{ ok: boolean; data?: any; error?: string }> => {
    const endpoint = `/api/user/events/step-${stepIndex + 1}`;
    if (stepLoading[stepIndex])
      return { ok: true, data: stepResult[stepIndex] };

    setStepLoading((s) => ({ ...s, [stepIndex]: true }));
    setStepError((s) => ({ ...s, [stepIndex]: null }));
    try {
      const body = {
        profileId,
        profileName,
        email,
        values: extra?.partialValues ?? formik.values,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        const msg = json?.message || `HTTP ${res.status}`;
        setStepError((s) => ({ ...s, [stepIndex]: msg }));
        return { ok: false, error: msg };
      }

      setStepResult((r) => ({ ...r, [stepIndex]: json }));
      setSavedAt((s) => ({ ...s, [stepIndex]: new Date().toISOString() }));
      return { ok: true, data: json };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStepError((s) => ({ ...s, [stepIndex]: msg }));
      return { ok: false, error: msg };
    } finally {
      setStepLoading((s) => ({ ...s, [stepIndex]: false }));
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("loginInfo");
      if (token) {
        const decodeToken = jwtDecode<any>(token);
        setProfileId(decodeToken?.profileId);
        setProfileName(decodeToken?.profileName || "");
      } else {
        router.push("/login");
      }
    }
  }, []);

  useEffect(() => {
    if (!openCity) setCityOption([]);
  }, [openCity]);

  useEffect(() => {
    if (!openCity) return;
    if (cityInput === "") return;

    const fetchData = async () => {
      setCityLoading(true);
      try {
        const response = await fetch(`/api/user/city?city=${cityInput}`);
        if (!response.ok) {
          console.error("Failed to fetch event data:", response.statusText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { cities }: { cities: CityType[] } = await response.json();
        const uniqueCities = cities.filter(
          (city, index, self) =>
            index === self.findIndex((t) => t.City === city.City)
        );
        setCityOption(uniqueCities);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setCityLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [cityInput, openCity]);

  const getLatLngByLocationName = async (locationName: string) => {
    const apiKey = "AIzaSyBEr0k_aQ_Sns6YbIQ4UBxCUTdPV9AhdF0";

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          locationName
        )}&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      }

      console.error("No results found or status not OK:", data);
      return null;
    } catch (error: unknown) {
      let message = "Unknown upload error";
      let stack = "";

      if (error instanceof Error) {
        message = error.message;
        stack = error.stack || "";
      } else if (typeof error === "string") {
        message = error;
      }

      await sendErrorEmail({
        errorMessage: message,
        stack,
        routeName: "getLatLngByLocationName function",
        userId: profileName,
      });
      console.error("Error fetching latitude and longitude:", error);
      return null;
    }
  };

  async function compressImageFile(
    file: File,
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.75
  ) {
    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);

      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        const targetW = Math.round(width * ratio);
        const targetH = Math.round(height * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, targetW, targetH);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas toBlob failed"));
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };
    });
  }

  const uploadCoverImage = async (
    imageData: File | string
  ): Promise<string | null> => {
    try {
      const formData = new FormData();

      let blobToSend: Blob | null = null;

      if (typeof imageData === "string" && imageData.startsWith("data:")) {
        const res = await fetch(imageData);
        const blob = await res.blob();
        // optionally compress blob
        const fileFromBlob = new File([blob], "cover.jpg", { type: blob.type });
        blobToSend = await compressImageFile(fileFromBlob, 1600, 1600, 0.8);
        formData.append("image", blobToSend, "cover.jpg");
      } else if (imageData instanceof File) {
        // compress the file if it's large
        const maxClientMB = 6;
        if (imageData.size > maxClientMB * 1024 * 1024) {
          const compressed = await compressImageFile(
            imageData,
            1600,
            1600,
            0.8
          );
          formData.append(
            "image",
            compressed,
            imageData.name.replace(/\.\w+$/, ".jpg")
          );
        } else {
          formData.append("image", imageData, imageData.name);
        }
      } else {
        console.error("Unsupported imageData type", imageData);
        return null;
      }

      const res = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        console.error("Upload failed", res.status, await res.text());
        return null;
      }
      const data = await res.json();
      return data?.blobUrl || data?.imageUrl || null;
    } catch (error) {
      let message = "Unknown upload error";
      let stack = "";

      if (error instanceof Error) {
        message = error.message;
        stack = error.stack || "";
      } else if (typeof error === "string") {
        message = error;
      }

      await sendErrorEmail({
        errorMessage: message,
        stack,
        routeName: "uploadCoverImage function",
        userId: profileName,
      });
      console.error(error);
      return null;
    }
  };

  const dataURLtoFile = (dataUrl: string, filename = "photo.jpg"): File => {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const uploadEventImage = async (
    imageData: string | File | Blob
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      if (typeof imageData === "string") {
        if (imageData.startsWith("data:")) {
          const file = dataURLtoFile(imageData, `photo_${Date.now()}.jpg`);
          formData.append("image", file, file.name);
        } else {
          console.warn(
            "uploadEventImage: received non-data URL string",
            imageData
          );
          return null;
        }
      } else if (imageData instanceof File) {
        formData.append("image", imageData, imageData.name);
      } else {
        formData.append("image", imageData, `photo_${Date.now()}.jpg`);
      }
      const response = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error(
          "uploadEventImage failed:",
          response.status,
          await response.text()
        );
        return null;
      }

      const data = await response.json();
      return data?.imageUrl ?? data?.blobUrl ?? null;
    } catch (error) {
      let message = "Unknown upload error";
      let stack = "";

      if (error instanceof Error) {
        message = error.message;
        stack = error.stack || "";
      } else if (typeof error === "string") {
        message = error;
      }

      await sendErrorEmail({
        errorMessage: message,
        stack,
        routeName: "uploadEventImage multiple images",
        userId: profileName,
      });
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const uploadImagesSequentially = async (
    images: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<(string | null)[]> => {
    const results: (string | null)[] = [];
    const total = images.length;
    for (let i = 0; i < total; i++) {
      const image = images[i];
      try {
        onProgress?.(i, total);

        const file = image.startsWith("data:")
          ? dataURLtoFile(image, `photo_${i}_${Date.now()}.jpg`)
          : undefined;

        const result = await uploadEventImage(file ?? image);
        results.push(result);
        onProgress?.(i + 1, total);
      } catch (err) {
        console.error("Failed uploading image index", i, err);
        let message = "Unknown upload error";
        let stack = "";

        if (err instanceof Error) {
          message = err.message;
          stack = err.stack || "";
        } else if (typeof err === "string") {
          message = err;
        }

        await sendErrorEmail({
          errorMessage: message,
          stack,
          routeName: "uploadCoverImage",
          userId: profileName,
        });
        results.push(null);
        onProgress?.(i + 1, total);
      }
    }
    return results;
  };

  const formik = useFormik<FormValues>({
    initialValues: {
      eventName: "",
      category: "",
      startTime: null,
      endTime: null,
      venue: "",
      description: "",
      coverPhoto: null,
      photos: [],
      hideVenue: 0,
      hideTicketOption: 0,
      repeats: {
        type: "none",
        interval: 1,
        stopCondition: "never",
        untilDate: null,
        times: 1,
        weekDays: Array(7).fill(false),
        monthDay: 1,
      },
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        setUploadMessage("Preparing your event…");
        setUploadProgress(null);

        const imageData = values?.coverPhoto;
        if (imageData) {
          setUploadMessage("Uploading cover photo…");
          const coverURL = await uploadCoverImage(imageData);
          if (!coverURL) {
            throw new Error("Cover upload failed");
          }
          (values as any)._coverURL = coverURL;
        }

        const images = values?.photos || [];
        let photoURLs: (string | null)[] = [];
        if (images.length > 0) {
          setUploadMessage("Uploading photos…");
          setUploadProgress({ current: 0, total: images.length });
          photoURLs = await uploadImagesSequentially(
            images,
            (current, total) => {
              const safeCurrent = Math.min(current, total);
              setUploadMessage(`Uploading photos ${safeCurrent} / ${total}…`);
              setUploadProgress({ current: safeCurrent, total });
            }
          );
          setUploadProgress({ current: images.length, total: images.length });
          setUploadMessage("Photos uploaded. Creating event…");
        }

        const locationName = values?.venue;
        setUploadMessage("Looking up venue location…");
        const coordinates = await getLatLngByLocationName(locationName);
        if (!coordinates) {
          throw new Error("Failed to fetch latitude and longitude");
        }
        const { lat, lng } = coordinates;

        setUploadMessage("Creating event…");

        const response = await fetch("/api/user/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coverImageURL: (values as any)._coverURL ?? null,
            images: photoURLs,
            eventName: values.eventName,
            profileId: profileId,
            startTime: values?.startTime,
            endTime: values?.endTime,
            venue: values?.venue,
            isVenueHidden: values?.hideVenue,
            hideTicketOption: values?.hideTicketOption,
            category: values?.category,
            description: values?.description,
            emailDescription: null,
            latitude: lat,
            longitude: lng,
            repeats: values?.repeats,
          }),
        });

        const data = await response.json();
        setMessage(data.message);

        if (data.status == 200) {
          try {
            await callApiForStep(2, {
              partialValues: {
                eventName: values.eventName,
                coverPhoto: (values as any)._coverURL ?? null,
                photos: photoURLs.filter((url) => url !== null) as string[],
                repeats: values?.repeats,
              },
            });
          } catch (step3Error) {
            console.error(
              "Step-3 email notification failed, but event was created:",
              step3Error
            );
          }
          setUploadMessage("Event created! Redirecting…");
          router.push("/events");
        } else {
          console.error("Event create failed", data);
          setUploadMessage("Failed to create event. Please try again.");
          try {
            await callApiForStep(2, {
              partialValues: {
                eventName: values.eventName,
                coverPhoto: (values as any)._coverURL ?? null,
                photos: photoURLs.filter((url) => url !== null) as string[],
                repeats: values?.repeats,
              },
            });
          } catch (step3Error) {
            console.error("Step-3 failure email also failed:", step3Error);
          }
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        setUploadMessage(
          "Upload failed. Please check your connection and try again."
        );
        // try {
        //   await callApiForStep(2, {
        //     partialValues: {
        //       coverPhoto: (values as any)._coverURL ?? null,
        //       photos:
        //         (photoURLs?.filter((url: any) => url !== null) as string[]) ||
        //         [],
        //       repeats: values?.repeats,
        //     },
        //   });
        // } catch (step3Error) {
        //   console.error("Step-3 failure email also failed:", step3Error);
        // }
        let message = "Unknown upload error";
        let stack = "";

        if (error instanceof Error) {
          message = error.message;
          stack = error.stack || "";
        } else if (typeof error === "string") {
          message = error;
        }

        await sendErrorEmail({
          errorMessage: message,
          stack,
          routeName: "Submit event form",
          userId: profileName,
        });
      } finally {
        setTimeout(() => {
          setIsSubmitting(false);
          setUploadMessage(null);
          setUploadProgress(null);
        }, 700);
      }
    },
    validateOnBlur: true,
    validateOnChange: true,
  });

  const stepFields: (keyof FormValues)[][] = [
    ["eventName", "category", "startTime", "endTime", "venue"],
    ["description"],
    ["coverPhoto", "photos"],
  ];

  useEffect(() => {
    const toPreview: Partial<FormValues> = {
      eventName: formik.values.eventName,
      category: formik.values.category,
      startTime: formik.values.startTime,
      endTime: formik.values.endTime,
      venue: formik.values.venue,
      hideVenue: formik.values.hideVenue,
      hideTicketOption: formik.values.hideTicketOption,
      coverPhoto: formik.values.coverPhoto,
      photos: formik.values.photos,
      description: formik.values.description,
    };
    setPreviewValues(toPreview);
  }, [formik.values]);

  const handleNext = async () => {
    window.scroll(0, 0);
    const currentFields = stepFields[activeStep];
    const errors: FormikErrors<FormValues> = await formik.validateForm();
    const hasErrorInStep = currentFields.some((f) => Boolean(errors[f]));

    if (hasErrorInStep) {
      currentFields.forEach((f) => formik.setFieldTouched(f, true, true));
      return;
    }

    if (activeStep !== 2) {
      try {
        const partialValues: Partial<FormValues> =
          activeStep === 0
            ? {
                eventName: formik.values.eventName,
                category: formik.values.category,
                startTime: formik.values.startTime,
                endTime: formik.values.endTime,
                venue: formik.values.venue,
                hideVenue: formik.values.hideVenue,
                hideTicketOption: formik.values.hideTicketOption,
              }
            : activeStep === 1
            ? {
                description: formik.values.description,
                eventName: formik.values.eventName,
              }
            : {};

        if (activeStep === 0 || activeStep === 1) {
          const resp = await callApiForStep(activeStep, { partialValues });

          if (!resp.ok) {
            setMessage(resp.error || "Failed to save step. Please try again.");
            setOpen(true);
            return;
          }
        }
      } catch (err) {
        console.error("Unexpected error saving step:", err);
        setMessage("Unexpected error. Try again.");
        setOpen(true);
        return;
      }
    }

    if (activeStep < steps.length - 1) {
      setActiveStep((s) => s + 1);
    } else {
      formik.handleSubmit();
    }
  };

  const handleBack = () => {
    window.scroll(0, 0);
    if (activeStep > 0) setActiveStep((s) => s - 1);
  };

  const onCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files && e.currentTarget.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);
    formik.setFieldValue("coverPhoto", file);
    if (e.target) (e.target as HTMLInputElement).value = "";
  };

  const previews = formik.values.photos || [];

  const onTileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.currentTarget.files && e.currentTarget.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const current = [...(formik.values.photos || [])];
      if (index < current.length) {
        current[index] = dataUrl;
      } else {
        current.push(dataUrl);
      }
      const sliced = current.slice(0, MAX_PHOTOS);
      formik.setFieldValue("photos", sliced);
      formik.setFieldError("photos", undefined);
      formik.setFieldTouched("photos", true, false);
    };
    reader.onerror = (err) => {
      console.error("Error reading tile file", err);
      formik.setFieldError("photos", "Failed to read photo");
    };
    reader.readAsDataURL(file);
    if (e.target) (e.target as HTMLInputElement).value = "";
  };

  const removePhoto = (index: number) => {
    const current = [...(formik.values.photos || [])];
    current.splice(index, 1);
    formik.setFieldValue("photos", current);
    if (current.length <= MAX_PHOTOS) formik.setFieldError("photos", undefined);
  };

  function CustomPopper(props: PopperProps) {
    return <Popper {...props} placement="top-start" />;
  }

  const onTilePick = (i: number) => inputRefs.current[i]?.click();

  const showAddBadgeIndex =
    formik.values.photos && formik.values.photos.length < MAX_PHOTOS
      ? formik.values.photos.length
      : -1;

  const Tile = ({ i, showAddBadge }: { i: number; showAddBadge?: boolean }) => {
    const hasPhoto = !!previews[i];
    return (
      <Box
        role="button"
        aria-label={hasPhoto ? `Photo slot ${i + 1}` : `Add photo ${i + 1}`}
        onClick={() => onTilePick(i)}
        sx={{
          width: 170,
          height: 120,
          border: "2px dashed rgba(255,255,255,0.7)",
          borderRadius: 3,
          backgroundColor: "#1d1d1d",
          position: "relative",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          transition: "transform 0.15s ease",
          "&:hover": { transform: "scale(1.02)" },
        }}
      >
        {!hasPhoto ? (
          <Box sx={{ textAlign: "center" }}>
            <PhotoCameraOutlinedIcon
              sx={{ fontSize: { xs: 26, sm: 30, md: 34 }, color: "#c2185b" }}
            />
            {showAddBadge && (
              <Typography
                sx={{
                  color: "#c2185b",
                  fontSize: { xs: 10, sm: 12 },
                  mt: 0.5,
                  fontWeight: 700,
                }}
              >
                Add Photo
              </Typography>
            )}
          </Box>
        ) : (
          <>
            <img
              src={previews[i] as string}
              alt={`public-photo-${i + 1}`}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: 6,
                bottom: 6,
                display: "flex",
                gap: 0.5,
              }}
            >
              <Tooltip title="Replace">
                <IconButton
                  size="small"
                  sx={{ bgcolor: "rgba(0,0,0,0.6)", color: "#fff" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTilePick(i);
                  }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  sx={{ bgcolor: "rgba(0,0,0,0.6)", color: "#fff" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(i);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}

        <input
          ref={(el: any) => (inputRefs.current[i] = el)}
          type="file"
          accept="image/*"
          onChange={(e) => onTileChange(i, e)}
          style={{ display: "none" }}
        />
      </Box>
    );
  };

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <>
      {profileId && <ProfileImgCheckerModel profileId={profileId} />}
      <Header />
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <Box
            sx={{
              background:
                "radial-gradient(circle at top left, #1A0B2E 0%, #000000 100%)",
              width: "100%",
            }}
          >
            <ParticleField />
            <Container
              maxWidth={isXs ? "sm" : "lg"}
              sx={{
                px: { xs: 1, sm: 2, md: 3 },
                py: { xs: 1.5, sm: 2 },
              }}
            >
              <Paper
                elevation={24}
                sx={{
                  p: { xs: 2, sm: 3, md: 4 },
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  overflowY: { xs: "auto", sm: "visible" },
                  // pb: { xs: 10, sm: 3 },
                }}
              >
                {isSubmitting && (
                  <Dialog
                    open={isSubmitting}
                    disableEscapeKeyDown
                    onClose={(event: any, reason: any) => {
                      if (
                        reason === "backdropClick" ||
                        reason === "escapeKeyDown"
                      )
                        return;
                    }}
                    fullWidth={false}
                    maxWidth="xs"
                    aria-labelledby="uploading-dialog-title"
                    BackdropProps={{
                      sx: {
                        backgroundColor: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(6px)",
                      },
                    }}
                    PaperProps={{
                      sx: {
                        borderRadius: 2,
                        p: 2,
                        background:
                          "linear-gradient(180deg, rgba(20,20,20,0.98), rgba(10,10,10,0.98))",
                        color: "#fff",
                        boxShadow: (theme) => theme.shadows[24],
                      },
                    }}
                  >
                    <DialogContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1.25,
                        py: 3,
                        px: { xs: 3, sm: 4 },
                        textAlign: "center",
                      }}
                    >
                      <CircularProgress size={56} />
                      <Typography
                        id="uploading-dialog-title"
                        sx={{ mt: 1, fontWeight: 700 }}
                      >
                        {uploadMessage ?? "Uploading…"}
                      </Typography>

                      {uploadProgress && (
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, opacity: 0.95 }}
                        >
                          {`(${uploadProgress.current} / ${uploadProgress.total})`}
                        </Typography>
                      )}

                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5, opacity: 0.85 }}
                      >
                        Please do not refresh or close the window.
                      </Typography>
                    </DialogContent>
                  </Dialog>
                )}

                <Box
                  sx={{
                    textAlign: "center",
                    mb: 4,
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "#ffffff",
                      fontSize: { xs: "1.8rem", sm: "2.4rem" },
                      background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      mb: 1,
                    }}
                  >
                    Create Your Event
                  </Typography>
                </Box>
                <Stepper
                  activeStep={activeStep}
                  alternativeLabel
                  sx={{
                    background: "transparent",
                    width: "100%",
                    margin: "0 auto 45px auto",
                  }}
                >
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel
                        sx={{
                          "& .MuiStepLabel-label": {
                            color: "#fff !important",
                            fontSize: { xs: "0.7rem", sm: "0.85rem" },
                          },
                          "& .MuiStepIcon-root": {
                            color: "rgba(255,255,255,0.3)",
                          },
                          "& .MuiStepIcon-root.Mui-active": {
                            color: "#c2185b",
                          },
                          "& .MuiStepIcon-root.Mui-completed": {
                            color: "#c2185b",
                          },
                          "@media (max-width:600px)": {
                            "& .MuiStepIcon-text": {
                              fontSize: "15px",
                              fill: "#fff",
                              textAnchor: "middle",
                              dominantBaseline: "central",
                            },
                            "& .MuiStepIcon-root": {
                              width: "30px",
                              height: "30px",
                            },
                          },
                        }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Box>
                  <form onSubmit={formik.handleSubmit}>
                    {activeStep === 0 && (
                      <Grid
                        container
                        spacing={isXs ? 1 : 2}
                        alignItems="center"
                      >
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Event Name"
                            name="eventName"
                            placeholder="Your event name"
                            variant="outlined"
                            value={formik.values.eventName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            autoComplete="false"
                            error={
                              formik.touched.eventName &&
                              Boolean(formik.errors.eventName)
                            }
                            helperText={
                              formik.touched.eventName &&
                              formik.errors.eventName
                            }
                            sx={yourTextFieldSx}
                          />
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <TextField
                            select
                            fullWidth
                            label="Category"
                            name="category"
                            value={formik.values.category}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            variant="outlined"
                            error={
                              formik.touched.category &&
                              Boolean(formik.errors.category)
                            }
                            autoComplete="false"
                            helperText={
                              formik.touched.category && formik.errors.category
                            }
                            sx={yourTextFieldSx}
                          >
                            <MenuItem value="" disabled>
                              What's your category?
                            </MenuItem>
                            <MenuItem value="House Party">House Party</MenuItem>
                            <MenuItem value="Meet & Greet">
                              Meet & Greet
                            </MenuItem>
                            <MenuItem value="Hotel Takeover">
                              Hotel Takeover
                            </MenuItem>
                          </TextField>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Autocomplete
                            id="city-autocomplete"
                            open={openCity}
                            onOpen={() => setOpenCity(true)}
                            onClose={(event, reason) => {
                              if (isXs && reason === "blur") return;
                              setOpenCity(false);
                            }}
                            disableClearable
                            disablePortal
                            PopperComponent={isXs ? CustomPopper : undefined}
                            isOptionEqualToValue={(option, value) =>
                              option.City === value.City
                            }
                            getOptionLabel={(option) => option.City}
                            options={cityOption.map((city) => ({
                              ...city,
                              key: city.id,
                            }))}
                            loading={cityLoading}
                            inputValue={cityInput}
                            onInputChange={(event, newInputValue) => {
                              if (
                                event?.type === "change" ||
                                event?.type === "click"
                              )
                                setCityInput(newInputValue);
                            }}
                            onChange={(event, newValue) => {
                              if (newValue?.City) {
                                formik.setFieldValue("venue", newValue.City);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                name="venue"
                                variant="outlined"
                                label="City (location of your event)"
                                autoComplete="address-level2"
                                error={
                                  formik.touched.venue &&
                                  Boolean(formik.errors.venue)
                                }
                                helperText={
                                  formik.touched.venue && formik.errors.venue
                                }
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {cityLoading ? (
                                        <CircularProgress
                                          color="inherit"
                                          size={15}
                                        />
                                      ) : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                                sx={yourTextFieldSx}
                              />
                            )}
                          />
                        </Grid>

                        <Grid item xs={12} md={12}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              mt: { xs: 1, md: 0 },
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={
                                    formik.values.hideVenue == 1 ? true : false
                                  }
                                  onChange={(e) =>
                                    formik.setFieldValue(
                                      "hideVenue",
                                      e.target.checked ? 1 : 0
                                    )
                                  }
                                  name="hideVenue"
                                  sx={{
                                    color: "#fff",
                                    p: 0.5,
                                    marginLeft: "10px",
                                    "& .MuiSvgIcon-root": { fontSize: 22 },
                                  }}
                                />
                              }
                              label={
                                <Typography
                                  sx={{ color: "#fff", fontSize: 14 }}
                                >
                                  Hide Address
                                </Typography>
                              }
                            />
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={12}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              mt: { xs: 1, md: 0 },
                              mb: { xs: 2, md: 1 },
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={
                                    formik.values.hideTicketOption == 1
                                      ? true
                                      : false
                                  }
                                  onChange={(e) =>
                                    formik.setFieldValue(
                                      "hideTicketOption",
                                      e.target.checked ? 1 : 0
                                    )
                                  }
                                  name="hideTicketOption"
                                  sx={{
                                    color: "#fff",
                                    p: 0.5,
                                    marginLeft: "10px",
                                    "& .MuiSvgIcon-root": { fontSize: 22 },
                                  }}
                                />
                              }
                              label={
                                <Typography
                                  sx={{ color: "#fff", fontSize: 14 }}
                                >
                                  Hide Ticket Purchase Option
                                </Typography>
                              }
                            />
                          </Box>
                        </Grid>

                        {/* START */}
                        <Grid item xs={12} md={6}>
                          <DateTimePicker
                            label="Start Time"
                            value={formik.values.startTime}
                            onChange={(value: Moment | null) => {
                              formik.setFieldValue("startTime", value);

                              if (value) {
                                const sixHoursLater = moment(value).add(
                                  6,
                                  "hours"
                                );
                                formik.setFieldValue("endTime", sixHoursLater);
                              } else {
                                formik.setFieldValue("endTime", null);
                              }
                            }}
                            onClose={() =>
                              formik.setFieldTouched("startTime", true, true)
                            }
                            disablePast
                            minDateTime={moment().add(1, "minute")}
                            sx={{ width: "100%" }}
                            slotProps={{
                              textField: {
                                // required: true,
                                fullWidth: true,
                                error:
                                  formik.touched.startTime &&
                                  Boolean(formik.errors.startTime),
                                helperText:
                                  formik.touched.startTime &&
                                  (formik.errors.startTime as
                                    | string
                                    | undefined),
                                sx: yourTextFieldSx,
                              },
                            }}
                          />
                        </Grid>

                        {/* END */}
                        <Grid item xs={12} md={6}>
                          {(() => {
                            const start: Moment | null =
                              formik.values.startTime;
                            const now = moment();
                            const minEnd = start
                              ? moment(start).add(1, "minute")
                              : now.clone().add(1, "minute");
                            return (
                              <DateTimePicker
                                label="End Time"
                                value={formik.values.endTime}
                                onChange={(value: Moment | null) => {
                                  if (!value) {
                                    formik.setFieldValue("endTime", null);
                                    return;
                                  }
                                  const startVal: Moment | null =
                                    formik.values.startTime;
                                  if (startVal) {
                                    const picked = moment(value);
                                    const final = picked.isAfter(startVal)
                                      ? picked
                                      : moment(startVal).add(1, "minute");
                                    formik.setFieldValue("endTime", final);
                                  } else {
                                    formik.setFieldValue("endTime", value);
                                  }
                                }}
                                onClose={() =>
                                  formik.setFieldTouched("endTime", true, true)
                                }
                                minDateTime={minEnd}
                                sx={{ width: "100%" }}
                                slotProps={{
                                  textField: {
                                    // required: true,
                                    fullWidth: true,
                                    error:
                                      formik.touched.endTime &&
                                      Boolean(formik.errors.endTime),
                                    helperText:
                                      formik.touched.endTime &&
                                      (formik.errors.endTime as
                                        | string
                                        | undefined),
                                    sx: yourTextFieldSx,
                                  },
                                }}
                              />
                            );
                          })()}
                        </Grid>
                      </Grid>
                    )}

                    {activeStep === 1 && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                          <Typography
                            variant="h6"
                            sx={{ color: "#fff", mb: 1, fontSize: "16px" }}
                          >
                            Description
                          </Typography>
                          <Editor
                            apiKey={
                              "3yffl36ic8qni4zhtxbmc0t1sujg1m25sc4l638375rwb5vs"
                            }
                            value={formik.values.description}
                            onEditorChange={(content) =>
                              formik.setFieldValue("description", content)
                            }
                            onBlur={() =>
                              formik.setFieldTouched("description", true, true)
                            }
                            init={{
                              menubar: false,
                              statusbar: false,
                              plugins: [
                                "advlist",
                                "autolink",
                                "lists",
                                "link",
                                "image",
                                "charmap",
                                "preview",
                                "anchor",
                                "searchreplace",
                                "visualblocks",
                                "code",
                                "fullscreen",
                                "insertdatetime",
                                "media",
                                "table",
                                "code",
                                "help",
                                "wordcount",
                              ],
                              toolbar:
                                "undo redo | blocks | " +
                                "bold italic forecolor | alignleft aligncenter " +
                                "alignright alignjustify | bullist numlist outdent indent | " +
                                "removeformat | help",
                              content_style:
                                "body { background-color: #2d2d2d; color: white; }",
                              skin: true,
                            }}
                          />
                          {formik.touched.description &&
                            formik.errors.description && (
                              <Typography sx={{ color: "#ff0000ff", mt: 1 }}>
                                {formik.errors.description as string}
                              </Typography>
                            )}
                        </Grid>
                      </Grid>
                    )}

                    {activeStep === 2 && (
                      <Grid container spacing={4} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                          <Typography
                            variant="h6"
                            sx={{ color: "#fff", mb: 2, fontSize: "16px" }}
                          >
                            Cover Photo (Required)
                          </Typography>

                          <Box
                            sx={{
                              width: "100%",
                              height: isXs ? 200 : 250,
                              border: "2px dashed rgba(255,255,255,0.7)",
                              borderRadius: 4,
                              backgroundColor: "#1d1d1d",
                              mx: "auto",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={onCoverFileChange}
                              style={{ display: "none" }}
                              id="upload-cover"
                            />
                            <label htmlFor="upload-cover">
                              {coverPreview ? (
                                <>
                                  <img
                                    src={coverPreview}
                                    alt="Cover Preview"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      borderRadius: "16px",
                                    }}
                                  />
                                  <IconButton
                                    component="span"
                                    sx={{
                                      position: "absolute",
                                      bottom: 8,
                                      right: 8,
                                      backgroundColor: "rgba(0,0,0,0.6)",
                                      color: "#fff",
                                      "&:hover": {
                                        backgroundColor: "rgba(0,0,0,0.8)",
                                      },
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </>
                              ) : (
                                <IconButton component="span">
                                  <PhotoCameraOutlinedIcon
                                    sx={{ fontSize: 60, color: "#c2185b" }}
                                  />
                                </IconButton>
                              )}
                            </label>
                          </Box>

                          {formik.touched.coverPhoto &&
                            typeof formik.errors.coverPhoto === "string" && (
                              <Typography
                                color="error"
                                variant="body2"
                                sx={{ mt: 1 }}
                              >
                                {formik.errors.coverPhoto}
                              </Typography>
                            )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography
                            variant="h6"
                            sx={{ color: "#fff", mb: 2, fontSize: "16px" }}
                          >
                            Photos (Optional - max 3)
                          </Typography>

                          <Box>
                            <Grid container spacing={2}>
                              {Array.from({ length: MAX_PHOTOS }).map(
                                (_, i) => (
                                  <Grid
                                    key={i}
                                    item
                                    xs={4}
                                    md={4}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Tile
                                      i={i}
                                      showAddBadge={showAddBadgeIndex === i}
                                    />
                                  </Grid>
                                )
                              )}
                            </Grid>

                            {formik.values.photos.length > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 1,
                                  mt: 1,
                                  justifyContent: "flex-start",
                                }}
                              >
                                {formik.values.photos.map((p, idx) => (
                                  <Box
                                    key={idx}
                                    sx={{
                                      width: 110,
                                      height: 110,
                                      borderRadius: 2,
                                      overflow: "hidden",
                                      position: "relative",
                                      backgroundColor: "#000",
                                      border:
                                        "1px solid rgba(255,255,255,0.06)",
                                    }}
                                  >
                                    <img
                                      src={p}
                                      alt={`photo-${idx}`}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => removePhoto(idx)}
                                      sx={{
                                        position: "absolute",
                                        top: 6,
                                        right: 6,
                                        backgroundColor: "rgba(0,0,0,0.6)",
                                        color: "#fff",
                                        "&:hover": {
                                          backgroundColor: "rgba(0,0,0,0.8)",
                                        },
                                      }}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ))}
                              </Box>
                            )}

                            {formik.touched.photos && formik.errors.photos && (
                              <Typography
                                color="error"
                                variant="body2"
                                sx={{ mt: 1 }}
                              >
                                {formik.errors.photos as string}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 3,
                        gap: 2,
                      }}
                    >
                      <Button variant="outlined" onClick={handleBack}>
                        Back
                      </Button>

                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={isSubmitting}
                        startIcon={
                          isSubmitting && activeStep === steps.length - 1 ? (
                            <CircularProgress size={18} />
                          ) : undefined
                        }
                      >
                        {activeStep === steps.length - 1
                          ? isSubmitting
                            ? "Submitting…"
                            : "Submit"
                          : "Next"}
                      </Button>
                    </Box>
                  </form>
                </Box>
              </Paper>
            </Container>
            <Snackbar
              open={open}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              autoHideDuration={5000}
              onClose={handleClose}
            >
              <Alert
                severity="success"
                sx={{
                  backgroundColor: "white",
                  color: "#fc4c82",
                  fontWeight: "bold",
                  alignItems: "center",
                  borderRight: "5px solid #fc4c82",
                }}
                icon={
                  <Box
                    component="img"
                    src="/icon.png"
                    alt="Logo"
                    sx={{
                      width: "20px",
                      height: "20px",
                    }}
                  />
                }
              >
                {message}
              </Alert>
            </Snackbar>
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
      <Box sx={{ height: isXs ? "63.2px" : "0" }} />
      {isXs ? <AppFooterMobile /> : <AppFooterDesktop />}
    </>
  );
};

export default CreateEventForm;
