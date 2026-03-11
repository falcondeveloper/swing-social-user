"use client";

import Header from "@/components/Header";
import {
  Box,
  useTheme,
  useMediaQuery,
  Button,
  Container,
  Paper,
  Divider,
  TextField,
  IconButton,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { Save, X, Camera } from "lucide-react";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import CustomDialog from "@/components/CustomDialog";

type Params = Promise<{ id: string }>;

export default function EditPost(props: { params: Params }) {
  const [id, setId] = useState("");
  const [postDetail, setPostDetail] = useState<any>({});
  const [parentCommentId, setParentCommentId] = useState(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [caption, setCaption] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState<"success" | "error" | null>(
    null,
  );

  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width: 480px)") ? true : false;

  useEffect(() => {
    const getIdFromParam = async () => {
      const params = await props.params;
      setId(params.id);
    };
    getIdFromParam();
  }, [props]);

  useEffect(() => {
    if (id) {
      handleWhatshotPosts(id);
    }
  }, [id, parentCommentId, hasLiked]);

  useEffect(() => {
    if (postDetail?.ImageCaption) {
      setCaption(postDetail.ImageCaption);
    }
    if (postDetail?.PhotoLink) {
      setImagePreview(postDetail.PhotoLink);
    }
  }, [postDetail]);

  const handleWhatshotPosts = async (userid: string) => {
    try {
      const response = await fetch(
        "/api/user/whatshot/post?id=" + userid + "&postId=" + id,
      );
      const data = await response.json();
      setPostDetail(data?.posts?.[0]);
      console.log(data?.posts?.[0]);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (image: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image");
      }

      return data?.blobUrl || null;
    } catch (error) {
      console.error("Error during image upload:", error);
      return null;
    }
  };

  const handleSave = async () => {
    try {
      let imageUrl = postDetail?.PhotoLink;

      if (newImage) {
        const uploadedImageUrl = await uploadImage(newImage);
        if (!uploadedImageUrl) {
          throw new Error("Failed to upload new image");
        }
        imageUrl = uploadedImageUrl;
      }

      console.log({
        postId: id,
        caption: caption,
        photoLink: imageUrl,
      });

      const response = await fetch("/api/user/whatshot/post/postupdate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: id,
          caption: caption,
          photoLink: imageUrl,
        }),
      });

      if (response.ok) {
        setDialogTitle("Success!");
        setDialogMessage("Post updated successfully.");
        setDialogType("success");
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setDialogTitle("Error!");
      setDialogMessage("Failed to update post.");
      setDialogType("error");
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Box sx={{ bgcolor: "#121212", minHeight: "100vh" }}>
        <Header />

        <Container maxWidth="lg" sx={{ mt: 12, mb: 8 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Button
              onClick={() => router.back()}
              startIcon={<ArrowLeft />}
              sx={{
                textTransform: "none",
                color: "rgba(255, 255, 255, 0.7)",
                textAlign: "center",
                minWidth: "auto",
                fontSize: "16px",
                fontWeight: "medium",
                "&:hover": {
                  color: "#fff",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              Back
            </Button>
            <Button
              onClick={handleSave}
              startIcon={<Save />}
              sx={{
                textTransform: "none",
                color: "#fff",
                bgcolor: "#f50057",
                "&:hover": {
                  bgcolor: "#c51162",
                },
              }}
            >
              Save Changes
            </Button>
          </Box>
          <Paper
            elevation={3}
            sx={{
              bgcolor: "#1E1E1E",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: { xs: "300px", sm: "400px", md: "500px" },
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: "#000",
              }}
            >
              {imagePreview ? (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Post"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Camera size={48} color="white" />
                  <Box sx={{ color: "white" }}>No image selected</Box>
                </Box>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <IconButton
                  component="span"
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    bgcolor: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.7)",
                    },
                  }}
                >
                  <Camera />
                </IconButton>
              </label>
            </Box>

            <Box sx={{ p: 3 }}>
              <TextField
                fullWidth
                label="Caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.5)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255, 255, 255, 0.7)",
                  },
                }}
              />
            </Box>

            <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
          </Paper>
        </Container>
        {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}
      </Box>

      <CustomDialog
        open={dialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        confirmText="OK"
        cancelText="CLOSE"
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);

          if (dialogType === "success") {
            router.back();
          }
        }}
      />
    </>
  );
}
