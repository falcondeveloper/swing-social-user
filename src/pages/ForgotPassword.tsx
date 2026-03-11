"use client";

import React, { memo, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  FormControl,
  useTheme,
  ThemeProvider,
  useMediaQuery,
  Paper,
  RadioGroup,
  Radio,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
  FormHelperText,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import CustomDialog from "@/components/CustomDialog";

const OptionCard: React.FC<{
  value: OptionType;
  title: string;
  hint: string;
  selected: boolean;
  recommended?: boolean;
  onSelect: () => void;
  shortcut?: string;
}> = ({ value, title, hint, selected, recommended, onSelect, shortcut }) => {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      aria-pressed={selected}
      aria-label={title}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: { xs: 1.25, sm: 2 },
        p: { xs: 1.5, sm: 2 },
        minHeight: 56,
        borderRadius: { xs: 1.5, sm: 2 },
        border: "1px solid",
        borderColor: selected
          ? "rgba(255,255,255,0.6)"
          : "rgba(255,255,255,0.2)",
        background: selected
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.04)",
        cursor: "pointer",
        transition: "all .2s",
        "&:hover": { borderColor: "rgba(255,255,255,0.6)" },
      }}
    >
      {" "}
      <Radio
        checked={selected}
        value={value}
        onChange={onSelect}
        inputProps={{ "aria-label": title }}
        sx={{ color: "#fff", mt: { xs: 0.25, sm: 0 } }}
      />{" "}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {" "}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {" "}
          <Typography
            color="#fff"
            fontWeight={700}
            sx={{ fontSize: { xs: "0.95rem", sm: "1rem" } }}
          >
            {" "}
            {title}{" "}
          </Typography>{" "}
        </Box>{" "}
        <Typography
          variant="body2"
          color="#aaa"
          sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, mt: 0.25 }}
        >
          {" "}
          {hint}{" "}
        </Typography>{" "}
      </Box>{" "}
    </Box>
  );
};

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

type OptionType = "" | "resetPassword" | "loginCode";

const getValidationSchema = (forgotMode: "email" | "phone") =>
  Yup.object({
    email:
      forgotMode === "email"
        ? Yup.string()
            .trim()
            .email("Enter a valid email")
            .required("Email is required")
        : Yup.string().notRequired(),
    option:
      forgotMode === "email"
        ? Yup.string()
            .oneOf(["resetPassword", "loginCode"], "Choose an option")
            .required("Choose an option")
        : Yup.string().notRequired(),
    phone:
      forgotMode === "phone"
        ? Yup.string()
            .min(7, "Phone number is too short")
            .required("Phone is required")
        : Yup.string().notRequired(),
    countryCode:
      forgotMode === "phone"
        ? Yup.string().required("Country code is required")
        : Yup.string().notRequired(),
  });

const ForgotPassword: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");
  const handleClose = typeof onClose === "function" ? onClose : () => {};

  const [snack, setSnack] = useState({ open: false, message: "" });
  const [mode, setMode] = useState<"emailCode" | "emailLink">("emailCode");
  const [forgotMode, setForgotMode] = useState<"email" | "phone">("email");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogAction, setDialogAction] = useState<"login" | "verify" | null>(
    null,
  );

  const formik = useFormik({
    initialValues: {
      email: "",
      option: "loginCode",
      phone: "",
      countryCode: "",
    },
    validationSchema: getValidationSchema(forgotMode),
    enableReinitialize: true, // ✅ allows schema to change when mode changes
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (forgotMode === "email") {
          if (mode === "emailLink") {
            // Send reset link
            const res = await fetch("/api/user/resetPasswordEmail", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userName: values.email.trim() }),
            });

            const data = await res.json();

            if (!data?.success) {
              setSnack({
                open: true,
                message: data.message ?? "Failed to send reset link",
              });
              return;
            }

            setDialogTitle("Email Sent");
            setDialogMessage("A password reset link was sent to your inbox.");
            setDialogAction("login");
            setDialogOpen(true);
            return;
          } else if (mode === "emailCode") {
            const code = Math.floor(1000 + Math.random() * 9000);

            const res = await fetch("/api/user/resetLoginCodeEmail", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: values.email.trim(), code }),
            });

            const data = await res.json();

            if (typeof window !== "undefined") {
              sessionStorage.setItem("loginOtp", String(code));
            }

            setDialogTitle("Login Code Sent!");
            setDialogMessage("Check your email for a 4-digit code.");
            setDialogAction("verify");
            setDialogOpen(true);
            return;
          }
        } else {
          // Phone login
          const cleanedCode = values.countryCode.replace(/^\+/, "");

          const res = await fetch("/api/user/loginwithphonecode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: values.phone.trim(),
              countryCode: cleanedCode,
            }),
          });

          const data = await res.json();

          if (data.status !== 200) {
            setSnack({
              open: true,
              message: data.message ?? "Failed to send code",
            });
            return;
          }

          setDialogTitle("Login Code Sent");
          setDialogMessage("We’ve sent a 4-digit login code to your phone.");
          setDialogAction("verify");
          setDialogOpen(true);
          return;
        }
      } catch (err) {
        console.error("Submission error:", err);
        setSnack({
          open: true,
          message: "Something went wrong. Please try again.",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    isSubmitting,
  } = formik;

  const fieldSx = {
    mb: 2,
    "& .MuiOutlinedInput-root": {
      color: "white",
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: "12px",
      "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
  } as const;

  return (
    <>
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            background:
              "radial-gradient(circle at top left, #1A0B2E 0%, #000000 100%)",
            position: "relative",
            overflow: "hidden",
            p: { xs: 1, sm: 2 },
          }}
        >
          <ParticleField />
          <Container maxWidth="sm" sx={{ p: 0 }}>
            <Paper
              elevation={24}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                maxHeight: { xs: "85vh", sm: "95vh" },
                overflowY: { xs: "auto", sm: "auto" },
                scrollbarWidth: "thin",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(255,255,255,0.3)",
                  borderRadius: "3px",
                },
              }}
            >
              <Box sx={{ mb: 2, textAlign: "center" }}>
                <Box sx={{ mb: 2 }}>
                  <img
                    src="/logo.png"
                    alt="SwingSocial Logo"
                    style={{
                      width: "250px",
                      height: "auto",
                      display: "block",
                      margin: "0 auto",
                      objectFit: "cover",
                    }}
                  />
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 500,
                    background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    mt: 1,
                  }}
                >
                  Need Help Logging In?
                </Typography>
                <Typography
                  variant="body2"
                  color="#fff"
                  sx={{ mt: 0.5, fontSize: { xs: "0.85rem", sm: "1rem" } }}
                >
                  Enter your email and choose how you’d like to get back in
                </Typography>
              </Box>

              <RadioGroup
                row
                value={forgotMode}
                onChange={(e) =>
                  setForgotMode(e.target.value as "phone" | "email")
                }
                sx={{ justifyContent: "center", mb: 2 }}
              >
                <FormControlLabel
                  value="phone"
                  control={<Radio sx={{ color: "#fff" }} />}
                  label={<Typography sx={{ color: "#fff" }}>Phone</Typography>}
                />
                <FormControlLabel
                  value="email"
                  control={<Radio sx={{ color: "#fff" }} />}
                  label={<Typography sx={{ color: "#fff" }}>Email</Typography>}
                />
              </RadioGroup>

              <form onSubmit={handleSubmit}>
                {forgotMode === "phone" && (
                  <FormControl
                    fullWidth
                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                    sx={{ mb: 2 }}
                  >
                    <PhoneInput
                      country={"us"}
                      specialLabel=""
                      value={formik.values.countryCode + formik.values.phone}
                      onChange={(value, country) => {
                        const c = country as CountryData;
                        formik.setFieldValue("countryCode", `+${c.dialCode}`);
                        const numberWithoutCode = value.replace(c.dialCode, "");
                        formik.setFieldValue("phone", numberWithoutCode);
                      }}
                      onBlur={() => formik.setFieldTouched("phone", true)}
                      inputStyle={{
                        width: "100%",
                        height: "56px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        color: "white",
                        border: "none",
                      }}
                      containerStyle={{
                        width: "100%",
                        border:
                          formik.touched.phone && formik.errors.phone
                            ? "1px solid #f44336"
                            : "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "12px",
                      }}
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <FormHelperText>{formik.errors.phone}</FormHelperText>
                    )}
                  </FormControl>
                )}

                {forgotMode === "email" && (
                  <>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                      sx={fieldSx}
                      margin="normal"
                    />

                    {/* LAZY-FRIENDLY OPTIONS */}
                    <FormControl
                      fullWidth
                      sx={{ mb: { xs: 1.5, sm: 1 } }}
                      error={touched.option && Boolean(errors.option)}
                    >
                      <Typography
                        variant="subtitle2"
                        color="#fff"
                        sx={{
                          mb: { xs: 0.75, sm: 1 },
                          fontSize: { xs: "0.9rem", sm: "1rem" },
                        }}
                      >
                        Choose an option{" "}
                      </Typography>

                      <RadioGroup
                        row
                        value={mode}
                        onChange={(e) =>
                          setMode(e.target.value as "emailCode" | "emailLink")
                        }
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          gap: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <FormControlLabel
                          value="emailLink"
                          control={<Radio sx={{ display: "none" }} />}
                          label={
                            <OptionCard
                              value="resetPassword"
                              title="Email me a Password Reset Link"
                              hint="Best if you forgot your password. We’ll send a secure link."
                              selected={values.option === "resetPassword"}
                              recommended={!isMobile}
                              onSelect={() =>
                                setFieldValue("option", "resetPassword")
                              }
                              shortcut="1"
                            />
                          }
                          sx={{ m: 0 }}
                        />
                        <FormControlLabel
                          value="emailCode"
                          control={<Radio sx={{ display: "none" }} />}
                          label={
                            <OptionCard
                              value="loginCode"
                              title="Email me a 4-digit Login Code"
                              hint="Quick sign-in without changing your password. Expires soon."
                              selected={values.option === "loginCode"}
                              recommended={isMobile}
                              onSelect={() =>
                                setFieldValue("option", "loginCode")
                              }
                              shortcut="2"
                            />
                          }
                          sx={{ m: 0 }}
                        />
                      </RadioGroup>
                    </FormControl>
                  </>
                )}

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  sx={{
                    py: 1.5,
                    mb: 2,
                    my: 3,
                    position: "relative",
                    borderRadius: "12px",
                    overflow: "hidden",
                    color: "white",
                    background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "200%",
                      height: "100%",
                      background:
                        "linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)",
                      animation: "shine 2s infinite",
                    },
                    "@keyframes shine": { "100%": { left: "100%" } },
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : mode === "emailCode" ? (
                    "Send 4-digit Code"
                  ) : mode === "emailLink" ? (
                    "Send Reset Link"
                  ) : (
                    "Send"
                  )}
                </Button>

                <Link
                  href="/login"
                  style={{
                    color: "#FF2D55",
                    marginTop: 8,
                    textDecoration: "none",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  Back to Login
                </Link>
              </form>

              <Typography
                variant="caption"
                color="#fff"
                sx={{
                  display: "block",
                  mt: 2,
                  textAlign: "center",
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                }}
              >
                Tip: Check your spam folder if you don’t see our email
              </Typography>
            </Paper>
          </Container>
        </Box>

        <Snackbar
          open={snack.open}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          autoHideDuration={5000}
          onClose={handleClose}
        >
          <Alert
            severity="success"
            sx={{
              backgroundColor: "white",
              color: "#fc4c82",
              fontWeight: "bold",
              alignItems: "center",
              borderRight: "5px solid #fc4c82",
            }}
            icon={
              <Box
                component="img"
                src="/icon.png"
                alt="Logo"
                sx={{ width: 20, height: 20 }}
              />
            }
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
      <CustomDialog
        open={dialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        confirmText="CONTINUE"
        cancelText="CLOSE"
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);

          if (dialogAction === "login") {
            router.push("/login");
          }

          if (dialogAction === "verify") {
            if (forgotMode === "phone") {
              const cleanedCode = values.countryCode.replace(/^\+/, "");
              router.push(`/otp-login/${values.phone}/${cleanedCode}`);
            } else {
              router.push(
                `/verify-code?email=${encodeURIComponent(values.email.trim())}`,
              );
            }
          }
        }}
      />
    </>
  );
};

export default ForgotPassword;
