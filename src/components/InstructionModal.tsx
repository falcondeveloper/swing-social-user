"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import SwipeIcon from "@mui/icons-material/SwipeRounded";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import TuneIcon from "@mui/icons-material/Tune";
import { useRouter } from "next/navigation";

export default function InstructionModal() {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const count = localStorage.getItem("memberalarm") || "0";
    localStorage.setItem("memberalarm", (parseInt(count) + 1).toString());
  }, []);

  const handleClose = async () => {
    const userid = localStorage.getItem("logged_in_profile");
    await fetch("/api/user/memberalarm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userid),
    });
    setOpen(false);
  };

  const swipeActions = [
    {
      icon: <ThumbUpIcon sx={{ fontSize: 22, color: "#00D179" }} />,
      direction: "RIGHT",
      label: "You like the profile",
      color: "#00D179",
      border: "rgba(0, 209, 121, 0.35)",
      bg: "rgba(0, 209, 121, 0.08)",
    },
    {
      icon: <HelpOutlineIcon sx={{ fontSize: 22, color: "#FFB300" }} />,
      direction: "DOWN",
      label: "You're not sure",
      color: "#FFB300",
      border: "rgba(255, 179, 0, 0.35)",
      bg: "rgba(255, 179, 0, 0.08)",
    },
    {
      icon: <ThumbDownIcon sx={{ fontSize: 22, color: "#FF2D55" }} />,
      direction: "LEFT",
      label: "You're not interested",
      color: "#FF2D55",
      border: "rgba(255, 45, 85, 0.35)",
      bg: "rgba(255, 45, 85, 0.08)",
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      disableEscapeKeyDown
      BackdropProps={{ sx: { backdropFilter: "blur(8px)" } }}
      PaperProps={{
        sx: {
          width: "100%",
          borderRadius: "20px",
          margin: 2,
          p: 3,
          background: "rgba(20, 10, 35, 0.85)",
          backdropFilter: "blur(25px)",
          border: "2px solid rgba(255,255,255,0.08)",
          color: "#fff",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF2D55, #7000FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SwipeIcon sx={{ color: "#fff", fontSize: 28 }} />
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              letterSpacing: 0.3,
              fontSize: "1.2rem", // ✅ Larger
              color: "#fff",
            }}
          >
            How to Swipe Profiles
          </Typography>

          <Box sx={{ width: "100%" }}>
            {swipeActions.map(
              ({ icon, direction, label, color, border, bg }) => (
                <Box
                  key={direction}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 1.2,
                    p: 1.4,
                    borderRadius: "14px",
                    background: bg,
                    border: `1.5px solid ${border}`,
                    transition: "transform 0.15s ease",
                    "&:hover": { transform: "scale(1.01)" },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: `${color}22`,
                      border: `1.5px solid ${color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </Box>
                  <Box sx={{ textAlign: "left" }}>
                    <Typography
                      sx={{ fontWeight: 800, fontSize: "0.95rem", color }}
                    >
                      {" "}
                      Swipe {direction}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.82rem",
                        color: "rgba(255,255,255,0.65)",
                      }}
                    >
                      {" "}
                      {label}
                    </Typography>
                  </Box>
                </Box>
              ),
            )}
          </Box>

          {/* Preferences tip */}
          <Box
            sx={{
              width: "100%",
              p: 1.8,
              borderRadius: "14px",
              background:
                "linear-gradient(135deg, rgba(112,0,255,0.14), rgba(255,45,85,0.08))",
              border: "1.5px solid rgba(155, 77, 255, 0.4)",
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
              textAlign: "left",
            }}
          >
            <TuneIcon
              sx={{ color: "#9B4DFF", fontSize: 22, mt: "2px", flexShrink: 0 }}
            />
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.6,
              }}
            >
              {" "}
              {/* ✅ Larger */}
              Members are registered as{" "}
              <strong style={{ color: "#fff" }}>Males</strong>,{" "}
              <strong style={{ color: "#fff" }}>Females</strong>, or{" "}
              <strong style={{ color: "#fff" }}>Couples</strong>. Filter by
              tapping {/* ✅ Clickable Preferences */}
              <Box
                component="span"
                onClick={() => {
                  handleClose();
                  router.push("/prefrences");
                }}
                sx={{
                  color: "#9B4DFF",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  "&:hover": { color: "#b97bff" },
                }}
              >
                Preferences
              </Box>
              .
            </Typography>
          </Box>

          {/* CTA button */}
          <Button
            fullWidth
            onClick={handleClose}
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
            Got it!
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
