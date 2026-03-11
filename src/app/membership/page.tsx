"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  TextField,
  Grid,
  Button,
  Box,
  ThemeProvider,
  createTheme,
  Alert,
  CircularProgress,
  InputAdornment,
  Fade,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Collapse,
  Chip,
  useMediaQuery,
} from "@mui/material";
import {
  CreditCard,
  Calendar,
  Lock,
  ArrowLeft,
  ArrowRight,
  User,
  MapPin,
  Phone,
  Tag,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import CheckCircle from "@mui/icons-material/CheckCircle";
import CustomDialog from "@/components/CustomDialog";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#FF1B6B",
      dark: "#c2185b",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#ffffff",
      secondary: "#aaaaaa",
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(30, 30, 30, 0.8)",
            borderRadius: "12px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.12)",
              borderWidth: "1px",
            },
            "&:hover": {
              backgroundColor: "rgba(30, 30, 30, 1)",
              "& fieldset": {
                borderColor: "rgba(255, 27, 107, 0.5)",
              },
            },
            "&.Mui-focused": {
              backgroundColor: "rgba(30, 30, 30, 1)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 20px rgba(255, 27, 107, 0.15)",
              "& fieldset": {
                borderColor: "#FF1B6B",
                borderWidth: "2px",
              },
            },
            "&.Mui-error fieldset": {
              borderColor: "#f44336",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#aaaaaa",
            fontSize: "14px",
            "&.Mui-focused": {
              color: "#FF1B6B",
              transform: "translate(14px, -9px) scale(0.75)",
            },
            "&.Mui-error": {
              color: "#f44336",
            },
          },
          "& .MuiOutlinedInput-input": {
            color: "#ffffff",
            fontSize: "15px",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 600,
          fontSize: "15px",
          padding: "12px 24px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        contained: {
          background: "linear-gradient(135deg, #FF1B6B 0%, #c2185b 100%)",
          boxShadow: "0 4px 15px rgba(255, 27, 107, 0.25)",
          "&:hover": {
            background: "linear-gradient(135deg, #c2185b 0%, #d81160 100%)",
            transform: "translateY(-2px)",
            boxShadow: "0 8px 25px rgba(255, 27, 107, 0.35)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&:disabled": {
            background: "rgba(255, 255, 255, 0.12)",
            color: "rgba(255, 255, 255, 0.3)",
            boxShadow: "none",
          },
        },
        outlined: {
          borderColor: "rgba(255, 27, 107, 0.5)",
          color: "#FF1B6B",
          "&:hover": {
            borderColor: "#c2185b",
            backgroundColor: "rgba(255, 27, 107, 0.08)",
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "rgba(30, 30, 30, 0.8)",
          backdropFilter: "blur(20px)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
  },
});

interface FormData {
  firstName: string;
  lastName: string;
  streetAddress: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  phoneNumber: string;
  membershipOption: string;
  cardNumber: string;
  expDate: string;
  cvv: string;
  promoCode: string;
}

const steps = ["Plan", "Details", "Payment"];

const membershipPlans = [
  {
    id: "Monthly - $17.95",
    name: "Monthly",
    price: "$17.95",
    period: "/month",
    savings: null,
    popular: false,
    features: ["Unlimited swipes", "Premium filters", "Message priority"],
  },
  {
    id: "Quarterly - $39.95",
    name: "Quarterly",
    price: "$39.95",
    period: "/3 months",
    savings: "25%",
    popular: false,
    features: ["Everything in Monthly", "3 months commitment", "Save $14"],
  },
  {
    id: "BiAnnually - $69.95",
    name: "Bi-Annual",
    price: "$69.95",
    period: "/6 months",
    savings: "35%",
    popular: true,
    features: ["Everything in Quarterly", "6 months commitment", "Save $38"],
  },
  {
    id: "Annually - $129.95",
    name: "Annual",
    price: "$129.95",
    period: "/year",
    savings: "40%",
    popular: false,
    features: ["Everything in Bi-Annual", "12 months commitment", "Save $86"],
  },
];

const BillingUpgrade: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    streetAddress: "",
    country: "",
    state: "",
    city: "",
    zipCode: "",
    phoneNumber: "",
    membershipOption: "",
    cardNumber: "",
    expDate: "",
    cvv: "",
    promoCode: "",
  });

  const [profileId, setProfileId] = useState<string>("");
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoCodeMessage, setPromocodeMessage] = useState<string>("");
  const [promoCodeList, setPromoCodeList] = useState<any[]>([]);
  const [userName, setUsername] = useState<string>("");
  const [membership, setMembership] = useState(0);
  const [advertiser, setAdvertiser] = useState<any>({});
  const [state, setState] = useState<string>("");
  const [firstMonthFree, setFirstMonthFree] = useState(false);
  const [isValidPromoCode, setIsValidPromoCode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogAction, setDialogAction] = useState<"success" | "error" | null>(
    null,
  );

  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatCardNumber = useCallback((value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  }, []);

  const formatExpiryDate = useCallback((value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  }, []);

  const validateCardNumber = useCallback((cardNumber: string) => {
    const num = cardNumber.replace(/\s/g, "");
    if (!/^\d+$/.test(num)) return false;
    if (num.length < 13 || num.length > 19) return false;

    let sum = 0;
    let isEven = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num.charAt(i));
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }, []);

  const handleGetAllPromoCodes = async () => {
    try {
      const response = await fetch("/api/user/promocode/check");
      if (!response.ok) throw new Error("Failed to fetch promo codes");

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      setPromoCodeList(result.promocodes || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    handleGetAllPromoCodes();
    const userid = localStorage.getItem("logged_in_profile");
    if (userid) {
      setProfileId(userid);

      const getState = async () => {
        try {
          const response = await fetch(`/api/user/state?userid=${userid}`);
          if (!response.ok) return;

          const { user: advertiserData } = await response.json();
          const [city, state] = advertiserData.Location.split(", ");
          setState(state);

          const result = await fetch("/api/user/promostate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: state }),
          });
          const data = await result.json();
          setFirstMonthFree(data.result === 1);
        } catch (error) {
          console.error("Error fetching state data:", error);
        }
      };

      getState();
    }

    const token = localStorage.getItem("loginInfo");
    if (token) {
      try {
        const decodeToken = jwtDecode<any>(token);
        setMembership(decodeToken?.membership || 0);
      } catch (error) {
        console.error("Invalid token:", error);
      }
    }

    setUsername(localStorage.getItem("profileUsername") || "");

    const getData = async () => {
      try {
        const response = await fetch(`/api/user/sweeping/user?id=${userid}`);
        if (!response.ok) return;

        const { user: advertiserData } = await response.json();
        setAdvertiser(advertiserData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (userid) getData();
  }, [mounted]);

  const handleChangePromoCode = (promoCodeText: string) => {
    setPromoCode(promoCodeText);
    setFormData((prev) => ({ ...prev, promoCode: promoCodeText }));

    if (promoCodeText) {
      const filter = promoCodeList.find(
        (val) => val?.PromoCodeText === promoCodeText,
      );
      if (filter) {
        setPromocodeMessage(filter.DisplayMessage);
        setIsValidPromoCode(true);
      } else {
        setPromocodeMessage("Invalid promo code");
        setIsValidPromoCode(false);
      }
    } else {
      setPromocodeMessage("");
      setIsValidPromoCode(true);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    let processedValue = value;

    if (name === "cardNumber") {
      processedValue = formatCardNumber(value);
    } else if (name === "expDate") {
      processedValue = formatExpiryDate(value);
    } else if (name === "cvv") {
      processedValue = value.replace(/[^0-9]/g, "").substring(0, 4);
    } else if (name === "phoneNumber") {
      processedValue = value.replace(/[^0-9+\-\s()]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (formError) setFormError("");
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ""); // only digits
    let formatted = input;

    // Auto format as MM/YY
    if (input.length >= 3) {
      formatted = `${input.substring(0, 2)}/${input.substring(2, 4)}`;
    }

    // Update formData
    setFormData((prev) => ({
      ...prev,
      expDate: formatted,
    }));

    // Validate format
    if (!/^\d{2}\/\d{2}$/.test(formatted)) {
      setFormError("Invalid expiry date. Use MM/YY format.");
      return;
    }

    // Validate month and expiry
    const [month, year] = formatted.split("/").map((num) => parseInt(num, 10));
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // last 2 digits
    const currentMonth = now.getMonth() + 1;

    if (month < 1 || month > 12) {
      setFormError("Invalid month. Use 01–12.");
    } else if (
      year < currentYear ||
      (year === currentYear && month < currentMonth)
    ) {
      setFormError("Card expired.");
    } else {
      setFormError(""); // valid
    }
  };

  const validateStep = (step: number) => {
    const tempErrors: Partial<FormData> = {};

    if (step === 0) {
      if (!formData.membershipOption) {
        setFormError("Please select a membership plan");
        return false;
      }
    } else if (step === 1) {
      if (!formData.firstName.trim()) tempErrors.firstName = "Required";
      if (!formData.lastName.trim()) tempErrors.lastName = "Required";
      if (!formData.streetAddress.trim()) tempErrors.streetAddress = "Required";
      if (!formData.country.trim()) tempErrors.country = "Required";
      if (!formData.state.trim()) tempErrors.state = "Required";
      if (!formData.city.trim()) tempErrors.city = "Required";
      if (!formData.zipCode.trim()) tempErrors.zipCode = "Required";
      if (!formData.phoneNumber.trim()) tempErrors.phoneNumber = "Required";
    } else if (step === 2) {
      if (!formData.cardNumber.trim()) {
        tempErrors.cardNumber = "Required";
      } else if (!validateCardNumber(formData.cardNumber)) {
        tempErrors.cardNumber = "Invalid card number";
      }

      if (!formData.expDate.trim()) {
        tempErrors.expDate = "Required";
      } else if (!/^\d{2}\/\d{2}$/.test(formData.expDate)) {
        tempErrors.expDate = "Use MM/YY format";
      } else {
        const [month, year] = formData.expDate
          .split("/")
          .map((num) => parseInt(num));
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;

        if (
          year < currentYear ||
          (year === currentYear && month < currentMonth)
        ) {
          tempErrors.expDate = "Card expired";
        }
      }

      if (!formData.cvv.trim()) {
        tempErrors.cvv = "Required";
      } else if (!/^\d{3,4}$/.test(formData.cvv)) {
        tempErrors.cvv = "3-4 digits";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
      setFormError("");
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setFormError("");
  };

  const handleUpdateAffiliate = async (userid: string) => {
    try {
      const response = await fetch("/api/user/upgrade-anytime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: userid,
        }),
      });

      const data = await response.json();
    } catch (error) {
      console.error("Error updating affiliate:", error);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    if (!isValidPromoCode && promoCode) {
      setFormError("Please enter a valid promo code or leave it empty.");
      return;
    }

    setLoading(true);

    try {
      const match = formData.membershipOption.match(
        /^([\w\s-]+) - \$([\d.]+)$/,
      );
      let unit = match?.[1];
      let length = "1";
      let planName = "";
      let pprice = "17.95";

      switch (unit) {
        case "Monthly":
          length = "1";
          planName = "Premium Monthly";
          pprice = "17.95";
          break;
        case "Quarterly":
          length = "3";
          planName = "Premium Quarterly";
          pprice = "39.95";
          break;
        case "BiAnnually":
        case "Bi-Annual":
          length = "6";
          planName = "BiAnnually";
          pprice = "69.95";
          break;
        case "Annual":
        case "Annually":
          length = "12";
          planName = "Annually";
          pprice = "129.95";
          break;
      }

      if (promoCode !== "") {
        pprice = "1";
      }

      const paymentPayload = {
        price: pprice,
        pprice: pprice,
        length: length,
        cardNumber: formData.cardNumber,
        expiry: formData.expDate,
        cvc: formData.cvv,
        firstName: formData.firstName,
        lastName: formData.lastName,
        plan: planName,
        isPromoCode: isValidPromoCode,
        country: formData.country,
        city: formData.city,
        state: formData.state,
        streetAddress: formData.streetAddress,
        phone: formData.phoneNumber,
        zipCode: formData.zipCode,
        promocode: promoCode,
        email: advertiser.Email,
        username: advertiser?.Username,
        firstMonthFree: firstMonthFree,
        userid: profileId,
      };

      const response = await fetch("/api/user/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      });

      const data = await response.json();

      if (data.success) {
        if (promoCode !== "") {
          await handleSubmitPromoCode();
        }

        await handleUpdateMembershipStatus(profileId, pprice);
        await handleUpdateAffiliate(profileId);

        setDialogTitle("Payment Successful! 🎉");
        setDialogMessage(data.message);
        setDialogAction("success");
        setDialogOpen(true);
      } else {
        setFormError(data.message || "Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("🚨 Payment submission error:", error);
      setFormError(
        "We're experiencing technical difficulties. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPromoCode = async () => {
    try {
      await fetch("/api/user/promocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: profileId, promocode: promoCode }),
      });
    } catch (error) {
      console.error("Error submitting promo code:", error);
    }
  };

  const handleUpdateMembershipStatus = async (
    userid: string,
    pprice: string,
  ) => {
    try {
      const response = await fetch("/api/user/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: userid,
          price: pprice,
          username: advertiser?.Username,
          avatar: advertiser?.Avatar,
        }),
      });

      const data = await response.json();

      if (data.success && data.updatedToken) {
        localStorage.setItem("loginInfo", data.updatedToken);
        localStorage.setItem("memberShip", "1");
        setMembership(1);
      } else {
        console.error("Membership update failed:", data.error || data.message);
      }
    } catch (error) {
      console.error("Error updating membership:", error);
    }
  };

  if (!mounted) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "#121212",
        }}
      >
        <CircularProgress sx={{ color: "#FF1B6B" }} />
      </Box>
    );
  }

  if (membership === 1) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            bgcolor: "#121212",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            py: 2,
          }}
        >
          <Container maxWidth="sm">
            <Button
              onClick={() => router.back()}
              startIcon={<ArrowLeft />}
              sx={{
                mb: 3,
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": { color: "#fff" },
              }}
            >
              Back
            </Button>

            <Card sx={{ textAlign: "center", p: 4 }}>
              <Box sx={{ mb: 3 }}>
                <CheckCircle
                  fontSize="large"
                  sx={{
                    color: "#4caf50",
                  }}
                />
              </Box>
              <Typography
                variant="h4"
                gutterBottom
                sx={{ color: "#FF1B6B", fontWeight: "bold" }}
              >
                Premium Active
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: "#aaaaaa" }}>
                You're already a Premium member! To make changes to your
                subscription, please contact our support team.
              </Typography>
              <Button
                component="a"
                href="mailto:info@swingsocial.co"
                variant="contained"
                size="large"
              >
                Contact Support
              </Button>
            </Card>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          bgcolor: "#121212",
          minHeight: "100vh",
          py: isMobile ? 2 : 4,
        }}
      >
        <Container maxWidth="sm">
          <Button
            onClick={() => router.back()}
            startIcon={<ArrowLeft />}
            sx={{
              mb: 3,
              color: "rgba(255, 255, 255, 0.7)",
              "&:hover": {
                color: "#fff",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            Back
          </Button>

          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                background: "linear-gradient(135deg, #FF1B6B, #FF758C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "bold",
              }}
            >
              Upgrade to Premium
            </Typography>
            <Typography variant="body1" sx={{ color: "#aaaaaa", mb: 3 }}>
              Welcome back, {userName}! Choose your perfect plan.
            </Typography>

            {/* Progress Stepper */}
            <Stepper
              activeStep={activeStep}
              alternativeLabel={!isMobile}
              orientation={isMobile ? "vertical" : "horizontal"}
              sx={{
                "& .MuiStepLabel-root .Mui-completed": { color: "#FF1B6B" },
                "& .MuiStepLabel-root .Mui-active": { color: "#FF1B6B" },
                "& .MuiStepLabel-label": { color: "#aaaaaa", fontSize: "12px" },
                mb: 3,
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Error Alert */}
          <Collapse in={Boolean(formError)}>
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: "rgba(244, 67, 54, 0.1)",
                border: "1px solid rgba(244, 67, 54, 0.2)",
                color: "#f44336",
              }}
              onClose={() => setFormError("")}
            >
              {formError}
            </Alert>
          </Collapse>

          <Card>
            <CardContent sx={{ p: isMobile ? 3 : 4 }}>
              {/* Step 0: Plan Selection */}
              {activeStep === 0 && (
                <Fade in={activeStep === 0}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ mb: 3, color: "#fff", textAlign: "center" }}
                    >
                      Choose Your Plan
                    </Typography>

                    <Grid container spacing={2}>
                      {membershipPlans.map((plan) => (
                        <Grid item xs={12} sm={6} key={plan.id}>
                          <Card
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                membershipOption: plan.id,
                              }))
                            }
                            sx={{
                              cursor: "pointer",
                              position: "relative",
                              minHeight: { xs: 220, sm: 240 },
                              borderRadius: 3,
                              overflow: "visible",
                              border:
                                formData.membershipOption === plan.id
                                  ? "2px solid #FF1B6B"
                                  : "2px solid rgba(255,255,255,0.02)",
                              transform:
                                formData.membershipOption === plan.id
                                  ? "translateY(-6px) scale(1.02)"
                                  : "none",
                              transition: "all 240ms cubic-bezier(.2,.8,.2,1)",
                              // background:
                              //   "linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.35))",
                              // boxShadow:
                              //   formData.membershipOption === plan.id
                              //     ? "0 12px 30px rgba(255,27,107,0.14)"
                              //     : "inset 0 1px 0 rgba(255,255,255,0.02), 0 6px 18px rgba(0,0,0,0.6)",
                              "&:hover": {
                                transform: "translateY(-6px) scale(1.01)",
                                boxShadow:
                                  "0 14px 36px rgba(255,27,107,0.12), inset 0 1px 0 rgba(255,255,255,0.02)",
                              },
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setFormData((prev) => ({
                                  ...prev,
                                  membershipOption: plan.id,
                                }));
                              }
                            }}
                          >
                            {/* Popular badge (same placement / functionality) */}
                            {plan.popular && (
                              <Chip
                                label="Most Popular"
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: -10,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  bgcolor: "#FF1B6B",
                                  color: "#fff",
                                  fontWeight: 700,
                                  px: 1.2,
                                  py: 0.4,
                                  borderRadius: 2,
                                  boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                                }}
                              />
                            )}

                            <CardContent
                              sx={{ textAlign: "center", p: { xs: 2, sm: 3 } }}
                            >
                              {/* Plan name */}
                              <Typography
                                variant="h6"
                                sx={{
                                  color: "#FF1B6B",
                                  fontWeight: 800,
                                  letterSpacing: 0.2,
                                  fontSize: { xs: 14, sm: 16 },
                                  mb: { xs: 1, sm: 1.5 },
                                }}
                              >
                                {plan.name}
                              </Typography>

                              {/* Price area (responsive sizes) */}
                              <Box
                                sx={{
                                  my: 1.5,
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "baseline",
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="h4"
                                  component="span"
                                  sx={{
                                    color: "#ffffff",
                                    fontWeight: 900,
                                    fontSize: { xs: "1.4rem", sm: "1.9rem" },
                                    lineHeight: 1,
                                  }}
                                >
                                  {plan.price}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  component="span"
                                  sx={{
                                    color: "#aaaaaa",
                                    fontSize: { xs: 11, sm: 13 },
                                  }}
                                >
                                  {plan.period}
                                </Typography>
                              </Box>

                              {/* Save chip (keeps same data) */}
                              {plan.savings && (
                                <Chip
                                  label={`Save ${plan.savings}`}
                                  size="small"
                                  sx={{
                                    bgcolor: "rgba(76,175,80,0.14)",
                                    color: "#4caf50",
                                    fontWeight: 700,
                                    mb: 1.25,
                                    px: 1,
                                  }}
                                />
                              )}

                              {/* Feature list (unchanged functionality, only styling) */}
                              <Box sx={{ textAlign: "left", mt: 1 }}>
                                {plan.features.map((feature, index) => (
                                  <Typography
                                    key={index}
                                    variant="body2"
                                    sx={{
                                      color: "#cccccc",
                                      mb: 0.8,
                                      display: "flex",
                                      alignItems: "center",
                                      fontSize: { xs: 12, sm: 13 },
                                    }}
                                  >
                                    <CheckCircle
                                      fontSize="small"
                                      sx={{
                                        mr: 1,
                                        color: "#4caf50",
                                        background: "rgba(0,0,0,0.15)",
                                        borderRadius: "50%",
                                        p: "2px",
                                      }}
                                    />
                                    {feature}
                                  </Typography>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Fade>
              )}

              {/* Step 1: Personal Details */}
              {activeStep === 1 && (
                <Fade in={activeStep === 1}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <User
                        size={20}
                        color="#FF1B6B"
                        style={{ marginRight: 8 }}
                      />
                      <Typography variant="h6" sx={{ color: "#fff" }}>
                        Personal & Billing Information
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          required
                          fullWidth
                          label="First Name"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          error={Boolean(errors.firstName)}
                          helperText={errors.firstName}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          required
                          fullWidth
                          label="Last Name"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          error={Boolean(errors.lastName)}
                          helperText={errors.lastName}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          label="Street Address"
                          name="streetAddress"
                          value={formData.streetAddress}
                          onChange={handleChange}
                          error={Boolean(errors.streetAddress)}
                          helperText={errors.streetAddress}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MapPin size={18} color="#aaaaaa" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <TextField
                          required
                          fullWidth
                          label="State"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          error={Boolean(errors.state)}
                          helperText={errors.state}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          required
                          fullWidth
                          label="Country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          error={Boolean(errors.country)}
                          helperText={errors.country}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          required
                          fullWidth
                          label="City"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          error={Boolean(errors.city)}
                          helperText={errors.city}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          required
                          fullWidth
                          label="Zip Code"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleChange}
                          error={Boolean(errors.zipCode)}
                          helperText={errors.zipCode}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          label="Phone Number"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          error={Boolean(errors.phoneNumber)}
                          helperText={errors.phoneNumber}
                          placeholder="+1 (555) 123-4567"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone size={18} color="#aaaaaa" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}

              {/* Step 2: Payment */}
              {activeStep === 2 && (
                <Fade in={activeStep === 2}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <CreditCard
                        size={20}
                        color="#FF1B6B"
                        style={{ marginRight: 8 }}
                      />
                      <Typography variant="h6" sx={{ color: "#fff" }}>
                        Payment Information
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          label="Card Number"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleChange}
                          error={Boolean(errors.cardNumber)}
                          helperText={errors.cardNumber}
                          placeholder="1234 5678 9012 3456"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CreditCard size={18} color="#aaaaaa" />
                              </InputAdornment>
                            ),
                          }}
                          inputProps={{ maxLength: 23 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          required
                          fullWidth
                          label="Expiry Date"
                          name="expDate"
                          value={formData.expDate}
                          // onChange={handleChange}
                          onChange={handleExpiryChange}
                          error={Boolean(errors.expDate)}
                          helperText={errors.expDate}
                          placeholder="MM/YY"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Calendar size={18} color="#aaaaaa" />
                              </InputAdornment>
                            ),
                          }}
                          inputProps={{ maxLength: 5 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          required
                          fullWidth
                          label="CVV"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleChange}
                          error={Boolean(errors.cvv)}
                          helperText={errors.cvv}
                          placeholder="123"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock size={18} color="#aaaaaa" />
                              </InputAdornment>
                            ),
                          }}
                          inputProps={{ maxLength: 4 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Promo Code (Optional)"
                          name="promoCode"
                          value={promoCode}
                          onChange={(e) =>
                            handleChangePromoCode(e.target.value)
                          }
                          placeholder="Enter promo code"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Tag size={18} color="#aaaaaa" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      {promoCodeMessage && (
                        <Grid item xs={12}>
                          <Alert
                            severity={isValidPromoCode ? "success" : "error"}
                            sx={{
                              bgcolor: isValidPromoCode
                                ? "rgba(76, 175, 80, 0.1)"
                                : "rgba(244, 67, 54, 0.1)",
                              border: `1px solid ${
                                isValidPromoCode
                                  ? "rgba(76, 175, 80, 0.2)"
                                  : "rgba(244, 67, 54, 0.2)"
                              }`,
                              color: isValidPromoCode ? "#4caf50" : "#f44336",
                            }}
                          >
                            {promoCodeMessage}
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Fade>
              )}

              {/* Navigation Buttons */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 4,
                  flexDirection: isMobile ? "column" : "row",
                  gap: 2,
                }}
              >
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<ArrowLeft />}
                  variant="outlined"
                  sx={{ order: isMobile ? 2 : 1 }}
                >
                  Back
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    size="large"
                    sx={{
                      minWidth: 160,
                      order: isMobile ? 1 : 2,
                      position: "relative",
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} style={{ marginRight: 8 }} />
                        Upgrade Now
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    endIcon={<ArrowRight />}
                    variant="contained"
                    size="large"
                    sx={{
                      minWidth: 160,
                      order: isMobile ? 1 : 2,
                    }}
                  >
                    Continue
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert
            severity="info"
            sx={{
              mt: 3,
              bgcolor: "rgba(33, 150, 243, 0.1)",
              border: "1px solid rgba(33, 150, 243, 0.2)",
              color: "#2196f3",
              "& .MuiAlert-icon": { color: "#2196f3" },
            }}
          >
            American Express is not currently accepted.
          </Alert>
        </Container>
      </Box>

      <CustomDialog
        open={dialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        confirmText={dialogAction === "success" ? "Continue to Members" : "OK"}
        cancelText="Close"
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);

          if (dialogAction === "success") {
            router.push("/members");
          }
        }}
      />
    </ThemeProvider>
  );
};

export default BillingUpgrade;
