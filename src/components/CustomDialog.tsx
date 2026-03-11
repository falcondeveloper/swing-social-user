"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  IconButton,
  Fade,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";

interface Props {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const CustomDialog: React.FC<Props> = ({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      BackdropProps={{
        sx: {
          backdropFilter: "blur(6px)",
        },
      }}
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 380,
          borderRadius: 4,
          p: 3,
          background: "rgba(20, 10, 35, 0.85)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#fff",
          position: "relative",
        },
      }}
    >
      <DialogContent sx={{ textAlign: "center", p: 0 }}>
        {/* Close */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 10,
            top: 10,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Gradient Icon Circle */}
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF2D55, #7000FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PhoneIphoneIcon sx={{ color: "#fff", fontSize: 30 }} />
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {title}
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: 3,
                fontWeight: 600,
                py: 1.2,
                borderColor: "rgba(255,255,255,0.3)",
                color: "#fff",
                "&:hover": {
                  borderColor: "#FF2D55",
                  backgroundColor: "rgba(255,45,85,0.1)",
                },
              }}
            >
              {cancelText.toUpperCase()}
            </Button>

            {onConfirm && (
              <Button
                fullWidth
                onClick={onConfirm}
                sx={{
                  borderRadius: 3,
                  fontWeight: 700,
                  py: 1.2,
                  background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                  color: "#fff",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                {confirmText.toUpperCase()}
              </Button>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialog;
