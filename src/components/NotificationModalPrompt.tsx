"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Typography, Button, Stack } from "@mui/material";

export default function NotificationPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    const granted = localStorage.getItem("notificationGranted");
    if (granted === "true") return;
    const dismissed = sessionStorage.getItem("notificationPopupDismissed");
    if (dismissed === "true") return;

    if (
      Notification.permission === "default" ||
      Notification.permission === "denied"
    ) {
      setOpen(true);
    }
  }, []);

  const turnOnNotification = async () => {
    if (!("Notification" in window)) {
      alert("Notifications are not supported in this browser.");
      return;
    }

    console.log("Current permission:", Notification.permission);

    if (Notification.permission === "denied") {
      alert(
        "Notifications are blocked in your browser settings. Please enable them manually.",
      );
      localStorage.setItem("notificationPopupDismissed", "true");
      setOpen(false);
      return;
    }

    const permission = await Notification.requestPermission();
    console.log("New permission:", permission);

    if (permission === "granted") {
      localStorage.setItem("notificationGranted", "true");
      localStorage.removeItem("notificationPopupDismissed");
      setOpen(false);
    } else {
      sessionStorage.setItem("notificationPopupDismissed", "true");
      setOpen(false);
    }
  };

  const closePopup = () => {
    localStorage.setItem("notificationPopupDismissed", "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 84,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1400,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          maxWidth: 320,
          width: "100%",
          px: 2,
          py: 1.5,
          borderRadius: 2,
        }}
      >
        <Typography fontSize={13} color="text.primary" sx={{ mb: 1 }}>
          Turn on notifications to stay updated on likes and messages.
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="contained"
            onClick={turnOnNotification}
            sx={{
              textTransform: "none",
              fontSize: 12,
              bgcolor: "#ff4d6d",
              "&:hover": { bgcolor: "#e64360" },
            }}
          >
            Turn on
          </Button>

          <Button
            size="small"
            variant="text"
            onClick={closePopup}
            sx={{
              textTransform: "none",
              fontSize: 12,
              color: "text.secondary",
            }}
          >
            Maybe later
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
