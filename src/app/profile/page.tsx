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
  Divider,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Autocomplete,
  Avatar as MuiAvatar,
  Tabs,
  Tab,
  Fade,
  Collapse,
  Alert,
  Snackbar,
  Stack,
  Badge,
  DialogActions,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import {
  ArrowLeft,
  MapPin,
  Heart,
  Eye,
  Users,
  Crown,
  Calendar,
  Info,
  Upload,
  X,
  Edit,
  Save,
  Camera,
  Plus,
  User,
  Settings,
  LogOut,
  Image as ImageIcon,
  Lock,
  Globe,
  Check,
  AlertCircle,
  Settings2,
  Bell,
  ShieldCheck,
} from "lucide-react";
import Cropper, { Area } from "react-easy-crop";
import getCroppedImg from "../../utils/cropImage";
import ProfileImgCheckerModel from "@/components/ProfileImgCheckerModel";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Enhanced theme with your brand guidelines
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

// Styled components
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

// Constants
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
  const isMobile = useMediaQuery("(max-width: 768px)");

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

    const tempId = `temp-${Date.now()}`;
    const preview: ImagePreview = {
      id: tempId,
      url: URL.createObjectURL(file),
      file: file,
      isUploading: true,
    };

    if (type === "public") {
      setPublicImagePreviews((prev) => [...prev, preview]);
    } else {
      setPrivateImagePreviews((prev) => [...prev, preview]);
    }

    try {
      const uploadURL = await uploadImage(file);

      if (type === "public") {
        const response = await fetch(
          "api/user/profile/update/images/public/insert",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileId: profileId,
              imageURL: uploadURL,
            }),
          },
        );

        const data = await response.json();
        if (data.status === 200) {
          setProfileImages((prev: any) => [
            ...prev,
            { Id: data.imageId, Url: uploadURL },
          ]);
          setPublicImagePreviews((prev) =>
            prev.filter((preview) => preview.id !== tempId),
          );
          showSnackbar("Image uploaded successfully!");
        }
      } else {
        const response = await fetch(
          "api/user/profile/update/images/private/insert",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileId: profileId,
              imageURL: uploadURL,
            }),
          },
        );

        const data = await response.json();
        if (data.status === 200) {
          setPrivateImages((prev: any) => [
            ...prev,
            { Id: data.imageId, Url: uploadURL },
          ]);
          setPrivateImagePreviews((prev) =>
            prev.filter((preview) => preview.id !== tempId),
          );
          showSnackbar("Private image uploaded successfully!");
        }
      }
    } catch (error) {
      console.error(error);
      showSnackbar("Failed to upload image", "error");
      if (type === "public") {
        setPublicImagePreviews((prev) =>
          prev.filter((preview) => preview.id !== tempId),
        );
      } else {
        setPrivateImagePreviews((prev) =>
          prev.filter((preview) => preview.id !== tempId),
        );
      }
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
      // Open cropper for both avatar and cover
      setSelectedImage(reader.result as string);
      setCurrentCropType(type); // Save type for later in crop save handler
      setTempFile(file); // Save original file for updating EditedData after cropping
      setShowCropper(true);
    };

    reader.readAsDataURL(file);
  };

  const renderImageSection = (type: "public" | "private") => {
    const images = type === "public" ? profileImages : privateImages;
    const previews =
      type === "public" ? publicImagePreviews : privateImagePreviews;
    const maxImages = 15;
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "12px",
                bgcolor: "rgba(255, 27, 107, 0.1)",
                border: "1px solid rgba(255, 27, 107, 0.2)",
              }}
            >
              {type === "public" ? (
                <Globe size={20} color="#FF1B6B" />
              ) : (
                <Lock size={20} color="#FF1B6B" />
              )}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
                {type === "public" ? "Public Photos" : "Private Photos"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#aaaaaa" }}>
                {type === "public"
                  ? "Visible to everyone"
                  : "Only for authorized members"}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={`${currentCount}/${maxImages}`}
            size="small"
            sx={{
              bgcolor: "rgba(255, 27, 107, 0.1)",
              color: "#FF1B6B",
              border: "1px solid rgba(255, 27, 107, 0.2)",
              fontWeight: 600,
            }}
          />
        </Box>

        <ImageGrid>
          {/* Existing images */}
          <AnimatePresence>
            {images?.map((image: any, index: number) => (
              <ImageCard
                key={image.Id}
                layoutId={`image-${image.Id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  setSelectedImage(image.Url);
                  setIsModalOpen(true);
                }}
              >
                <img
                  src={image.Url}
                  alt={`${type} Photo ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
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
              </ImageCard>
            ))}
          </AnimatePresence>

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
              </label>
            </UploadCard>
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

  const renderPersonalInfo = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: "12px",
              bgcolor: "rgba(255, 27, 107, 0.1)",
              border: "1px solid rgba(255, 27, 107, 0.2)",
            }}
          >
            <User size={20} color="#FF1B6B" />
          </Box>
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
            Personal Information
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {isEditing ? (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={editedData?.Username || ""}
                  onChange={(e) =>
                    handleInputChange("Username", e.target.value)
                  }
                  error={!!errors.Username}
                  helperText={errors.Username}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Age"
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(e.target.value)}
                  error={!!errors.Age}
                  helperText={errors.Age}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  id="location-autocomplete"
                  open={openCity}
                  onOpen={() => setOpenCity(true)}
                  onClose={() => setOpenCity(false)}
                  isOptionEqualToValue={(option, value) =>
                    option.City === value.City
                  }
                  getOptionLabel={(option) => option.City || ""}
                  options={cityOption}
                  loading={cityLoading}
                  inputValue={cityInput}
                  noOptionsText={
                    <Typography sx={{ color: "white" }}>No options</Typography>
                  }
                  value={
                    editedData?.Location
                      ? {
                          City: editedData.Location.replace(", USA", ""),
                        }
                      : null
                  }
                  onInputChange={(event, newInputValue) => {
                    if (event?.type === "change" || event?.type === "click")
                      setCityInput(newInputValue);
                  }}
                  onChange={(event, newValue) => {
                    if (newValue?.City)
                      handleInputChange("Location", newValue.City);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Location"
                      error={!!errors.Location}
                      helperText={errors.Location}
                      disabled={isSubmitting}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <MapPin
                            size={20}
                            color="#aaaaaa"
                            style={{ marginRight: 8 }}
                          />
                        ),
                        endAdornment: (
                          <>
                            {cityLoading ? (
                              <CircularProgress color="inherit" size={15} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tagline"
                  multiline
                  rows={2}
                  value={editedData?.Tagline || ""}
                  onChange={(e) => handleInputChange("Tagline", e.target.value)}
                  error={!!errors.Tagline}
                  helperText={errors.Tagline}
                  placeholder="Tell everyone about yourself in one line..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="About Me"
                  multiline
                  rows={4}
                  value={editedData?.About || ""}
                  onChange={(e) => handleInputChange("About", e.target.value)}
                  error={!!errors.About}
                  helperText={errors.About}
                  placeholder="Share more about yourself, your interests, and what you're looking for..."
                />
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Stack spacing={3}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "bold", color: "white" }}
                    >
                      {advertiser.Username}
                    </Typography>
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
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#aaaaaa",
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <MapPin size={16} />
                    {advertiser.Location?.replace(", USA", "")}
                  </Typography>
                </Box>

                {advertiser.Tagline && (
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: "12px",
                      bgcolor: "rgba(255, 27, 107, 0.05)",
                      border: "1px solid rgba(255, 27, 107, 0.1)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: "#FF1B6B", mb: 1, fontWeight: 600 }}
                    >
                      Tagline
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "white", fontStyle: "italic" }}
                    >
                      "{advertiser.Tagline}"
                    </Typography>
                  </Box>
                )}

                {advertiser.About && (
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ color: "#FF1B6B", mb: 2, fontWeight: 600 }}
                    >
                      About Me
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#aaaaaa", lineHeight: 1.6 }}
                    >
                      {advertiser.About}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderDetails = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: "12px",
              bgcolor: "rgba(255, 27, 107, 0.1)",
              border: "1px solid rgba(255, 27, 107, 0.2)",
            }}
          >
            <Info size={20} color="#FF1B6B" />
          </Box>
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
            Physical Details
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {["BodyType", "HairColor", "EyeColor", "SexualOrientation"].map(
            (field) => {
              const options =
                field === "BodyType"
                  ? BODY_TYPES
                  : field === "HairColor"
                    ? HAIR_COLORS
                    : field === "EyeColor"
                      ? EYE_COLORS
                      : ORIENTATIONS;
              const label =
                field === "SexualOrientation"
                  ? "Orientation"
                  : field.replace(/([A-Z])/g, " $1").trim();

              return (
                <Grid item xs={6} sm={3} key={field}>
                  {isEditing ? (
                    <FormControl fullWidth>
                      <InputLabel>{label}</InputLabel>
                      <Select
                        value={editedData?.[field] || ""}
                        onChange={(e) =>
                          handleInputChange(field, e.target.value)
                        }
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
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#FF1B6B", fontWeight: "bold" }}
                      >
                        {label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "white" }}>
                        {advertiser?.[field] || "Not specified"}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              );
            },
          )}

          <Grid item xs={12}>
            {isEditing ? (
              <Box>
                <Typography
                  sx={{
                    color: "#e91e63",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                  }}
                >
                  Swing Style
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries({
                    exploring: "Exploring/Unsure",
                    fullSwap: "Full Swap",
                    softSwap: "Soft Swap",
                    voyeur: "Voyeur",
                  }).map(([key, label]) => (
                    <Grid item xs={6} sm={3} key={key}>
                      <FormControlLabel
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
                            disabled={isSubmitting}
                            sx={{
                              color: "white",
                              "&.Mui-checked": {
                                color: "#e91e63",
                              },
                            }}
                          />
                        }
                        label={label}
                        sx={{ color: "white" }}
                      />
                    </Grid>
                  ))}
                </Grid>
                {/* Display the error message below the checkboxes */}
                {errors.swingStyles && (
                  <Typography
                    sx={{ color: "#d32f2f", mt: 1, fontSize: "0.75rem" }}
                  >
                    {errors.swingStyles}
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                <Typography
                  sx={{
                    color: "#e91e63",
                    fontSize: "0.875rem",
                    mb: 1,
                    fontWeight: "bold",
                  }}
                >
                  Swing Style
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  {advertiser?.SwingStyleTags?.length > 0 ? (
                    advertiser.SwingStyleTags.map(
                      (tag: string, index: number) => (
                        <Box
                          key={index}
                          sx={{
                            padding: "5px 10px",
                            backgroundColor: "#272727",
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }}
                        >
                          {tag}
                        </Box>
                      ),
                    )
                  ) : (
                    <Typography sx={{ color: "white" }}>
                      No data available
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

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

  // Initialize data on mount
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

  // Don't render until mounted
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

  if (loading) {
    return (
      <Box sx={{ bgcolor: "#121212", minHeight: "100vh" }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "60vh",
            }}
          >
            <CircularProgress sx={{ color: "#FF1B6B" }} />
          </Box>
        </Container>
        {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}
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

      if (previewImages.banner) {
        const bannerFile = editedData.ProfileBanner;
        const bannerUrl = await uploadImage(bannerFile);
        updatedProfileData.ProfileBanner = bannerUrl;
      }

      if (previewImages.avatar) {
        const avatarFile = editedData.Avatar;
        const avatarUrl = await uploadImage(avatarFile);
        updatedProfileData.Avatar = avatarUrl;
      }

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

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels || !currentCropType || !tempFile)
      return;

    try {
      const croppedImage = await getCroppedImg(
        selectedImage,
        croppedAreaPixels,
      );

      // Convert base64 -> File
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], `${currentCropType}-cropped.jpg`, {
        type: blob.type,
      });

      // Save to state
      if (currentCropType === "avatar") {
        setPreviewImages((prev) => ({ ...prev, avatar: croppedImage }));
        setEditedData((prev: any) => ({ ...prev, Avatar: file }));
      } else {
        setPreviewImages((prev) => ({ ...prev, banner: croppedImage }));
        setEditedData((prev: any) => ({ ...prev, ProfileBanner: file }));
      }

      // Reset cropper state
      setSelectedImage(null);
      setTempFile(null);
      setCurrentCropType(null);
      setShowCropper(false);
    } catch (err) {
      console.error("Cropping failed", err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#121212",
        }}
      >
        <Header />

        <Container
          maxWidth="md"
          sx={{
            pt: { xs: 2, sm: 2, md: 2 },
            pb: { xs: 8, sm: 9, md: 10 },
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          <ProfileHeader sx={{ mb: 4 }}>
            <CoverImageContainer
              sx={{
                position: "relative",
                backgroundImage: `url(${
                  previewImages.banner ||
                  advertiser.ProfileBanner ||
                  "/default-cover.jpg"
                })`,
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

              <Box
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 16,
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "row",
                  gap: 1,
                  alignItems: "center",
                }}
              >
                {/* Premium Badge */}
                {(membership === "1" ||
                  membership1 === 1 ||
                  membership === "0" ||
                  membership1 === 0) && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 1.9,
                      py: 1,
                      borderRadius: "999px",
                      background: "rgba(0, 0, 0, 0.65)",
                      color: membership1 === 1 ? "#FFD700" : "#ccc",
                      fontWeight: 600,
                      fontSize: "13px",
                      gap: 0.5,
                      lineHeight: 1,
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    {membership1 === 1 ? (
                      <Crown size={16} />
                    ) : (
                      <User size={16} />
                    )}
                    {membership1 === 1 ? "Premium" : "Free"}
                  </Box>
                )}

                {/* Preferences Button */}
                <Button
                  variant="outlined"
                  onClick={() => router.push("/prefrences")}
                  startIcon={<Settings2 size={16} />}
                  sx={{
                    borderRadius: "999px",
                    fontSize: "13px",
                    textTransform: "none",
                    px: 1.5,
                    py: 0.5,
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.3)",
                    background: "rgba(0, 0, 0, 0.65)",
                    backdropFilter: "blur(45px)",
                    "&:hover": {
                      background: "rgba(255,255,255,0.1)",
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                    width: { xs: "auto", sm: "auto" },
                  }}
                >
                  Preferences
                </Button>
              </Box>

              {/* Edit overlay for cover */}
              {isEditing && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    bgcolor: "rgba(0,0,0,0.7)",
                    borderRadius: "8px",
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Camera size={16} color="white" />
                  <Typography variant="body2" sx={{ color: "white" }}>
                    Click to change cover
                  </Typography>
                </Box>
              )}
            </CoverImageContainer>

            {/* Profile Info */}
            <Box sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 } }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  alignItems: { xs: "center", md: "flex-start" },
                  gap: 3,
                }}
              >
                {/* Avatar */}
                <Box sx={{ position: "relative", mt: { xs: -6, sm: -8 } }}>
                  <ProfileAvatar
                    onClick={() => {
                      if (isEditing) {
                        document.getElementById("avatar-upload")?.click();
                      }
                    }}
                  >
                    <img
                      src={
                        previewImages.avatar ||
                        advertiser.Avatar ||
                        "/noavatar.png"
                      }
                      alt="Profile Avatar"
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
                          bottom: 8,
                          right: 8,
                          bgcolor: "#FF1B6B",
                          borderRadius: "50%",
                          width: 32,
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
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
                </Box>

                {/* Basic Info */}
                <Box
                  sx={{
                    flex: 1,
                    mt: { xs: 2, md: 1 },
                    width: "100%",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "flex-start", md: "center" },
                    justifyContent: "space-between",
                    gap: { xs: 2, md: 0 },
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: "bold", color: "white" }}
                      >
                        {advertiser.Username}
                      </Typography>
                      {advertiser?.selfie_verification_status === "true" ? (
                        <Box
                          sx={{
                            transform: "translateX(-50%)",
                            bgcolor: "rgba(255, 255, 255, 0.9)",
                            color: "#e91e63",
                            ml: 6,
                            px: 1.5,
                            py: 0.3,
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.6,
                            backdropFilter: "blur(6px)",
                            boxShadow: "0 4px 12px rgba(233, 30, 99, 0.2)",
                            border: "1px solid rgba(233, 30, 99, 0.3)",
                            zIndex: 1,
                          }}
                        >
                          <CheckCircleIcon
                            sx={{ fontSize: 14, color: "#4CAF50" }}
                          />
                          Verified
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ShieldCheck size={14} />}
                          onClick={() => router.push("/profile-verification")}
                          sx={{
                            ml: 2,
                            px: 2,
                            py: 0.5,
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 700,
                            textTransform: "none",
                            color: "#fff",
                            backgroundColor: "#1D9BF0", // Official "Verified Blue"
                            boxShadow: "0 2px 8px rgba(29, 155, 240, 0.25)",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              backgroundColor: "#1a8cd8",
                              boxShadow: "0 4px 12px rgba(29, 155, 240, 0.35)",
                              transform: "translateY(-1px)",
                            },
                            "&:active": {
                              transform: "translateY(0)",
                            },
                          }}
                        >
                          Verify Profile
                        </Button>
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#aaaaaa",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <MapPin size={16} />
                      {advertiser.Location?.replace(", USA", "")}
                    </Typography>
                  </Box>

                  {/* Chips */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1.5,
                      justifyContent: { xs: "flex-start", md: "flex-end" },
                    }}
                  >
                    <ActionChip
                      icon={<Settings size={14} />}
                      label="Membership"
                      onClick={() => router.push("/membership")}
                    />

                    {isEditing ? (
                      <>
                        <ActionChip
                          icon={
                            isSubmitting ? (
                              <CircularProgress size={14} />
                            ) : (
                              <Save size={14} />
                            )
                          }
                          label="Save"
                          onClick={handleSave}
                          disabled={isSubmitting}
                        />
                        <ActionChip
                          icon={<X size={14} />}
                          label="Cancel"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedData(advertiser);
                            setPreviewImages({ banner: null, avatar: null });
                          }}
                        />
                      </>
                    ) : (
                      <ActionChip
                        icon={<Edit size={14} />}
                        label="Edit"
                        // onClick={() => setIsEditing(true)}
                        onClick={handleEditToggle}
                      />
                    )}

                    <ActionChip
                      icon={<LogOut size={14} />}
                      label="Logout"
                      onClick={handleLogout}
                    />
                    {/* <ActionChip
                      icon={<Bell size={14} />}
                      label="Notifications"
                      onClick={() => router.push("/notifications")}
                    /> */}
                  </Box>
                </Box>
              </Box>
            </Box>
          </ProfileHeader>

          <Card sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                "& .MuiTab-root": {
                  minHeight: { xs: 56, sm: 64 },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  padding: { xs: "8px 4px", sm: "12px 16px" },
                  minWidth: "auto",
                },
                "& .MuiTab-iconWrapper": {
                  marginBottom: { xs: "2px", sm: "4px" },
                },
              }}
            >
              <Tab
                label="Profile"
                icon={<User size={isMobile ? 14 : 16} />}
                iconPosition="top"
                sx={{ flexDirection: "column" }}
              />
              <Tab
                label="Public Photos"
                icon={<Globe size={isMobile ? 14 : 16} />}
                iconPosition="top"
                sx={{ flexDirection: "column" }}
              />
              <Tab
                label="Private Photos"
                icon={<Lock size={isMobile ? 14 : 16} />}
                iconPosition="top"
                sx={{ flexDirection: "column" }}
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
                <Card>{renderImageSection("public")}</Card>
              </Fade>
            )}

            {activeTab === 2 && (
              <Fade in={activeTab === 2}>
                <Card>{renderImageSection("private")}</Card>
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
          <>
            <Dialog open={showCropper} onClose={() => setShowCropper(false)}>
              <DialogContent
                sx={{
                  backgroundColor: "#000",
                  color: "#fff",
                  width: { xs: "300px", sm: "400px" }, // Adjust width for smaller screens
                  height: { xs: "300px", sm: "400px" },
                  position: "relative",
                  padding: 0, // Remove padding to maximize crop area
                }}
              >
                {selectedImage && (
                  <Cropper
                    image={selectedImage || undefined}
                    crop={crop}
                    zoom={zoom}
                    aspect={currentCropType === "avatar" ? 1 : 16 / 9}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    objectFit="contain"
                  />
                )}
              </DialogContent>
              <DialogActions
                sx={{
                  backgroundColor: "#121212",
                  padding: 2,
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleCropSave}
                  sx={{
                    backgroundColor: "#c2185b",
                    "&:hover": { backgroundColor: "#ad1457" },
                  }}
                >
                  Crop
                </Button>
              </DialogActions>
            </Dialog>
          </>
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

        {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}
      </Box>
    </ThemeProvider>
  );
};

export default ProfileDetail;
