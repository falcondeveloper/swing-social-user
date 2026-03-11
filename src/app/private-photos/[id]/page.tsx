"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  createTheme,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  ThemeProvider,
  Typography,
  useMediaQuery,
  Tooltip,
  DialogContent,
  Dialog,
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
import Fade from "@mui/material/Fade";
import heic2any from "heic2any";

type Params = Promise<{ id: string }>;

type PrivateImage = {
  Id: string;
  Url: string;
  ProfileId: string;
};

// ── "deleting" added for delete spinner ──────────────────────────────────────
type SlotUploadStatus = "idle" | "uploading" | "done" | "error" | "deleting";

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
ParticleField.displayName = "ParticleField";

const PrivatePhotosPage = ({ params }: { params: Params }) => {
  const router = useRouter();

  // ── Ref: tracks per-slot cloud URL for submit polling ────────────────────
  const slotUploadedUrlsRef = useRef<(string | null)[]>(
    Array.from({ length: MAX_PHOTOS }, () => null),
  );

  // ── State ─────────────────────────────────────────────────────────────────
  const [userId, setUserId] = useState<string>("");
  const [openCropper, setOpenCropper] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  // ── Parallel slot arrays ──────────────────────────────────────────────────
  const [previews, setPreviews] = useState<(string | null)[]>(
    Array.from({ length: MAX_PHOTOS }, () => null),
  );
  const [files, setFiles] = useState<(File | null)[]>(
    Array.from({ length: MAX_PHOTOS }, () => null),
  );
  const [uploadedUrls, setUploadedUrls] = useState<(string | null)[]>(
    Array.from({ length: MAX_PHOTOS }, () => null),
  );
  const [imageIds, setImageIds] = useState<(string | null)[]>(
    Array.from({ length: MAX_PHOTOS }, () => null),
  );
  const [slotUploadStatus, setSlotUploadStatus] = useState<SlotUploadStatus[]>(
    Array.from({ length: MAX_PHOTOS }, () => "idle"),
  );

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasAnyPhoto = previews.some((p) => !!p);

  // ── Resolve params ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const p = await params;
      setUserId(p.id);
    })();
  }, [params]);

  // ── Fetch existing private images ─────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const getPrivateImages = async () => {
      try {
        const response = await fetch(`/api/user/sweeping/images?id=${userId}`);
        const data = await response.json();
        const images: PrivateImage[] = data?.images || [];

        if (images.length === 0) return;

        const newPreviews = Array.from({ length: MAX_PHOTOS }, () => null) as (
          | string
          | null
        )[];
        const newUrls = Array.from({ length: MAX_PHOTOS }, () => null) as (
          | string
          | null
        )[];
        const newIds = Array.from({ length: MAX_PHOTOS }, () => null) as (
          | string
          | null
        )[];

        images.slice(0, MAX_PHOTOS).forEach((img, i) => {
          newPreviews[i] = img.Url;
          newUrls[i] = img.Url;
          newIds[i] = img.Id;
        });

        setPreviews(newPreviews);
        setUploadedUrls(newUrls);
        setImageIds(newIds);

        // ✅ Mark fetched slots as done so submit polling skips them
        setSlotUploadStatus((prev) => {
          const next = [...prev];
          images.slice(0, MAX_PHOTOS).forEach((_, i) => {
            next[i] = "done";
          });
          return next;
        });
      } catch (error) {
        console.error("Error fetching private images:", error);
      } finally {
        setImagesLoading(false);
      }
    };

    getPrivateImages();
  }, [userId]);

  // ── Cloudinary upload ─────────────────────────────────────────────────────
  const uploadToCloudinary = async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "dating_unsigned");
    formData.append("folder", "dating-app/private-photos");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dkkf79biv/image/upload",
      {
        method: "POST",
        body: formData,
      },
    );
    if (!res.ok) throw new Error("Cloudinary upload failed");

    const data = await res.json();
    return data.secure_url.replace(
      "/upload/",
      "/upload/w_800,h_1000,c_fill,q_auto,f_auto/",
    );
  };

  const saveImageToDb = async (imageUrl: string) => {
    const response = await fetch("/api/user/profile/update/private-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pid: userId, image: imageUrl }),
    });
    if (!response.ok) throw new Error("Failed to save image reference");
  };

  // ── Background upload per slot (fires after crop confirm) ────────────────
  const runBackgroundUpload = async (blob: Blob, slotIndex: number) => {
    setSlotUploadStatus((prev) => {
      const next = [...prev];
      next[slotIndex] = "uploading";
      return next;
    });

    try {
      const cloudUrl = await uploadToCloudinary(blob);
      await saveImageToDb(cloudUrl);

      slotUploadedUrlsRef.current[slotIndex] = cloudUrl;

      setUploadedUrls((prev) => {
        const next = [...prev];
        next[slotIndex] = cloudUrl;
        return next;
      });

      setSlotUploadStatus((prev) => {
        const next = [...prev];
        next[slotIndex] = "done";
        return next;
      });
    } catch (err) {
      console.error(`Background upload failed for slot ${slotIndex}:`, err);
      setSlotUploadStatus((prev) => {
        const next = [...prev];
        next[slotIndex] = "error";
        return next;
      });
    }
  };

  // ── Formik — submit just polls then navigates ─────────────────────────────
  const formik = useFormik({
    initialValues: { photos: [] as File[] },
    validationSchema: Yup.object().shape({
      photos: Yup.array()
        .of(Yup.mixed<File>())
        .max(MAX_PHOTOS, `You can upload up to ${MAX_PHOTOS} photos`),
    }),
    onSubmit: async (_, { setSubmitting, setFieldError }) => {
      try {
        // Poll any slots still uploading
        const uploadingSlots = slotUploadStatus
          .map((status, i) => ({ status, i }))
          .filter(({ status }) => status === "uploading");

        if (uploadingSlots.length > 0) {
          await Promise.all(
            uploadingSlots.map(
              ({ i }) =>
                new Promise<void>((resolve, reject) => {
                  let attempts = 0;
                  const interval = setInterval(() => {
                    attempts++;
                    if (slotUploadedUrlsRef.current[i]) {
                      clearInterval(interval);
                      resolve();
                    } else if (attempts > 100) {
                      clearInterval(interval);
                      reject(new Error(`Slot ${i} upload timed out`));
                    }
                  }, 300);
                }),
            ),
          );
        }

        const hasErrors = slotUploadStatus.some((s) => s === "error");
        if (hasErrors) {
          setFieldError(
            "photos",
            "Some photos failed to upload. Please remove and re-add them.",
          );
          return;
        }

        // ✅ Private photos are optional — always navigate
        await router.push(`/about/${userId}`);
      } catch (e) {
        console.error("Submit failed:", e);
        setFieldError("photos", "Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ── Slot helpers ──────────────────────────────────────────────────────────
  const firstEmptyIndex = () => previews.findIndex((p) => !p);

  const onTilePick = (i: number) => inputRefs.current[i]?.click();

  // ── HEIC conversion + open cropper ───────────────────────────────────────
  const processAndOpenCropper = useCallback(
    async (rawFile: File, slotIndex: number) => {
      let file = rawFile;
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
          file = new File(
            [blob],
            file.name.replace(/\.(heic|heif)$/i, ".jpg"),
            { type: "image/jpeg" },
          );
        }

        const downscaled = await downscaleImage(file);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setSelectedFile(downscaled);
        setCropImageUrl(URL.createObjectURL(downscaled));
        setSelectedIndex(slotIndex);
        setOpenCropper(true);
      } catch (error) {
        console.error("File processing failed:", error);
      }
    },
    [],
  );

  const onTileChange = async (
    i: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const fl = e.target.files ? Array.from(e.target.files) : [];
    if (!fl.length) return;
    await processAndOpenCropper(fl[0], i);
    e.target.value = "";
  };

  // ── Crop confirm — close immediately, upload in background ───────────────
  const onCropComplete = (_: any, area: any) => setCroppedAreaPixels(area);

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || !selectedFile || selectedIndex === null) return;

    try {
      const imageBitmap = await createImageBitmap(selectedFile);
      const { x, y, width, height } = croppedAreaPixels;

      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imageBitmap, x, y, width, height, 0, 0, 800, 1000);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject("Blob creation failed")),
          "image/jpeg",
          0.85,
        );
      });

      // ✅ Show preview immediately
      const previewUrl = URL.createObjectURL(blob);
      const newPreviews = [...previews];
      newPreviews[selectedIndex] = previewUrl;
      setPreviews(newPreviews);

      // ✅ Close dialog immediately
      if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
      setCropImageUrl(null);
      setSelectedFile(null);
      const capturedIndex = selectedIndex;
      setSelectedIndex(null);
      setOpenCropper(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);

      // 🔥 Fire and forget
      runBackgroundUpload(blob, capturedIndex);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  const downscaleImage = async (file: File): Promise<File> => {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        0.95,
      );
    });
  };

  // ── Delete with spinner ───────────────────────────────────────────────────
  const onRemove = async (i: number) => {
    const imageId = imageIds[i];
    const isServer = !!uploadedUrls[i] && !!imageId;

    if (isServer) {
      setSlotUploadStatus((prev) => {
        const next = [...prev];
        next[i] = "deleting";
        return next;
      });

      try {
        const response = await fetch(
          "/api/user/profile/update/images/private/delete",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: userId, imageId }),
          },
        );
        const data = await response.json();
        if (data.status !== 200) {
          console.error("Delete failed:", data);
          setSlotUploadStatus((prev) => {
            const next = [...prev];
            next[i] = "done";
            return next;
          });
          return;
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        setSlotUploadStatus((prev) => {
          const next = [...prev];
          next[i] = "done";
          return next;
        });
        return;
      }
    }

    const newPreviews = [...previews];
    const newFiles = [...files];
    const newUrls = [...uploadedUrls];
    const newIds = [...imageIds];

    if (newPreviews[i]?.startsWith("blob:"))
      URL.revokeObjectURL(newPreviews[i]!);

    newPreviews[i] = null;
    newFiles[i] = null;
    newUrls[i] = null;
    newIds[i] = null;
    slotUploadedUrlsRef.current[i] = null;

    setPreviews(newPreviews);
    setFiles(newFiles);
    setUploadedUrls(newUrls);
    setImageIds(newIds);
    setSlotUploadStatus((prev) => {
      const next = [...prev];
      next[i] = "idle";
      return next;
    });
    formik.setFieldValue(
      "photos",
      newFiles.filter((x): x is File => !!x),
    );
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const onDropWrapper = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const fl = Array.from(e.dataTransfer.files || []);
    if (!fl.length) return;
    const idx = firstEmptyIndex();
    if (idx === -1) return;
    await processAndOpenCropper(fl[0], idx);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);

  // ── Tile ──────────────────────────────────────────────────────────────────
  const Tile = ({ i, showAddBadge }: { i: number; showAddBadge?: boolean }) => {
    const hasPhoto = !!previews[i];
    const isProcessing =
      slotUploadStatus[i] === "uploading" || slotUploadStatus[i] === "deleting";

    return (
      <Box
        role="button"
        onClick={() => !isProcessing && onTilePick(i)}
        sx={{
          width: "100%",
          aspectRatio: "4 / 5",
          border: "2px dashed rgba(255,255,255,0.7)",
          borderRadius: 3,
          backgroundColor: "#1d1d1d",
          position: "relative",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          cursor: isProcessing ? "default" : "pointer",
          transition: "transform 0.15s ease",
          "&:hover": { transform: isProcessing ? "none" : "scale(1.02)" },
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
            {/* 1️⃣ Image */}
            <img
              src={previews[i] as string}
              alt={`private-photo-${i + 1}`}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {/* 2️⃣ Uploading overlay */}
            {slotUploadStatus[i] === "uploading" && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  zIndex: 1,
                }}
              >
                <CircularProgress size={28} sx={{ color: "#FF2D55" }} />
                <Typography
                  sx={{ color: "#fff", fontSize: "0.6rem", fontWeight: 600 }}
                >
                  Uploading...
                </Typography>
              </Box>
            )}

            {/* 3️⃣ Deleting overlay */}
            {slotUploadStatus[i] === "deleting" && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  zIndex: 1,
                }}
              >
                <CircularProgress size={28} sx={{ color: "#FF2D55" }} />
                <Typography
                  sx={{ color: "#fff", fontSize: "0.6rem", fontWeight: 600 }}
                >
                  Deleting...
                </Typography>
              </Box>
            )}

            {/* 4️⃣ Error banner */}
            {slotUploadStatus[i] === "error" && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "rgba(255,45,85,0.85)",
                  py: 0.5,
                  textAlign: "center",
                  zIndex: 1,
                }}
              >
                <Typography
                  sx={{ color: "#fff", fontSize: "0.65rem", fontWeight: 700 }}
                >
                  ✕ Upload failed
                </Typography>
              </Box>
            )}

            {/* 5️⃣ Action buttons — hidden while processing */}
            {!isProcessing && (
              <Box
                sx={{
                  position: "absolute",
                  right: 6,
                  bottom: 6,
                  display: "flex",
                  gap: 0.5,
                  zIndex: 2,
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
            )}
          </>
        )}

        <input
          ref={(el: any) => (inputRefs.current[i] = el)}
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(e) => onTileChange(i, e)}
          style={{ display: "none" }}
        />
      </Box>
    );
  };

  const firstEmpty = firstEmptyIndex();
  const showAddBadgeIndex = firstEmpty === -1 ? undefined : firstEmpty;
  const isSubmitting = formik.isSubmitting;
  const anyUploading = slotUploadStatus.some((s) => s === "uploading");

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
                  will be able to see these — so anything goes!
                </Typography>

                <Box
                  onDrop={onDropWrapper}
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
                  sx={{
                    textAlign: "center",
                    mt: 2,
                    mb: 2,
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
                    type="submit"
                    disabled={isSubmitting}
                    sx={{
                      width: 56,
                      height: 56,
                      minWidth: 56,
                      borderRadius: "50%",
                      backgroundColor: "#c2185b",
                      color: "#fff",
                      "&:hover": { backgroundColor: "#ad1457" },
                      "&.Mui-disabled": {
                        backgroundColor: "rgba(194,24,91,0.3)",
                      },
                    }}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} sx={{ color: "#fff" }} />
                    ) : (
                      <ArrowForwardIosIcon />
                    )}
                  </Button>
                </Grid>

                <Box sx={{ mt: { xs: 3, sm: 4 } }}>
                  <Carousel title="Users LOVE to see your private pics" />
                </Box>
              </Grid>
            </form>
          </Paper>
        </Container>
      </Box>

      {/* ── Crop Dialog ── */}
      <Dialog
        open={openCropper}
        onClose={() => {
          if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
          setCropImageUrl(null);
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
            height: { xs: "375px", sm: "500px" },
            position: "relative",
            padding: 0,
          }}
        >
          <Cropper
            key={cropImageUrl}
            image={cropImageUrl || undefined}
            crop={crop}
            zoom={zoom}
            aspect={4 / 5}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            zoomSpeed={0.1}
            restrictPosition={false}
          />
        </DialogContent>
        <DialogActions
          sx={{ backgroundColor: "#121212", justifyContent: "center", p: 2 }}
        >
          <Button
            variant="outlined"
            onClick={() => {
              if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
              setCropImageUrl(null);
              setOpenCropper(false);
              setCrop({ x: 0, y: 0 });
              setZoom(1);
            }}
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
            Crop & Add
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default PrivatePhotosPage;
