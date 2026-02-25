"use client";

import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
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
  LinearProgress,
} from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Cropper from "react-easy-crop";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { EditIcon } from "lucide-react";
import Carousel from "@/commonPage/Carousel";
import { useDropzone } from "react-dropzone";
import heic2any from "heic2any";

type Params = Promise<{ id: string }>;

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(
    null,
  );
  const [isCropping, setIsCropping] = useState(false);
  const [storedAvatar, setStoredAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const avatarFromStorage = localStorage.getItem("Avatar");
      if (avatarFromStorage) {
        setStoredAvatar(avatarFromStorage);
        setUploadedAvatarUrl(avatarFromStorage);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      const p = await params;
      setUserId(p.id);
    })();
  }, [params]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    let file = acceptedFiles[0];

    try {
      if (
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif")
      ) {
        const converted = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.95,
        });

        const blob = Array.isArray(converted) ? converted[0] : converted;

        file = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
          type: "image/jpeg",
        });
      }

      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
      setUploadProgress(0);
      setUploadedAvatarUrl(null);

      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setAvatarImage(imageUrl);
      setOpenCropper(true);
    } catch (error) {
      console.error("File processing failed:", error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".gif", ".jpg"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    multiple: false,
    maxFiles: 1,
  });

  const uploadImage = async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "dating_unsigned");
    formData.append("folder", "dating-app/avatars");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dkkf79biv/image/upload",
      {
        method: "POST",
        body: formData,
      },
    );

    if (!res.ok) {
      throw new Error("Cloudinary upload failed");
    }

    const data = await res.json();
    return data.secure_url;
  };

  const handleCropConfirm = async () => {
    if (!croppedArea || !selectedFile) return;

    try {
      setIsCropping(true);
      setUploadProgress(10);

      const imageBitmap = await createImageBitmap(selectedFile);

      const { x, y, width, height } = croppedArea;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas error");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(imageBitmap, x, y, width, height, 0, 0, width, height);

      setUploadProgress(35);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject("Blob creation failed")),
          "image/jpeg",
          0.85,
        );
      });

      setUploadProgress(60);
      const uploadedUrl = await uploadImage(blob);

      setUploadProgress(85);

      const optimizedUrl = uploadedUrl.replace(
        "/upload/",
        "/upload/w_800,h_1000,c_fill,q_auto,f_auto/",
      );

      localStorage.setItem("Avatar", optimizedUrl);

      setUploadedAvatarUrl(optimizedUrl);
      setCroppedAvatar(URL.createObjectURL(blob));

      setUploadProgress(100);

      setTimeout(() => {
        setOpenCropper(false);
        setIsCropping(false);
        setUploadProgress(0);
      }, 200);
    } catch (error) {
      console.error("Upload failed:", error);
      setIsCropping(false);
      setUploadProgress(0);
    }
  };

  const handleNavigateToAvatarUpload = async () => {
    if (!uploadedAvatarUrl) {
      console.error("No uploaded avatar URL available");
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch("/api/user/avatarUpload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pid: userId,
          Questionable: 1,
          avatar: uploadedAvatarUrl,
        }),
      });

      if (!res.ok) {
        throw new Error("Avatar save failed");
      }

      await router.push(`/verify-identity/${userId}`);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setIsUploading(false);
    }
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedArea(croppedAreaPixels);
  };

  const handleCloseCropper = () => {
    if (!isCropping) {
      setOpenCropper(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setUploadProgress(0);
    }
  };

  const formik = useFormik({
    initialValues: {
      avatar: "",
    },
    validationSchema: Yup.object().shape({
      avatar: Yup.string().required("Please upload your avatar"),
    }),
    onSubmit: async (values) => {
      // This will now be handled by handleNavigateToAvatarUpload
    },
  });

  console.log("Rendered UploadAvatar with userId:", userId);

  return (
    <>
      <ThemeProvider theme={theme}>
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

              <form style={{ width: "100%" }}>
                <Grid>
                  <Typography
                    sx={{
                      textAlign: "center",
                      color: "#ffffffff",
                      fontWeight: "bold",
                      fontSize: "0.875rem",
                    }}
                  >
                    Look your best! Upload a clear, confident photo of you. A
                    great pic gets great results.
                  </Typography>

                  <Grid item xs={12} sx={{ mt: 2, textAlign: "center" }}>
                    <Typography
                      variant="h6"
                      sx={{ color: "#c2185b", fontWeight: "bold", mb: 2 }}
                    >
                      Primary Profile Picture
                    </Typography>

                    <Box
                      {...getRootProps()}
                      sx={{
                        width: 200,
                        aspectRatio: "4 / 5",
                        border: "2px dashed #fff",
                        borderRadius: 4,
                        backgroundColor: isDragActive ? "#2a2a2a" : "#1d1d1d",
                        mx: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "0.3s",
                      }}
                    >
                      <input {...getInputProps()} multiple={false} />

                      {croppedAvatar || storedAvatar ? (
                        <>
                          <Box
                            component="img"
                            src={croppedAvatar || storedAvatar || ""}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            sx={{
                              position: "absolute",
                              bottom: 8,
                              right: 8,
                              backgroundColor: "rgba(0,0,0,0.6)",
                              color: "#fff",
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </>
                      ) : (
                        <PhotoCameraOutlinedIcon
                          sx={{ fontSize: 40, color: "#c2185b" }}
                        />
                      )}
                    </Box>

                    {formik.errors.avatar && (
                      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
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
                    No nudity, vulgarity, cartoons, or objects. Real faces only
                    - this is a community of real people.
                  </Typography>

                  <Grid item xs={12} sx={{ textAlign: "center", mt: 2, mb: 4 }}>
                    <Button
                      onClick={handleNavigateToAvatarUpload}
                      disabled={isUploading || !uploadedAvatarUrl}
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        backgroundColor: "#c2185b",
                        color: "#fff",
                        "&:hover": { backgroundColor: "#ad1457" },
                        "&.Mui-disabled": {
                          backgroundColor: "rgba(194, 24, 91, 0.3)",
                        },
                      }}
                    >
                      {isUploading ? (
                        <>
                          <CircularProgress size={24} sx={{ color: "#fff" }} />
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

                  <Box sx={{ mt: 2, textAlign: "center", px: 2 }}>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        mb: 1,
                      }}
                    >
                      Selfie Verification Guidelines
                    </Typography>

                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.75)",
                        fontSize: "0.8rem",
                        lineHeight: 1.6,
                      }}
                    >
                      This photo will be used for selfie verification to confirm
                      your identity. Make sure:
                    </Typography>

                    <Box
                      component="ul"
                      sx={{
                        textAlign: "left",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: "0.8rem",
                        mt: 1,
                        pl: 3,
                      }}
                    >
                      <li>Your full face is clearly visible</li>
                      <li>No sunglasses, masks, or heavy filters</li>
                      <li>Good lighting and no blur</li>
                      <li>No nudity or inappropriate content</li>
                    </Box>

                    <Typography
                      sx={{
                        color: "#c2185b",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        mt: 1,
                      }}
                    >
                      Please use a real photo of yourself, it helps us keep our
                      community safe and genuine.
                    </Typography>
                  </Box>
                </Grid>
              </form>

              <Carousel title="Exciting Events and Real Connections Start Here!" />
            </Paper>
          </Container>
        </Box>

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
            {!isCropping ? (
              <Cropper
                key={avatarImage}
                image={avatarImage || undefined}
                crop={crop}
                zoom={zoom}
                objectFit="contain"
                aspect={4 / 5}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onMediaLoaded={() => {
                  setTimeout(() => {
                    setZoom(1);
                  }, 50);
                }}
              />
            ) : (
              <Box
                sx={{
                  height: "450px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 4,
                  background:
                    "linear-gradient(145deg, #0A0118 0%, #1A0B2E 100%)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    opacity: 0.3,
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      width: "200%",
                      height: "200%",
                      background:
                        "radial-gradient(circle, #FF2D55 0%, transparent 50%)",
                      animation: "pulse 4s ease-in-out infinite",
                      transform: "translate(-50%, -50%)",
                    },
                    "@keyframes pulse": {
                      "0%, 100%": {
                        opacity: 0.3,
                        transform: "translate(-50%, -50%) scale(1)",
                      },
                      "50%": {
                        opacity: 0.6,
                        transform: "translate(-50%, -50%) scale(1.2)",
                      },
                    },
                  }}
                />

                <Box
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{ position: "relative", display: "inline-flex", mb: 3 }}
                  >
                    <CircularProgress
                      size={80}
                      thickness={4}
                      variant="determinate"
                      value={uploadProgress}
                      sx={{
                        color: "#c2185b",
                        "& .MuiCircularProgress-circle": {
                          strokeLinecap: "round",
                          transition: "stroke-dashoffset 0.5s ease",
                        },
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: "1.2rem",
                          textShadow: "0 0 10px rgba(194, 24, 91, 0.5)",
                        }}
                      >
                        {uploadProgress}%
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      color: "#fff",
                      mb: 1,
                      fontWeight: 600,
                      background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      animation: "fadeInOut 2s ease-in-out infinite",
                      "@keyframes fadeInOut": {
                        "0%, 100%": { opacity: 0.8 },
                        "50%": { opacity: 1 },
                      },
                    }}
                  >
                    {uploadProgress < 25 && "Cropping your image..."}
                    {uploadProgress >= 25 &&
                      uploadProgress < 50 &&
                      "Optimizing quality..."}
                    {uploadProgress >= 50 &&
                      uploadProgress < 75 &&
                      "Uploading to cloud..."}
                    {uploadProgress >= 75 &&
                      uploadProgress < 100 &&
                      "Almost there..."}
                    {uploadProgress === 100 && "Complete! 🎉"}
                  </Typography>

                  <Box sx={{ width: "100%", maxWidth: "320px", mt: 3 }}>
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 5,
                          background:
                            "linear-gradient(90deg, #FF2D55, #7000FF)",
                          boxShadow: "0 0 20px rgba(194, 24, 91, 0.5)",
                          transition: "transform 0.3s ease",
                        },
                      }}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1.5,
                        width: "100%",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255,255,255,0.6)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {uploadProgress < 25 && "Cropping"}
                        {uploadProgress >= 25 &&
                          uploadProgress < 50 &&
                          "Optimizing"}
                        {uploadProgress >= 50 &&
                          uploadProgress < 75 &&
                          "Uploading"}
                        {uploadProgress >= 75 &&
                          uploadProgress < 100 &&
                          "Finalizing"}
                        {uploadProgress === 100 && "Done"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                        }}
                      >
                        {uploadProgress}% complete
                      </Typography>
                    </Box>

                    {uploadProgress === 100 && (
                      <Box
                        sx={{
                          mt: 3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          animation: "slideUp 0.5s ease",
                          "@keyframes slideUp": {
                            "0%": { opacity: 0, transform: "translateY(20px)" },
                            "100%": { opacity: 1, transform: "translateY(0)" },
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#00D179",
                            fontWeight: 500,
                          }}
                        >
                          ✓ Upload successful!
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions
            sx={{
              background: "linear-gradient(145deg, #0A0118 0%, #1A0B2E 100%)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              justifyContent: "center",
              p: 2,
            }}
          >
            {!isCropping ? (
              <>
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
              </>
            ) : (
              <Button
                variant="outlined"
                sx={{
                  color: "#fff",
                  border: "none",
                  backgroundColor: "#c2185b",
                }}
              >
                Processing...
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </>
  );
}
