"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Grid,
  useMediaQuery,
  createTheme,
  ThemeProvider,
  Paper,
  Avatar,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import VerifiedIcon from "@mui/icons-material/Verified";
import FaceRetouchingNaturalIcon from "@mui/icons-material/FaceRetouchingNatural";
import { useRouter } from "next/navigation";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

type StepType =
  | "intro"
  | "avatar"
  | "selfie"
  | "verifying"
  | "success"
  | "failed";

type Params = Promise<{ id: string }>;

type SelfieStatus = "idle" | "uploading" | "verifying";
type DialogType = "success" | "error";

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

const GlowingBadge = memo(() => (
  <Box
    sx={{
      position: "absolute",
      top: -4,
      right: -4,
      width: 24,
      height: 24,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #00D179, #00A3FF)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "2px solid rgba(255,255,255,0.2)",
      boxShadow: "0 4px 15px rgba(0,209,121,0.4)",
      animation: "pulse 2s infinite",
      "@keyframes pulse": {
        "0%": { boxShadow: "0 4px 15px rgba(0,209,121,0.4)" },
        "50%": { boxShadow: "0 4px 25px rgba(0,209,121,0.8)" },
        "100%": { boxShadow: "0 4px 15px rgba(0,209,121,0.4)" },
      },
    }}
  >
    <VerifiedIcon sx={{ fontSize: 14, color: "#fff" }} />
  </Box>
));

export default function SelfieVerification({ params }: { params: Params }) {
  const router = useRouter();
  const [selfieStatus, setSelfieStatus] = useState<SelfieStatus>("idle");
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [step, setStep] = useState<StepType>("selfie");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>("success");
  const [dialogMessage, setDialogMessage] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [showVerifyButton, setShowVerifyButton] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await params;
      setUserId(p.id);
    })();
  }, [params]);

  const openDialog = (type: DialogType, message: string) => {
    setDialogType(type);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const uploadedAvatar = localStorage.getItem("Avatar");

  async function uploadAvatarFromLocalStorage() {
    const res = await fetch("/api/s3/upload-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        avatarUrl: uploadedAvatar,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || "AVATAR_UPLOAD_FAILED");
    }

    localStorage.setItem("avatarS3Uploaded", "true");
    localStorage.setItem("avatarS3Key", data.key);
  }

  useEffect(() => {
    if (!userId) return;
    uploadAvatarFromLocalStorage();
  }, [userId]);

  async function normalizeImage(file: File): Promise<Blob> {
    const img = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS_ERROR");
    ctx.drawImage(img, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.92);
    });
  }

  async function uploadSelfieToS3(userId: string, file: File) {
    const presignRes = await fetch("/api/s3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type: "selfie" }),
    });
    const { uploadUrl, key } = await presignRes.json();
    const normalizedBlob = await normalizeImage(file);
    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: normalizedBlob,
    });
    return key;
  }

  const handleSelfieCapture = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setSelfiePreview(previewUrl);
    setShowVerifyButton(true);
  };

  const handleVerifySelfie = async () => {
    if (!selfiePreview) return;

    setSelfieStatus("verifying");
    setShowVerifyButton(false);

    try {
      const response = await fetch(selfiePreview);
      const blob = await response.blob();
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      const selfieKey = await uploadSelfieToS3(userId, file);
      const avatarKey = localStorage.getItem("avatarS3Key");
      const res = await fetch("/api/user/verify-selfie/same-selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarKey, selfieKey, userId }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok || !data.match) {
        throw new Error(data.message || "Face verification failed");
      }
      await fetch("/api/user/verify-selfie/update-profile-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      localStorage.removeItem("avatarS3Key");
      localStorage.removeItem("avatarS3Uploaded");

      setStep("success");
    } catch (err: any) {
      setStep("failed");
      openDialog(
        "error",
        err.message ||
          "Verification failed. Please try again with better lighting.",
      );
    } finally {
      setSelfieStatus("idle");
    }
  };

  const handleChangeProfilePicture = () => {
    router.push(`/upload/${userId}`);
  };

  const handleSkipSelfie = () => {
    localStorage.setItem("selfieSkipped", "true");
    router.push(`/bannerupload/${userId}`);
  };

  const handleRetakeSelfie = () => {
    setSelfiePreview(null);
    setShowVerifyButton(false);
    document.getElementById("selfie-upload")?.click();
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, #1A0B2E 0%, #000000 100%)",
          position: "relative",
          overflow: "hidden",
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <ParticleField />
        <Box
          sx={{
            width: "100%",
            px: 1,
            py: 1,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              px: 1.5,
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Button
              onClick={handleSkipSelfie}
              startIcon={<CloseIcon />}
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 10,
                color: "rgba(255,255,255,0.7)",
                backgroundColor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                borderRadius: "50px",
                px: 2,
                py: 0.4,
                textTransform: "none",
                fontSize: "0.8rem",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                },
              }}
            >
              Skip
            </Button>

            {step === "selfie" && (
              <Box textAlign="center">
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      mx: "auto",
                      mb: 2,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FF2D55, #7000FF)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 10px 30px rgba(255,45,85,0.3)",
                    }}
                  >
                    <FaceRetouchingNaturalIcon
                      sx={{ fontSize: 35, color: "#fff" }}
                    />
                  </Box>

                  <Typography variant="h5" color="#fff" gutterBottom>
                    Verify Your Identity
                  </Typography>

                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.95rem",
                      maxWidth: 320,
                      mx: "auto",
                    }}
                  >
                    Take a clear selfie to verify it's really you. This helps
                    keep our community safe.
                  </Typography>
                </Box>

                {/* Avatar and Selfie Preview Section */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    mb: 4,
                  }}
                >
                  {/* Profile Picture */}
                  <Box sx={{ position: "relative" }}>
                    <Avatar
                      src={uploadedAvatar || ""}
                      sx={{
                        width: 120,
                        height: 120,
                        border: "3px solid rgba(255,255,255,0.1)",
                        objectFit: "contain",
                      }}
                    >
                      {!uploadedAvatar && <CameraAltIcon />}
                    </Avatar>
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        bottom: -20,
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.7rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Profile Photo
                    </Typography>
                  </Box>

                  {/* Selfie Preview */}
                  <Box sx={{ position: "relative" }}>
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        border: "3px solid",
                        borderColor: selfiePreview
                          ? "#FF2D55"
                          : "rgba(255,255,255,0.1)",
                        overflow: "hidden",
                        display: "flex",
                        objectFit: "contain",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {selfiePreview ? (
                        <img
                          src={selfiePreview}
                          alt="Selfie preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <CameraAltIcon
                          sx={{
                            fontSize: 30,
                            color: "rgba(255,255,255,0.2)",
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        bottom: -20,
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: selfiePreview
                          ? "#FF2D55"
                          : "rgba(255,255,255,0.5)",
                        fontSize: "0.7rem",
                        whiteSpace: "nowrap",
                        fontWeight: selfiePreview ? 600 : 400,
                      }}
                    >
                      {selfiePreview ? "Selfie Taken" : "Your Selfie"}
                    </Typography>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {!selfiePreview ? (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleSelfieCapture}
                        hidden
                        id="selfie-upload"
                      />
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<CameraAltIcon />}
                        onClick={() =>
                          document.getElementById("selfie-upload")?.click()
                        }
                        fullWidth
                        sx={{
                          background:
                            "linear-gradient(45deg, #FF2D55, #7000FF)",
                          py: 1.4,
                          borderRadius: 3,
                          fontSize: "1rem",
                          textTransform: "none",
                          mt: 2,
                        }}
                      >
                        Take a Selfie
                      </Button>
                    </>
                  ) : (
                    <>
                      {showVerifyButton && (
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleVerifySelfie}
                          disabled={selfieStatus === "verifying"}
                          fullWidth
                          sx={{
                            background:
                              "linear-gradient(45deg, #FF2D55, #7000FF)",
                            py: 1.4,
                            borderRadius: 3,
                            fontSize: "1rem",
                            textTransform: "none",
                            mt: 2,
                          }}
                        >
                          {selfieStatus === "verifying" ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <CircularProgress
                                size={20}
                                thickness={5}
                                sx={{ color: "#fff" }}
                              />
                              Verifying your selfie...
                            </Box>
                          ) : (
                            "✨ Verify Now"
                          )}
                        </Button>
                      )}

                      <Button
                        variant="outlined"
                        size="large"
                        onClick={handleRetakeSelfie}
                        fullWidth
                        sx={{
                          py: 1.5,
                          borderRadius: 3,
                          borderColor: "rgba(255,255,255,0.2)",
                          color: "#fff",
                          textTransform: "none",
                          fontSize: "0.95rem",
                          "&:hover": {
                            borderColor: "#FF2D55",
                            backgroundColor: "rgba(255,45,85,0.1)",
                          },
                        }}
                      >
                        Retake Photo
                      </Button>
                    </>
                  )}

                  {/* Change Profile Picture Button */}
                  <Button
                    variant="text"
                    startIcon={<EditIcon />}
                    onClick={handleChangeProfilePicture}
                    sx={{
                      mt: 1,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "none",
                      fontSize: "0.9rem",
                      "&:hover": {
                        color: "#fff",
                        backgroundColor: "transparent",
                      },
                    }}
                  >
                    Change Profile Picture
                  </Button>
                </Box>
              </Box>
            )}

            {selfieStatus === "verifying" && (
              <Box
                sx={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 2000,
                  background: "rgba(10, 1, 24, 0.95)",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  px: 3,
                }}
              >
                <CircularProgress
                  size={70}
                  thickness={3}
                  sx={{
                    color: "#FF2D55",
                    mb: 4,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <Typography
                  variant="h5"
                  sx={{ color: "#fff", fontWeight: 700, mb: 2 }}
                >
                  Verifying Your Identity
                </Typography>
                <Typography
                  sx={{ color: "rgba(255,255,255,0.7)", maxWidth: 280 }}
                >
                  This usually takes 15–30 seconds. Please don't close the app.
                </Typography>
              </Box>
            )}

            {step === "failed" && (
              <Box textAlign="center" sx={{ py: 2 }}>
                <Box
                  sx={{
                    width: 90,
                    height: 90,
                    mx: "auto",
                    mb: 3,
                    borderRadius: "50%",
                    background: "rgba(255,45,85,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ErrorOutlineIcon sx={{ fontSize: 50, color: "#FF2D55" }} />
                </Box>

                <Typography
                  variant="h5"
                  sx={{ color: "#FF2D55", fontWeight: 700, mb: 2 }}
                >
                  Verification Failed
                </Typography>

                <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 3 }}>
                  We couldn't match your selfie with your profile photo.
                </Typography>

                <Box
                  sx={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 3,
                    p: 2.5,
                    mb: 3,
                    textAlign: "left",
                  }}
                >
                  <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1.5 }}>
                    Tips for better results:
                  </Typography>
                  {[
                    "Face the camera directly with good lighting",
                    "Remove sunglasses, hats, or masks",
                    "Match your profile photo expression",
                    "Ensure your face is clearly visible",
                  ].map((tip) => (
                    <Box
                      key={tip}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                        color: "rgba(255,255,255,0.7)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <CheckCircleIcon
                        sx={{ fontSize: 16, color: "#FF2D55" }}
                      />
                      {tip}
                    </Box>
                  ))}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleChangeProfilePicture}
                      sx={{
                        py: 1.5,
                        borderRadius: 3,
                        borderColor: "rgba(255,255,255,0.2)",
                        color: "#fff",
                      }}
                    >
                      Change Photo
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        setStep("selfie");
                        setSelfiePreview(null);
                        setShowVerifyButton(false);
                      }}
                      sx={{
                        background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                        py: 1.5,
                        borderRadius: 3,
                      }}
                    >
                      Try Again
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {step === "success" && (
              <Box textAlign="center" sx={{ py: 2 }}>
                <Box
                  sx={{
                    position: "relative",
                    width: 120,
                    height: 120,
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <Avatar
                    src={uploadedAvatar || ""}
                    sx={{
                      width: "100%",
                      height: "100%",
                      border: "4px solid #00D179",
                      boxShadow: "0 0 30px rgba(0,209,121,0.5)",
                    }}
                  />
                  <GlowingBadge />
                </Box>

                <Typography
                  variant="h4"
                  sx={{ color: "#00D179", fontWeight: 800, mb: 1 }}
                >
                  Verified!
                </Typography>

                <Typography sx={{ color: "rgba(255,255,255,0.8)", mb: 4 }}>
                  Your identity has been confirmed. You're now a verified
                  member.
                </Typography>

                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg, rgba(255,45,85,0.1), rgba(112,0,255,0.1))",
                    borderRadius: 3,
                    p: 3,
                    mb: 4,
                  }}
                >
                  <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
                    ✨ Verified Benefits
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "0.95rem",
                    }}
                  >
                    • Get more profile views
                    <br />
                    • Higher match confidence
                    <br />
                    • Trusted member badge
                    <br />• Priority in searches
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={() => router.push(`/bannerupload/${userId}`)}
                  endIcon={<ArrowForwardIosIcon />}
                  sx={{
                    background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                    px: 4,
                    py: 1.8,
                    borderRadius: 3,
                    fontSize: "1.1rem",
                    textTransform: "none",
                  }}
                >
                  Continue
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={dialogOpen}
        fullWidth
        maxWidth="xs"
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          sx: {
            background: "rgba(20, 10, 30, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
          },
        }}
      >
        <DialogContent sx={{ textAlign: "center", pt: 4 }}>
          {dialogType === "success" ? (
            <CheckCircleIcon sx={{ fontSize: 70, color: "#00D179", mb: 2 }} />
          ) : (
            <ErrorOutlineIcon sx={{ fontSize: 70, color: "#FF2D55", mb: 2 }} />
          )}
          <Typography variant="h6" fontWeight={700} color="#fff" mb={1}>
            {dialogType === "success" ? "Success!" : "Verification Failed"}
          </Typography>
          <Typography color="rgba(255,255,255,0.7)">{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            fullWidth
            variant={dialogType === "success" ? "contained" : "outlined"}
            onClick={() => {
              setDialogOpen(false);
              if (dialogType === "success") {
                router.push(`/bannerupload/${userId}`);
              }
            }}
            sx={{
              py: 1.5,
              borderRadius: 3,
              ...(dialogType === "success" && {
                background: "linear-gradient(45deg, #00D179, #00A3FF)",
              }),
            }}
          >
            {dialogType === "success" ? "Continue" : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
