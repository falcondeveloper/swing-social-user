"use client";

import { Box, useMediaQuery, createTheme, Avatar } from "@mui/material";
import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import {
  Paper,
  Typography,
  Button,
  CircularProgress,
  ThemeProvider,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { useRouter } from "next/navigation";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Loader from "@/commonPage/Loader";
import FaceRetouchingNaturalIcon from "@mui/icons-material/FaceRetouchingNatural";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckIcon from "@mui/icons-material/Check";

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

type SelfieStatus = "idle" | "verifying";
type StepType = "selfie" | "success" | "failed";

const GlowingBadge = memo(() => (
  <Box
    sx={{
      position: "absolute",
      top: -6,
      right: -6,
      width: { xs: 26, md: 30 },
      height: { xs: 26, md: 30 },
      borderRadius: "50%",
      background: "linear-gradient(135deg, #FF2D55, #7000FF)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "pulseGlow 2s ease-in-out infinite",
      zIndex: 2,
    }}
  >
    <VerifiedIcon
      sx={{
        fontSize: { xs: 16, md: 18 },
        color: "#fff",
      }}
    />
  </Box>
));

const page = () => {
  const router = useRouter();
  const isMobileOrTablet = useMediaQuery("(max-width:900px)");
  const [userId, setUserId] = useState<string>("");
  const [isInitLoading, setIsInitLoading] = useState(false);
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
  const [selfieStatus, setSelfieStatus] = useState<SelfieStatus>("idle");
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [step, setStep] = useState<StepType>("selfie");
  const [showVerifyButton, setShowVerifyButton] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tokenDevice = localStorage.getItem("loginInfo");
    if (!tokenDevice) {
      router.push("/login");
      return;
    }

    const init = async () => {
      try {
        const decodedToken: any = jwtDecode(tokenDevice);

        const userId = decodedToken?.profileId;

        if (!userId) {
          throw new Error("Invalid token");
        }

        setUserId(userId);
        setIsInitLoading(true);
        const response = await fetch(`/api/user/sweeping/user?id=${userId}`);
        const data = await response.json();
        const user = data?.user;

        if (user?.Avatar) {
          setUploadedAvatar(user.Avatar);
        }

        const alreadyUploaded = localStorage.getItem("avatarS3Uploaded");

        if (!user?.Avatar || alreadyUploaded) return;
        setIsInitLoading(true);
        await uploadAvatarFromLocalStorage(userId, user.Avatar);
      } catch (error) {
        console.error("Initialization failed:", error);

        localStorage.removeItem("loginInfo");
        router.push("/login");
      } finally {
        setIsInitLoading(false);
      }
    };

    init();
  }, []);

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
        "Content-Type": file.type || "image/jpeg",
      },
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
      setErrorMessage(
        err?.message ||
          "Verification failed. Please try again with better lighting.",
      );
      setStep("failed");
    } finally {
      setSelfieStatus("idle");
    }
  };

  const handleRetakeSelfie = () => {
    setSelfiePreview(null);
    setShowVerifyButton(false);
    document.getElementById("selfie-upload")?.click();
  };

  if (isInitLoading) {
    return (
      <Box
        sx={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#121212",
        }}
      >
        <AppHeaderMobile />
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
        <AppFooterMobile />
      </Box>
    );
  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background:
              "radial-gradient(circle at top left, #1A0B2E 0%, #000000 100%)",
          }}
        >
          {selfieStatus !== "verifying" &&
            (isMobileOrTablet ? <AppHeaderMobile /> : <AppHeaderDesktop />)}
          <Box
            sx={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <ParticleField />
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: { xs: "flex-start", md: "center" },
                px: { xs: 1, sm: 3, md: 4 },
                py: { xs: 1, md: 4 },
                pt: { xs: 1, md: 14 },
                pb: { xs: 10.5, md: 6 },
                overflowY: "auto",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  maxWidth: { xs: "100%", sm: 600, md: 800, lg: 950 },
                  borderRadius: { xs: 3, md: 4 },
                  p: { xs: 2, sm: 3, md: 5 },
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {step === "selfie" && (
                  <Box
                    textAlign="center"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      minHeight: { md: "60vh" },
                    }}
                  >
                    <Box sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          mx: "auto",
                          mb: 2,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #FF2D55, #7000FF)",
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
                        Take a clear selfie to verify it's really you. This
                        helps keep our community safe.
                      </Typography>
                    </Box>

                    {/* Avatar and Selfie Preview Section */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "row", sm: "row" },
                        alignItems: "center",
                        justifyContent: "center",
                        gap: { xs: 4, sm: 5 },
                        mb: 4,
                      }}
                    >
                      {/* Profile Picture */}
                      <Box sx={{ position: "relative" }}>
                        <Avatar
                          src={uploadedAvatar || ""}
                          sx={{
                            width: { xs: 110, sm: 120, md: 140 },
                            height: { xs: 110, sm: 120, md: 140 },
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
                            width: { xs: 110, sm: 120, md: 140 },
                            height: { xs: 110, sm: 120, md: 140 },
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
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
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
                            fullWidth={isMobileOrTablet}
                            sx={{
                              background:
                                "linear-gradient(45deg, #FF2D55, #7000FF)",
                              width: {
                                xs: "100%",
                                md: 280,
                              },
                              py: {
                                xs: 1.4,
                                md: 1,
                              },
                              fontSize: {
                                xs: "1rem",
                                md: "0.9rem",
                              },
                              borderRadius: 3,
                              textTransform: "none",
                              mt: 2,
                              mx: {
                                md: "auto",
                              },
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

                      {/* Benefits Section */}
                      <Box
                        sx={{
                          mt: 4,
                          p: 3,
                          borderRadius: 4,
                          background:
                            "linear-gradient(135deg, rgba(0,209,121,0.08), rgba(0,163,255,0.06))",
                          border: "1px solid rgba(255,255,255,0.08)",
                          backdropFilter: "blur(10px)",
                          textAlign: "left",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#fff",
                            fontWeight: 700,
                            mb: 2,
                            textAlign: "center",
                            fontSize: "1rem",
                          }}
                        >
                          Why Get Verified?
                        </Typography>

                        {[
                          "Boost your profile visibility",
                          "Increase match trust & confidence",
                          "Get a verified badge on your profile",
                          "Stand out in search results",
                        ].map((benefit) => (
                          <Box
                            key={benefit}
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1.5,
                              mb: 1.8,
                              color: "rgba(255,255,255,0.85)",
                              fontSize: {
                                xs: "0.9rem",
                                md: "0.95rem",
                              },
                              lineHeight: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                minWidth: 20,
                                minHeight: 20,
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg, #FF2D55, #7000FF)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                mt: "2px",
                              }}
                            >
                              <CheckIcon sx={{ fontSize: 13, color: "#fff" }} />
                            </Box>

                            <Typography
                              component="span"
                              sx={{ fontWeight: 500 }}
                            >
                              {benefit}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}

                {step === "failed" && (
                  <Box
                    textAlign="center"
                    sx={{
                      minHeight: "60vh",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      animation: "fadeIn 0.4s ease",
                      "@keyframes fadeIn": {
                        from: { opacity: 0, transform: "translateY(10px)" },
                        to: { opacity: 1, transform: "translateY(0)" },
                      },
                    }}
                  >
                    {/* Icon with glow */}
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        mx: "auto",
                        mb: 3,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle at center, rgba(255,45,85,0.25), rgba(255,45,85,0.08))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ErrorOutlineIcon
                        sx={{ fontSize: 40, color: "#FF2D55" }}
                      />
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        mb: 1,
                        fontSize: "1.8rem",
                        background: "linear-gradient(45deg,#FF2D55,#FF617B)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Verification Failed
                    </Typography>

                    {/* Reason Card */}
                    <Box
                      sx={{
                        mt: 3,
                        mb: 3,
                        p: 1.5,
                        borderRadius: 3,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          color: "rgba(255,255,255,0.5)",
                          mb: 0.5,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        Reason
                      </Typography>

                      <Typography sx={{ color: "rgba(255,255,255,0.85)" }}>
                        {errorMessage}
                      </Typography>
                    </Box>

                    {/* Buttons */}
                    <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
                      <Button
                        variant="contained"
                        onClick={() => {
                          setStep("selfie");
                          setSelfiePreview(null);
                          setShowVerifyButton(false);
                        }}
                        fullWidth={isMobileOrTablet}
                        sx={{
                          background:
                            "linear-gradient(45deg, #FF2D55, #7000FF)",
                          width: {
                            xs: "100%",
                            md: 280,
                          },
                          py: {
                            xs: 1.4,
                            md: 1,
                          },
                          fontSize: {
                            xs: "1rem",
                            md: "0.9rem",
                          },
                          borderRadius: 3,
                          textTransform: "none",
                          mx: {
                            md: "auto",
                          },
                        }}
                      >
                        Try Again
                      </Button>
                    </Box>

                    {/* Tips Section */}
                    <Box
                      sx={{
                        background:
                          "linear-gradient(135deg, rgba(255,45,85,0.08), rgba(112,0,255,0.08))",
                        borderRadius: 3,
                        p: 3,

                        textAlign: "left",
                      }}
                    >
                      <Typography
                        sx={{ color: "#fff", fontWeight: 700, mb: 2 }}
                      >
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
                            alignItems: "flex-start",
                            gap: 1.5,
                            mb: 1.8,
                            color: "rgba(255,255,255,0.8)",
                            fontSize: {
                              xs: "0.9rem",
                              md: "0.95rem",
                            },
                            lineHeight: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              minWidth: 20,
                              minHeight: 20,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #FF2D55, #7000FF)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              mt: "2px",
                            }}
                          >
                            <CheckIcon sx={{ fontSize: 13, color: "#fff" }} />
                          </Box>

                          <Typography component="span" sx={{ fontWeight: 400 }}>
                            {tip}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {step === "success" && (
                  <Box
                    textAlign="center"
                    sx={{
                      minHeight: "60vh",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      animation: "fadeIn 0.4s ease",
                      "@keyframes fadeIn": {
                        from: { opacity: 0, transform: "translateY(10px)" },
                        to: { opacity: 1, transform: "translateY(0)" },
                      },
                    }}
                  >
                    {/* Avatar with strong glow */}
                    <Box
                      sx={{
                        position: "relative",
                        width: 120,
                        height: 120,
                        mx: "auto",
                        mb: 3,
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          inset: -8,
                          borderRadius: "50%",
                        }}
                      />
                      <Avatar
                        src={uploadedAvatar || ""}
                        sx={{
                          width: "100%",
                          height: "100%",
                          border: "4px solid #FF1B6B",
                        }}
                      />
                      <GlowingBadge />
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        mb: 1,
                        fontSize: "1.8rem",
                        background: "linear-gradient(45deg,#FF2D55,#FF617B)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      You're Verified!
                    </Typography>

                    {/* Subtitle */}
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.75)",
                        maxWidth: 320,
                        mx: "auto",
                        mb: 4,
                        fontSize: "1rem",
                      }}
                    >
                      Your identity has been confirmed. Your profile now shows a
                      trusted verification badge.
                    </Typography>

                    {/* Benefits Card */}
                    <Box
                      sx={{
                        background:
                          "linear-gradient(135deg, rgba(0,209,121,0.12), rgba(0,163,255,0.08))",
                        borderRadius: 4,
                        p: 3,
                        mb: 5,
                        border: "1px solid rgba(255,255,255,0.08)",
                        backdropFilter: "blur(10px)",
                        textAlign: "left",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#fff",
                          fontSize: "1.30rem",
                          fontWeight: 600,
                          mb: 2,
                          textAlign: "center",
                        }}
                      >
                        Verified Member Benefits
                      </Typography>

                      {[
                        "Get more profile visibility",
                        "Higher match confidence",
                        "Trusted verification badge",
                        "Priority in search results",
                      ].map((benefit) => (
                        <Box
                          key={benefit}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 1.8,
                            color: "rgba(255,255,255,0.85)",
                            fontSize: {
                              xs: "0.9rem",
                              md: "0.95rem",
                            },
                            lineHeight: 1.4,
                          }}
                        >
                          <Box
                            sx={{
                              minWidth: 22,
                              minHeight: 22,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #FF2D55, #7000FF)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
                          </Box>

                          <Typography component="span" sx={{ fontWeight: 500 }}>
                            {benefit}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Continue Button */}
                    <Button
                      variant="contained"
                      onClick={() => router.push("/profile")}
                      endIcon={<ArrowForwardIosIcon />}
                      fullWidth={isMobileOrTablet}
                      sx={{
                        background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                        width: {
                          xs: "100%",
                          md: 380,
                        },
                        py: {
                          xs: 1.4,
                          md: 1,
                        },
                        fontSize: {
                          xs: "1rem",
                          md: "1.1rem",
                        },
                        borderRadius: 3,
                        textTransform: "none",
                        mt: 2,
                        mx: {
                          md: "auto",
                        },
                      }}
                    >
                      Continue
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
          {selfieStatus !== "verifying" &&
            (isMobileOrTablet ? <AppFooterMobile /> : <AppFooterDesktop />)}
        </Box>
        {selfieStatus === "verifying" && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              background: "rgba(10, 1, 24, 0.85)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 2,
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: 480,
                p: 4,
                borderRadius: 4,
                textAlign: "center",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
              }}
            >
              {/* Images Row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  mb: 4,
                }}
              >
                {/* Avatar */}
                <Avatar
                  src={uploadedAvatar || ""}
                  sx={{
                    width: 90,
                    height: 90,
                    border: "3px solid #FF2D55",
                  }}
                />

                {/* Animated Divider */}
                <Box
                  sx={{
                    width: 60,
                    height: 4,
                    borderRadius: 4,
                    background:
                      "linear-gradient(90deg, #FF2D55, #7000FF, #FF2D55)",
                    animation: "pulseLine 1.5s ease-in-out infinite",

                    "@keyframes pulseLine": {
                      "0%": { opacity: 0.4 },
                      "50%": { opacity: 1 },
                      "100%": { opacity: 0.4 },
                    },
                  }}
                />

                {/* Selfie */}
                <Avatar
                  src={selfiePreview || ""}
                  sx={{
                    width: 90,
                    height: 90,
                    border: "3px solid #FF2D55",
                  }}
                />
              </Box>

              {/* Title */}
              <Typography
                sx={{
                  fontSize: { xs: "1.3rem", md: "1.6rem" },
                  fontWeight: 800,
                  mb: 1,
                  background: "linear-gradient(45deg,#FF2D55,#FF617B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Verifying Your Photos
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  mb: 3,
                }}
              >
                We’re securely comparing your <strong>profile photo</strong>{" "}
                with your <strong>selfie</strong> to confirm it’s really you.
              </Typography>

              {/* Sub Loader */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#FF2D55,#7000FF)",
                      animation: "pulseDot 1.4s infinite ease-in-out",
                      animationDelay: `${i * 0.2}s`,

                      "@keyframes pulseDot": {
                        "0%, 80%, 100%": {
                          transform: "scale(0.5)",
                          opacity: 0.5,
                        },
                        "40%": { transform: "scale(1)", opacity: 1 },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </ThemeProvider>
    </>
  );
};

export default page;
