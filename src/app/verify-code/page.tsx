"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Password } from "@mui/icons-material";
import CustomDialog from "@/components/CustomDialog";

const OtpLoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [storedCode, setStoredCode] = useState("");
  const [dialogAction, setDialogAction] = useState<
    "login" | "signup" | "success" | null
  >(null);

  useEffect(() => {
    const emailParam = searchParams?.get("email") ?? "";
    if (emailParam) setEmail(emailParam);

    const savedOtp = sessionStorage.getItem("loginOtp") || "";
    setStoredCode(savedOtp);
  }, [searchParams]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      const nextInput = document.getElementById(
        `otp-${index + 1}`,
      ) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(
        `otp-${index - 1}`,
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const checkEmailAndLogin = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/user/loginWithOutPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.status === 200) {
        sessionStorage.removeItem("loginOtp");
        localStorage.setItem("loginInfo", data.jwtToken);
        localStorage.setItem("logged_in_profile", data.currentProfileId);
        localStorage.setItem("profileUsername", data.currentuserName);
        localStorage.setItem("memberalarm", data.memberAlarm);
        localStorage.setItem("memberShip", data.memberShip);

        router.push("/home");
      } else {
        const message = data.message || "Login failed.";

        setDialogMessage(message);

        if (message.toLowerCase().includes("no registered")) {
          setDialogAction("signup");
        } else {
          setDialogAction("login");
        }

        setDialogOpen(true);
      }
    } catch {
      setDialogMessage("Something went wrong. Please try again.");
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const enteredCode = otp.join("");

    if (enteredCode === storedCode) {
      setDialogMessage("OTP Verified! You have successfully logged in.");
      setDialogAction("success");
      setDialogOpen(true);
    } else {
      setDialogMessage("The OTP you entered is incorrect. Please try again.");
      setDialogOpen(true);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "radial-gradient(circle at top left, #1A0B2E 0%, #000000 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: "20px",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <Password sx={{ fontSize: 48, color: "#FF2D55", mb: 2 }} />

          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              background: "linear-gradient(45deg,#FF2D55,#7000FF)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              mb: 2,
            }}
          >
            Verify Email OTP
          </Typography>

          <Typography sx={{ mb: 3, color: "rgba(255,255,255,0.7)" }}>
            Enter the 4-digit code sent to your email
          </Typography>

          <TextField
            fullWidth
            label="Email"
            value={email}
            disabled
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.2)",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.6)",
              },
            }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              mb: 4,
            }}
          >
            {otp.map((digit, index) => (
              <TextField
                key={index}
                id={`otp-${index}`}
                value={digit}
                onChange={(e: any) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e: any) => handleKeyDown(e, index)}
                inputProps={{ maxLength: 1 }}
                sx={{
                  width: "55px",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "#FF2D55",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#7000FF",
                    },
                  },
                  "& input": {
                    textAlign: "center",
                    fontSize: "1.6rem",
                    color: "#fff",
                  },
                }}
              />
            ))}
          </Box>

          <Button
            fullWidth
            onClick={handleContinue}
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: "12px",
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(45deg,#FF2D55,#7000FF)",
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              "LOGIN"
            )}
          </Button>
        </Paper>
      </Container>

      {/* Custom Dialog */}
      <CustomDialog
        open={dialogOpen}
        title="Verification Status"
        description={dialogMessage}
        confirmText={
          dialogAction === "signup"
            ? "SIGN UP"
            : dialogAction === "success"
              ? "CONTINUE"
              : "OK"
        }
        cancelText="CLOSE"
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);

          if (dialogAction === "success") {
            checkEmailAndLogin();
          }

          if (dialogAction === "signup") {
            router.push("/register");
          }
        }}
      />
    </Box>
  );
};

const EmailOtpLogin = () => {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            background: "#000",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <OtpLoginContent />
    </Suspense>
  );
};

export default EmailOtpLogin;
