"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  styled,
  createTheme,
  ThemeProvider,
  useMediaQuery,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Tabs,
  Tab,
  Fade,
  Alert,
  Snackbar,
  Stack,
  DialogActions,
  LinearProgress,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import {
  MapPin,
  Crown,
  Info,
  Upload,
  X,
  Edit,
  Save,
  Camera,
  User,
  Settings,
  LogOut,
  Lock,
  Globe,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import Cropper, { Area } from "react-easy-crop";
import getCroppedImg from "../../utils/cropImage";
import ProfileImgCheckerModel from "@/components/ProfileImgCheckerModel";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import Loader from "@/commonPage/Loader";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#FF1B6B",
      dark: "#c2185b",
    },
    secondary: {
      main: "#03dac5",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#ffffff",
      secondary: "#aaaaaa",
    },
  },
  typography: {
    h4: {
      fontWeight: 700,
      fontSize: "2rem",
      color: "white",
    },
    h6: {
      fontWeight: 600,
      color: "#FF1B6B",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 600,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        contained: {
          background: "linear-gradient(135deg, #FF1B6B 0%, #c2185b 100%)",
          boxShadow: "0 4px 15px rgba(255, 27, 107, 0.25)",
          "&:hover": {
            background: "linear-gradient(135deg, #c2185b 0%, #d81160 100%)",
            transform: "translateY(-2px)",
            boxShadow: "0 8px 25px rgba(255, 27, 107, 0.35)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "rgba(30, 30, 30, 0.8)",
          backdropFilter: "blur(20px)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(30, 30, 30, 0.8)",
            borderRadius: "12px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.12)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255, 27, 107, 0.5)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#FF1B6B",
              borderWidth: "2px",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#aaaaaa",
            "&.Mui-focused": {
              color: "#FF1B6B",
            },
          },
          "& .MuiOutlinedInput-input": {
            color: "#ffffff",
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          "& .MuiTabs-indicator": {
            backgroundColor: "#FF1B6B",
            height: "3px",
            borderRadius: "3px",
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "#aaaaaa",
          fontWeight: 500,
          fontSize: "14px",
          textTransform: "none",
          "&.Mui-selected": {
            color: "#FF1B6B",
            fontWeight: 600,
          },
        },
      },
    },
  },
});

const ProfileHeader = styled(Card)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: "24px",
  background: "rgba(30, 30, 30, 0.95)",
  border: "1px solid rgba(255, 27, 107, 0.1)",
  backdropFilter: "blur(20px)",
}));

const CoverImageContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  height: "280px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  borderRadius: "24px 24px 0 0",
  cursor: "pointer",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    background:
      "linear-gradient(to top, rgba(18,18,18,0.9) 0%, transparent 100%)",
    pointerEvents: "none",
  },
}));

const ProfileAvatar = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "120px",
  height: "120px",
  borderRadius: "50%",
  border: "4px solid rgba(30, 30, 30, 0.9)",
  overflow: "hidden",
  cursor: "pointer",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: "0 12px 40px rgba(255, 27, 107, 0.3)",
  },
}));

const ImageGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: "16px",
  padding: "24px 0",
});

const ImageCard = styled(motion.div)(({ theme }) => ({
  position: "relative",
  aspectRatio: "1",
  borderRadius: "16px",
  overflow: "hidden",
  cursor: "pointer",
  background: "rgba(30, 30, 30, 0.8)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "scale(1.02)",
    boxShadow: "0 8px 25px rgba(255, 27, 107, 0.15)",
  },
}));

const UploadCard = styled(Box)(({ theme }) => ({
  aspectRatio: "1",
  borderRadius: "16px",
  border: "2px dashed rgba(255, 27, 107, 0.3)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  background: "rgba(255, 27, 107, 0.05)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    borderColor: "rgba(255, 27, 107, 0.6)",
    background: "rgba(255, 27, 107, 0.1)",
    transform: "scale(1.02)",
  },
}));

const ActionChip = styled(Chip)(({ theme }) => ({
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  color: "white",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  fontSize: "0.75rem",
  height: "auto",
  padding: "4px 8px",
  minWidth: "fit-content",
  "& .MuiChip-label": {
    padding: "2px 4px",
    fontSize: "inherit",
  },
  "& .MuiChip-icon": {
    margin: "0 2px 0 0",
  },
  "&:hover": {
    backgroundColor: "rgba(255, 27, 107, 0.2)",
    borderColor: "rgba(255, 27, 107, 0.3)",
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.7rem",
    "& .MuiChip-label": {
      padding: "1px 2px",
    },
  },
}));

const BODY_TYPES = [
  "Average",
  "Slim/Petite",
  "Ample",
  "Athletic",
  "BBW/BBM",
  "A little extra padding",
];

const EYE_COLORS = ["Gray", "Brown", "Black", "Green", "Blue", "Hazel"];

const HAIR_COLORS = [
  "Platinum Blonde",
  "Other",
  "Silver",
  "Hair? What Hair?",
  "Red/Auburn",
  "Grey",
  "White",
  "Blonde",
  "Salt and pepper",
  "Brown",
  "Black",
];
const ORIENTATIONS = ["Straight", "Bi", "Bi-curious", "Open minded"];

interface SwingStyles {
  exploring: boolean;
  fullSwap: boolean;
  softSwap: boolean;
  voyeur: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ImagePreview {
  id: string;
  url: string;
  file: File;
  isUploading: boolean;
}

interface UpdateProfileData {
  ProfileId: string;
  Username: string;
  Age: number;
  PartnerAge: null;
  Gender: string;
  PartnerGender: string;
  Location: string;
  Tagline: string;
  About: string;
  BodyType: string;
  PartnerBodyType: string;
  HairColor: string;
  PartnerHairColor: string;
  EyeColor: string;
  PartnerEyeColor: string;
  AccountType: string;
  ProfileBanner?: string;
  SwingStyle: any;
  Avatar?: string;
  Orientation?: string;
  PartnerSexualOrientation?: string;
  ProfileImages?: (string | null)[];
  PrivateImages?: (string | null)[]; // Add this
}

const ProfileDetail: React.FC = () => {
  const isMobileOrTablet = useMediaQuery("(max-width:900px)");
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [advertiser, setAdvertiser] = useState<any>({});
  const [profileImages, setProfileImages] = useState<any>([]);
  const [privateImages, setPrivateImages] = useState<any>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAge, setCurrentAge] = useState<string>("");
  const [pCurrentAge, setPCurrentAge] = useState<string>("");
  const [membership, setMembership] = useState<any>(0);
  const [membership1, setMembership1] = useState<any>(0);
  const [cityLoading, setCityLoading] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [cityOption, setCityOption] = useState<any>([]);
  const [cityInput, setCityInput] = useState<string>("");
  const isEditingRef = useRef(false);
  const [previewImages, setPreviewImages] = useState<{
    banner: any | null;
    avatar: any | null;
  }>({
    banner: null,
    avatar: null,
  });
  const [publicImagePreviews, setPublicImagePreviews] = useState<
    ImagePreview[]
  >([]);
  const [privateImagePreviews, setPrivateImagePreviews] = useState<
    ImagePreview[]
  >([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [currentCropType, setCurrentCropType] = useState<
    "avatar" | "cover" | null
  >(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const router = useRouter();

  const [avatarUploadStatus, setAvatarUploadStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [bannerUploadStatus, setBannerUploadStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [bannerUploadProgress, setBannerUploadProgress] = useState(0);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<"public" | "private" | null>(null);
  const [cropAreaPixels, setCropAreaPixels] = useState<any>(null);
  const [imageCrop, setImageCrop] = useState({ x: 0, y: 0 });
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const validateImage = (file: File) => {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, JPEG, and PNG files are allowed";
    }

    if (file.size > maxSize) {
      return "Image size should be less than 5MB";
    }

    return "";
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return data?.blobUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleImageAdd = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "public" | "private",
  ) => {
    const files = event.target.files;
    if (!files?.length) return;

    const file = files[0];
    const error = validateImage(file);
    if (error) {
      showSnackbar(error, "error");
      return;
    }

    // Open cropper instead of uploading directly
    setCropFile(file);
    setCropImageUrl(URL.createObjectURL(file));
    setCropType(type);
    setImageCrop({ x: 0, y: 0 });
    setImageZoom(1);
    setCropAreaPixels(null);
    setCropOpen(true);

    event.target.value = "";
  };

  const handleImageCropConfirm = async () => {
    if (!cropAreaPixels || !cropFile || !cropType) return;

    try {
      const imageBitmap = await createImageBitmap(cropFile);
      const { x, y, width, height } = cropAreaPixels;

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

      // Close cropper immediately, show local preview
      const previewUrl = URL.createObjectURL(blob);
      const capturedType = cropType;

      if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
      setCropOpen(false);
      setCropImageUrl(null);
      setCropFile(null);
      setCropType(null);

      const tempId = `temp-${Date.now()}`;
      const tempPreview: ImagePreview = {
        id: tempId,
        url: previewUrl,
        file: new File([blob], "cropped.jpg", { type: "image/jpeg" }),
        isUploading: true,
      };

      if (capturedType === "public") {
        setPublicImagePreviews((prev) => [...prev, tempPreview]);
      } else {
        setPrivateImagePreviews((prev) => [...prev, tempPreview]);
      }

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "dating_unsigned");
      formData.append(
        "folder",
        capturedType === "public"
          ? "dating-app/public-photos"
          : "dating-app/private-photos",
      );

      const cloudRes = await fetch(
        "https://api.cloudinary.com/v1_1/dkkf79biv/image/upload",
        { method: "POST", body: formData },
      );
      if (!cloudRes.ok) throw new Error("Cloudinary upload failed");

      const cloudData = await cloudRes.json();
      const cloudUrl = cloudData.secure_url.replace(
        "/upload/",
        "/upload/w_800,h_1000,c_fill,q_auto,f_auto/",
      );

      // Save to DB
      const endpoint =
        capturedType === "public"
          ? "api/user/profile/update/images/public/insert"
          : "api/user/profile/update/images/private/insert";

      const apiRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, imageURL: cloudUrl }),
      });
      const apiData = await apiRes.json();

      if (apiData.status === 200) {
        if (capturedType === "public") {
          setProfileImages((prev: any) => [
            ...prev,
            { Id: apiData.imageId, Url: cloudUrl },
          ]);
          setPublicImagePreviews((prev) => prev.filter((p) => p.id !== tempId));
        } else {
          setPrivateImages((prev: any) => [
            ...prev,
            { Id: apiData.imageId, Url: cloudUrl },
          ]);
          setPrivateImagePreviews((prev) =>
            prev.filter((p) => p.id !== tempId),
          );
        }
        showSnackbar(
          `${capturedType === "public" ? "Public" : "Private"} photo uploaded!`,
        );
      }
    } catch (err) {
      console.error("Crop/upload failed:", err);
      showSnackbar("Failed to upload image", "error");
    }
  };

  const handleImageDelete = async (
    imageId: string,
    type: "public" | "private",
  ) => {
    try {
      const endpoint =
        type === "public"
          ? "api/user/profile/update/images/public/delete"
          : "api/user/profile/update/images/private/delete";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profileId,
          imageId: imageId,
        }),
      });

      const data = await response.json();
      if (data.status === 200) {
        if (type === "public") {
          setProfileImages((prev: any) =>
            prev.filter((image: any) => image.Id !== imageId),
          );
        } else {
          setPrivateImages((prev: any) =>
            prev.filter((image: any) => image.Id !== imageId),
          );
        }
        showSnackbar("Image deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      showSnackbar("Failed to delete image", "error");
    }
  };

  const uploadToCloudinary = async (
    blob: Blob,
    type: "avatar" | "cover",
  ): Promise<string> => {
    const setStatus =
      type === "avatar" ? setAvatarUploadStatus : setBannerUploadStatus;
    const setProgress =
      type === "avatar" ? setAvatarUploadProgress : setBannerUploadProgress;

    setStatus("uploading");
    setProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "dating_unsigned");
      formData.append("folder", "dating-app/avatars");

      setProgress(50);

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dkkf79biv/image/upload",
        { method: "POST", body: formData },
      );
      if (!res.ok) throw new Error("Cloudinary upload failed");

      const data = await res.json();
      const optimizedUrl = data.secure_url.replace(
        "/upload/",
        type === "avatar"
          ? "/upload/w_800,h_1000,c_fill,q_auto,f_auto/"
          : "/upload/w_1600,h_900,c_fill,q_auto,f_auto/",
      );

      setProgress(80);
      return optimizedUrl;
    } catch (err) {
      setStatus("error");
      setProgress(0);
      throw err;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const fetchData = async (userId: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/user/sweeping/user?id=${userId}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const { user: advertiserData } = await response.json();

      if (advertiserData) {
        const userAge = (
          new Date().getFullYear() -
          new Date(advertiserData?.DateOfBirth).getFullYear()
        ).toString();
        setCurrentAge(userAge);

        if (advertiserData.PartnerDateOfBirth) {
          const partnerAge = (
            new Date().getFullYear() -
            new Date(advertiserData.PartnerDateOfBirth).getFullYear()
          ).toString();
          setPCurrentAge(partnerAge);
        }

        setAdvertiser(advertiserData);
        setEditedData(advertiserData);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      showSnackbar("Failed to load profile data", "error");
    } finally {
      setLoading(false);
    }
  };

  const getProfileImages = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/user/sweeping/images/profile?id=${userId}`,
      );
      const data = await response.json();
      setProfileImages(data?.images || []);
    } catch (error) {
      console.error("Error fetching profile images:", error);
    }
  };

  const getPrivateImages = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/sweeping/images?id=${userId}`);
      const data = await response.json();
      setPrivateImages(data?.images || []);
    } catch (error) {
      console.error("Error fetching private images:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setCurrentCropType(type);
      setTempFile(file);
      setShowCropper(true);
    };

    reader.readAsDataURL(file);
  };

  const renderImageSection = (type: "public" | "private") => {
    const images = type === "public" ? profileImages : privateImages;
    const previews =
      type === "public" ? publicImagePreviews : privateImagePreviews;
    const maxImages = 6;
    const currentCount = (images?.length || 0) + previews.length;

    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "14px",
                bgcolor: "rgba(255, 27, 107, 0.1)",
                border: "1px solid rgba(255, 27, 107, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {type === "public" ? (
                <Globe size={20} color="#FF1B6B" />
              ) : (
                <Lock size={20} color="#FF1B6B" />
              )}
            </Box>

            <Stack direction="column" spacing={0.3}>
              <Typography
                sx={{
                  fontSize: { xs: "16px", sm: "18px", md: "20px" },
                  fontWeight: 600,
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                {type === "public" ? "Public Photos" : "Private Photos"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#aaaaaa", fontSize: { xs: "12px", sm: "13px" } }}
              >
                {type === "public"
                  ? "Visible to everyone"
                  : "Only for authorized members"}
              </Typography>
            </Stack>
          </Stack>

          <Chip
            label={`${currentCount}/${maxImages}`}
            size="small"
            sx={{
              bgcolor: "rgba(255, 27, 107, 0.1)",
              color: "#FF1B6B",
              border: "1px solid rgba(255, 27, 107, 0.2)",
              fontWeight: 600,
              flexShrink: 0, // 👈 prevent chip from shrinking
            }}
          />
        </Box>

        <ImageGrid>
          {images?.map((image: any, index: number) => (
            <>
              <Box
                key={image.Id}
                sx={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  cursor: "pointer",
                  // aspectRatio: "1",
                }}
              >
                <img
                  src={image.Url}
                  alt={`${type} Photo ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: "16px",
                  }}
                  onClick={() => {
                    setSelectedImage(image.Url);
                    setIsModalOpen(true);
                  }}
                />
                {isEditing && (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageDelete(image.Id, type);
                    }}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(244, 67, 54, 0.9)",
                      color: "white",
                      width: 32,
                      height: 32,
                      "&:hover": {
                        backgroundColor: "rgba(244, 67, 54, 1)",
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <X size={16} />
                  </IconButton>
                )}
              </Box>
            </>
          ))}

          {/* Preview images */}
          {previews.map((preview) => (
            <ImageCard
              key={preview.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ opacity: preview.isUploading ? 0.7 : 1 }}
            >
              <img
                src={preview.url}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {preview.isUploading && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.7)",
                  }}
                >
                  <CircularProgress size={24} sx={{ color: "#FF1B6B" }} />
                </Box>
              )}
            </ImageCard>
          ))}

          {/* Upload button */}
          {/* Photo limit info bar */}
          {isEditing && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 2,
                py: 1.2,
                mb: 2,
                borderRadius: "12px",
                bgcolor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Progress bar */}
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.8,
                  }}
                >
                  <Typography
                    sx={{ fontSize: "12px", color: "#aaa", fontWeight: 500 }}
                  >
                    {type === "public" ? "Public" : "Private"} Photos
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: currentCount >= maxImages ? "#f44336" : "#FF1B6B",
                    }}
                  >
                    {currentCount} / {maxImages}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    height: 6,
                    borderRadius: "999px",
                    bgcolor: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${(currentCount / maxImages) * 100}%`,
                      borderRadius: "999px",
                      background:
                        currentCount >= maxImages
                          ? "linear-gradient(90deg, #f44336, #e53935)"
                          : "linear-gradient(90deg, #FF1B6B, #c2185b)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </Box>
              </Box>

              {/* Status badge */}
              <Chip
                label={
                  currentCount >= maxImages
                    ? "Full"
                    : `${maxImages - currentCount} left`
                }
                size="small"
                sx={{
                  bgcolor:
                    currentCount >= maxImages
                      ? "rgba(244,67,54,0.12)"
                      : "rgba(255,27,107,0.1)",
                  color: currentCount >= maxImages ? "#f44336" : "#FF1B6B",
                  border: `1px solid ${
                    currentCount >= maxImages
                      ? "rgba(244,67,54,0.25)"
                      : "rgba(255,27,107,0.2)"
                  }`,
                  fontWeight: 700,
                  fontSize: "11px",
                  height: 24,
                }}
              />
            </Box>
          )}

          {/* Upload card — only shown when under limit */}
          {isEditing && currentCount < maxImages && (
            <UploadCard>
              <label
                htmlFor={`image-upload-${type}`}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  gap: "8px",
                }}
              >
                <input
                  type="file"
                  id={`image-upload-${type}`}
                  hidden
                  accept="image/*"
                  onChange={(e) => handleImageAdd(e, type)}
                />
                <Upload size={32} color="#FF1B6B" />
                <Typography
                  variant="body2"
                  sx={{
                    color: "#FF1B6B",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Add Photo
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#666", fontSize: "11px", textAlign: "center" }}
                >
                  {maxImages - currentCount} slot
                  {maxImages - currentCount !== 1 ? "s" : ""} remaining
                </Typography>
              </label>
            </UploadCard>
          )}

          {/* Full limit locked card */}
          {isEditing && currentCount >= maxImages && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.2,
                borderRadius: "12px",
                bgcolor: "rgba(244,67,54,0.06)",
                border: "1px solid rgba(244,67,54,0.2)",
                mt: 1,
              }}
            >
              <X size={16} color="#f44336" />
              <Typography
                sx={{ fontSize: "12px", color: "#f44336", fontWeight: 600 }}
              >
                Remove a photo to upload a new one
              </Typography>
            </Box>
          )}
        </ImageGrid>
      </Box>
    );
  };

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    const onPopState = () => {
      if (isEditingRef.current) {
        setEditedData(null);
        setPreviewImages({
          banner: null,
          avatar: null,
        });
        setIsEditing(false);
        return;
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const formatSwingLabel = (value: string) => {
    return value
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const renderPersonalInfo = () => (
    <Card
      sx={{
        mb: 3,
        borderRadius: "20px",
        background: "linear-gradient(145deg, #1e1e1e, #161616)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* ===== Section Header ===== */}
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: "14px",
              bgcolor: "rgba(255, 27, 107, 0.1)",
              border: "1px solid rgba(255, 27, 107, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={20} color="#FF1B6B" />
          </Box>

          <Typography
            sx={{
              fontSize: { xs: "18px", sm: "20px", md: "22px" },
              fontWeight: 600,
              color: "white",
            }}
          >
            Personal Information
          </Typography>
        </Stack>

        {/* ========================================================= */}
        {/* ====================== VIEW MODE ======================== */}
        {/* ========================================================= */}

        {!isEditing && (
          <Stack spacing={4}>
            {/* Top Profile Info */}
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
                flexWrap="wrap"
              >
                <Typography
                  sx={{
                    fontSize: { xs: "22px", sm: "26px", md: "30px" },
                    fontWeight: 700,
                    color: "white",
                    wordBreak: "break-word",
                  }}
                >
                  {advertiser.Username}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={`${currentAge}${
                      advertiser.Gender === "Male"
                        ? "M"
                        : advertiser.Gender === "Female"
                          ? "F"
                          : ""
                    }`}
                    sx={{
                      bgcolor: "rgba(255, 27, 107, 0.1)",
                      color: "#FF1B6B",
                      border: "1px solid rgba(255, 27, 107, 0.2)",
                      fontWeight: 600,
                    }}
                  />

                  <Chip
                    label={advertiser.AccountType}
                    variant="outlined"
                    sx={{
                      borderColor: "#FF1B6B",
                      color: "#FF1B6B",
                      fontWeight: 600,
                    }}
                  />
                </Stack>
              </Stack>

              {/* Location */}
              <Stack direction="row" spacing={1} alignItems="center">
                <MapPin size={16} color="#aaaaaa" />
                <Typography
                  sx={{
                    color: "#aaaaaa",
                    fontSize: { xs: "14px", sm: "15px" },
                  }}
                >
                  {advertiser.Location?.replace(", USA", "")}
                </Typography>
              </Stack>
            </Stack>

            {/* Tagline */}
            {advertiser.Tagline && (
              <Box
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: "16px",
                  bgcolor: "rgba(255, 27, 107, 0.05)",
                  border: "1px solid rgba(255, 27, 107, 0.1)",
                }}
              >
                <Typography
                  sx={{
                    color: "#FF1B6B",
                    fontWeight: 600,
                    mb: 1,
                    fontSize: { xs: "16px", md: "18px" },
                  }}
                >
                  Tagline
                </Typography>

                <Typography
                  sx={{
                    color: "white",
                    fontStyle: "italic",
                    fontSize: { xs: "14px", sm: "15px" },
                  }}
                >
                  "{advertiser.Tagline}"
                </Typography>
              </Box>
            )}

            {/* About Section */}
            {advertiser.About && (
              <Box>
                <Typography
                  sx={{
                    color: "#FF1B6B",
                    fontWeight: 600,
                    mb: 2,
                    fontSize: { xs: "16px", md: "18px" },
                  }}
                >
                  About Me
                </Typography>

                <Typography
                  sx={{
                    color: "#aaaaaa",
                    lineHeight: 1.7,
                    fontSize: { xs: "14px", sm: "15px", md: "16px" },
                  }}
                >
                  {advertiser.About}
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* ========================================================= */}
        {/* ====================== EDIT MODE ======================== */}
        {/* ========================================================= */}

        {isEditing && (
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Username"
                value={editedData?.Username || ""}
                onChange={(e) => handleInputChange("Username", e.target.value)}
                error={!!errors.Username}
                helperText={errors.Username}
              />

              <TextField
                fullWidth
                label="Age"
                type="number"
                value={currentAge}
                onChange={(e) => setCurrentAge(e.target.value)}
                error={!!errors.Age}
                helperText={errors.Age}
              />
            </Stack>

            <TextField
              fullWidth
              label="Tagline"
              multiline
              rows={2}
              value={editedData?.Tagline || ""}
              onChange={(e) => handleInputChange("Tagline", e.target.value)}
              error={!!errors.Tagline}
              helperText={errors.Tagline}
            />

            <TextField
              fullWidth
              label="About Me"
              multiline
              rows={4}
              value={editedData?.About || ""}
              onChange={(e) => handleInputChange("About", e.target.value)}
              error={!!errors.About}
              helperText={errors.About}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  const renderDetails = () => {
    const detailFields = [
      { key: "BodyType", label: "Body Type", options: BODY_TYPES },
      { key: "HairColor", label: "Hair Color", options: HAIR_COLORS },
      { key: "EyeColor", label: "Eye Color", options: EYE_COLORS },
      { key: "SexualOrientation", label: "Orientation", options: ORIENTATIONS },
    ];

    return (
      <Card
        sx={{
          mb: 3,
          borderRadius: "20px",
          background: "linear-gradient(145deg, #1e1e1e, #161616)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <CardContent
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3, md: 4 },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} mb={4}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "14px",
                bgcolor: "rgba(255, 27, 107, 0.1)",
                border: "1px solid rgba(255, 27, 107, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Info size={20} color="#FF1B6B" />
            </Box>

            <Typography
              sx={{
                fontSize: { xs: "18px", sm: "20px", md: "22px" },
                fontWeight: 600,
                color: "white",
              }}
            >
              Physical Details
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {detailFields.map(({ key, label, options }) => (
              <Box key={key}>
                {isEditing ? (
                  <FormControl fullWidth>
                    <InputLabel>{label}</InputLabel>
                    <Select
                      value={editedData?.[key] || ""}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      label={label}
                    >
                      {options.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Stack spacing={1}>
                    <Typography
                      sx={{
                        fontSize: { xs: "14px", md: "16px" },
                        color: "#FF1B6B",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {label}
                    </Typography>

                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: "10px",
                        bgcolor: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    >
                      {advertiser?.[key] || "Not specified"}
                    </Box>
                  </Stack>
                )}
              </Box>
            ))}
          </Box>

          <Box mt={5}>
            <Typography
              sx={{
                color: "#FF1B6B",
                fontWeight: 600,
                mb: 1,
                fontSize: { xs: "14px", md: "16px" },
              }}
            >
              Swing Style
            </Typography>

            {isEditing ? (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, 1fr)",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(4, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  {Object.entries({
                    exploring: "Exploring/Unsure",
                    fullSwap: "Full Swap",
                    softSwap: "Soft Swap",
                    voyeur: "Voyeur",
                  }).map(([key, label]) => (
                    <FormControlLabel
                      key={key}
                      control={
                        <Checkbox
                          checked={
                            editedData?.swingStyles?.[
                              key as keyof SwingStyles
                            ] || false
                          }
                          onChange={(e) =>
                            handleInputChange("swingStyles", {
                              ...editedData?.swingStyles,
                              [key]: e.target.checked,
                            })
                          }
                          sx={{
                            color: "white",
                            "&.Mui-checked": {
                              color: "#FF1B6B",
                            },
                          }}
                        />
                      }
                      label={label}
                      sx={{ color: "white" }}
                    />
                  ))}
                </Box>

                {errors.swingStyles && (
                  <Typography
                    sx={{ color: "#d32f2f", mt: 1, fontSize: "12px" }}
                  >
                    {errors.swingStyles}
                  </Typography>
                )}
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                }}
              >
                {advertiser?.SwingStyleTags?.length > 0 ? (
                  advertiser.SwingStyleTags.map(
                    (tag: string, index: number) => (
                      <Chip
                        key={index}
                        label={formatSwingLabel(tag)}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "20px",
                          bgcolor: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "13px",
                          textTransform: "none",
                        }}
                      />
                    ),
                  )
                ) : (
                  <Typography sx={{ color: "#aaaaaa" }}>
                    No data available
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const uploadImagesSequentially = async (
    images: File[],
  ): Promise<(string | null)[]> => {
    const results: (string | null)[] = [];

    for (const image of images) {
      const result = await uploadImage(image); // Wait for each upload to finish
      console.log(image);
      results.push(result);
    }
    return results;
  };

  useEffect(() => {
    if (!mounted) return;

    const userid = localStorage.getItem("logged_in_profile");

    if (!userid) {
      router.push("/login");
    }

    if (userid) {
      setProfileId(userid);
      fetchData(userid);
      getProfileImages(userid);
      getPrivateImages(userid);
    }

    const token = localStorage.getItem("loginInfo");
    if (token) {
      try {
        const decodeToken = jwtDecode<any>(token);
        setMembership1(decodeToken?.membership || 0);
      } catch (error) {
        console.error("Invalid token:", error);
      }
    }

    setMembership(localStorage.getItem("memberShip") || "0");
  }, [mounted]);

  useEffect(() => {
    if (!openCity) {
      setCityOption([]);
      return;
    }
    if (cityInput === "") return;

    const fetchData = async () => {
      setCityLoading(true);
      try {
        const response = await fetch(`/api/user/city?city=${cityInput}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { cities } = await response.json();
        const uniqueCities = cities.filter(
          (city: any, index: any, self: any) =>
            index === self.findIndex((t: any) => t.City === city.City),
        );

        setCityOption(uniqueCities);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setCityLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [cityInput, openCity]);

  if (!mounted) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "#121212",
        }}
      >
        <CircularProgress sx={{ color: "#FF1B6B" }} />
      </Box>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedData(null);
      setPreviewImages({
        banner: null,
        avatar: null,
      });
    } else {
      setEditedData({
        ...advertiser,
        Location: advertiser?.Location || "",
        Tagline: advertiser?.Tagline || "",
        swingStyles: {
          exploring: advertiser?.SwingStyleTags?.includes("exploring") || false,
          fullSwap: advertiser?.SwingStyleTags?.includes("fullSwap") || false,
          softSwap: advertiser?.SwingStyleTags?.includes("softSwap") || false,
          voyeur: advertiser?.SwingStyleTags?.includes("voyeur") || false,
        },
      });
      setCityInput(advertiser?.Location?.replace(", USA", "") || "");
    }
    setIsEditing(!isEditing);
    window.history.pushState({}, "");
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const baseProfileData = {
        ProfileId: profileId,
        Username: editedData.Username || advertiser.Username,
        Age: currentAge || advertiser.Age,
        Gender: editedData.Gender || advertiser.Gender,
        Location: editedData.Location || advertiser.Location,
        Tagline: editedData.Tagline || advertiser.Tagline,
        About: editedData.About || advertiser.About,
        BodyType: editedData.BodyType || advertiser.BodyType,
        HairColor: editedData.HairColor || advertiser.HairColor,
        EyeColor: editedData.EyeColor || advertiser.EyeColor,
        AccountType: editedData.AccountType || advertiser.AccountType,
        Orientation:
          editedData.SexualOrientation || advertiser.SexualOrientation,
        SwingStyle: editedData?.swingStyles || advertiser.swingStyle,
      };

      let updatedProfileData: UpdateProfileData;

      if (editedData.AccountType === "Couple") {
        updatedProfileData = {
          ...baseProfileData,
          PartnerAge: pCurrentAge || advertiser.PartnerAge,
          PartnerGender: editedData?.PartnerGender || advertiser.PartnerGender,
          PartnerBodyType:
            editedData?.PartnerBodyType || advertiser.PartnerBodyType,
          PartnerHairColor:
            editedData?.PartnerHairColor || advertiser.PartnerHairColor,
          PartnerEyeColor:
            editedData?.PartnerEyeColor || advertiser.PartnerEyeColor,
          PartnerSexualOrientation:
            editedData?.PartnerSexualOrientation ||
            advertiser.PartnerSexualOrientation,
        };
      } else {
        updatedProfileData = {
          ...baseProfileData,
          PartnerAge: null,
          PartnerGender: "",
          PartnerBodyType: "",
          PartnerHairColor: "",
          PartnerEyeColor: "",
          PartnerSexualOrientation: "",
        };
      }

      // if (previewImages.banner) {
      //   const bannerFile = editedData.ProfileBanner;
      //   const bannerUrl = await uploadImage(bannerFile);
      //   updatedProfileData.ProfileBanner = bannerUrl;
      // }

      // if (previewImages.avatar) {
      //   const avatarFile = editedData.Avatar;
      //   const avatarUrl = await uploadImage(avatarFile);
      //   updatedProfileData.Avatar = avatarUrl;
      // }

      if (publicImagePreviews.length > 0) {
        const publicFiles = publicImagePreviews.map((preview) => preview.file);
        const publicUrls = await uploadImagesSequentially(publicFiles);
        updatedProfileData.ProfileImages = publicUrls;
      }

      if (privateImagePreviews.length > 0) {
        const privateFiles = privateImagePreviews.map(
          (preview) => preview.file,
        );
        const privateUrls = await uploadImagesSequentially(privateFiles);
        updatedProfileData.PrivateImages = privateUrls;
      }
      const response = await fetch("/api/user/profile/update/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProfileData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const reuslt = await response.json();
      setAdvertiser(updatedProfileData);
      setPreviewImages({
        banner: null,
        avatar: null,
      });
      setPublicImagePreviews([]);
      setPrivateImagePreviews([]);
      setIsEditing(false);
      fetchData(profileId);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // const handleCropSave = async () => {
  //   if (!selectedImage || !croppedAreaPixels || !currentCropType || !tempFile)
  //     return;

  //   try {
  //     const croppedImage = await getCroppedImg(
  //       selectedImage,
  //       croppedAreaPixels,
  //     );

  //     // Convert base64 -> Blob
  //     const fetchResponse = await fetch(croppedImage);
  //     const blob = await fetchResponse.blob();

  //     // Show local preview immediately
  //     if (currentCropType === "avatar") {
  //       setPreviewImages((prev) => ({ ...prev, avatar: croppedImage }));
  //     } else {
  //       setPreviewImages((prev) => ({ ...prev, banner: croppedImage }));
  //     }

  //     // Close cropper right away — don't block the user
  //     const cropType = currentCropType; // capture before reset
  //     setSelectedImage(null);
  //     setTempFile(null);
  //     setCurrentCropType(null);
  //     setShowCropper(false);

  //     // Background upload to Cloudinary
  //     try {
  //       const cloudUrl = await uploadToCloudinary(blob, cropType);

  //       if (cropType === "avatar") {
  //         setAvatarUploadProgress(90);
  //         const response = await fetch("/api/user/avatarUpload", {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({
  //             pid: profileId,
  //             Questionable: 1,
  //             avatar: cloudUrl,
  //           }),
  //         });
  //         if (!response.ok) throw new Error("Avatar save failed");

  //         setAdvertiser((prev: any) => ({ ...prev, Avatar: cloudUrl }));
  //         setEditedData((prev: any) => ({ ...prev, Avatar: cloudUrl }));
  //         setAvatarUploadStatus("done");
  //         setAvatarUploadProgress(100);
  //         showSnackbar("Avatar updated successfully!");
  //       } else {
  //         setBannerUploadProgress(90);
  //         const response = await fetch("/api/user/bannerUpload", {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({
  //             pid: profileId,
  //             Questionable: 1,
  //             banner: cloudUrl,
  //           }),
  //         });
  //         if (!response.ok) throw new Error("Banner save failed");

  //         setAdvertiser((prev: any) => ({ ...prev, ProfileBanner: cloudUrl }));
  //         setEditedData((prev: any) => ({ ...prev, ProfileBanner: cloudUrl }));
  //         setBannerUploadStatus("done");
  //         setBannerUploadProgress(100);
  //         showSnackbar("Cover photo updated successfully!");
  //       }
  //     } catch (uploadErr) {
  //       console.error("Upload failed", uploadErr);
  //       // Revert preview on failure
  //       if (cropType === "avatar") {
  //         setPreviewImages((prev) => ({ ...prev, avatar: null }));
  //         setAvatarUploadStatus("error");
  //       } else {
  //         setPreviewImages((prev) => ({ ...prev, banner: null }));
  //         setBannerUploadStatus("error");
  //       }
  //       showSnackbar("Failed to upload image", "error");
  //     }
  //   } catch (err) {
  //     console.error("Cropping failed", err);
  //     showSnackbar("Failed to crop image", "error");
  //   }
  // };

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels || !currentCropType || !tempFile)
      return;

    const cropType = currentCropType; // capture before async resets

    try {
      // Canvas-based high-quality crop (same as UploadAvatar's handleCropConfirm)
      const imageBitmap = await createImageBitmap(tempFile);
      const { x, y, width, height } = croppedAreaPixels;

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

      // Show local preview immediately
      const previewUrl = URL.createObjectURL(blob);
      if (cropType === "avatar") {
        setPreviewImages((prev) => ({ ...prev, avatar: previewUrl }));
      } else {
        setPreviewImages((prev) => ({ ...prev, banner: previewUrl }));
      }

      // Close cropper right away — don't block the user
      setSelectedImage(null);
      setTempFile(null);
      setCurrentCropType(null);
      setShowCropper(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);

      // Background upload to Cloudinary
      try {
        const cloudUrl = await uploadToCloudinary(blob, cropType);

        if (cropType === "avatar") {
          setAvatarUploadProgress(90);
          const response = await fetch("/api/user/avatarUpload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pid: profileId,
              Questionable: 1,
              avatar: cloudUrl,
            }),
          });
          if (!response.ok) throw new Error("Avatar save failed");

          setAdvertiser((prev: any) => ({ ...prev, Avatar: cloudUrl }));
          setEditedData((prev: any) => ({ ...prev, Avatar: cloudUrl }));
          setAvatarUploadStatus("done");
          setAvatarUploadProgress(100);
          showSnackbar("Avatar updated successfully!");
        } else {
          setBannerUploadProgress(90);
          const response = await fetch("/api/user/bannerUpload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pid: profileId,
              Questionable: 1,
              banner: cloudUrl,
            }),
          });
          if (!response.ok) throw new Error("Banner save failed");

          setAdvertiser((prev: any) => ({ ...prev, ProfileBanner: cloudUrl }));
          setEditedData((prev: any) => ({ ...prev, ProfileBanner: cloudUrl }));
          setBannerUploadStatus("done");
          setBannerUploadProgress(100);
          showSnackbar("Cover photo updated successfully!");
        }
      } catch (uploadErr) {
        console.error("Upload failed", uploadErr);
        if (cropType === "avatar") {
          setPreviewImages((prev) => ({ ...prev, avatar: null }));
          setAvatarUploadStatus("error");
        } else {
          setPreviewImages((prev) => ({ ...prev, banner: null }));
          setBannerUploadStatus("error");
        }
        showSnackbar("Failed to upload image", "error");
      }
    } catch (err) {
      console.error("Cropping failed", err);
      showSnackbar("Failed to crop image", "error");
    }
  };

  if (loading) {
    const headerHeight = isMobileOrTablet ? 68 : 68;
    const footerHeight = isMobileOrTablet ? 72 : 72;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#121212",
        }}
      >
        {isMobileOrTablet ? <AppHeaderMobile /> : <AppHeaderDesktop />}

        <Box
          sx={{
            height: `calc(100dvh - ${headerHeight}px - ${footerHeight}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader />
        </Box>

        {isMobileOrTablet ? <AppFooterMobile /> : <AppFooterDesktop />}
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#121212",
        }}
      >
        {isMobileOrTablet ? <AppHeaderMobile /> : <AppHeaderDesktop />}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            pt: { xs: 2, md: 14 },
            pb: { xs: 8, md: 6 },
          }}
        >
          <Container
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", md: "1200px", lg: "1400px" },
            }}
          >
            <ProfileHeader
              sx={{
                mb: { xs: 3, sm: 3 },
                position: "relative",
                overflow: "hidden",
                backgroundColor: "#1a1a1a",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {bannerUploadStatus === "uploading" && (
                <LinearProgress
                  variant="determinate"
                  value={bannerUploadProgress}
                  sx={{
                    height: 3,
                    borderRadius: 0,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      background: "linear-gradient(90deg, #FF1B6B, #c2185b)",
                    },
                  }}
                />
              )}
              {bannerUploadStatus === "error" && (
                <Typography
                  sx={{
                    color: "#FF1B6B",
                    fontSize: "0.7rem",
                    textAlign: "center",
                    py: 0.5,
                  }}
                >
                  ✕ Cover upload failed — click to retry
                </Typography>
              )}
              {/* Cover Image Container - Dating app style with gradient overlay */}
              <CoverImageContainer
                sx={{
                  position: "relative",
                  height: { xs: "350px", sm: "450px", md: "450px" },
                  backgroundImage: `url(${
                    previewImages.banner ||
                    advertiser.ProfileBanner ||
                    "/default-cover.jpg"
                  })`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  cursor: isEditing ? "pointer" : "default",
                  transition: "transform 0.3s ease",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "70%",
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                    pointerEvents: "none",
                  },
                }}
                onClick={() => {
                  if (isEditing) {
                    document.getElementById("cover-upload")?.click();
                  }
                }}
              >
                <input
                  type="file"
                  id="cover-upload"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "cover")}
                />

                {/* Top Right Actions - Dating app style */}
                <Box
                  sx={{
                    position: "absolute",
                    top: { xs: 10, sm: 16 },
                    right: { xs: 12, sm: 20 },
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "row",
                    gap: { xs: 1, sm: 1.5 },
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  {(membership === "1" ||
                    membership1 === 1 ||
                    membership === "0" ||
                    membership1 === 0) && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        px: { xs: 1.8, sm: 1.9 },
                        py: { xs: 0.9, sm: 1 },
                        borderRadius: "999px",
                        background: "rgba(0, 0, 0, 0.75)",
                        color: membership1 === 1 ? "#FFD700" : "#ccc",
                        fontWeight: 600,
                        fontSize: { xs: "12px", sm: "13px" },
                        gap: 0.5,
                        lineHeight: 1,
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    >
                      {membership1 === 1 ? (
                        <Crown size={14} />
                      ) : (
                        <User size={14} />
                      )}
                      {membership1 === 1 ? "Premium" : "Free"}
                    </Box>
                  )}

                  <Button
                    variant="outlined"
                    onClick={() => router.push("/prefrences")}
                    startIcon={<Settings2 size={14} />}
                    sx={{
                      borderRadius: "999px",
                      fontSize: { xs: "12px", sm: "13px" },
                      textTransform: "none",
                      px: { xs: 1.9, sm: 1.5 },
                      py: { xs: 0.4, sm: 0.5 },
                      color: "#fff",
                      borderColor: "rgba(255,255,255,0.3)",
                      background: "rgba(0, 0, 0, 0.65)",
                      backdropFilter: "blur(45px)",
                      minWidth: { xs: "auto", sm: "100px" },
                      whiteSpace: "nowrap",
                      "& .MuiButton-startIcon": {
                        marginRight: { xs: "4px", sm: "8px" },
                      },
                      "&:hover": {
                        background: "rgba(255,255,255,0.15)",
                        borderColor: "rgba(255,255,255,0.6)",
                      },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{ display: { xs: "none", sm: "inline" } }}
                    >
                      Preferences
                    </Box>
                    <Box
                      component="span"
                      sx={{ display: { xs: "inline", sm: "none" } }}
                    >
                      Prefs
                    </Box>
                  </Button>
                </Box>

                {/* Edit overlay for cover - Dating app style */}
                {isEditing && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: { xs: 12, sm: 16 },
                      right: { xs: 12, sm: 20 },
                      bgcolor: "rgba(255,27,107,0.9)",
                      borderRadius: "999px",
                      px: { xs: 2, sm: 2.5 },
                      py: { xs: 0.8, sm: 1 },
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      boxShadow: "0 4px 12px rgba(255,27,107,0.3)",
                      zIndex: 10,
                    }}
                  >
                    <Camera size={16} color="white" />
                    <Typography
                      variant="body2"
                      sx={{
                        color: "white",
                        fontWeight: 500,
                        fontSize: { xs: "12px", sm: "14px" },
                        display: { xs: "none", sm: "block" },
                      }}
                    >
                      Change cover
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "white",
                        fontWeight: 500,
                        fontSize: "12px",
                        display: { xs: "block", sm: "none" },
                      }}
                    >
                      Edit
                    </Typography>
                  </Box>
                )}
              </CoverImageContainer>

              {/* Profile Info - Dating app card style */}
              <Box
                sx={{
                  px: { xs: 2, sm: 3, md: 4 },
                  pb: { xs: 2, sm: 3 },
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "center", sm: "flex-end" },
                    gap: { xs: 2, sm: 3 },
                    mt: { xs: -8, sm: -10, md: -12 },
                    position: "relative",
                    zIndex: 5,
                  }}
                >
                  {/* Avatar - Dating app style with gradient border */}
                  <Box
                    sx={{
                      position: "relative",
                      flexShrink: 0,
                      filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))",
                    }}
                  >
                    <ProfileAvatar
                      onClick={() => {
                        if (isEditing) {
                          document.getElementById("avatar-upload")?.click();
                        }
                      }}
                      sx={{
                        width: { xs: 120, sm: 110, md: 130 },
                        height: { xs: 120, sm: 110, md: 130 },
                        border: "4px solid",
                        borderColor: "background.paper",
                        borderRadius: "50%",
                        overflow: "hidden",
                        cursor: isEditing ? "pointer" : "default",
                        transition: "transform 0.2s ease",
                        "&:hover": {
                          transform: isEditing ? "scale(1.02)" : "none",
                        },
                      }}
                    >
                      <img
                        src={
                          previewImages.avatar ||
                          advertiser.Avatar ||
                          "/noavatar.png"
                        }
                        alt={advertiser.Username}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />

                      {isEditing && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: { xs: 4, sm: 8 },
                            right: { xs: 4, sm: 8 },
                            bgcolor: "#FF1B6B",
                            borderRadius: "50%",
                            width: { xs: 28, sm: 32, md: 36 },
                            height: { xs: 28, sm: 32, md: 36 },
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid white",
                            boxShadow: "0 4px 12px rgba(255,27,107,0.4)",
                          }}
                        >
                          <Camera size={16} color="white" />
                        </Box>
                      )}
                      <input
                        type="file"
                        id="avatar-upload"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "avatar")}
                      />
                    </ProfileAvatar>

                    {/* Avatar upload progress */}
                    {avatarUploadStatus === "uploading" && (
                      <Box sx={{ width: 130, mx: "auto", mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={avatarUploadProgress}
                          sx={{
                            height: 3,
                            borderRadius: 2,
                            backgroundColor: "rgba(255,255,255,0.1)",
                            "& .MuiLinearProgress-bar": {
                              background:
                                "linear-gradient(90deg, #FF1B6B, #c2185b)",
                            },
                          }}
                        />
                        <Typography
                          sx={{
                            textAlign: "center",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "0.65rem",
                            mt: 0.5,
                            animation: "fadeInOut 2s ease-in-out infinite",
                            "@keyframes fadeInOut": {
                              "0%, 100%": { opacity: 0.5 },
                              "50%": { opacity: 1 },
                            },
                          }}
                        >
                          Uploading...
                        </Typography>
                      </Box>
                    )}
                    {avatarUploadStatus === "error" && (
                      <Typography
                        sx={{
                          color: "#FF1B6B",
                          fontSize: "0.65rem",
                          textAlign: "center",
                          mt: 0.5,
                        }}
                      >
                        ✕ Upload failed — tap to retry
                      </Typography>
                    )}
                  </Box>

                  {/* Basic Info - Dating app style */}
                  <Box
                    sx={{
                      flex: 1,
                      width: "100%",
                      mb: { xs: 1, sm: 2 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: { xs: "center", md: "center" },
                        justifyContent: "space-between",
                        gap: { xs: 3, md: 3 },
                      }}
                    >
                      <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 2,
                            flexWrap: "wrap",
                            justifyContent: { xs: "center", md: "flex-start" },
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: "bold",
                              color: "white",
                              fontSize: {
                                xs: "1.5rem",
                                sm: "1.8rem",
                                md: "2rem",
                              },
                              lineHeight: 1.2,
                            }}
                          >
                            {advertiser.Username}
                          </Typography>
                          {advertiser?.selfie_verification_status === "true" ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                px: "12px",
                                py: "6px",
                                background:
                                  "linear-gradient(135deg, #FF1B6B, #FF85A1)",
                                borderRadius: "999px",
                                border: "1px solid rgba(255,255,255,0.2)",
                                boxShadow: "0 2px 8px rgba(255,27,107,0.3)",
                              }}
                            >
                              <Box
                                component="img"
                                src="/verified-badge.svg"
                                alt="Verified"
                                sx={{
                                  width: 14,
                                  height: 14,
                                  filter: "brightness(0) invert(1)",
                                }}
                              />
                              <Typography
                                sx={{
                                  fontSize: { xs: "10px", sm: "11px" },
                                  color: "#fff",
                                  fontWeight: 600,
                                  lineHeight: 1,
                                  whiteSpace: "nowrap",
                                  letterSpacing: "0.3px",
                                }}
                              >
                                Verified
                              </Typography>
                            </Box>
                          ) : (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<ShieldCheck size={14} />}
                              onClick={() =>
                                router.push("/profile-verification")
                              }
                              sx={{
                                px: { xs: 1.5, sm: 2 },
                                py: { xs: 0.6, sm: 0.5 },
                                borderRadius: "999px",
                                fontSize: { xs: "11px", sm: "12px" },
                                fontWeight: 700,
                                textTransform: "none",
                                color: "#fff",
                                backgroundColor: "#FF1B6B",
                                boxShadow: "0 2px 8px rgba(255,27,107,0.25)",
                                transition: "all 0.2s ease-in-out",
                                whiteSpace: "nowrap",
                                "& .MuiButton-startIcon": {
                                  marginRight: { xs: "4px", sm: "8px" },
                                },
                                "&:hover": {
                                  backgroundColor: "#E6155E",
                                  boxShadow: "0 4px 12px rgba(255,27,107,0.35)",
                                  transform: "translateY(-1px)",
                                },
                              }}
                            >
                              <Box
                                component="span"
                                sx={{ display: { xs: "none", sm: "inline" } }}
                              >
                                Verify Profile
                              </Box>
                              <Box
                                component="span"
                                sx={{ display: { xs: "inline", sm: "none" } }}
                              >
                                Verify
                              </Box>
                            </Button>
                          )}
                        </Box>

                        {/* Location with dating app style */}
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#aaaaaa",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            justifyContent: { xs: "center", md: "flex-start" },
                            fontSize: { xs: "13px", sm: "14px" },
                          }}
                        >
                          <MapPin size={16} />
                          {advertiser.Location?.replace(", USA", "")}
                          {advertiser.Age && (
                            <Box
                              component="span"
                              sx={{
                                ml: 1,
                                px: 1.5,
                                py: 0.5,
                                bgcolor: "rgba(255,255,255,0.1)",
                                borderRadius: "999px",
                                fontSize: "12px",
                              }}
                            >
                              {advertiser.Age} years
                            </Box>
                          )}
                        </Typography>
                      </Box>

                      {/* Action Chips - Dating app style */}
                      <Box
                        sx={{
                          width: "100%",
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "repeat(3, 1fr)",
                            sm: "repeat(3, 1fr)",
                          },
                          gap: 1.5,
                        }}
                      >
                        <ActionChip
                          icon={<Settings size={14} />}
                          label="Membership"
                          onClick={() => router.push("/membership")}
                          sx={{
                            width: "100%",
                            justifyContent: "center",
                            fontSize: { xs: "12px", sm: "13px" },
                            py: 1.2,
                            borderRadius: "12px",
                            px: { xs: 1.5, sm: 2 },
                            "& .MuiChip-icon": {
                              marginRight: "6px",
                            },
                          }}
                        />

                        {isEditing ? (
                          <ActionChip
                            icon={
                              isSubmitting ? (
                                <CircularProgress
                                  size={16}
                                  sx={{ color: "white" }}
                                />
                              ) : (
                                <Save size={14} />
                              )
                            }
                            label="Save"
                            onClick={handleSave}
                            disabled={isSubmitting}
                            sx={{
                              width: "100%",
                              justifyContent: "center",
                              fontSize: { xs: "12px", sm: "13px" },
                              py: 1.2,
                              borderRadius: "12px",
                              px: { xs: 1.5, sm: 2 },
                              bgcolor: "#FF1B6B",
                              color: "white",

                              whiteSpace: "nowrap",
                              overflow: "hidden",

                              "& .MuiChip-icon": {
                                marginRight: "6px",
                              },

                              "&:hover": {
                                bgcolor: "#E6155E",
                              },
                            }}
                          />
                        ) : (
                          <ActionChip
                            icon={<Edit size={14} />}
                            label="Edit"
                            onClick={handleEditToggle}
                            sx={{
                              width: "100%",
                              "& .MuiChip-icon": {
                                marginRight: "6px",
                              },
                              borderRadius: "12px",
                              justifyContent: "center",
                              fontSize: { xs: "12px", sm: "13px" },
                              py: 1.2,
                            }}
                          />
                        )}

                        <ActionChip
                          icon={<LogOut size={14} />}
                          label="Logout"
                          onClick={handleLogout}
                          sx={{
                            width: "100%",
                            "& .MuiChip-icon": {
                              marginRight: "6px",
                            },
                            borderRadius: "12px",
                            justifyContent: "center",
                            fontSize: { xs: "12px", sm: "13px" },
                            py: 1.2,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </ProfileHeader>

            <Card
              sx={{
                mb: 3,
                borderRadius: "16px",
                background: "linear-gradient(145deg, #1e1e1e, #161616)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{
                  "& .MuiTabs-indicator": {
                    height: 3,
                    borderRadius: "3px",
                    backgroundColor: "#FF1B6B",
                  },
                  "& .MuiTab-root": {
                    flex: 1,
                    minWidth: 0,
                    maxWidth: "33.33%",
                    textTransform: "none",
                    fontWeight: 600,
                    minHeight: { xs: 54, sm: 60 },
                    fontSize: { xs: "12px", sm: "14px", md: "15px" },
                    padding: { xs: "8px 4px", sm: "10px 12px" },
                    color: "#aaaaaa",
                    transition: "all 0.2s ease",
                  },
                  "& .Mui-selected": {
                    color: "white !important",
                  },
                  "& .MuiTab-iconWrapper": {
                    marginBottom: { xs: "3px", sm: "5px" },
                  },
                }}
              >
                <Tab
                  label="Profile"
                  icon={<User size={16} />}
                  iconPosition="top"
                />

                <Tab
                  label="Public Photos"
                  icon={<Globe size={16} />}
                  iconPosition="top"
                />

                <Tab
                  label="Private Photos"
                  icon={<Lock size={16} />}
                  iconPosition="top"
                />
              </Tabs>
            </Card>

            <Box>
              {activeTab === 0 && (
                <Fade in={activeTab === 0}>
                  <Box>
                    {renderPersonalInfo()}
                    {renderDetails()}
                  </Box>
                </Fade>
              )}

              {activeTab === 1 && (
                <Fade in={activeTab === 1}>
                  <Card sx={{ mb: 3 }}>{renderImageSection("public")}</Card>
                </Fade>
              )}

              {activeTab === 2 && (
                <Fade in={activeTab === 2}>
                  <Card sx={{ mb: 3 }}>{renderImageSection("private")}</Card>
                </Fade>
              )}
            </Box>
          </Container>

          <Dialog
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            maxWidth="lg"
            fullWidth
            PaperProps={{
              sx: {
                bgcolor: "transparent",
                boxShadow: "none",
                maxHeight: "90vh",
              },
            }}
          >
            <DialogContent
              sx={{
                p: 0,
                bgcolor: "rgba(0,0,0,0.95)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
            >
              <img
                src={selectedImage || ""}
                alt="Enlarged view"
                style={{
                  maxWidth: "100%",
                  maxHeight: "90vh",
                  objectFit: "contain",
                }}
              />
              <IconButton
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  color: "white",
                  bgcolor: "rgba(0,0,0,0.7)",
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.9)",
                  },
                }}
                onClick={() => setIsModalOpen(false)}
              >
                <X />
              </IconButton>
            </DialogContent>
          </Dialog>

          {profileId && <ProfileImgCheckerModel profileId={profileId} />}

          {showCropper && (
            <Dialog
              open={showCropper}
              onClose={() => {
                setShowCropper(false);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
              }}
              maxWidth="sm"
              fullWidth
            >
              <DialogContent
                sx={{
                  backgroundColor: "#000",
                  color: "#fff",
                  height: "400px",
                  position: "relative",
                  padding: 0,
                  overflow: "hidden",
                }}
              >
                {selectedImage && (
                  <Cropper
                    key={selectedImage}
                    image={selectedImage}
                    crop={crop}
                    zoom={zoom}
                    objectFit="contain"
                    aspect={currentCropType === "avatar" ? 4 / 5 : 16 / 9}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    onMediaLoaded={() => setTimeout(() => setZoom(1), 50)}
                  />
                )}
              </DialogContent>
              <DialogActions
                sx={{
                  background:
                    "linear-gradient(145deg, #0A0118 0%, #1A0B2E 100%)",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  justifyContent: "center",
                  p: 2,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowCropper(false);
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
                  onClick={handleCropSave}
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
          )}

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
              severity={snackbar.severity}
              sx={{
                bgcolor:
                  snackbar.severity === "success"
                    ? "rgba(76, 175, 80, 0.1)"
                    : "rgba(244, 67, 54, 0.1)",
                color: snackbar.severity === "success" ? "#4caf50" : "#f44336",
                border: `1px solid ${
                  snackbar.severity === "success"
                    ? "rgba(76, 175, 80, 0.2)"
                    : "rgba(244, 67, 54, 0.2)"
                }`,
              }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
        {isMobileOrTablet ? <AppFooterMobile /> : <AppFooterDesktop />}
      </Box>

      <Dialog
        open={cropOpen}
        onClose={() => {
          if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
          setCropOpen(false);
          setCropImageUrl(null);
          setCropFile(null);
          setCropType(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            height: "400px",
            position: "relative",
            padding: 0,
            overflow: "hidden",
          }}
        >
          {cropImageUrl && (
            <Cropper
              key={cropImageUrl}
              image={cropImageUrl}
              crop={imageCrop}
              zoom={imageZoom}
              aspect={4 / 5}
              onCropChange={setImageCrop}
              onZoomChange={setImageZoom}
              onCropComplete={(_, area) => setCropAreaPixels(area)}
              zoomSpeed={0.1}
              restrictPosition={false}
            />
          )}
        </DialogContent>
        <DialogActions
          sx={{
            background: "linear-gradient(145deg, #1e1e1e, #161616)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => {
              if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
              setCropOpen(false);
              setCropImageUrl(null);
              setCropFile(null);
              setCropType(null);
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
            onClick={handleImageCropConfirm}
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
};

export default ProfileDetail;
