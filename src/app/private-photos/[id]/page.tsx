"use client";

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  createTheme,
  Grid,
  IconButton,
  Paper,
  ThemeProvider,
  Typography,
  useMediaQuery,
  Tooltip,
  DialogContent,
  Dialog,
  Slider,
  DialogActions,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useRouter } from "next/navigation";
import Carousel from "@/commonPage/Carousel";
import Cropper from "react-easy-crop";

type Params = Promise<{ id: string }>;

const MAX_PHOTOS = 6;

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
  const particles = useMemo(
    () =>
      Array.from({ length: isMobile ? 15 : 50 }).map((_, i) => ({
        id: i,
        size: Math.random() * (isMobile ? 4 : 6) + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * (isMobile ? 15 : 20) + 10,
        delay: -Math.random() * 20,
      })),
    [isMobile],
  );

  return (
    <Box
      sx={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.6 }}
    >
      {particles.map((p) => (
        <Box
          key={p.id}
          sx={{
            position: "absolute",
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: "linear-gradient(45deg, #FF2D55, #7000FF)",
            borderRadius: "50%",
            animation: `float ${p.duration}s infinite linear`,
            animationDelay: `${p.delay}s`,
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

const page = ({ params }: { params: Params }) => {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const p = await params;
      setUserId(p.id);
    })();
  }, [params]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [previews, setPreviews] = useState<(string | null)[]>(
    Array.from({ length: MAX_PHOTOS }, () => null),
  );
  const [files, setFiles] = useState<(File | null)[]>(
    Array.from({ length: MAX_PHOTOS }, () => null),
  );
  const [dragOver, setDragOver] = useState(false);

  const getCroppedImg = (imageSrc: string, crop: any): Promise<File> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas error");

        // 🔥 FORCE 4:5 OUTPUT
        const TARGET_WIDTH = 800;
        const TARGET_HEIGHT = 1000;

        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          TARGET_WIDTH,
          TARGET_HEIGHT,
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Blob error");

            resolve(
              new File([blob], "cropped.jpg", {
                type: "image/jpeg",
              }),
            );
          },
          "image/jpeg",
          0.95,
        );
      };

      image.onerror = reject;
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file, `${Date.now()}-${file.name}`);

    const res = await fetch("/api/user/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (!result.blobUrl) {
      throw new Error("Upload failed");
    }
    return result.blobUrl;
  };

  const uploadPrivateImage = async (imageUrl: string) => {
    try {
      const response = await fetch("/api/user/profile/update/private-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pid: userId,
          image: imageUrl,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save image reference");
      }
    } catch (error) {
      console.error("Error saving private image:", error);
      throw error;
    }
  };

  const formik = useFormik({
    initialValues: { photos: [] as File[] },
    validationSchema: Yup.object().shape({
      photos: Yup.array()
        .of(Yup.mixed<File>())
        .max(MAX_PHOTOS, `You can upload up to ${MAX_PHOTOS} photos`),
    }),
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        const uploadedUrls: string[] = [];

        if (values?.photos?.length > 0) {
          for (let i = 0; i < values?.photos?.length; i++) {
            const f = values.photos[i];
            setUploadProgress(i + 1);
            const url = await uploadImage(f);
            await uploadPrivateImage(url);
            uploadedUrls.push(url);
          }

          if (uploadedUrls.length === 0) {
            setFieldError("photos", "Image upload failed. Try again.");
            return;
          }
        }
        await router.push(`/about/${userId}`);
      } catch (e) {
        console.error("Error in upload flow:", e);
        setFieldError("photos", "Something went wrong during upload.");
      } finally {
        setSubmitting(false);
        setUploadProgress(0);
      }
    },
  });

  const firstEmptyIndex = () => previews.findIndex((p) => !p);

  const validateAndUseFiles = (incoming: File[], targetIndex?: number) => {
    const newPreviews = [...previews];
    const newFiles = [...files];
    let idx = typeof targetIndex === "number" ? targetIndex : firstEmptyIndex();

    for (const f of incoming) {
      if (!f.type.startsWith("image/")) continue;
      if (idx < 0 || idx >= MAX_PHOTOS) break;

      if (newPreviews[idx]) URL.revokeObjectURL(newPreviews[idx]!);
      const url = URL.createObjectURL(f);
      newPreviews[idx] = url;
      newFiles[idx] = f;

      const next = newPreviews.findIndex((p, i) => !p && i > idx);
      idx = next === -1 ? MAX_PHOTOS : next;
    }

    setPreviews(newPreviews);
    setFiles(newFiles);
    formik.setFieldValue(
      "photos",
      newFiles.filter((x): x is File => !!x),
    );
  };

  const onTilePick = (i: number) => inputRefs.current[i]?.click();

  const onTileChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files ? Array.from(e.target.files) : [];
    if (!fl.length) return;

    setSelectedFile(fl[0]);
    setSelectedIndex(i);
    setCropModalOpen(true);

    e.target.value = "";
  };

  const handleCropDone = async () => {
    if (!selectedFile || !croppedAreaPixels || selectedIndex === null) return;
    const previewUrl = URL.createObjectURL(selectedFile);

    try {
      const croppedFile = await getCroppedImg(previewUrl, croppedAreaPixels);
      validateAndUseFiles([croppedFile], selectedIndex);
    } catch (e) {
      console.error("Crop failed", e);
    } finally {
      setCropModalOpen(false);
      setSelectedFile(null);
      setSelectedIndex(null);
    }
  };

  const onRemove = (i: number) => {
    const newPreviews = [...previews];
    const newFiles = [...files];
    if (newPreviews[i]) URL.revokeObjectURL(newPreviews[i]!);
    newPreviews[i] = null;
    newFiles[i] = null;
    setPreviews(newPreviews);
    setFiles(newFiles);
    formik.setFieldValue(
      "photos",
      newFiles.filter((x): x is File => !!x),
    );
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const fl = Array.from(e.dataTransfer.files || []);
    if (!fl.length) return;
    validateAndUseFiles(fl);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const Tile = ({ i, showAddBadge }: { i: number; showAddBadge?: boolean }) => {
    const hasPhoto = !!previews[i];
    return (
      <Box
        role="button"
        onClick={() => onTilePick(i)}
        sx={{
          width: "100%",
          aspectRatio: "4 / 5", // 🔥 MATCH CROP
          border: "2px dashed rgba(255,255,255,0.7)",
          borderRadius: 3,
          backgroundColor: "#000",
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
              sx={{ fontSize: { xs: 26, sm: 30, md: 34 }, color: "#FF2D55" }}
            />
            {showAddBadge && (
              <Typography
                sx={{
                  color: "#FF2D55",
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
                    onRemove(i);
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

  const firstEmpty = firstEmptyIndex();
  const showAddBadgeIndex = firstEmpty === -1 ? undefined : firstEmpty;
  const isUploading = formik.isSubmitting;

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
          maxWidth="md"
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
            <form onSubmit={formik.handleSubmit} style={{ width: "100%" }}>
              <Grid>
                <Typography
                  variant="h6"
                  sx={{
                    color: "#c2185b",
                    fontWeight: "bold",
                    textAlign: "center",
                    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                    mb: { xs: 2, sm: 3 },
                  }}
                >
                  Private Photos{" "}
                  <Typography component="span" sx={{ fontWeight: 400 }}>
                    (Optional)
                  </Typography>
                </Typography>
                <Typography
                  sx={{
                    textAlign: "center",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: { xs: "0.85rem", sm: "0.95rem" },
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  You can post private pics here. Only users you give access
                  will be able to see these - so anything goes!
                </Typography>

                {/* Drag & Drop wrapper */}
                <Box
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  sx={{
                    mt: 3,
                    p: { xs: 1, sm: 1.5 },
                    borderRadius: 2,
                    outline: dragOver
                      ? "2px dashed #FF2D55"
                      : "2px dashed transparent",
                    transition: "outline-color 0.15s ease",
                  }}
                >
                  <Grid
                    container
                    spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
                    sx={{ maxWidth: 1000, mx: "auto" }}
                  >
                    {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
                      <Grid
                        key={i}
                        item
                        xs={4}
                        sm={4}
                        md={3}
                        lg={2}
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Tile i={i} showAddBadge={showAddBadgeIndex === i} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {formik.errors.photos &&
                  typeof formik.errors.photos === "string" && (
                    <Typography
                      color="error"
                      variant="body2"
                      sx={{ mt: 1, textAlign: "center" }}
                    >
                      {formik.errors.photos}
                    </Typography>
                  )}

                <Typography
                  sx={{
                    textAlign: "center",
                    color: "#fff",
                    fontWeight: 700,
                    mt: { xs: 2, sm: 2.5 },
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                  }}
                >
                  You can always add, update, or remove these later
                </Typography>

                <Grid
                  item
                  xs={12}
                  sx={{ textAlign: "center", mt: { xs: 2.5, sm: 3 } }}
                >
                  <Button
                    type="submit"
                    disabled={isUploading}
                    sx={{
                      width: { xs: 52, sm: 56 },
                      height: { xs: 52, sm: 56 },
                      borderRadius: "50%",
                      backgroundColor: "#FF2D55",
                      color: "#fff",
                      "&:hover": { backgroundColor: "#CC1439" },
                      position: "relative",
                    }}
                  >
                    {isUploading ? (
                      <CircularProgress size={24} sx={{ color: "#fff" }} />
                    ) : (
                      <ArrowForwardIosIcon />
                    )}
                  </Button>
                  {isUploading && (
                    <Typography
                      sx={{
                        mt: 2,
                        textAlign: "center",
                        color: "#fff",
                        fontSize: { xs: "0.85rem", sm: "0.95rem" },
                        fontWeight: 500,
                      }}
                    >
                      Uploading {uploadProgress} of{" "}
                      {formik.values.photos.length}
                    </Typography>
                  )}
                </Grid>

                <Box sx={{ mt: { xs: 3, sm: 4 } }}>
                  <Carousel title="Users LOVE to see your private pics" />
                </Box>
              </Grid>
            </form>
          </Paper>
        </Container>
      </Box>

      <Dialog
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#121212",
            color: "#fff",
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogContent
          sx={{ position: "relative", height: 500, bgcolor: "#000" }}
        >
          {selectedFile && (
            <Cropper
              image={URL.createObjectURL(selectedFile)}
              crop={crop}
              zoom={zoom}
              aspect={4 / 5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixels) =>
                setCroppedAreaPixels(croppedAreaPixels)
              }
              cropShape="rect"
              showGrid={false}
            />
          )}
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
            onClick={handleCropDone}
            sx={{
              backgroundColor: "#c2185b",
              "&:hover": { backgroundColor: "#ad1457" },
            }}
          >
            Crop
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default page;
