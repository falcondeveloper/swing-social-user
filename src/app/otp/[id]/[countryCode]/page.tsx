"use client";

import React, { useState, useEffect, Suspense, memo, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  Container,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import "react-toastify/dist/ReactToastify.css";
import RefreshIcon from "@mui/icons-material/Refresh";

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

  const particles = useMemo(() => {
    const count = isMobile ? 15 : 50;
    return [...Array(count)].map((_, i) => ({
      id: i,
      size: Math.random() * (isMobile ? 4 : 6) + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * (isMobile ? 15 : 20) + 10,
      delay: -Math.random() * 20,
    }));
  }, [isMobile]);

  return (
    <Box
      sx={{
        position: "absolute",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        opacity: 0.6,
      }}
    >
      {particles.map((particle) => (
        <Box
          key={particle.id}
          sx={{
            position: "absolute",
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: "linear-gradient(45deg, #FF2D55, #7000FF)",
            borderRadius: "50%",
            animation: `float ${particle.duration}s infinite linear`,
            animationDelay: `${particle.delay}s`,
            "@keyframes float": {
              "0%": {
                transform: "translate(0, 0) rotate(0deg)",
                opacity: 0,
              },
              "50%": {
                opacity: 0.8,
              },
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

const validationSchema = Yup.object({
  otp: Yup.array()
    .of(
      Yup.string()
        .matches(/^[0-9]$/, "Must be a digit")
        .required("Required"),
    )
    .min(4, "Must be 4 digits")
    .max(4, "Must be 4 digits"),
});

export default function Otp({
  params,
}: {
  params: Promise<{ idEmail: string; countryCode?: string }>;
}) {
  const { idEmail, countryCode } = React.use(params);
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpData, setOtpData] = useState<{
    verificationId: string;
    mobileNumber: string;
    responseCode: string;
    timeout: string;
    transactionId: string;
  } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (phone) {
      handleVerificationPhone(phone);
    }
  }, [phone]);

  useEffect(() => {
    setPhone(localStorage.getItem("phone"));
    setId(localStorage.getItem("logged_in_profile") || idEmail);
  }, [idEmail, countryCode]);

  const formik = useFormik({
    initialValues: { otp: ["", "", "", ""] },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      console.log("otpData.", otpData);
      try {
        const enteredCode = values.otp.join("");
        const res = await fetch(
          `/api/user/otp?countryCode=${countryCode}&mobileNumber=${phone}&verificationId=${otpData?.verificationId}&code=${enteredCode}`,
          { method: "GET" },
        );

        const data = await res.json();

        if (
          res.ok &&
          (data?.responseCode === 200 || data?.responseCode === "200") &&
          data?.message === "SUCCESS" &&
          data?.data?.verificationStatus === "VERIFICATION_COMPLETED"
        ) {
          await fetch("/api/user/savestatus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: 1 }),
          });
          toast.success("OTP Verified Successfully");
          router.push(`/intrested/${id}`);
          localStorage.removeItem("phone");
        } else {
          setError(true);
          setTimeout(() => {
            setError(false);
            formik.setFieldValue("otp", ["", "", "", ""]);
          }, 3000);
        }
      } catch (error) {
        console.error("OTP verification failed:", error);
        setError(true);
      }
      setLoading(false);
    },
  });

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...formik.values.otp];
    newOtp[index] = value.slice(-1);
    formik.setFieldValue("otp", newOtp);

    if (value && index < newOtp.length - 1) {
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
    if (event.key === "Backspace" && !formik.values.otp[index] && index > 0) {
      const prevInput = document.getElementById(
        `otp-${index - 1}`,
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleVerificationPhone = async (phone: string) => {
    try {
      const res = await fetch("/api/user/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, countryCode }),
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      const data = await res.json();
      setResendTimer(90);
      setOtpData(data?.data);
      console.log(data?.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  return (
    <>
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center", // ✅ Vertically center
            background:
              "radial-gradient(circle at top left, #1A0B2E 0%, #000000 100%)",
            position: "relative",
            overflow: "hidden",
            width: "100%",
            height: "100vh", // ✅ Full viewport height
          }}
        >
          <ParticleField />
          <Container
            maxWidth="sm"
            sx={{
              px: { xs: 1, sm: 2, md: 3 },
              py: { xs: 1.5, sm: 2 },
              display: "flex",
              justifyContent: "center",
              alignItems: "center", // ✅ Center content inside container
              height: "100%",
            }}
          >
            <Paper
              elevation={24}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
                mx: "auto",
                width: "100%",
              }}
            >
              <Stepper
                activeStep={1}
                alternativeLabel
                sx={{
                  background: "transparent",
                  width: "100%",
                  margin: "0 auto 16px auto",
                }}
              >
                {[
                  "Profile Info",
                  "Verify Phone",
                  "Preferences",
                  "Avatar & Banner",
                  "About",
                ].map((label) => (
                  <Step key={label}>
                    <StepLabel
                      sx={{
                        "& .MuiStepLabel-label": {
                          color: "#fff !important",
                          fontSize: { xs: "0.7rem", sm: "0.85rem" },
                        },
                        "& .MuiStepIcon-root": {
                          color: "rgba(255,255,255,0.3)",
                        },
                        "& .MuiStepIcon-root.Mui-active": {
                          color: "#c2185b",
                        },
                        "& .MuiStepIcon-root.Mui-completed": {
                          color: "#c2185b",
                        },
                      }}
                    >
                      {/* {label} */}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  mt: 2,
                }}
              >
                <Grid
                  container
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    padding: "16px",
                  }}
                >
                  {/* Heading */}
                  <Grid item xs={12} textAlign="center">
                    <Typography
                      variant="h5"
                      sx={{
                        color: "#fff",
                        fontWeight: "bold",
                        mb: 1,
                        fontSize: { xs: "1.4rem", sm: "1.6rem" },
                      }}
                    >
                      Verify your phone number
                    </Typography>

                    {phone && (
                      <Typography
                        sx={{
                          color: "#c2185b",
                          fontWeight: "600",
                          mb: 3,
                          fontSize: { xs: "1rem", sm: "1.05rem" },
                        }}
                      >
                        Code sent via SMS to <br />
                        <span style={{ color: "#fff" }}>{phone}</span>
                      </Typography>
                    )}
                  </Grid>

                  {/* OTP Input */}
                  <Grid item xs={12} sx={{ textAlign: "center" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        flexWrap: "nowrap",
                        gap: { xs: 1, sm: 2 },
                        mb: 4,
                        overflowX: "auto",
                      }}
                    >
                      {formik.values.otp.map((digit, index) => (
                        <TextField
                          key={index}
                          id={`otp-${index}`}
                          value={digit}
                          onChange={(e: any) =>
                            handleOtpChange(e.target.value, index)
                          }
                          onKeyDown={(e: any) => handleKeyDown(e, index)}
                          error={Boolean(formik.errors.otp?.[index])}
                          type="tel"
                          variant="outlined"
                          inputProps={{
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                            maxLength: 1,
                            style: {
                              textAlign: "center",
                              fontSize: "1.5rem",
                              color: "#fff",
                              padding: 0,
                              height: "50px",
                            },
                          }}
                          sx={{
                            backgroundColor: "#2a2a2a",
                            width: "50px",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "8px",
                              "& fieldset": {
                                borderColor: "rgba(255,255,255,0.3)",
                              },
                              "&:hover fieldset": {
                                borderColor: "#c2185b",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#c2185b",
                                borderWidth: "2px",
                              },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Error message */}
                  {error && (
                    <Typography
                      variant="body2"
                      color="error"
                      sx={{ textAlign: "center", mb: 2 }}
                    >
                      Please input the correct verification code
                    </Typography>
                  )}

                  {/* Helper text */}
                  <Grid item xs={12} sx={{ textAlign: "center", mb: 2 }}>
                    <Typography
                      sx={{
                        color: "#aaa",
                        fontSize: "0.95rem",
                        mb: 1,
                      }}
                    >
                      Didn’t receive your code? Check your network signal.
                    </Typography>
                    <Grid item xs={12} sx={{ textAlign: "center", mt: 1 }}>
                      <Button
                        variant="text"
                        startIcon={<RefreshIcon fontSize="small" />}
                        onClick={() => {
                          toast.success("Code is resent");
                          handleVerificationPhone(phone ?? "");
                        }}
                        disabled={resendTimer > 0}
                        sx={{
                          color: resendTimer > 0 ? "#aaa" : "#e4518cff",
                          fontWeight: 500,
                          fontSize: "1rem",
                          textTransform: "none",
                          textDecoration: "underline",
                          "&:hover": {
                            textDecoration: "underline",
                            backgroundColor: "transparent",
                          },
                        }}
                      >
                        {/* {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"} */}
                        {resendTimer > 0 ? (
                          <Typography
                            sx={{
                              color: "#aaa",
                              fontSize: "0.9rem",
                              textAlign: "center",
                              mb: 1,
                            }}
                          >
                            You can resend code in {resendTimer}s
                          </Typography>
                        ) : (
                          <Typography>Resend Code</Typography>
                        )}
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
                    <Button
                      fullWidth
                      sx={{
                        backgroundColor: "#c2185b",
                        color: "#fff",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        py: 1.5,
                        borderRadius: "8px",
                        "&:hover": { backgroundColor: "#ad1457" },
                      }}
                      onClick={() => formik.handleSubmit()}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} sx={{ color: "white" }} />
                      ) : (
                        "Verify Code"
                      )}
                    </Button>
                  </Grid>

                  {/* Footer */}
                  <Grid item xs={12} sx={{ textAlign: "center", mt: 4 }}>
                    <Typography sx={{ color: "#c2185b", fontWeight: "bold" }}>
                      Come party with us
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    </>
  );
}
