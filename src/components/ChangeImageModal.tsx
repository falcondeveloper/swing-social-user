import React, { useState } from "react";
import { Modal, Box, TextField, Button } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import CustomDialog from "./CustomDialog";

export default function ChangeImageModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: any;
}) {
  const isMobile = useMediaQuery("(max-width: 480px)");
  const [images, setImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]); // For previewing uploaded images
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogAction, setDialogAction] = useState<"success" | "error" | null>(
    null,
  );

  // Function to handle image uploads
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Update the images array
      const updatedImages = [...images];
      updatedImages[index] = file;
      setImages(updatedImages);

      // Update the preview images array
      const updatedPreviews = [...previewImages];
      updatedPreviews[index] = URL.createObjectURL(file);
      setPreviewImages(updatedPreviews);
    }
  };

  // Function to upload a single image
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

  // Handle form submission
  const handleSubmit = async () => {
    try {
      console.log(images);
      // Upload images to the server
      const uploadedImageUrls: string[] = [];
      for (const image of images) {
        if (image) {
          const imageUrl = await uploadImage(image);
          if (imageUrl) {
            uploadedImageUrls.push(imageUrl);
          }
        }
      }

      // Log the product data (including uploaded image URLs)
      console.log({
        images: uploadedImageUrls,
        product: product, // Uploaded image URLs
      });

      const result = await fetch("/api/marketplace/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: uploadedImageUrls,
          productId: product.Id,
        }),
      });

      if (result.ok) {
        setDialogTitle("Images Updated Successfully!");
        setDialogMessage("Your product images have been updated.");
        setDialogAction("success");
        setDialogOpen(true);
      } else {
        setDialogTitle("Update Failed");
        setDialogMessage("Something went wrong while updating images.");
        setDialogAction("error");
        setDialogOpen(true);
      }
      onClose();
    } catch (error) {
      console.error("Error submitting product:", error);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isMobile ? "90%" : "50%",
            bgcolor: "#222",
            border: "2px solid #666",
            borderRadius: "8px",
            boxShadow: 24,
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            color: "white",
          }}
        >
          <h2 style={{ margin: 0, textAlign: "center" }}>Update Images</h2>

          {/* Image Upload */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {[...Array(5)].map((_, index) => (
              <Box
                key={index}
                sx={{
                  flexShrink: 0,
                  width: { xs: "40px", sm: "55px", md: "75px", lg: "120px" },
                  height: { xs: "40px", sm: "55px", md: "75px", lg: "120px" },
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
                  position: "relative",
                  backgroundColor: "black",
                }}
              >
                {previewImages[index] ? (
                  <img
                    src={previewImages[index]}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <label
                    htmlFor={`file-input-${index}`}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      cursor: "pointer",
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src="/photocamera.png"
                      alt="Camera Icon"
                      style={{
                        width: "50%",
                        height: "50%",
                        objectFit: "contain",
                      }}
                    />
                    <input
                      id={`file-input-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleImageUpload(event, index)}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </Box>
            ))}
          </Box>

          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              backgroundColor: "#007BFF",
              "&:hover": { backgroundColor: "#0056b3" },
            }}
          >
            Submit
          </Button>
        </Box>
      </Modal>

      <CustomDialog
        open={dialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        confirmText="OK"
        cancelText="CLOSE"
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);

          if (dialogAction === "success") {
            onClose();
            window.location.reload();
          }
        }}
      />
    </>
  );
}
