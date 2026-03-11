"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Alert,
  Divider,
  Chip,
  FormHelperText,
  Snackbar,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";

const affiliatePaymentSchema = Yup.object({
  yourName: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .matches(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .required("Your name is required"),

  businessName: Yup.string().when("makePayableTo", {
    is: "business",
    then: (schema) =>
      schema
        .min(2, "Business name must be at least 2 characters")
        .required("Business name is required"),
    otherwise: (schema) => schema.notRequired(),
  }),

  makePayableTo: Yup.string()
    .oneOf(["business", "your"])
    .required("Please select who to make payment payable to"),

  email: Yup.string().email().required(),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Please enter a valid phone number (10 digits)")
    .required("Phone is required"),

  address: Yup.string().min(5).required(),
  country: Yup.string().required(),
  city: Yup.string().required(),
  state: Yup.string().required(),
  postal: Yup.string().required(),

  paymentEmail: Yup.string().email().required(),

  taxIndividual: Yup.object({
    part1: Yup.string().when("makePayableTo", {
      is: "your",
      then: (schema) => schema.required("Required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    part2: Yup.string().when("makePayableTo", {
      is: "your",
      then: (schema) => schema.required("Required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    part3: Yup.string().when("makePayableTo", {
      is: "your",
      then: (schema) => schema.required("Required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  }),

  taxBusiness: Yup.object({
    ein: Yup.string().when("makePayableTo", {
      is: "business",
      then: (schema) =>
        schema
          .matches(/^\d{9}$/, "EIN must be 9 digits")
          .required("EIN is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  }),
});

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
};

const phoneFieldSx = {
  "& .react-tel-input": {
    width: "100%",
  },

  "& .react-tel-input .form-control": {
    width: "100%",
    height: "56px",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "white",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    fontSize: "16px",
    paddingLeft: "58px",
    transition: "border-color 0.2s ease",
  },

  /* Hover (same as MUI hover) */
  "& .react-tel-input .form-control:hover": {
    borderColor: "rgba(255,255,255,0.4)",
  },

  /* Focus (same as MUI focused field) */
  "& .react-tel-input .form-control:focus": {
    outline: "none",
    borderColor: "rgba(255,255,255,0.4)",
  },

  "& .react-tel-input .flag-dropdown": {
    background: "transparent",
    border: "none",
    borderRadius: "12px 0 0 12px",
  },

  "& .react-tel-input .selected-flag": {
    background: "transparent",
  },

  "& .react-tel-input .selected-flag:hover": {
    background: "rgba(255,255,255,0.08)",
  },

  "& .react-tel-input .country-list": {
    backgroundColor: "#11111b",
    color: "white",
    borderRadius: "12px",
  },
};

const SuccessOverlay = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10, 10, 20, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            style={{
              background: "linear-gradient(135deg, #ff5fa2, #ff006e)",
              borderRadius: 24,
              padding: "40px 32px",
              textAlign: "center",
              color: "white",
              maxWidth: 420,
              width: "90%",
              boxShadow: "0 30px 80px rgba(255, 0, 110, 0.45)",
            }}
          >
            {/* Floating Heart */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: 42, marginBottom: 14 }}
            >
              💖
            </motion.div>

            {/* Title */}
            <Typography variant="h5" fontWeight={800} mb={1}>
              Payment Request Sent
            </Typography>

            {/* Main Message */}
            <Typography
              variant="body1"
              sx={{
                opacity: 0.95,
                mb: 1.5,
                lineHeight: 1.6,
              }}
            >
              Your affiliate payout request has been submitted successfully.
            </Typography>

            {/* Reassurance Message */}
            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                lineHeight: 1.6,
                mb: 3,
              }}
            >
              We’ll review your request and send updates to your
              <strong> entered email address</strong>.
              <br />
              Please keep an eye on your inbox 💌
            </Typography>

            {/* Done Button */}
            <Button
              onClick={onClose}
              variant="contained"
              sx={{
                px: 5,
                py: 1.2,
                fontWeight: 700,
                borderRadius: 99,
                textTransform: "none",
                background: "white",
                color: "#ff006e",
                minWidth: 140,
                "&:hover": {
                  background: "#ffe3ef",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.25s ease",
              }}
            >
              Got it 💕
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AffiliatePaymentProps {
  profileId: string;
  affiliateCode: string | null;
}

const formatEarningsFromApi = (val: string | number | undefined | null) => {
  if (val === undefined || val === null) return "$0.00";
  const s = typeof val === "string" ? val : String(val);
  const n = Number(s);
  if (isNaN(n)) return "$0.00";
  if (n > 1000) {
    return `$${(n / 100).toFixed(2)}`;
  } else {
    return `$${n.toFixed(2)}`;
  }
};

const parseAmount = (val: string) => {
  const n = Number(val.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
};

const AffiliatePayment = ({
  profileId,
  affiliateCode,
}: AffiliatePaymentProps) => {
  const [submitStatus, setSubmitStatus] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!affiliateCode) return;
    const fetchAffiliate = async () => {
      try {
        setLoading(true);
        setError(null);

        const getRes = await fetch("/api/user/get-affiliate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateCode: affiliateCode,
            limit: 300,
          }),
        });

        const data = await getRes.json();

        if (!getRes.ok) {
          throw new Error(data?.message || "Failed to fetch affiliate data");
        }

        setAffiliateData(data?.stats?.total_earnings);
      } catch (err: any) {
        console.error("Affiliate fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliate();
  }, [affiliateCode]);

  const formik = useFormik({
    initialValues: {
      affiliateId: affiliateCode ? affiliateCode : "-",
      minThreshold: "$50",
      businessName: "",
      yourName: "",
      makePayableTo: "your",
      email: "",
      phone: "",
      countryCode: "",
      address: "",
      country: "",
      city: "",
      state: "",
      postal: "",
      taxIndividual: {
        part1: "",
        part2: "",
        part3: "",
      },
      taxBusiness: {
        ein: "",
      },
      paymentEmail: "",
    },
    validationSchema: affiliatePaymentSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { resetForm }) => {
      try {
        setSubmitStatus("submitting");
        setIsLocked(true);

        const res = await fetch("/api/user/affiliate/request-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...values,
            profileId,
            affiliateCode,
            makePayableName: payableToName,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Request failed");
        }
        setSubmitStatus("success");
        setTimeout(() => {
          setShowSuccess(true);
          resetForm();
          setSubmitStatus("");
          setIsLocked(false);
        }, 800);
      } catch (error: any) {
        console.error("Affiliate payout error:", error);

        setSubmitStatus("error");
        setIsLocked(false);
      }
    },
  });

  const payableToName =
    formik.values.makePayableTo === "business"
      ? formik.values.businessName
      : formik.values.yourName;

  const MIN_PAYOUT = 50;

  const totalIncomeFormatted = formatEarningsFromApi(affiliateData);
  const totalIncomeNumber = parseAmount(totalIncomeFormatted);

  const hasReachedMinThreshold = totalIncomeNumber >= MIN_PAYOUT;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pb: { xs: 8, md: 0 },
      }}
    >
      <SuccessOverlay
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
      <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.1)" }} />
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            background:
              "linear-gradient(135deg, #ff5fa2 0%, #ff2f92 50%, #ff006e 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 4px 18px rgba(255, 0, 110, 0.35)",
            mb: 1,
            fontSize: { xs: "1.75rem", md: "2.125rem" },
            textAlign: "center",
          }}
        >
          Payment Information
        </Typography>

        <Typography
          variant="body1"
          sx={{
            textAlign: "center",
            color: "rgba(255, 180, 210, 0.9)",
            letterSpacing: "0.3px",
          }}
        >
          Complete your affiliate payout details
        </Typography>
      </Box>

      <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.1)" }} />

      <Paper
        sx={{
          p: 2,
          mb: 4,
          bgcolor: "rgba(219, 68, 55, 0.1)",
          border: "1px solid rgba(219, 68, 55, 0.3)",
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              Affiliate ID
            </Typography>
            <Typography variant="h6" sx={{ color: "#ff4081", fontWeight: 600 }}>
              {formik.values.affiliateId}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              Minimum Payment Threshold
            </Typography>
            <Typography variant="h6" sx={{ color: "#ff4081", fontWeight: 600 }}>
              {formik.values.minThreshold}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        sx={{
          p: 2,
          mb: 4,
          bgcolor: hasReachedMinThreshold
            ? "rgba(156, 39, 176, 0.12)"
            : "rgba(233, 30, 99, 0.12)",
          border: "1px solid",
          borderColor: hasReachedMinThreshold
            ? "rgba(156, 39, 176, 0.4)"
            : "rgba(233, 30, 99, 0.4)",
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.8)" }}
            >
              Total Earnings
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: hasReachedMinThreshold ? "#ab47bc" : "#f50057",
              }}
            >
              {totalIncomeFormatted}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            {hasReachedMinThreshold ? (
              <Alert
                severity="success"
                sx={{
                  bgcolor: "rgba(156, 39, 176, 0.15)",
                  color: "#e1bee7",
                }}
              >
                You're eligible to request a payout 💝
              </Alert>
            ) : (
              <Alert
                severity="warning"
                sx={{
                  bgcolor: "rgba(233, 30, 99, 0.15)",
                  color: "#f8bbd9",
                }}
              >
                You need{" "}
                <strong>
                  ${Math.max(MIN_PAYOUT - totalIncomeNumber, 0).toFixed(2)}
                </strong>{" "}
                more to reach the minimum payout of ${MIN_PAYOUT}
              </Alert>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ position: "relative" }}>
        {!hasReachedMinThreshold && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "start",
              justifyContent: "center",
              top: 40,
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            <Paper
              sx={{
                px: 4,
                py: 3,
                borderRadius: 3,
                bgcolor: "rgba(20,20,30,0.75)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.15)",
                textAlign: "center",
                maxWidth: 360,
              }}
            >
              <Typography variant="h6" sx={{ color: "white", fontWeight: 700 }}>
                Payout Not Available Yet
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.8)", mt: 1 }}
              >
                Your earnings haven’t reached the minimum payout threshold.
                <br />
                Earn{" "}
                <strong>
                  ${(MIN_PAYOUT - totalIncomeNumber).toFixed(2)}
                </strong>{" "}
                more to unlock the payout request.
              </Typography>
            </Paper>
          </Box>
        )}

        <Box
          sx={{
            filter: !hasReachedMinThreshold ? "blur(6px)" : "none",
            pointerEvents: !hasReachedMinThreshold ? "none" : "auto",
            opacity: !hasReachedMinThreshold ? 0.6 : 1,
            transition: "all 0.3s ease",
          }}
        >
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Make Payable To */}
              <Grid item xs={12}>
                <Typography
                  variant="body1"
                  sx={{ color: "white", mb: 1, fontWeight: 500 }}
                >
                  Make Payable To <span style={{ color: "#f44336" }}>*</span>
                </Typography>

                <RadioGroup
                  row
                  name="makePayableTo"
                  value={formik.values.makePayableTo}
                  onChange={formik.handleChange}
                  sx={{ gap: 2 }}
                >
                  {[
                    { value: "your", label: "Your Name" },
                    { value: "business", label: "Business Name" },
                  ].map((option) => {
                    const selected =
                      formik.values.makePayableTo === option.value;

                    return (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio sx={{ display: "none" }} />}
                        sx={{ m: 0 }}
                        label={
                          <Box
                            sx={{
                              minWidth: 160,
                              textAlign: "center",
                              px: 3,
                              py: 1.5,
                              borderRadius: 2,
                              cursor: "pointer",
                              fontWeight: 600,
                              color: selected ? "#ff5fa2" : "white",
                              border: "1px solid",
                              borderColor: selected
                                ? "#ff5fa2"
                                : "rgba(255,255,255,0.25)",
                              backgroundColor: selected
                                ? "rgba(255,95,162,0.12)"
                                : "transparent",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                borderColor: "#ff5fa2",
                              },
                            }}
                          >
                            {option.label}
                          </Box>
                        }
                      />
                    );
                  })}
                </RadioGroup>

                {formik.touched.makePayableTo &&
                  formik.errors.makePayableTo && (
                    <FormHelperText sx={{ color: "#f44336", mt: 0.5 }}>
                      {formik.errors.makePayableTo}
                    </FormHelperText>
                  )}
              </Grid>

              {/*Your Name & Business Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Your Name"
                  name="yourName"
                  value={formik.values.yourName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.yourName && Boolean(formik.errors.yourName)
                  }
                  helperText={formik.touched.yourName && formik.errors.yourName}
                  sx={textFieldSx}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Name"
                  name="businessName"
                  disabled={formik.values.makePayableTo !== "business"}
                  required={formik.values.makePayableTo === "business"}
                  value={formik.values.businessName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.businessName &&
                    Boolean(formik.errors.businessName)
                  }
                  helperText={
                    formik.touched.businessName && formik.errors.businessName
                  }
                  sx={{
                    ...textFieldSx,
                    opacity:
                      formik.values.makePayableTo === "business" ? 1 : 0.6,
                  }}
                />
              </Grid>

              {/* Email & Phone */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={
                    formik.touched.email && formik.errors.email
                      ? formik.errors.email
                      : "We’ll send payout confirmations and updates to this email"
                  }
                  sx={{
                    ...textFieldSx,
                    "& .MuiFormHelperText-root": {
                      color:
                        formik.touched.email && formik.errors.email
                          ? "#f44336"
                          : "rgba(255,180,210,0.85)",
                      fontSize: "0.75rem",
                      mt: 0.5,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={phoneFieldSx}>
                  <PhoneInput
                    country={"us"}
                    value={formik.values.countryCode + formik.values.phone}
                    onChange={(value, country) => {
                      const c = country as CountryData;
                      formik.setFieldValue("countryCode", `+${c.dialCode}`);
                      const numberWithoutCode = value.replace(c.dialCode, "");
                      formik.setFieldValue("phone", numberWithoutCode);
                    }}
                    onBlur={() => formik.setFieldTouched("phone", true)}
                    inputProps={{
                      name: "phone",
                      required: true,
                    }}
                    specialLabel=""
                  />

                  {formik.touched.phone && formik.errors.phone && (
                    <FormHelperText sx={{ color: "#f44336", mt: 0.5 }}>
                      {formik.errors.phone}
                    </FormHelperText>
                  )}
                </Box>
              </Grid>

              {/* Address */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Mailing Address"
                  name="address"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.address && Boolean(formik.errors.address)
                  }
                  helperText={formik.touched.address && formik.errors.address}
                  sx={textFieldSx}
                />
              </Grid>

              {/* Location Details */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  required
                  label="Country"
                  name="country"
                  value={formik.values.country}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.country && Boolean(formik.errors.country)
                  }
                  helperText={formik.touched.country && formik.errors.country}
                  sx={textFieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  required
                  label="City"
                  name="city"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.city && Boolean(formik.errors.city)}
                  helperText={formik.touched.city && formik.errors.city}
                  sx={textFieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  required
                  label="State/Province"
                  name="state"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.state && Boolean(formik.errors.state)}
                  helperText={formik.touched.state && formik.errors.state}
                  sx={textFieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  required
                  label="Postal Code"
                  name="postal"
                  placeholder="12345"
                  value={formik.values.postal}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0);
                    formik.setFieldValue("postal", value);
                  }}
                  onBlur={formik.handleBlur}
                  error={formik.touched.postal && Boolean(formik.errors.postal)}
                  helperText={formik.touched.postal && formik.errors.postal}
                  sx={textFieldSx}
                />
              </Grid>

              {/* Payment Email */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Payment Email (Payments are sent via email)"
                  name="paymentEmail"
                  type="email"
                  value={formik.values.paymentEmail}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.paymentEmail &&
                    Boolean(formik.errors.paymentEmail)
                  }
                  helperText={
                    formik.touched.paymentEmail && formik.errors.paymentEmail
                  }
                  sx={textFieldSx}
                />
              </Grid>

              {/* Tax Information Section */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "rgba(255, 193, 7, 0.05)",
                    border: "1px solid rgba(255, 193, 7, 0.2)",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: "white", fontWeight: 600 }}
                    >
                      Tax Information
                    </Typography>
                    <Chip
                      label="US Only"
                      size="small"
                      sx={{
                        bgcolor: "rgba(255, 193, 7, 0.2)",
                        color: "#ffc107",
                      }}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.6)", mb: 3 }}
                  >
                    Only required for US-based individuals or businesses
                  </Typography>

                  {/* Individual Tax ID */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "white", mb: 2 }}
                    >
                      Individual Tax ID (SSN)
                      {formik.values.makePayableTo === "your" && (
                        <span style={{ color: "#f44336" }}> *</span>
                      )}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="XXX"
                          name="taxIndividual.part1"
                          inputProps={{ maxLength: 3 }}
                          value={formik.values.taxIndividual.part1}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.taxIndividual?.part1 &&
                            Boolean(formik.errors.taxIndividual?.part1)
                          }
                          helperText={
                            formik.touched.taxIndividual?.part1 &&
                            formik.errors.taxIndividual?.part1
                          }
                          sx={textFieldSx}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="XX"
                          name="taxIndividual.part2"
                          inputProps={{ maxLength: 2 }}
                          value={formik.values.taxIndividual.part2}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.taxIndividual?.part2 &&
                            Boolean(formik.errors.taxIndividual?.part2)
                          }
                          helperText={
                            formik.touched.taxIndividual?.part2 &&
                            formik.errors.taxIndividual?.part2
                          }
                          sx={textFieldSx}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="XXXX"
                          name="taxIndividual.part3"
                          inputProps={{ maxLength: 4 }}
                          value={formik.values.taxIndividual.part3}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.taxIndividual?.part3 &&
                            Boolean(formik.errors.taxIndividual?.part3)
                          }
                          helperText={
                            formik.touched.taxIndividual?.part3 &&
                            formik.errors.taxIndividual?.part3
                          }
                          sx={textFieldSx}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Business EIN */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "white", mb: 2 }}
                    >
                      Business EIN
                      {formik.values.makePayableTo === "business" && (
                        <span style={{ color: "#f44336" }}> *</span>
                      )}
                    </Typography>
                    <TextField
                      fullWidth
                      label="XX-XXXXXXX"
                      name="taxBusiness.ein"
                      value={formik.values.taxBusiness.ein}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.taxBusiness?.ein &&
                        Boolean(formik.errors.taxBusiness?.ein)
                      }
                      helperText={
                        formik.touched.taxBusiness?.ein &&
                        formik.errors.taxBusiness?.ein
                      }
                      sx={textFieldSx}
                    />
                  </Box>

                  {/* W-9 Statement */}
                  <Alert
                    severity="info"
                    sx={{
                      bgcolor: "rgba(33, 150, 243, 0.1)",
                      color: "rgba(255,255,255,0.8)",
                      "& .MuiAlert-icon": { color: "#2196f3" },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "0.875rem", lineHeight: 1.6 }}
                    >
                      <strong>Substitute W-9:</strong> Under penalties of
                      perjury, I hereby certify that the Tax ID number shown
                      above is my/our correct taxpayer identification number and
                      that I am/we are not subject to backup withholding and
                      that I am/we are a U.S. person (including a U.S. resident
                      alien). I will inform you immediately if I become subject
                      to backup withholding.
                    </Typography>
                  </Alert>
                </Paper>
              </Grid>
            </Grid>

            {submitStatus && (
              <Box sx={{ mt: 3 }}>
                {submitStatus === "success" && (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Payment request submitted successfully!
                  </Alert>
                )}
                {submitStatus === "error" && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    An error occurred. Please try again.
                  </Alert>
                )}
              </Box>
            )}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
              <Button
                type="submit"
                size="large"
                variant="contained"
                disabled={submitStatus === "submitting" || isLocked}
                sx={{
                  py: 1,
                  px: 6,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 3,
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                  maxWidth: {
                    xs: "100%",
                    sm: 360,
                  },
                  background:
                    "linear-gradient(135deg, #ff5fa2 0%, #ff2f92 50%, #ff006e 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #ff6fb1 0%, #ff3fa0 50%, #ff1f80 100%)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                    boxShadow: "0 8px 24px rgba(255, 0, 110, 0.5)",
                  },
                  "&:disabled": {
                    background: "linear-gradient(135deg, #ffb3d1, #ff99c8)",
                    boxShadow: "none",
                    color: "rgba(255,255,255,0.8)",
                  },
                  transition: "all 0.25s ease",
                }}
              >
                {submitStatus === "submitting"
                  ? "Processing..."
                  : "Request Payout"}
              </Button>

              {!formik.isValid && formik.submitCount > 0 && (
                <Typography
                  variant="body2"
                  sx={{ color: "#ff4d8d", textAlign: "center", mt: 2 }}
                >
                  Please fix the errors above before submitting
                </Typography>
              )}
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  );
};

export default AffiliatePayment;
