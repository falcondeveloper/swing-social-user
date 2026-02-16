"use client";
import React, { useEffect, useState } from "react";
import { Box, Dialog, DialogContent, Typography, Button } from "@mui/material";

export default function InstructionModal() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const count = localStorage.getItem("memberalarm") || "0";
    localStorage.setItem("memberalarm", (parseInt(count) + 1).toString());
  }, []);

  const handleClose = async () => {
    const userid = localStorage.getItem("logged_in_profile");
    await fetch("/api/user/memberalarm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userid),
    });
    setOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: "#333",
            color: "#fff",
            borderRadius: "12px",
            padding: "16px",
          },
        }}
      >
        <DialogContent>
          <Typography
            variant="h6"
            component="div"
            gutterBottom
            sx={{ textAlign: "center", fontWeight: "bold" }}
          >
            How to Swipe Profiles
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, textAlign: "center" }}>
            Swipe <strong>RIGHT</strong> if you like the profile.
            <br />
            Swipe <strong>DOWN</strong> if you're not sure.
            <br />
            Swipe <strong>LEFT</strong> if you're not interested.
          </Typography>

          <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
            Members are registered as <strong>Males</strong>,{" "}
            <strong>Females</strong>, or <strong>Couples</strong>. If you would
            like to filter to couples only or females only, you can do so by
            tapping your Avatar on the top right and tapping{" "}
            <strong>Preferences</strong>.
          </Typography>

          <Box display="flex" justifyContent="center" mt={3}>
            <Button
              onClick={handleClose}
              variant="contained"
              color="primary"
              sx={{
                textTransform: "none",
                color: "#fff",
                backgroundColor: "#C2185B",
                "&:hover": { backgroundColor: "#C2185C" },
              }}
            >
              Got it!
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
