"use client";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  createTheme,
  Grid,
  Paper,
  Step,
  StepLabel,
  Stepper,
  TextField,
  ThemeProvider,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Carousel from "@/commonPage/Carousel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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

type Params = Promise<{ id: string }>;

export default function About(props: { params: Params }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const getIdFromParam = async () => {
      const params = await props.params;
      setId(params.id);
    };
    getIdFromParam();
  }, [props.params]);

  const validationSchema = Yup.object({
    tagline: Yup.string().required("Tagline is required."),

    about: Yup.string()
      .required("About me is required.")
      .min(20, "About must be at least 20 characters."),
  });

  const savedDraft = useMemo(() => {
    if (!id || typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem(`register_step5_${id}`) || "null");
  }, [id]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: savedDraft || {
      tagline: "",
      about: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsUploading(true);
      try {
        const response = await fetch("/api/user/about", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pid: id,
            aboutme: values.about,
            tagline: values.tagline,
          }),
        });

        if (!response.ok) {
          throw new Error("Avatar save failed");
        }

        await router.push(`/plan/${id}`);
      } catch (error) {
        console.error("Error submitting form:", error);
        setIsUploading(false);
      }
    },
  });

  const formikValuesStr = JSON.stringify(formik.values);
  useEffect(() => {
    if (id) {
      localStorage.setItem(`register_step5_${id}`, formikValuesStr);
    }
  }, [formikValuesStr, id]);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, #1A0B2E 0%, #000000 100%)",
          position: "relative",
          overflow: "hidden",
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <ParticleField />
        <Container
          maxWidth="sm"
          sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1.5, sm: 2 } }}
        >
          <Paper
            elevation={24}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
            }}
          >
            {/* <Stepper
              activeStep={4}
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
                  </StepLabel>
                </Step>
              ))}
            </Stepper> */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{
                  color: "#c2185b",
                  fontWeight: "bold",
                  textAlign: "center",
                  textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                  mb: { xs: 2, sm: 3 },
                }}
              >
                Tell us about your self
              </Typography>
              <form onSubmit={formik.handleSubmit}>
                {/* Tagline Instructions */}
                <Box sx={{ color: "#fff", mb: 2 }}>
                  <Typography variant="body2">
                    Enter a short tagline other users can see when swiping
                    through pics.
                  </Typography>
                  {/* <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                <li style={{ marginBottom: "5px" }}>New to the Lifestyle</li>
                <li style={{ marginBottom: "5px" }}>We love Dancing</li>
                <li>We love 3sums!</li>
              </ul> */}
                </Box>

                {/* Tagline Field */}
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  sx={{ color: "#fff", textAlign: "left" }}
                >
                  Tagline <span style={{ color: "#fff" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Enter your tagline"
                  variant="outlined"
                  name="tagline"
                  value={formik.values.tagline}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.tagline && Boolean(formik.errors.tagline)
                  }
                  helperText={
                    formik.touched.tagline &&
                    typeof formik.errors.tagline === "string"
                      ? formik.errors.tagline
                      : undefined
                  }
                  sx={{
                    mt: 1,
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: "12px",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                      "&:hover fieldset": {
                        borderColor: "rgba(255,255,255,0.4)",
                      },
                    },
                    "& .MuiFormHelperText-root": {
                      color:
                        formik.touched.about && formik.errors.about
                          ? "#f44336"
                          : "#fff",
                    },
                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                  }}
                />

                {/* About Instructions */}
                <Typography variant="body2" sx={{ color: "#fff", mb: 1 }}>
                  Enter a short description about yourself or yourselves, such
                  as
                  <em>
                    {" "}
                    "We love boating and camping on the weekends and speed
                    dating..."
                  </em>
                </Typography>

                {/* About Field */}
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  sx={{ color: "#fff", textAlign: "left" }}
                >
                  About <span style={{ color: "#fff" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Write about yourself (min 20 characters)"
                  variant="outlined"
                  name="about"
                  value={formik.values.about}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.about && Boolean(formik.errors.about)}
                  helperText={
                    formik.touched.about &&
                    typeof formik.errors.about === "string"
                      ? formik.errors.about
                      : `${formik.values.about.length}/20 characters`
                  }
                  sx={{
                    mt: 1,
                    mb: 2,

                    "& .MuiOutlinedInput-root": {
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: "12px",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                      "&:hover fieldset": {
                        borderColor: "rgba(255,255,255,0.4)",
                      },
                    },

                    "& .MuiInputLabel-root": {
                      color: "rgba(255,255,255,0.7)",
                    },

                    "& .MuiFormHelperText-root": {
                      color:
                        formik.touched.about && formik.errors.about
                          ? "#f44336"
                          : "#fff",
                    },
                  }}
                />

                {/* Continue Button */}
                <Grid
                  item
                  xs={12}
                  sx={{
                    textAlign: "center",
                    mt: 2,
                    mb: 2,
                    display: "flex",
                    justifyContent: "center",
                    gap: 0,
                  }}
                >
                  <Button
                    onClick={() => router.back()}
                    disabled={isUploading}
                    sx={{
                      width: "56px",
                      height: "56px",
                      minWidth: "56px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      color: "#fff",
                      mr: 2,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.2)",
                      },
                    }}
                  >
                    <ArrowBackIcon />
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading}
                    sx={{
                      width: 56,
                      height: 56,
                      minWidth: 56,
                      borderRadius: "50%",
                      backgroundColor: "#c2185b",
                      color: "#fff",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      "&:hover": { backgroundColor: "#ad1457" },
                    }}
                  >
                    {isUploading ? (
                      <CircularProgress size={24} sx={{ color: "#fff" }} />
                    ) : (
                      <ArrowForwardIosIcon />
                    )}
                  </Button>
                </Grid>
              </form>
            </Grid>
            <Carousel title="This is the last screen!" />
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
