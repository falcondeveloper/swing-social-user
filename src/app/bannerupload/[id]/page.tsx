"use client";

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
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
  LinearProgress,
  useMediaQuery,
  createTheme,
  ThemeProvider,
  Container,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Cropper from "react-easy-crop";
import { useRouter } from "next/navigation";
import { EditIcon } from "lucide-react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Carousel from "@/commonPage/Carousel";

type Params = Promise<{ id: string }>;
type UploadStatus = "idle" | "uploading" | "done" | "error";

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
              "0%": { transform: "translate(0, 0) rotate(0deg)", opacity: 0 },
              "50%": { opacity: 0.8 },
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
ParticleField.displayName = "ParticleField";

export default function UploadBanner({ params }: { params: Params }) {
  const router = useRouter();

  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedBanner, setCroppedBanner] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<any>(null);
  const [openCropper, setOpenCropper] = useState(false);
  const uploadStatusRef = useRef<UploadStatus>("idle");
  const uploadedUrlRef = useRef<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    (async () => {
      const p = await params;
      setUserId(p.id);
    })();
  }, [params]);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/user/sweeping/user?id=${userId}`);
        const data = await res.json();
        const user = data?.user;

        if (!user) return;

        const isValidBanner =
          user.ProfileBanner &&
          !user.ProfileBanner.includes("default-avatar") &&
          !user.ProfileBanner.startsWith("/images/") &&
          !user.ProfileBanner.startsWith("/avatars/");

        const existingBanner = isValidBanner ? user.ProfileBanner : null;

        if (existingBanner && !uploadedUrlRef.current) {
          setCroppedBanner(existingBanner);
          uploadedUrlRef.current = existingBanner;
          uploadStatusRef.current = "done";
          setUploadStatus("done");
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };

    fetchUserData();
  }, [userId]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
    setSelectedFile(file);
    setBannerImage(URL.createObjectURL(file));
    setOpenCropper(true);
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedArea(croppedAreaPixels);
  };

  const runBackgroundUpload = async (blob: Blob, previewUrl: string) => {
    uploadStatusRef.current = "uploading";
    setUploadStatus("uploading");
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "dating_unsigned");
      formData.append("folder", "dating-app/banners");

      setUploadProgress(50);

      const cloudRes = await fetch(
        "https://api.cloudinary.com/v1_1/dkkf79biv/image/upload",
        { method: "POST", body: formData },
      );
      if (!cloudRes.ok) throw new Error("Cloudinary upload failed");

      const cloudData = await cloudRes.json();
      const cloudUrl = cloudData.secure_url.replace(
        "/upload/",
        "/upload/w_1600,h_900,c_fill,q_auto,f_auto/",
      );

      setUploadProgress(80);

      if (userId) {
        const apiRes = await fetch("/api/user/bannerUpload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pid: userId,
            Questionable: 1,
            banner: cloudUrl,
          }),
        });
        if (!apiRes.ok) throw new Error("Banner API save failed");
      }

      uploadedUrlRef.current = cloudUrl;
      uploadStatusRef.current = "done";
      setUploadStatus("done");
      setUploadProgress(100);
    } catch (err) {
      console.error("Background upload failed:", err);
      uploadStatusRef.current = "error";
      setUploadStatus("error");
      setUploadProgress(0);
    }
  };

  const handleCropConfirm = async () => {
    if (!croppedArea || !selectedFile) return;

    try {
      const imageBitmap = await createImageBitmap(selectedFile);
      const { x, y, width, height } = croppedArea;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imageBitmap, x, y, width, height, 0, 0, width, height);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject("Blob creation failed")),
          "image/jpeg",
          0.85,
        );
      });

      const previewUrl = URL.createObjectURL(blob);
      setCroppedBanner(previewUrl);

      setOpenCropper(false);

      runBackgroundUpload(blob, previewUrl);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  const handleCloseCropper = () => {
    setOpenCropper(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (uploadStatusRef.current === "uploading") {
        await new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (uploadStatusRef.current === "done") {
              clearInterval(interval);
              resolve();
            } else if (uploadStatusRef.current === "error" || attempts > 100) {
              clearInterval(interval);
              reject(new Error("Upload did not complete in time"));
            }
          }, 300);
        });
      }

      if (
        (uploadStatusRef.current === "idle" ||
          uploadStatusRef.current === "error") &&
        userId
      ) {
        try {
          const res = await fetch(`/api/user/sweeping/user?id=${userId}`);
          const data = await res.json();
          const user = data?.user;
          const fallbackUrl = user?.Avatar;

          if (fallbackUrl) {
            await fetch("/api/user/bannerUpload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pid: userId,
                Questionable: 1,
                banner: fallbackUrl,
              }),
            });
          }
        } catch (err) {
          console.error("Failed to fetch avatar for banner fallback:", err);
        }
      }

      await router.push(`/public-photos/${userId}`);
    } catch (err) {
      console.error("Submit failed:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
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
        <Container
          maxWidth="sm"
          sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1.5, sm: 2 } }}
        >
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
            <Grid>
              <Typography
                sx={{
                  textAlign: "center",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                }}
              >
                Give your profile a little extra personality! A banner is the
                first thing people notice — make it count.
              </Typography>

              <Grid item xs={12} sx={{ mt: 2, textAlign: "center" }}>
                <Typography
                  variant="h6"
                  sx={{ color: "#c2185b", fontWeight: "bold", mb: 2 }}
                >
                  POST Profile Banner
                </Typography>

                <Box
                  sx={{
                    width: "100%",
                    height: 200,
                    border: "2px dashed #fff",
                    borderRadius: 2,
                    backgroundColor: "#1d1d1d",
                    mx: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    style={{ display: "none" }}
                    id="upload-banner"
                  />
                  <label
                    htmlFor="upload-banner"
                    style={{ width: "100%", height: "100%", cursor: "pointer" }}
                  >
                    {croppedBanner ? (
                      <>
                        <img
                          src={croppedBanner}
                          alt="Cropped Banner"
                          style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            display: "block",
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
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" },
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </>
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconButton component="span">
                          <PhotoCameraOutlinedIcon
                            sx={{ fontSize: 40, color: "#c2185b" }}
                          />
                        </IconButton>
                      </Box>
                    )}
                  </label>
                </Box>
              </Grid>

              <Typography
                sx={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.6)",
                  mt: 2,
                  fontSize: "0.75rem",
                  lineHeight: 1.7,
                }}
              >
                {croppedBanner
                  ? "Looking great! Hit the arrow to continue, or tap the image to swap it out."
                  : "No worries if you skip this — we'll use your profile photo as your banner for now. You can always update it later from your profile settings."}
              </Typography>

              {uploadStatus === "uploading" && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    mt: 1.5,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                    },
                  }}
                />
              )}

              {uploadStatus === "uploading" && (
                <Typography
                  sx={{
                    textAlign: "center",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.7rem",
                    mt: 0.8,
                    animation: "fadeInOut 2s ease-in-out infinite",
                    "@keyframes fadeInOut": {
                      "0%, 100%": { opacity: 0.5 },
                      "50%": { opacity: 1 },
                    },
                  }}
                >
                  Uploading your banner in the background...
                </Typography>
              )}

              {uploadStatus === "error" && (
                <Typography
                  sx={{
                    textAlign: "center",
                    color: "#FF2D55",
                    fontSize: "0.7rem",
                    mt: 0.8,
                    fontWeight: 600,
                  }}
                >
                  ✕ Upload failed — please re-select your banner
                </Typography>
              )}

              {/* {!croppedBanner && (
                <Typography
                  sx={{
                    textAlign: "center",
                    color: "#9B4DFF",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    mt: 1,
                  }}
                >
                  👉 Feel free to skip — just hit the arrow →
                </Typography>
              )} */}

              <Grid
                item
                xs={12}
                sx={{
                  textAlign: "center",
                  mt: 2,
                  mb: 4,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Button
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  sx={{
                    width: 56,
                    height: 56,
                    minWidth: 56,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    mr: 2,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                  }}
                >
                  <ArrowBackIcon />
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  sx={{
                    width: 56,
                    height: 56,
                    minWidth: 56,
                    borderRadius: "50%",
                    backgroundColor: "#c2185b",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    "&:hover": { backgroundColor: "#ad1457" },
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} sx={{ color: "#fff" }} />
                  ) : (
                    <ArrowForwardIosIcon />
                  )}
                </Button>
              </Grid>

              <Carousel title="Wild Events and Real Profiles are Waiting!" />
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* ─── Crop Dialog — clean, no upload progress inside ─────────────── */}
      <Dialog
        open={openCropper}
        onClose={handleCloseCropper}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            minHeight: "400px",
            position: "relative",
            padding: 0,
          }}
        >
          <Cropper
            key={bannerImage}
            image={bannerImage || undefined}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={() => setTimeout(() => setZoom(1), 50)}
          />
        </DialogContent>
        <DialogActions
          sx={{
            background: "linear-gradient(145deg, #0A0118 0%, #1A0B2E 100%)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleCloseCropper}
            sx={{
              color: "#fff",
              borderColor: "rgba(255,255,255,0.3)",
              "&:hover": {
                borderColor: "#fff",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCropConfirm}
            sx={{
              backgroundColor: "#c2185b",
              "&:hover": { backgroundColor: "#ad1457" },
              ml: 1,
            }}
          >
            Crop & Upload
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
