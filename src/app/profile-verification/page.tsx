"use client";

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import {
  Paper,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { useRouter } from "next/navigation";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Loader from "@/commonPage/Loader";

type DialogType = "success" | "error";

const validationSchema = Yup.object({
  selfie: Yup.mixed()
    .required("A selfie is required")
    .test("fileSize", "File too large (max 5MB)", (value: any) => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024;
    })
    .test("fileType", "Only image files are allowed", (value: any) => {
      if (!value) return true;
      return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        value.type,
      );
    }),
});

const page = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [userId, setUserId] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isInitLoading, setIsInitLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>("success");
  const [dialogMessage, setDialogMessage] = useState("");

  const openDialog = (type: DialogType, message: string) => {
    setDialogType(type);
    setDialogMessage(message);
    setDialogOpen(true);
  };

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

  const formik = useFormik({
    initialValues: {
      selfie: null as File | null,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!values.selfie) {
        setError("Please select a selfie to upload");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        setUploadSuccess(true);
        setIsUploading(false);

        setTimeout(() => {
          setUploadSuccess(false);
          formik.resetForm();
          setPreview(null);
        }, 3000);
      } catch (err) {
        setError("Upload failed. Please try again.");
        setIsUploading(false);
      }
    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      setPreview(URL.createObjectURL(file));
      const selfieKey = await uploadSelfieToS3(userId, file);
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
        throw new Error(data.message || "Verification failed");
      }

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
      setPreview(null);
      openDialog(
        "error",
        err.message || "Selfie verification failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakeSelfie = useCallback(() => {
    const input = document.getElementById("selfie-upload") as HTMLInputElement;
    if (input) {
      input.click();
    }
  }, []);

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
      {isMobileOrTablet ? (
        <>
          <AppHeaderMobile />
          <Paper
            elevation={24}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
            }}
          >
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  mb: 1,
                  fontSize: { xs: "1.75rem", sm: "2rem" },
                  background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Verify Your Face
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 3 }}
              >
                Take a real-time selfie to confirm you’re a real person
              </Typography>
            </Box>

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
                  {isUploading ? (
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
                        This usually takes 5–10 seconds. Please don’t close the
                        app.
                      </Typography>
                    </Box>
                  ) : preview ? (
                    <Box
                      component="img"
                      src={preview}
                      alt="Selfie"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <CameraAltIcon
                      sx={{ fontSize: 60, color: "rgba(255,255,255,0.3)" }}
                    />
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 3,
                  mt: 2,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                  >
                    Face Clearly Visible
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                  >
                    Good Lighting
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                  >
                    No Sunglasses
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="selfie-upload"
              />

              <Box sx={{ mb: 2 }}>
                {!uploadSuccess ? (
                  <Button
                    variant="contained"
                    startIcon={<CameraAltIcon />}
                    onClick={handleTakeSelfie}
                    fullWidth
                    sx={{
                      background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                      color: "white",
                      py: 1.5,
                      px: 4,
                      borderRadius: "50px",
                      "&:hover": {
                        background: "linear-gradient(45deg, #CC1439, #5200CC)",
                      },
                    }}
                  >
                    Take Selfie
                  </Button>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mt: 3,
                    }}
                  >
                    <IconButton
                      onClick={() => router.push(`/plan/${userId}`)}
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        backgroundColor: "#c2185b",
                        color: "#fff",
                        "&:hover": { backgroundColor: "#ad1457" },
                      }}
                    >
                      <ArrowForwardIosIcon sx={{ fontSize: 26 }} />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 24,
                  backgroundColor: "rgba(255, 45, 85, 0.1)",
                  color: "#FF2D55",
                  border: "1px solid rgba(255, 45, 85, 0.3)",
                }}
              >
                {error}
              </Alert>
            )}

            {formik.touched.selfie && formik.errors.selfie && (
              <Alert
                severity="error"
                sx={{
                  mb: 10,
                  backgroundColor: "rgba(255, 45, 85, 0.1)",
                  color: "#FF2D55",
                  border: "1px solid rgba(255, 45, 85, 0.3)",
                }}
              >
                {formik.errors.selfie}
              </Alert>
            )}

            {uploadSuccess && (
              <Alert
                severity="success"
                sx={{
                  mb: 2,
                  backgroundColor: "rgba(0, 209, 121, 0.1)",
                  color: "#00D179",
                  border: "1px solid rgba(0, 209, 121, 0.3)",
                  textAlign: "center",
                }}
              >
                <strong>Selfie verified</strong>
                <br />
                Your selfie was uploaded successfully and a verification badge
                has been added to your profile.
              </Alert>
            )}
          </Paper>
          <AppFooterMobile />
        </>
      ) : (
        <>
          <Box
            sx={{
              bgcolor: "#121212",
              minHeight: "100vh",
              color: "white",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <AppHeaderDesktop />

            {/* MAIN CONTENT */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "100px 0",
                textAlign: "center",
              }}
            >
              {/* TITLE */}
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Verify Your Face
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: "rgba(255,255,255,0.7)", mb: 5 }}
              >
                Take a real-time selfie to confirm you’re a real person
              </Typography>

              {/* CAMERA CIRCLE */}
              <Box
                sx={{
                  position: "relative",
                  width: 260,
                  height: 260,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: "3px dashed rgba(255,255,255,0.25)",
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {isUploading ? (
                    <CircularProgress size={64} sx={{ color: "#FF2D55" }} />
                  ) : preview ? (
                    <Box
                      component="img"
                      src={preview}
                      alt="Selfie"
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <CameraAltIcon
                      sx={{ fontSize: 70, color: "rgba(255,255,255,0.35)" }}
                    />
                  )}
                </Box>
              </Box>

              {/* HINTS */}
              <Box
                sx={{
                  display: "flex",
                  gap: 4,
                  mb: 5,
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 13,
                }}
              >
                <Typography variant="caption">Face Clearly Visible</Typography>
                <Typography variant="caption">Good Lighting</Typography>
                <Typography variant="caption">No Sunglasses</Typography>
              </Box>

              {/* FILE INPUT */}
              <input
                type="file"
                accept="image/*"
                capture="user"
                id="selfie-upload"
                hidden
                onChange={handleFileChange}
              />

              {/* CTA BUTTON */}
              {!uploadSuccess ? (
                <Button
                  startIcon={<CameraAltIcon />}
                  onClick={handleTakeSelfie}
                  sx={{
                    width: "100%",
                    maxWidth: 520,
                    py: 1.8,
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: "999px",
                    background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                    color: "#fff",
                    "&:hover": {
                      background: "linear-gradient(90deg, #CC1439, #5200CC)",
                    },
                  }}
                >
                  Take Selfie
                </Button>
              ) : (
                <IconButton
                  onClick={() => router.push(`/plan/${userId}`)}
                  sx={{
                    mt: 3,
                    width: 64,
                    height: 64,
                    bgcolor: "#c2185b",
                    color: "#fff",
                    "&:hover": { bgcolor: "#ad1457" },
                  }}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              )}

              {/* ERRORS / SUCCESS */}
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 4,
                    backgroundColor: "rgba(255,45,85,0.1)",
                    color: "#FF2D55",
                    border: "1px solid rgba(255,45,85,0.3)",
                  }}
                >
                  {error}
                </Alert>
              )}

              {uploadSuccess && (
                <Alert
                  severity="success"
                  sx={{
                    mt: 4,
                    backgroundColor: "rgba(0,209,121,0.1)",
                    color: "#00D179",
                    border: "1px solid rgba(0,209,121,0.3)",
                  }}
                >
                  <strong>Selfie verified</strong>
                  <br />
                  Your verification badge has been added to your profile.
                </Alert>
              )}
            </Box>

            <AppFooterDesktop />
          </Box>
        </>
      )}

      <Dialog
        open={dialogOpen}
        fullWidth
        maxWidth="xs"
        disableEscapeKeyDown
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
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
            <ErrorOutlineIcon sx={{ fontSize: 64, color: "#FF2D55", mb: 2 }} />
          )}

          <Typography variant="h6" fontWeight={700} mb={1}>
            {dialogType === "success"
              ? "Verification Successful"
              : "Verification Failed"}
          </Typography>

          <Typography variant="body2">{dialogMessage}</Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          {dialogType === "success" ? (
            <Button
              fullWidth
              onClick={() => router.push("profile")}
              sx={{
                borderRadius: "50px",
                py: 1.4,
                background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Go to Profile
            </Button>
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
    </>
  );
};

export default page;
