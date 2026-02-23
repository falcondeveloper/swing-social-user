"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  CircularProgress,
  useMediaQuery,
  createTheme,
  ThemeProvider,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Cropper from "react-easy-crop";
import { useRouter } from "next/navigation";
import "@tensorflow/tfjs";
import { useFormik } from "formik";
import * as Yup from "yup";
import { EditIcon } from "lucide-react";
import Carousel from "@/commonPage/Carousel";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Fade from "@mui/material/Fade";

type Params = Promise<{ id: string }>;

type DialogType = "success" | "error";

type StepType =
  | "intro"
  | "avatar"
  | "selfie"
  | "verifying"
  | "success"
  | "failed";
type SelfieStatus = "idle" | "uploading" | "verifying";

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

async function preprocessImageForUpload(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");

    img.onload = () => {
      // Target dimensions (same as server-side)
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1500;
      const TARGET_SIZE_KB = 500;

      let width = img.width;
      let height = img.height;

      // Calculate aspect ratio resize
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const widthRatio = MAX_WIDTH / width;
        const heightRatio = MAX_HEIGHT / height;
        const ratio = Math.min(widthRatio, heightRatio);

        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // High-quality rendering
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Try progressively lower quality until under target size
      let quality = 0.92;

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Blob creation failed"));
              return;
            }

            const sizeKB = blob.size / 1024;

            // If too large and quality can be reduced, try again
            if (sizeKB > TARGET_SIZE_KB && quality > 0.7) {
              quality -= 0.05;
              tryCompress();
            } else {
              console.log(
                `Client-side compressed to ${Math.round(sizeKB)}KB at quality ${Math.round(quality * 100)}%`,
              );
              resolve(blob);
            }
          },
          "image/webp",
          quality,
        );
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = dataUrl;
  });
}

export default function UploadAvatar({ params }: { params: Params }) {
  const router = useRouter();
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [croppedAvatar, setCroppedAvatar] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<any>(null);
  const [openCropper, setOpenCropper] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSelfieUploading, setIsSelfieUploading] = useState(false);
  const [step, setStep] = useState<StepType>("intro");
  const [selfieStatus, setSelfieStatus] = useState<SelfieStatus>("idle");
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>("success");
  const [dialogMessage, setDialogMessage] = useState("");
  const [isCropAnimating, setIsCropAnimating] = useState(false);

  const openDialog = (type: DialogType, message: string) => {
    setDialogType(type);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  useEffect(() => {
    (async () => {
      const p = await params;
      setUserId(p.id);
    })();
  }, [params]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;

        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedArea(null);

        setAvatarImage(null);

        setTimeout(() => {
          setAvatarImage(imageData);
          setOpenCropper(true);
        }, 50);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = async () => {
    if (!croppedArea || !avatarImage) return;

    const image = new Image();
    image.src = avatarImage;

    image.onload = async () => {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const { x, y, width, height } = croppedArea;

      const workCanvas = document.createElement("canvas");
      workCanvas.width = width * scaleX;
      workCanvas.height = height * scaleY;

      const wctx = workCanvas.getContext("2d");
      if (!wctx) return;

      wctx.imageSmoothingEnabled = true;
      wctx.imageSmoothingQuality = "high";

      wctx.drawImage(
        image,
        x * scaleX,
        y * scaleY,
        width * scaleX,
        height * scaleY,
        0,
        0,
        workCanvas.width,
        workCanvas.height,
      );

      const TARGET_WIDTH = 1200;
      const TARGET_HEIGHT = 1500;

      const outCanvas = document.createElement("canvas");
      outCanvas.width = TARGET_WIDTH;
      outCanvas.height = TARGET_HEIGHT;

      const octx = outCanvas.getContext("2d");
      if (!octx) return;

      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = "high";

      octx.drawImage(workCanvas, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      outCanvas.toBlob(
        (blob) => {
          if (!blob) return;

          const reader = new FileReader();
          reader.onloadend = () => {
            const webpDataUrl = reader.result as string;

            setIsCropAnimating(true);

            setTimeout(() => {
              setCroppedAvatar(webpDataUrl);
              formik.setFieldValue("avatar", webpDataUrl);
              setOpenCropper(false);

              setTimeout(() => {
                setIsCropAnimating(false);
              }, 300);
            }, 150);
          };

          reader.readAsDataURL(blob);
        },
        "image/webp",
        0.95,
      );
    };
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedArea(croppedAreaPixels);
  };

  async function uploadAvatarFromLocalStorage(
    userId: string,
    avatarUrl: string,
  ) {
    const res = await fetch("/api/s3/upload-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        avatarUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || "AVATAR_UPLOAD_FAILED");
    }

    localStorage.setItem("avatarS3Uploaded", "true");
    localStorage.setItem("avatarS3Key", data.key);
  }

  const uploadImage = async (dataUrl: string): Promise<string> => {
    // 🚀 NEW: Preprocess on client side first
    console.time("Client-side preprocessing");
    const preprocessedBlob = await preprocessImageForUpload(dataUrl);
    console.timeEnd("Client-side preprocessing");

    const formData = new FormData();
    formData.append("image", preprocessedBlob, `${Date.now()}.webp`);

    console.time("Server upload");
    const res = await fetch("/api/user/upload", {
      method: "POST",
      body: formData,
    });
    console.timeEnd("Server upload");

    const result = await res.json();

    if (!result.blobUrl) {
      throw new Error("Upload failed");
    }

    localStorage.setItem("Avatar", result?.blobUrl);

    uploadAvatarFromLocalStorage(userId, result?.blobUrl).catch((err) => {
      console.error("Avatar upload failed:", err);
    });

    return result.blobUrl;
  };

  const formik = useFormik({
    initialValues: {
      avatar: "",
    },
    validationSchema: Yup.object().shape({
      avatar: Yup.string().required("Please upload your avatar"),
    }),
    onSubmit: async (values) => {
      setIsUploading(true);
      try {
        const avatarUrl = await uploadImage(values.avatar);

        if (!avatarUrl) {
          formik.setFieldError("banner", "Image upload failed. Try again.");
          setIsUploading(false);
          return;
        }

        const res = await fetch("/api/user/avatarUpload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pid: userId,
            Questionable: 1,
            avatar: avatarUrl,
          }),
        });

        if (!res.ok) {
          throw new Error("Avatar save failed");
        }

        // await router.push(`/bannerupload/${userId}`);
        setStep("selfie");
      } catch (err) {
        console.error("Form submit failed:", err);
        setIsUploading(false);
      }
    },
  });

  async function normalizeImage(file: File): Promise<Blob> {
    const img = await createImageBitmap(file);

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS_ERROR");

    ctx.drawImage(img, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.9);
    });
  }

  async function uploadSelfieToS3(userId: string, file: File) {
    const presignRes = await fetch("/api/s3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        type: "selfie",
      }),
    });

    const { uploadUrl, key } = await presignRes.json();
    const normalizedBlob = await normalizeImage(file);

    await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/webp",
      },
      body: normalizedBlob,
    });

    return key;
  }

  const handleSelfieUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelfiePreview(URL.createObjectURL(file));
    setSelfieStatus("uploading");

    try {
      // 1️⃣ Upload selfie to S3
      const selfieKey = await uploadSelfieToS3(userId, file);

      // 2️⃣ Verify face
      setSelfieStatus("verifying");

      const avatarKey = localStorage.getItem("avatarS3Key");

      const res = await fetch("/api/user/verify-selfie/same-selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarKey,
          selfieKey,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok || !data.match) {
        throw new Error(data.message || "Face verification failed");
      }

      // 3️⃣ Update badge
      await fetch("/api/user/verify-selfie/update-profile-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      openDialog(
        "success",
        "Your selfie has been verified successfully. A verification badge has been added to your profile.",
      );

      localStorage.removeItem("avatarS3Key");
      localStorage.removeItem("avatarS3Uploaded");
    } catch (err: any) {
      setSelfiePreview(null);
      openDialog(
        "error",
        err.message ||
          "Verification failed. Double check your profile picture and verification picture are of your face.",
      );
    } finally {
      setSelfieStatus("idle");
    }
  };

  const handleSkipSelfie = () => {
    localStorage.setItem("selfieSkipped", "true");
    router.push(`/bannerupload/${userId}`);
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        {selfieStatus !== "idle" && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: 3000,
              background: "rgba(10, 1, 24, 0.92)",
              backdropFilter: "blur(8px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <CircularProgress
              size={64}
              thickness={4}
              sx={{ color: "#FF2D55", mb: 3 }}
            />

            <Typography
              variant="h6"
              sx={{ color: "#fff", fontWeight: 600, mb: 1 }}
            >
              {selfieStatus === "uploading"
                ? "Uploading your selfie"
                : "Verifying your identity"}
            </Typography>

            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
              This usually takes a few seconds. Please keep the app open.
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            background:
              "radial-gradient(circle at top left, #1A0B2E 0%, #000000 100%)",
            position: "relative",
            overflow: "hidden",
            width: "100%",
            minHeight: "100vh",
          }}
        >
          <ParticleField />
          <Container
            maxWidth="sm"
            sx={{
              px: { xs: 1, sm: 2 },
              py: 1,
            }}
          >
            <Paper
              elevation={24}
              sx={{
                width: "100%",
                p: { xs: 2, sm: 3, md: 4 },
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
              }}
            >
              <Stepper
                activeStep={3}
                alternativeLabel
                sx={{
                  background: "transparent",
                  width: "100%",
                  margin: "0 auto 16px auto",
                }}
              >
                {[
                  "Profile Info",
                  "Verify Phone",
                  "Preferences",
                  "Avatar & Banner",
                  "About",
                ].map((label) => (
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
                      }}
                    ></StepLabel>
                  </Step>
                ))}
              </Stepper>

              {step === "intro" && (
                <Box
                  sx={{
                    minHeight: "55vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 360,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        color: "#fff",
                        fontWeight: 700,
                        lineHeight: 1.25,
                        mb: 1,
                      }}
                    >
                      Complete your profile
                    </Typography>

                    <Typography
                      sx={{
                        color: "#aaa",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        mb: 2,
                      }}
                    >
                      Start by uploading a clear profile photo so others can
                      recognize you.
                    </Typography>

                    <Typography
                      sx={{
                        color: "#bbb",
                        fontSize: "0.85rem",
                        lineHeight: 1.6,
                        mb: 3,
                      }}
                    >
                      <strong style={{ color: "#fff" }}>
                        Selfie verification is optional for now.
                      </strong>
                      <br />
                      You can skip it and verify your selfie later to get a
                      verified badge.
                    </Typography>

                    <Button
                      variant="contained"
                      onClick={() => setStep("avatar")}
                      sx={{
                        px: 4,
                        py: 1.2,
                        borderRadius: "10px",
                      }}
                    >
                      Get Started
                    </Button>
                  </Box>
                </Box>
              )}

              {step === "avatar" && (
                <>
                  <form
                    onSubmit={formik.handleSubmit}
                    style={{ width: "100%" }}
                  >
                    <Grid>
                      <Typography
                        sx={{
                          textAlign: "center",
                          color: "#ffffffff",
                          fontWeight: "bold",
                          fontSize: "0.875rem",
                        }}
                      >
                        Look your best! Upload a clear, confident photo of you.
                        A great pic gets great results.
                      </Typography>

                      <Grid item xs={12} sx={{ mt: 2, textAlign: "center" }}>
                        <Typography
                          variant="h6"
                          sx={{ color: "#c2185b", fontWeight: "bold", mb: 2 }}
                        >
                          Primary Profile Picture
                        </Typography>

                        <Box
                          sx={{
                            width: 200,
                            aspectRatio: "4 / 5",
                            border: "2px dashed #fff",
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
                            onChange={onFileChange}
                            style={{ display: "none" }}
                            id="upload-avatar"
                          />
                          <label htmlFor="upload-avatar">
                            {croppedAvatar ? (
                              <>
                                <Box
                                  component="img"
                                  src={croppedAvatar}
                                  alt="Cropped Avatar"
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    transition:
                                      "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                                    transform: isCropAnimating
                                      ? "scale(0.92)"
                                      : "scale(1)",
                                    opacity: isCropAnimating ? 0 : 1,
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
                                  sx={{ fontSize: 40, color: "#c2185b" }}
                                />
                              </IconButton>
                            )}
                          </label>
                        </Box>

                        {formik.errors.avatar && (
                          <Typography
                            color="error"
                            variant="body2"
                            sx={{ mt: 1 }}
                          >
                            {formik.errors.avatar}
                          </Typography>
                        )}
                      </Grid>

                      <Typography
                        sx={{
                          textAlign: "center",
                          color: "#ffffffff",
                          fontWeight: "bold",
                          mt: 2,
                          fontSize: "0.675rem",
                        }}
                      >
                        No nudity, vulgarity, cartoons, or objects. Real faces
                        only - this is a community of real people.
                      </Typography>

                      <Grid item xs={12} sx={{ textAlign: "center", mt: 4 }}>
                        <Button
                          type="submit"
                          disabled={isUploading}
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            backgroundColor: "#c2185b",
                            color: "#fff",
                            "&:hover": { backgroundColor: "#ad1457" },
                          }}
                        >
                          {isUploading ? (
                            <>
                              <CircularProgress
                                size={24}
                                sx={{ color: "#fff" }}
                              />
                              <Typography
                                sx={{
                                  color: "#fff",
                                  fontSize: "0.875rem",
                                  position: "absolute",
                                  top: "100%",
                                  width: "400px",
                                  marginTop: "8px",
                                }}
                              >
                                Don't take your pants off yet, give us a sec...
                              </Typography>
                            </>
                          ) : (
                            <ArrowForwardIosIcon />
                          )}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </>
              )}

              {step === "selfie" && (
                <Box textAlign="center">
                  <Typography variant="h6" color="#fff" fontWeight="bold">
                    Selfie Verification
                  </Typography>

                  {/* ✅ CLIENT REQUIRED TEXT */}
                  <Typography
                    sx={{ color: "#bbb", mt: 1, mb: 2, fontSize: "0.9rem" }}
                  >
                    Verification must match the face picture in your profile.
                    <br />
                    <strong style={{ color: "#fff" }}>
                      Double check your profile picture and verification picture
                      are of your face.
                    </strong>
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        width: 230,
                        height: 230,
                      }}
                    >
                      {/* CIRCULAR IMAGE */}
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          border: "3px dashed rgba(255, 255, 255, 0.2)",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        {isSelfieUploading ? (
                          <Box
                            sx={{
                              position: "fixed",
                              inset: 0,
                              zIndex: 2000,
                              background: "rgba(10, 1, 24, 0.92)",
                              backdropFilter: "blur(6px)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                              px: 3,
                            }}
                          >
                            <CircularProgress
                              size={60}
                              thickness={4}
                              sx={{ color: "#FF2D55", mb: 3 }}
                            />

                            <Typography
                              variant="h6"
                              sx={{
                                color: "white",
                                fontWeight: 600,
                                mb: 1,
                              }}
                            >
                              We’re verifying your selfie
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              This usually takes 15–30 seconds. Please don’t
                              close the app.
                            </Typography>
                          </Box>
                        ) : selfiePreview ? (
                          <Box
                            component="img"
                            src={selfiePreview}
                            alt="Selfie"
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <CameraAltIcon
                            sx={{
                              fontSize: 60,
                              color: "rgba(255,255,255,0.3)",
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleSelfieUpload}
                    hidden
                    id="selfie-upload"
                  />

                  <Button
                    variant="contained"
                    startIcon={<CameraAltIcon />}
                    onClick={() =>
                      document.getElementById("selfie-upload")?.click()
                    }
                    fullWidth
                    sx={{
                      background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                      py: 1.5,
                      borderRadius: "50px",
                    }}
                  >
                    Take Selfie
                  </Button>

                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    {/* Skip selfie – subtle text link */}
                    <Button
                      variant="text"
                      onClick={handleSkipSelfie}
                      sx={{
                        color: "rgba(255,255,255,0.65)",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        textTransform: "none",
                        padding: 0,
                        minHeight: "auto",
                        "&:hover": {
                          color: "#fff",
                          background: "transparent",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Skip selfie verification for now
                    </Button>

                    {/* Change profile photo – outlined secondary CTA */}
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => {
                        setIsUploading(false);
                        setStep("avatar");
                      }}
                      sx={{
                        mt: 0.5,
                        px: 3,
                        py: 0.9,
                        mb: 2,
                        borderRadius: "50px",
                        borderColor: "rgba(255,255,255,0.35)",
                        color: "#fff",
                        fontSize: "0.85rem",
                        textTransform: "none",
                        "&:hover": {
                          borderColor: "#fff",
                          background: "rgba(255,255,255,0.05)",
                        },
                      }}
                    >
                      Change profile photo
                    </Button>
                  </Box>

                  {croppedAvatar && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        sx={{
                          color: "#aaa",
                          fontSize: "0.75rem",
                          mb: 1,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        Your Uploaded Avatar
                      </Typography>

                      <Box
                        sx={{
                          width: 200,
                          aspectRatio: "4 / 5",
                          mx: "auto",
                          borderRadius: "10px",
                          overflow: "hidden",
                          border: "2px solid #c2185b",
                        }}
                      >
                        <img
                          src={croppedAvatar}
                          alt="Avatar"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {step === "failed" && (
                <Box
                  textAlign="center"
                  sx={{
                    py: 4,
                    px: 2,
                    animation: "fadeIn 0.4s ease-in-out",
                  }}
                >
                  {/* ❌ Icon */}
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      mx: "auto",
                      mb: 2,
                      borderRadius: "50%",
                      background: "rgba(255,45,85,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 36,
                      color: "#FF2D55",
                    }}
                  >
                    ✕
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{ color: "#FF2D55", fontWeight: 700, mb: 1 }}
                  >
                    Verification Failed
                  </Typography>

                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.75)",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      mb: 3,
                    }}
                  >
                    Verification must match the face picture in your profile.
                    <br />
                    <strong style={{ color: "#fff" }}>
                      Double check your profile picture and verification picture
                      are of your face.
                    </strong>
                  </Typography>

                  {/* 💡 Tips */}
                  <Box
                    sx={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 2,
                      p: 2,
                      mb: 3,
                      textAlign: "left",
                      maxWidth: 360,
                      mx: "auto",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 600,
                        mb: 1,
                        fontSize: "0.9rem",
                      }}
                    >
                      Tips for better results:
                    </Typography>

                    <Typography sx={{ color: "#aaa", fontSize: "0.85rem" }}>
                      • Face the camera directly
                      <br />
                      • Ensure good lighting
                      <br />
                      • Remove sunglasses or hats
                      <br />• Match your avatar photo expression
                    </Typography>
                  </Box>

                  {/* CTA Buttons */}
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      mb: 1.5,
                      py: 1.2,
                      borderRadius: "50px",
                      background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                    }}
                    onClick={() => setStep("selfie")}
                  >
                    Retry Selfie
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      py: 1.2,
                      borderRadius: "50px",
                      borderColor: "rgba(255,255,255,0.3)",
                      color: "#fff",
                    }}
                    onClick={() => {
                      setStep("avatar");
                      setIsUploading(false);
                    }}
                  >
                    Change Profile Photo
                  </Button>
                </Box>
              )}

              {step === "success" && (
                <Box
                  textAlign="center"
                  sx={{
                    py: 4,
                    px: 2,
                    animation: "fadeIn 0.4s ease-in-out",
                  }}
                >
                  {/* ✅ Success Icon */}
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      mx: "auto",
                      mb: 2,
                      borderRadius: "50%",
                      background: "rgba(0,209,121,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 40,
                      color: "#00D179",
                    }}
                  >
                    ✓
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{ color: "#00D179", fontWeight: 800, mb: 1 }}
                  >
                    Profile Verified
                  </Typography>

                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      mb: 3,
                    }}
                  >
                    Your selfie successfully matched your profile photo.
                    <br />
                    Your account is now verified and trusted.
                  </Typography>

                  {/* 🔐 Trust Badge */}
                  <Box
                    sx={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 2,
                      p: 2,
                      mb: 3,
                      maxWidth: 360,
                      mx: "auto",
                    }}
                  >
                    <Typography
                      sx={{ color: "#fff", fontWeight: 600, mb: 0.5 }}
                    >
                      Identity Confirmed
                    </Typography>

                    <Typography sx={{ color: "#aaa", fontSize: "0.85rem" }}>
                      Verified profiles get more visibility, trust, and better
                      matches.
                    </Typography>
                  </Box>

                  <Grid
                    item
                    xs={12}
                    sx={{
                      alignItems: "center",
                      textAlign: "center",
                      mt: 4,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Button
                      type="submit"
                      onClick={() => router.push(`/bannerupload/${userId}`)}
                      sx={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        backgroundColor: "#c2185b",
                        color: "#fff",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        "&:hover": { backgroundColor: "#ad1457" },
                      }}
                    >
                      <ArrowForwardIosIcon />
                    </Button>
                  </Grid>
                </Box>
              )}

              <Carousel title="Exciting Events and Real Connections Start Here!" />

              <Dialog
                open={openCropper}
                onClose={() => {
                  setOpenCropper(false);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                }}
                TransitionComponent={Fade}
              >
                <DialogContent
                  sx={{
                    backgroundColor: "#000",
                    color: "#fff",
                    width: { xs: "300px", sm: "400px" },
                    height: { xs: "300px", sm: "400px" },
                    position: "relative",
                    padding: 0,
                  }}
                >
                  <Cropper
                    key={avatarImage}
                    image={avatarImage || undefined}
                    crop={crop}
                    zoom={zoom}
                    aspect={4 / 5}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </DialogContent>
                <DialogActions
                  sx={{
                    backgroundColor: "#121212",
                    justifyContent: "center",
                    p: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={handleCropConfirm}
                    sx={{
                      backgroundColor: "#c2185b",
                      "&:hover": { backgroundColor: "#ad1457" },
                    }}
                  >
                    Crop
                  </Button>
                </DialogActions>
              </Dialog>
            </Paper>
          </Container>
        </Box>

        <Dialog
          open={dialogOpen}
          fullWidth
          maxWidth="xs"
          disableEscapeKeyDown
          onClose={(_, reason) => {
            if (reason === "backdropClick" || reason === "escapeKeyDown")
              return;
            setDialogOpen(false);
          }}
          BackdropProps={{
            sx: {
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(10, 1, 24, 0.75)",
            },
          }}
        >
          <DialogContent sx={{ textAlign: "center", pt: 4 }}>
            {dialogType === "success" ? (
              <CheckCircleIcon sx={{ fontSize: 64, color: "#00D179", mb: 2 }} />
            ) : (
              <ErrorOutlineIcon
                sx={{ fontSize: 64, color: "#FF2D55", mb: 2 }}
              />
            )}

            <Typography variant="h6" fontWeight={700} mb={1}>
              {dialogType === "success"
                ? "Verification Successful"
                : "Verification Failed"}
            </Typography>

            <Typography variant="body2">{dialogMessage}</Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, justifyContent: "center" }}>
            {dialogType === "success" ? (
              <Grid
                item
                xs={12}
                sx={{
                  alignItems: "center",
                  textAlign: "center",
                  mt: 4,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Button
                  type="submit"
                  onClick={() => router.push(`/bannerupload/${userId}`)}
                  sx={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "#c2185b",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    "&:hover": { backgroundColor: "#ad1457" },
                  }}
                >
                  <ArrowForwardIosIcon />
                </Button>
              </Grid>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setDialogOpen(false)}
                sx={{ borderRadius: "50px" }}
              >
                Try Again
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </>
  );
}
