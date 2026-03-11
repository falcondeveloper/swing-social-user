"use client";

import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
} from "@mui/material";
import React, { memo, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
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
  mb: 3,
  "& .MuiOutlinedInput-root": {
    color: "white",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
} as const;

const phoneRegExp = /^[0-9]{10}$/;
const zipRegExp = /^[0-9A-Za-z\s-]{4,10}$/;
const nameRegExp = /^[A-Za-z\s'-]{2,40}$/;

const validationSchema = Yup.object().shape({
  organizationType: Yup.string().required(
    "Please select your organization type.",
  ),
  companyName: Yup.string()
    .min(2, "Company name is too short.")
    .max(100, "Company name is too long.")
    .required("Company or group name is required."),
  firstName: Yup.string()
    .matches(nameRegExp, "Enter a valid first name.")
    .min(2, "First name must be at least 2 characters.")
    .required("First name is required."),
  lastName: Yup.string()
    .matches(nameRegExp, "Enter a valid last name.")
    .min(2, "Last name must be at least 2 characters.")
    .required("Last name is required."),
  email: Yup.string()
    .email("Enter a valid email address.")
    .required("Email is required."),
  mobilePhone: Yup.string()
    .transform((value) => value.replace(/\D/g, ""))
    .matches(phoneRegExp, "Enter a valid 10-digit phone number.")
    .required("Mobile phone number is required."),
  businessPhone: Yup.string()
    .transform((value) => (value ? value.replace(/\D/g, "") : value))
    .matches(phoneRegExp, "Enter a valid 10-digit business phone number.")
    .nullable(),
  address: Yup.string()
    .min(5, "Address must be at least 5 characters.")
    .required("Street address is required."),
  city: Yup.string()
    .matches(nameRegExp, "Enter a valid city name.")
    .required("City is required."),

  zip: Yup.string()
    .matches(zipRegExp, "Enter a valid ZIP or postal code.")
    .required("ZIP/Postal code is required."),
  country: Yup.string()
    .matches(nameRegExp, "Enter a valid country name.")
    .required("Country is required."),
  website: Yup.string().nullable(),
  whatsapp: Yup.string().nullable(),
  paymentMethod: Yup.string().required("Please select a payment method."),
  paypalEmail: Yup.string()
    .nullable()
    .when("paymentMethod", {
      is: (val: string) => val === "paypal",
      then: (schema) =>
        schema
          .trim()
          .email("Enter a valid PayPal email address.")
          .required("PayPal email is required."),
      otherwise: (schema) => schema.notRequired().nullable(),
    }),

  agreeToTerms: Yup.boolean().oneOf(
    [true],
    "You must agree to the terms before submitting",
  ),
});

const AffiliateProgramInfo = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 4,
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        background:
          "linear-gradient(135deg, rgba(255,95,162,0.15), rgba(255,0,110,0.12))",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff",
      }}
    >
      <Typography variant="body1" sx={{ opacity: 0.95, mb: 2, maxWidth: 720 }}>
        Earn <strong>recurring monthly income</strong> by referring new members
        to <strong>swingsocial.co</strong>.
      </Typography>

      <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.15)" }} />

      {/* How You Earn */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            💸 How You Earn
          </Typography>

          <Typography variant="body2" sx={{ mb: 0.8 }}>
            • Earn <strong>up to 50% commission</strong> on signup
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.8 }}>
            • Earn <strong>$4 every month</strong> for each active referral
          </Typography>
          <Typography variant="body2">
            • Get paid for{" "}
            <strong>as long as your referral stays active</strong>
          </Typography>
        </Grid>

        {/* Retention */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            🔁 Long-Term Earnings
          </Typography>

          <Typography variant="body2" sx={{ mb: 0.8 }}>
            Swing Social is an alternative lifestyle platform for couples and
            singles looking to spice up their love life.
          </Typography>

          <Typography variant="body2">
            ⭐ <strong>80% of users stay active</strong> with an average paid
            membership of <strong>5 years</strong>.
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.15)" }} />

      {/* Earnings Breakdown */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          💰 What You Can Earn
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>1 referral</strong> → $4/month × 5 years ={" "}
              <strong>$240</strong>
            </Typography>
            <Typography variant="body2">
              <strong>10 referrals</strong> → <strong>$2,400 total</strong>
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>100 referrals</strong> → <strong>$400/month</strong>
            </Typography>
            <Typography variant="body2">
              = <strong>$4,800/year</strong> or{" "}
              <strong>$24,000 in 5 years</strong>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

const ReferalForm = ({
  onSuccess,
}: {
  onSuccess?: (code: string | null) => void;
}) => {
  const [profileId, setProfileId] = useState<string | null>(null);

  // Custom Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogAction, setDialogAction] = useState<
    "success" | "partial" | "error" | null
  >(null);

  const showDialog = (
    title: string,
    message: string,
    action: typeof dialogAction = null,
  ) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogAction(action);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tokenDevice = localStorage.getItem("loginInfo");
      if (tokenDevice) {
        const decodeToken = jwtDecode<any>(tokenDevice);
        setProfileId(decodeToken?.profileId);
      }
    }
  }, []);

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.substring(0, 10);

    if (value.length > 6) {
      value = `(${value.substring(0, 3)}) ${value.substring(
        3,
        6,
      )}-${value.substring(6)}`;
    } else if (value.length > 3) {
      value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }

    formik.setFieldValue("mobilePhone", value);
  };

  const formik = useFormik({
    initialValues: {
      organizationType: "",
      companyName: "",
      firstName: "",
      lastName: "",
      email: "",
      mobilePhone: "",
      businessPhone: "",
      address: "",
      city: "",
      zip: "",
      country: "",
      website: "",
      whatsapp: "",
      paymentMethod: "paypal",
      paypalEmail: "",
      agreeToTerms: false,
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const payload = { ...values, profileId };

        const res = await fetch("/api/user/affiliate-apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          showDialog(
            "Submission Failed",
            data?.message || "Please try again later.",
            "error",
          );
          return;
        }

        const statusRes = await fetch("/api/user/set-affiliate-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: profileId }),
        });

        if (!statusRes.ok) {
          showDialog(
            "Application Submitted",
            "Your affiliate application was submitted successfully. However, we couldn't update your affiliate status automatically.",
            "partial",
          );
        } else {
          showDialog(
            "Welcome to the Affiliate Program!",
            "Your application was submitted successfully. You will be redirected shortly.",
            "success",
          );
        }

        resetForm();
        if (typeof onSuccess === "function") {
          onSuccess(null);
        }
      } catch (err) {
        console.error("Affiliate apply error:", err);
        showDialog("Something Went Wrong", "Please try again later.", "error");
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (formik.values.paymentMethod !== "paypal") {
      if (formik.values.paypalEmail) formik.setFieldValue("paypalEmail", "");
      if (formik.touched.paypalEmail || formik.errors.paypalEmail) {
        formik.setFieldError("paypalEmail", undefined);
        formik.setFieldTouched("paypalEmail", false, false);
      }
    } else {
    }
  }, [formik.values.paymentMethod]);

  const scrollToField = (fieldName: string) => {
    if (!fieldName) return;
    const selector = `[name="${fieldName}"]`;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      try {
        (el as HTMLElement).focus({ preventScroll: true });
      } catch {}
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      const touched: Record<string, boolean> = {};
      Object.keys(formik.initialValues).forEach((k) => {
        touched[k] = true;
      });
      formik.setTouched(touched);
      const firstInvalid = Object.keys(errors)[0];
      scrollToField(firstInvalid);
      return;
    }
    formik.handleSubmit(e);
  };

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
            width: "100%",
            minHeight: "100vh",
          }}
        >
          <Container
            maxWidth="lg"
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
              <Box sx={{ mb: 3, color: "#fff" }}>
                <Typography
                  variant="h6"
                  fontWeight="700"
                  color="#fff"
                  gutterBottom
                >
                  How the Swing Social Affiliate Program Works
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mb: 1, color: "rgba(255,255,255,0.95)" }}
                >
                  Join our affiliate program, share your unique links, and earn
                  commissions on sales generated through your referrals. Below
                  is a quick overview.
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: 3,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <Paper
                    sx={{ p: 2, flex: 1, background: "rgba(255,255,255,0.03)" }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ mb: 1, color: "#fff" }}
                    >
                      Quick Steps
                    </Typography>
                    <List dense>
                      <ListItem disableGutters>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: "#fff" }}>
                              Apply
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                              Submit this short form
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: "#fff" }}>
                              Receive Code
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                              We’ll create a unique affiliate code & landing
                              page for you.
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: "#fff" }}>
                              Share Links
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                              Promote your landing page or use banner links
                              provided.
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: "#fff" }}>Earn</Typography>
                          }
                          secondary={
                            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                              You’ll earn commission for every qualifying sale
                              tracked to your code.
                            </Typography>
                          }
                        />
                      </ListItem>
                    </List>
                  </Paper>

                  <Paper
                    sx={{ p: 2, flex: 1, background: "rgba(255,255,255,0.03)" }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ mb: 1, color: "#fff" }}
                    >
                      Payouts & Tracking
                    </Typography>
                    <List dense>
                      <ListItem disableGutters>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: "#fff" }}>
                              Tracking
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                              Sales are tracked automatically using your
                              affiliate code and cookies.
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: "#fff" }}>
                              Reporting
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                              View conversions and earnings in your Affiliate
                              Dashboard.
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: "#fff" }}>
                              Payouts
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                              Monthly payouts via PayPal or ACH after minimum
                              payout threshold.
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: "#fff" }}>
                              Support
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                              Need help? Email{" "}
                              <Link
                                href="mailto:info@swingsocial.co"
                                color="inherit"
                              >
                                info@swingsocial.co
                              </Link>
                            </Typography>
                          }
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <AffiliateProgramInfo />
                </Box>

                <Divider
                  sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }}
                />

                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ mb: 1, color: "#fff" }}
                  >
                    FAQ
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={
                          <Typography sx={{ color: "#fff" }}>
                            Do I need a website?
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                            No you can share links on social media, email, or
                            any channel.
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={
                          <Typography sx={{ color: "#fff" }}>
                            When do I get paid?
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Payouts are processed monthly once you reach the
                            minimum payout threshold.
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={
                          <Typography sx={{ color: "#fff" }}>
                            How long do cookies last?
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Cookies last for 30 days by default (check program
                            terms for current value).
                          </Typography>
                        }
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
              <Box component="form" noValidate onSubmit={handleFormSubmit}>
                <Box>
                  <Typography
                    variant="h5"
                    mb={3}
                    fontWeight="bold"
                    textAlign={"center"}
                    color="#fff"
                  >
                    Affiliate Registration Form
                  </Typography>
                  <Box
                    sx={{
                      mx: "auto",
                      borderRadius: "20px",
                      mb: 8,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: { xs: 0, sm: 0, md: 2 },
                      }}
                    >
                      <TextField
                        select
                        fullWidth
                        label="Organization Type *"
                        name="organizationType"
                        value={formik.values.organizationType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.organizationType &&
                          Boolean(formik.errors.organizationType)
                        }
                        helperText={
                          formik.touched.organizationType &&
                          formik.errors.organizationType
                        }
                        sx={fieldSx}
                      >
                        <MenuItem value="Licensed Travel Agency">
                          Licensed Travel Agency
                        </MenuItem>
                        <MenuItem value="Lifestyle Club">
                          Lifestyle Club
                        </MenuItem>
                        <MenuItem value="Event Planner">Event Planner</MenuItem>
                        <MenuItem value="Website">Website</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </TextField>

                      <TextField
                        fullWidth
                        label="Company / Group Name *"
                        name="companyName"
                        value={formik.values.companyName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.companyName &&
                          Boolean(formik.errors.companyName)
                        }
                        helperText={
                          formik.touched.companyName &&
                          formik.errors.companyName
                        }
                        sx={fieldSx}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: { xs: 0, sm: 0, md: 2 },
                      }}
                    >
                      <TextField
                        fullWidth
                        label="First Name *"
                        name="firstName"
                        value={formik.values.firstName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.firstName &&
                          Boolean(formik.errors.firstName)
                        }
                        helperText={
                          formik.touched.firstName && formik.errors.firstName
                        }
                        //
                        sx={fieldSx}
                      />
                      <TextField
                        fullWidth
                        label="Last Name *"
                        name="lastName"
                        value={formik.values.lastName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.lastName &&
                          Boolean(formik.errors.lastName)
                        }
                        helperText={
                          formik.touched.lastName && formik.errors.lastName
                        }
                        sx={fieldSx}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: { xs: 0, sm: 0, md: 2 },
                      }}
                    >
                      <TextField
                        fullWidth
                        label="Email *"
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.email && Boolean(formik.errors.email)
                        }
                        helperText={formik.touched.email && formik.errors.email}
                        sx={fieldSx}
                      />
                      <TextField
                        fullWidth
                        label="Mobile Phone *"
                        name="mobilePhone"
                        value={formik.values.mobilePhone}
                        onChange={handlePhoneChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.mobilePhone &&
                          Boolean(formik.errors.mobilePhone)
                        }
                        helperText={
                          formik.touched.mobilePhone &&
                          formik.errors.mobilePhone
                        }
                        sx={fieldSx}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      label="Street Address *"
                      name="address"
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.address && Boolean(formik.errors.address)
                      }
                      helperText={
                        formik.touched.address && formik.errors.address
                      }
                      sx={fieldSx}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: { xs: 0, sm: 0, md: 2 },
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="City *"
                          name="city"
                          value={formik.values.city}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.city && Boolean(formik.errors.city)
                          }
                          helperText={formik.touched.city && formik.errors.city}
                          sx={fieldSx}
                          fullWidth
                        />
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <TextField
                          fullWidth
                          label="Country *"
                          name="country"
                          value={formik.values.country}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.country &&
                            Boolean(formik.errors.country)
                          }
                          helperText={
                            formik.touched.country && formik.errors.country
                          }
                          sx={fieldSx}
                        />
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Zip *"
                          name="zip"
                          value={formik.values.zip}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.zip && Boolean(formik.errors.zip)
                          }
                          helperText={formik.touched.zip && formik.errors.zip}
                          sx={fieldSx}
                          fullWidth
                        />
                      </Box>
                    </Box>

                    <TextField
                      fullWidth
                      label="Website"
                      name="website"
                      value={formik.values.website}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      sx={fieldSx}
                    />

                    <TextField
                      select
                      fullWidth
                      label="Payment Method *"
                      name="paymentMethod"
                      value={formik.values.paymentMethod}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.paymentMethod &&
                        Boolean(formik.errors.paymentMethod)
                      }
                      helperText={
                        formik.touched.paymentMethod &&
                        formik.errors.paymentMethod
                      }
                      sx={fieldSx}
                    >
                      <MenuItem value="paypal">PayPal</MenuItem>
                      <MenuItem value="ach">ACH / Bank Transfer</MenuItem>
                    </TextField>

                    {formik.values.paymentMethod === "paypal" && (
                      <TextField
                        fullWidth
                        label="PayPal Email *"
                        name="paypalEmail"
                        value={formik.values.paypalEmail}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.paypalEmail &&
                          Boolean(formik.errors.paypalEmail)
                        }
                        helperText={
                          formik.touched.paypalEmail &&
                          formik.errors.paypalEmail
                        }
                        sx={fieldSx}
                      />
                    )}

                    <FormControlLabel
                      control={
                        <Checkbox
                          name="agreeToTerms"
                          checked={formik.values.agreeToTerms}
                          onChange={formik.handleChange}
                          sx={{
                            color: "#fff",
                            p: 0.5,
                            marginRight: "5px",
                            "& .MuiSvgIcon-root": { fontSize: 22 },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          I agree to the{" "}
                          <a
                            href="https://swingsocial.co/terms-and-conditions/"
                            target="_blank"
                            style={{ color: "#FF2D55" }}
                          >
                            Terms of Service
                          </a>
                        </Typography>
                      }
                      sx={{
                        mt: 0.3,
                        ml: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                      componentsProps={{
                        typography: {
                          sx: {
                            display: "flex",
                            alignItems: "center",
                          },
                        },
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      disabled={formik.isSubmitting}
                      variant="contained"
                      sx={{
                        mt: 3,
                        py: 1.4,
                        borderRadius: "30px",
                        background: "linear-gradient(90deg,#7000FF,#FF2D55)",
                        fontWeight: "bold",
                      }}
                    >
                      {formik.isSubmitting
                        ? "Submitting..."
                        : "Submit Application"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Container>
        </Box>

        <CustomDialog
          open={dialogOpen}
          title={dialogTitle}
          description={dialogMessage}
          confirmText="OK"
          cancelText="Close"
          onClose={() => setDialogOpen(false)}
          onConfirm={() => {
            setDialogOpen(false);

            if (dialogAction === "success" || dialogAction === "partial") {
              window.location.reload();
            }
          }}
        />
      </ThemeProvider>
    </>
  );
};

export default ReferalForm;
