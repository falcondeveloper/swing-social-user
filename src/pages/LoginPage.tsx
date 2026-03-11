"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  memo,
  useContext,
} from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  InputAdornment,
  ThemeProvider,
  createTheme,
  Alert,
  CircularProgress,
  useMediaQuery,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormHelperText,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import { jwtDecode } from "jwt-decode";
import { PushNotificationsContext } from "@/components/PushNotificationsProvider";
import { getToken } from "firebase/messaging";
import { DeviceTypes, isPWA, useDevice } from "@/utils/useDevice";
import CustomDialog from "@/components/CustomDialog";

const theme = createTheme({
  palette: {
    primary: { main: "#FF2D55", light: "#FF617B", dark: "#CC1439" },
    secondary: { main: "#7000FF", light: "#9B4DFF", dark: "#5200CC" },
    success: { main: "#00D179" },
    background: { default: "#0A0118" },
  },
});

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

const ParticleField = memo(() => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const particles = useMemo(() => {
    const count = isMobile ? 15 : 50;
    return Array.from({ length: count }, (_, i) => ({
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
      sx={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.6 }}
    >
      {particles.map((p) => (
        <Box
          key={p.id}
          sx={{
            position: "absolute",
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: "linear-gradient(45deg, #FF2D55, #7000FF)",
            borderRadius: "50%",
            animation: `float ${p.duration}s infinite linear`,
            animationDelay: `${p.delay}s`,
            "@keyframes float": {
              "0%": { transform: "translate(0, 0) rotate(0deg)", opacity: 0 },
              "50%": { opacity: 0.8 },
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

const RotatingCard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [rotation] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  return (
    <Box
      ref={cardRef}
      sx={{ perspective: "1000px", transformStyle: "preserve-3d" }}
    >
      <Box
        sx={{
          transition: "transform 0.1s ease-out",
          transform: `rotateX(${-rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

const getOS = () => {
  const ua = window.navigator.userAgent;
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "MacOS";
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown";
};

const trackHit = async ({
  aff,
  refer,
}: {
  aff: string | null;
  refer: string | null;
}) => {
  if (!aff && !refer) return null;
  try {
    const ipData = await fetch("https://ipapi.co/json").then((r) => r.json());
    const payload = {
      affiliate: aff,
      referral: refer,
      OS: getOS(),
      page: "Login",
      url: window.location.href,
      userid: null,
      ip: ipData?.ip,
      city: ipData?.city,
      region: ipData?.region,
      country_name: ipData?.country_name,
    };
    const res = await fetch("/api/user/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data?.data?.HitId ?? null;
  } catch {
    return null;
  }
};

const LoginPage = () => {
  const device = useDevice();
  const router = useRouter();
  const messaging = useContext(PushNotificationsContext);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">(
    "password",
  );
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: "",
    description: "",
    onConfirm: undefined as (() => void) | undefined,
  });

  useEffect(() => {
    const id = localStorage.getItem("logged_in_profile");
    const urlParams = new URLSearchParams(window.location.search);
    const aff = urlParams.get("aff");
    const refer = urlParams.get("refer");
    const tokenfrom = urlParams.get("token");
    if (tokenfrom) {
      const decodeToken = jwtDecode<any>(tokenfrom);
      localStorage.setItem("loginInfo", tokenfrom);
      localStorage.setItem("logged_in_profile", decodeToken.profileId);
      localStorage.setItem("profileUsername", decodeToken.profileName);
      localStorage.setItem("memberalarm", decodeToken.memberAlarm);
      localStorage.setItem("memberShip", decodeToken.membership);
      router.push("/home");
    }
    (async () => {
      try {
        const ipData = await fetch("https://ipapi.co/json").then((r) =>
          r.json(),
        );
        await fetch("/api/user/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliate: aff,
            referral: refer,
            OS: getOS(),
            page: "Login",
            url: window.location.href,
            userid: id || null,
            ip: ipData?.ip,
            city: ipData?.city,
            region: ipData?.region,
            country_name: ipData?.country_name,
          }),
        });
      } catch {}
    })();
  }, []);

  const ZW_CHARS = /[\u200B-\u200D\uFEFF]/g;

  const normalize = (v?: string) =>
    (v ?? "").normalize("NFKC").replace(ZW_CHARS, "").trim();

  const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
  const isUsername = (v: string) => /^[a-zA-Z0-9._-]{3,30}$/.test(v);

  const validationSchema = useMemo(
    () =>
      Yup.object({
        email:
          loginMethod === "password"
            ? Yup.string()
                .transform((val) => normalize(val))
                .required("Email, phone or username is required")
            : mode === "email"
              ? Yup.string()
                  .transform((val) => normalize(val))
                  .required("Email is required")
                  .email("Enter a valid email")
              : Yup.string().when("phone", {
                  is: (val: string) => !val || val.trim() === "",
                  then: () => Yup.string().required("Phone number is required"),
                }),
        phone:
          loginMethod === "otp" && mode === "phone"
            ? Yup.string()
                .required("Phone number is required")
                .min(6, "Phone number too short")
            : Yup.string().notRequired(),
        password:
          loginMethod === "password"
            ? Yup.string().required("Please enter a password")
            : Yup.string().notRequired(),
      }),
    [loginMethod, mode],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ref = document.referrer;
    }
  }, []);

  const initFCMAndSaveToken = async (profileId: string) => {
    if (!messaging) {
      console.error("Messaging not initialized");
      return;
    }

    try {
      if (device === DeviceTypes.IOS && !isPWA()) {
        throw new Error(
          'On iPhone, please install the app using "Add to Home Screen"',
        );
      }

      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Notifications permission denied");
        }
      }

      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Workers not supported");
      }

      let registration = await navigator.serviceWorker.getRegistration("/");

      if (!registration) {
        registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" },
        );
      }

      await navigator.serviceWorker.ready;

      const firebaseToken = await getToken(messaging, {
        vapidKey:
          "BIDy2RbO49rCl4PiCwOEjNbG-iewNN5s19EohjSo5CeGiiMJsS-isosbF2J0Rb7FiSv_3yhJageGnXP5f6N6nag",
        serviceWorkerRegistration: registration,
      });

      if (!firebaseToken) {
        throw new Error("Failed to get FCM token");
      }

      if (!firebaseToken || typeof firebaseToken !== "string") {
        throw new Error("Invalid FCM token received");
      }

      await fetch("/api/user/notification-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          token: firebaseToken,
        }),
      });
    } catch (error) {
      console.error("FCM init error:", error);
    }
  };

  const formik = useFormik({
    initialValues: { email: "", countryCode: "", phone: "", password: "" },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const aff = urlParams.get("aff");
      const refer = urlParams.get("refer");
      const hitId = await trackHit({ aff, refer });

      try {
        if (loginMethod === "password") {
          // 🔑 Password login
          const res = await fetch("/api/user/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: values.email.trim(),
              pwd: values.password.trim(),
              hitid: hitId,
            }),
          });
          const data = await res.json();

          await new Promise((r) => setTimeout(r, 800));
          setSnack({ open: true, message: data.message ?? "Welcome!" });

          if (data.status === 404 || data.status === 500) return;

          if (data.currentuserName === "Webnew") {
            return router.push(`/screenname/${data.currentProfileId}`);
          }

          localStorage.setItem("loginInfo", data.jwtToken);
          localStorage.setItem("logged_in_profile", data.currentProfileId);
          localStorage.setItem("profileUsername", data.currentuserName);
          localStorage.setItem("memberalarm", data.memberAlarm);
          localStorage.setItem("memberShip", data.memberShip);
          await initFCMAndSaveToken(data.currentProfileId);
          router.push("/home");
        } else if (mode === "email") {
          const code = Math.floor(1000 + Math.random() * 9000);
          const res = await fetch("/api/user/resetLoginCodeEmail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: values.email.trim(),
              code,
              hitid: hitId,
            }),
          });
          const data = await res.json();
          if (data?.success === "false" || data?.success === false) {
            setSnack({
              open: true,
              message: data.message ?? "Error sending code",
            });
            return;
          } else {
            setDialogConfig({
              title: "Login Code Sent!",
              description:
                "We’ve emailed you a 4-digit login code. Enter this to continue.",
              onConfirm: () => {
                sessionStorage.setItem("loginOtp", String(code));
                router.push(
                  `/verify-code?email=${encodeURIComponent(values.email.trim())}`,
                );
                setLoginMethod("password");
                setDialogOpen(false);
              },
            });

            setDialogOpen(true);
            return;
          }
        } else if (mode === "phone") {
          // 🔑 Phone login (OTP)
          const cleanedCode = values.countryCode.replace(/^\+/, "");
          const res = await fetch("/api/user/loginwithphonecode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: values.phone.trim(),
              countryCode: cleanedCode,
              hitid: hitId,
            }),
          });
          const data = await res.json();

          if (data.status === 200) {
            setDialogConfig({
              title: "Login Code Sent!",
              description:
                "We’ve sent a 4-digit login code to your phone. Enter this to continue.",
              onConfirm: () => {
                router.push(`/otp-login/${values.phone}/${cleanedCode}`);
                setDialogOpen(false);
              },
            });

            setDialogOpen(true);
            return;
          } else {
            console.error(data.message);

            setSnack({
              open: true,
              message: data.message ?? "Error sending code",
            });
            return;
          }
        }
      } catch (e) {
        setSnack({
          open: true,
          message: "Something went wrong. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  const handleClose = (
    _: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") return;
    setSnack((s) => ({ ...s, open: false }));
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background:
            "radial-gradient(circle at top left, #1A0B2E 0%, #000000 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <ParticleField />
        <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
          <RotatingCard>
            <Paper
              elevation={24}
              sx={{
                p: { xs: 2, sm: 2, md: 4 },
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Box sx={{ mb: 4, textAlign: "center" }}>
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
                    Welcome Back! Sign in to Continue
                  </Typography>
                </Box>
              </Box>
              <Box component="form" noValidate onSubmit={formik.handleSubmit}>
                {loginMethod === "password" ? (
                  <TextField
                    fullWidth
                    label="Username or Email or Phone"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    sx={fieldSx}
                    autoComplete="new-email"
                  />
                ) : (
                  <>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: "#fff",
                        textAlign: "center",
                        mb: 1,
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                        fontWeight: 500,
                      }}
                    >
                      Send login code to:
                    </Typography>
                    <RadioGroup
                      row
                      value={mode}
                      onChange={(e) =>
                        setMode(e.target.value as "email" | "phone")
                      }
                      sx={{ justifyContent: "center", mb: 2 }}
                    >
                      <FormControlLabel
                        value="phone"
                        control={<Radio sx={{ color: "#fff" }} />}
                        label={
                          <Typography sx={{ color: "#fff" }}>Phone</Typography>
                        }
                      />
                      <FormControlLabel
                        value="email"
                        control={<Radio sx={{ color: "#fff" }} />}
                        label={
                          <Typography sx={{ color: "#fff" }}>Email</Typography>
                        }
                      />
                    </RadioGroup>

                    {/* 📱 Phone field */}
                    {mode === "phone" && (
                      <FormControl
                        fullWidth
                        error={
                          formik.touched.phone && Boolean(formik.errors.phone)
                        }
                        sx={{ mb: 2 }}
                      >
                        <PhoneInput
                          country={"us"}
                          specialLabel=""
                          enableSearch={true}
                          searchPlaceholder="Search country..."
                          searchClass="country-search-input"
                          dropdownClass="country-dropdown"
                          value={
                            formik.values.countryCode + formik.values.phone
                          }
                          onChange={(value, country) => {
                            const c = country as CountryData;
                            formik.setFieldValue(
                              "countryCode",
                              `+${c.dialCode}`,
                            );
                            const numberWithoutCode = value.replace(
                              c.dialCode,
                              "",
                            );
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

                    {/* 📧 Email field */}
                    {mode === "email" && (
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.email && Boolean(formik.errors.email)
                        }
                        helperText={formik.touched.email && formik.errors.email}
                        sx={fieldSx}
                        autoComplete="new-email"
                      />
                    )}
                  </>
                )}
                {loginMethod === "password" && (
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.password && Boolean(formik.errors.password)
                    }
                    helperText={
                      formik.touched.password && formik.errors.password
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((s) => !s)}
                            edge="end"
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />
                )}
                <Button
                  fullWidth
                  type="submit"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    position: "relative",
                    overflow: "hidden",
                    color: "white",
                    borderRadius: "12px",
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
                  {" "}
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : loginMethod === "password" ? (
                    "SIGN IN"
                  ) : mode === "email" ? (
                    "Send Email Code"
                  ) : (
                    "Send Phone Code"
                  )}{" "}
                </Button>
                <Typography
                  onClick={() => router.push("/forgot-password")}
                  sx={{
                    textAlign: "end",
                    cursor: "pointer",
                    color: "#FF2D55",
                    marginBottom: "15px",
                    marginTop: "2px",
                  }}
                >
                  {" "}
                  <Link href="forgot-password">Lost your password?</Link>{" "}
                </Typography>{" "}
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {" "}
                  <Box
                    sx={{ flexGrow: 1, bgcolor: "rgba(255,255,255,0.2)" }}
                  />{" "}
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.9rem",
                      px: 2,
                      mb: 2,
                    }}
                  >
                    {" "}
                    OR{" "}
                  </Typography>{" "}
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: 1,
                      bgcolor: "rgba(255,255,255,0.2)",
                    }}
                  />{" "}
                </Box>{" "}
                {loginMethod === "password" ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setLoginMethod("otp")}
                    sx={{
                      py: 0.8,
                      mb: 1,
                      borderRadius: "12px",
                      fontWeight: 500,
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      color: "#fff",
                      bgcolor: "#c51162",
                      borderColor: "rgba(255,255,255,0.4)",
                      textTransform: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      "&:hover": {
                        borderColor: "#FF2D55",
                        bgcolor: "#c51162",
                      },
                    }}
                  >
                    <Typography component="div" sx={{ fontWeight: 600 }}>
                      Login with Email or Phone Code
                    </Typography>
                    <Typography
                      component="div"
                      sx={{ fontSize: "0.8rem", opacity: 0.8 }}
                    >
                      (no password needed)
                    </Typography>
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setLoginMethod("password")}
                    sx={{
                      py: 0.8,
                      mb: 1,
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      color: "#fff",
                      bgcolor: "#c51162",
                      borderColor: "rgba(255,255,255,0.4)",
                      textTransform: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      "&:hover": {
                        borderColor: "#FF2D55",
                        bgcolor: "#c51162",
                      },
                    }}
                  >
                    Login with Password
                  </Button>
                )}
                <Typography
                  sx={{
                    mt: 3,
                    textAlign: "center",
                    color: "rgba(255,255,255,0.7)",
                    "& a": {
                      color: "primary.main",
                      textDecoration: "none",
                      position: "relative",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        width: "100%",
                        height: "2px",
                        bottom: -2,
                        left: 0,
                        background: "linear-gradient(45deg, #FF2D55, #7000FF)",
                        transform: "scaleX(0)",
                        transition: "transform 0.3s ease",
                        transformOrigin: "right",
                      },
                      "&:hover::after": {
                        transform: "scaleX(1)",
                        transformOrigin: "left",
                      },
                    },
                  }}
                >
                  {" "}
                  New to Swing Social?{" "}
                  <Link href="/register">Create an account</Link>{" "}
                </Typography>{" "}
              </Box>{" "}
            </Paper>{" "}
          </RotatingCard>{" "}
        </Container>{" "}
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

      <CustomDialog
        open={dialogOpen}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmText="OK"
        cancelText="Cancel"
        onClose={() => setDialogOpen(false)}
        onConfirm={dialogConfig.onConfirm}
      />
    </ThemeProvider>
  );
};

export default LoginPage;
