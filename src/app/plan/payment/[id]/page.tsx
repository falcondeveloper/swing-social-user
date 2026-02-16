"use client";
import React, { Suspense, useEffect, useState } from "react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { useRouter } from "next/navigation";
import PaymentDialog, { DialogType } from "@/components/PaymentDialog";

type Params = Promise<{ id: string }>;

interface ReferralValidationResult {
  valid: boolean;
  affiliateCode?: string | null;
  profileId?: string | null;
  message?: string;
}

export default function Payment(props: { params: Params }) {
  const [id, setId] = useState<string>("");
  const router = useRouter();

  const [promoCode, setPromoCode] = useState<any>("");
  const [promoCodeMessage, setPromocodeMessage] = useState<any>(null);
  const [promoCodeList, setPromoCodeList] = useState<any>([]);
  const [firstMonthFree, setFirstMonthFree] = useState(false);
  const [address, setAddress] = useState<any>("");
  const [state, setState] = useState<any>("");
  const [isValidPromoCode, setValidPromoCode] = useState<any>(false);
  const [price, setPrice] = useState<any>("");
  const [plan, setPlan] = useState<any>("");
  const [unit, setUnit] = useState<any>("");
  const [email, setEmail] = useState<any>("");
  const [phone, setPhone] = useState("");
  const [userName, setUsername] = useState<any>("");
  const [password, setPassword] = useState<any>("");
  const [getAffCode, setGetAffCode] = useState<any>("");
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [perrors, setPErrors] = useState<any>({
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    qstreetAddress: "",
    qzipCode: "",
    qcity: "",
    qcountry: "",
    phone: "",
  });

  const [errors, setErrors] = useState<any>({});

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: DialogType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    const getIdFromParam = async () => {
      const params = await props.params;
      const pid: any = params.id;
      console.log(pid);
      setId(pid);
    };
    getIdFromParam();
    handlePromoState();
  }, [props]);

  const handleChangePromoCode = (promoCodeText: string) => {
    setPromoCode(promoCodeText);
    if (promoCodeText) {
      let filter = promoCodeList.filter(
        (val: any) => val?.PromoCodeText === promoCodeText,
      );
      if (filter?.length > 0) {
        console.log(filter[0].DisplayMessage, "=====filter");
        setPromocodeMessage(filter[0]?.DisplayMessage);
        setValidPromoCode(true);
      } else {
        setPromocodeMessage("Promo Code is Invalid");
        setValidPromoCode(false);
      }
    } else {
      setPromocodeMessage(null);
      setValidPromoCode(true);
    }
  };

  const handleSubmitPromoCode = async () => {
    try {
      const response = await fetch("/api/user/promocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pid: id, promocode: promoCode }),
      });

      console.log(response);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const getLocationName = async (latitude: number, longitude: number) => {
    const apiKey = "AIzaSyBEr0k_aQ_Sns6YbIQ4UBxCUTdPV9AhdF0";

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      console.error("No results found or status not OK:", data);
      return "Unknown Location";
    } catch (error) {
      console.error("Error fetching location name:", error);
      return "Unknown Location";
    }
  };

  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationName = await getLocationName(latitude, longitude);
          setAddress(locationName);
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const handleGetAllPromoCodes = async () => {
    try {
      const apiUrl = `/api/user/promocode/check`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch event data");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setPromoCodeList(result.promocodes);
    } catch (error) {}
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ssprice = localStorage.getItem("ssprice");
      const ssplan = localStorage.getItem("ssplan");
      const ssunit = localStorage.getItem("ssunit");
      const emailVal = localStorage.getItem("email");
      const userNameVal = localStorage.getItem("userName");
      const passwordVal = localStorage.getItem("password");
      const affCodeVal = localStorage.getItem("affiliate_code");

      setPrice(ssprice);
      setPlan(ssplan);
      setUnit(ssunit);
      setEmail(emailVal);
      setUsername(userNameVal);
      setPassword(passwordVal);
      setGetAffCode(affCodeVal);
    }
    getCurrentLocation();
    handleGetAllPromoCodes();
  }, [address]);

  const handlePhoneChange = (event: any) => {
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

    setPhone(value);
  };

  const onClose = () => {
    setOpen(false);
  };

  const handleCardNumberChange = (e: any) => {
    const input = e.target.value.replace(/\D/g, "");
    const formatted = input.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted.trim());

    if (input.length !== 16) {
      setPErrors((prev: any) => ({
        ...prev,
        cardNumber: "Invalid card number. Must be 16 digits.",
      }));
    } else {
      setPErrors((prev: any) => ({ ...prev, cardNumber: "" }));
    }
  };

  const handleExpiryChange = (e: any) => {
    const input = e.target.value.replace(/\D/g, "");
    let formatted = input;

    if (input.length >= 2) {
      formatted = `${input.substring(0, 2)}/${input.substring(2, 4)}`;
    }

    setExpiry(formatted);

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formatted)) {
      setPErrors((prev: any) => ({
        ...prev,
        expiry: "Invalid expiry date. Use MM/YY format.",
      }));
    } else {
      setPErrors((prev: any) => ({ ...prev, expiry: "" }));
    }
  };

  const handleCvcChange = (e: any) => {
    const value = e.target.value;
    setCvc(value);

    if (!/^\d{3,4}$/.test(value)) {
      setPErrors((prev: any) => ({
        ...prev,
        cvc: "Invalid CVC. Must be 3-4 digits.",
      }));
    } else {
      setPErrors((prev: any) => ({ ...prev, cvc: "" }));
    }
  };

  const handleUpdateMembershipStatus = async (userid: string, pprice: any) => {
    try {
      const response = await fetch("/api/user/membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileId: userid, price: pprice }),
      });

      const checkData = await response.json();
      localStorage.setItem("memberShip", "1");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const validateReferral = async (
    code?: string | null,
  ): Promise<ReferralValidationResult> => {
    if (!code) {
      console.log("No referral code provided — skipping validation.");
      return { valid: false, message: "No referral code provided" };
    }

    try {
      const res = await fetch("/api/user/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const json = await res.json();

      if (res.ok && json?.is_valid) {
        console.log("✅ Referral code is valid:", json?.affiliate_code);
        return {
          valid: true,
          affiliateCode: json?.affiliate_code,
          profileId: json?.profile_id,
          message: json?.message,
        };
      } else {
        console.warn("❌", json?.message || "Referral code not found");
        return {
          valid: false,
          message: json?.message || "Referral code not found",
        };
      }
    } catch (err) {
      console.error("Referral validation error:", err);
      return {
        valid: false,
        message: "Unable to validate referral at this time",
      };
    }
  };

  const handleLogin = async (userName: string, password: string) => {
    const payload = {
      email: userName,
      pwd: password,
    };

    const result = await fetch("/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await result.json();

    if (getAffCode) {
      try {
        const isValid = await validateReferral(getAffCode);
        if (isValid) {
          const referralRes = await fetch("/api/user/create-referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              affiliateCode: getAffCode,
              referredUserId: data.currentProfileId,
              referredUserName: data.currentuserName,
              referredEmail: email,
              subscriptionId: null,
              memberShipCheck: data?.memberShip === 0 ? "Free" : "Paid",
            }),
          });
          const referralData = await referralRes.json();
          localStorage.removeItem("affiliate_code");
          setGetAffCode(null);
        } else {
          console.warn("Affiliate code invalid or not available:", getAffCode);
        }
      } catch (err) {
        console.error("Referral API error:", err);
      }
    }

    localStorage.setItem("loginInfo", data.jwtToken);
    localStorage.setItem("logged_in_profile", data.currentProfileId);
    localStorage.setItem("profileUsername", data.currentuserName);
    localStorage.setItem("memberalarm", data.memberAlarm);
    localStorage.setItem("memberShip", data.memberShip);
    router.push("/home");
  };

  const handlePromoState = async () => {
    const params = await props.params;
    const userid: any = params.id;
    const response = await fetch(`/api/user/state?userid=${userid}`);
    if (!response.ok) {
      console.log("Error : please check it out");
    }
    const { user: advertiserData } = await response.json();
    console.log(advertiserData);
    const [city, userState] = advertiserData.Location.split(", ");
    setState(userState);
    console.log(userState);
    const result = await fetch("/api/user/promostate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state: userState,
      }),
    });

    const data = await result.json();

    if (data.result == 1) {
      setFirstMonthFree(true);
      console.log("Free Month");
    } else {
      console.log("Premium Month");
      setFirstMonthFree(false);
    }
  };

  const handleConfirm = async () => {
    if (isProcessing) {
      console.log("Payment already in progress, ignoring duplicate request");
      return;
    }

    if (!cardNumber || !expiry || !cvc) {
      setPErrors({
        cardNumber: cardNumber ? "" : "Card number is required.",
        expiry: expiry ? "" : "Expiry date is required.",
        cvc: cvc ? "" : "CVC is required.",
      });
      return;
    }

    if (!errors.cardNumber && !errors.expiry && !errors.cvc) {
      setIsProcessing(true);

      try {
        var ssunit = unit;
        var planName = "";
        var billingCycle = "1";
        var pprice = "17.95";
        if (ssunit == "1") {
          planName = plan + " Monthly";
          billingCycle = "1";
          pprice = "17.95";
        } else if (ssunit == "12") {
          planName = plan + " Annually";
          billingCycle = "12";
          pprice = "129.95";
        } else if (ssunit == "3") {
          planName = plan + " Quarterly";
          billingCycle = "3";
          pprice = "39.95";
        } else {
          planName = plan + "Bi-Annually";
          billingCycle = "6";
          pprice = "69.95";
        }

        if (promoCode !== "") {
          pprice = "1";
        }

        const response = await fetch("/api/user/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            price: price,
            pprice: pprice,
            length: billingCycle,
            cardNumber: cardNumber,
            expiry: expiry,
            cvc: cvc,
            firstName: formData.firstName,
            lastName: formData.lastName,
            plan: planName,
            isPromoCode: isValidPromoCode,
            city: formData?.qcity,
            country: formData?.qcountry,
            state: state,
            streetAddress: formData?.qstreetAddress,
            phone: formData?.phone,
            zipCode: formData?.qzipCode,
            firstMonthFree: firstMonthFree,
            promocode: promoCode,
            email: email,
            username: userName,
            userid: id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const respondCode = data.respondCode;
          if (respondCode === "1") {
            if (promoCode === "") {
              await handleUpdateMembershipStatus(id, pprice);
            } else {
              await handleSubmitPromoCode();
              await handleUpdateMembershipStatus(id, pprice);
            }
            setOpen(false);
            setDialogState({
              open: true,
              type: "success",
              title: `Thank you ${userName}!`,
              message: "You will now be directed to Swing Social soon!",
              confirmText: "Continue",
              onConfirm: () => {
                setDialogState((prev) => ({ ...prev, open: false }));
                handleLogin(userName, password);
              },
            });
          } else {
            setOpen(false);
            setDialogState({
              open: true,
              type: "error",
              title: "Payment Failed",
              message: "Sorry, we are unable to process your payment.",
              confirmText: "Edit Card",
              cancelText: "Continue as Free Member",
              onConfirm: () => {
                setDialogState((prev) => ({ ...prev, open: false }));
                setOpen(true);
              },
              onCancel: () => {
                setDialogState((prev) => ({ ...prev, open: false }));
                handleLogin(userName, password);
              },
            });
          }
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        setOpen(false);
        setDialogState({
          open: true,
          type: "error",
          title: "Unexpected Error",
          message: "An unexpected error occurred. Please try again.",
          confirmText: "OK",
          onConfirm: () => {
            setDialogState((prev) => ({ ...prev, open: false }));
          },
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    if (name == "phone") {
      handlePhoneChange(e);
    }
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First Name is required.";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last Name is required.";
    }

    if (!formData.qstreetAddress.trim()) {
      newErrors.streetAddress = "Street Address is required.";
    }

    if (!formData.qzipCode.trim() || !/^\d{5}$/.test(formData.qzipCode)) {
      newErrors.zipCode = "Valid Zip Code is required (5 digits).";
    }

    if (!formData.qcity.trim()) {
      newErrors.city = "City is required.";
    }

    if (!formData.qcountry.trim()) {
      newErrors.country = "Country is required.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required (format: (123) 456-7890).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentProcess = () => {
    if (validateForm()) {
      setOpen(true);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Box
        sx={{
          width: "100%",
          maxWidth: 800,
          margin: "auto",
          mt: 5,
          p: 3,
          borderRadius: 2,
          backgroundColor: "#000",
          color: "#fff",
        }}
      >
        <Typography variant="h5" mb={2} align="center">
          Payment Details
        </Typography>
        <Typography variant="h6" mb={3} align="center">
          Payment for {plan} Subscription
        </Typography>

        <Grid container spacing={2}>
          {/* First Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              error={!!errors.firstName}
              helperText={errors.firstName}
              variant="outlined"
              InputLabelProps={{ style: { color: "#fff" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#fff" },
                  "&:hover fieldset": { borderColor: "#61dafb" },
                },
                input: { color: "#fff" },
              }}
            />
          </Grid>

          {/* Last Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              error={!!errors.lastName}
              helperText={errors.lastName}
              variant="outlined"
              InputLabelProps={{ style: { color: "#fff" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#fff" },
                  "&:hover fieldset": { borderColor: "#61dafb" },
                },
                input: { color: "#fff" },
              }}
            />
          </Grid>

          {/* Street Address */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              name="qstreetAddress"
              value={formData.qstreetAddress}
              onChange={handleInputChange}
              error={!!errors.streetAddress}
              helperText={errors.streetAddress}
              variant="outlined"
              InputLabelProps={{ style: { color: "#fff" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#fff" },
                  "&:hover fieldset": { borderColor: "#61dafb" },
                },
                input: { color: "#fff" },
              }}
            />
          </Grid>

          {/* City */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              name="qcity"
              value={formData.qcity}
              onChange={handleInputChange}
              error={!!errors.city}
              helperText={errors.city}
              variant="outlined"
              InputLabelProps={{ style: { color: "#fff" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#fff" },
                  "&:hover fieldset": { borderColor: "#61dafb" },
                },
                input: { color: "#fff" },
              }}
            />
          </Grid>

          {/* Country */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Country"
              name="qcountry"
              value={formData.qcountry}
              onChange={handleInputChange}
              error={!!errors.country}
              helperText={errors.country}
              variant="outlined"
              InputLabelProps={{ style: { color: "#fff" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#fff" },
                  "&:hover fieldset": { borderColor: "#61dafb" },
                },
                input: { color: "#fff" },
              }}
            />
          </Grid>

          {/* Zip Code */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Zip Code"
              name="qzipCode"
              value={formData.qzipCode}
              onChange={handleInputChange}
              error={!!errors.zipCode}
              helperText={errors.zipCode}
              variant="outlined"
              InputLabelProps={{ style: { color: "#fff" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#fff" },
                  "&:hover fieldset": { borderColor: "#61dafb" },
                },
                input: { color: "#fff" },
              }}
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={phone}
              onChange={handleInputChange}
              error={!!errors.phone}
              helperText={errors.phone}
              placeholder="(123) 456-7890"
              variant="outlined"
              InputLabelProps={{ style: { color: "#fff" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#fff" },
                  "&:hover fieldset": { borderColor: "#61dafb" },
                },
                input: { color: "#fff" },
              }}
            />
          </Grid>
        </Grid>

        {/* Pay Button */}
        <Button
          onClick={handlePaymentProcess}
          fullWidth
          variant="contained"
          color="primary"
          sx={{
            mt: 5,
            textTransform: "none",
            backgroundColor: "#f50057",
            py: 1.5,
            color: "#fff",
            fontSize: "16px",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#c51162",
            },
          }}
          startIcon={<CreditCardIcon />}
        >
          Pay with Card
        </Button>
      </Box>

      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: "#000",
            color: "#fff",
            border: "1px solid #fff",
          },
        }}
      >
        <DialogTitle sx={{ color: "#fff" }}>
          Enter Payment Information
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Card Number */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Card Number"
                name="cardNumber"
                value={cardNumber}
                onChange={handleCardNumberChange}
                variant="outlined"
                InputLabelProps={{ style: { color: "#fff" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#fff" },
                    "&:hover fieldset": { borderColor: "#61dafb" },
                  },
                  input: { color: "#fff" },
                }}
                error={Boolean(perrors.cardNumber)}
                helperText={perrors.cardNumber}
              />
            </Grid>

            {/* Expiry */}
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                placeholder="MM/YY"
                name="expiry"
                value={expiry}
                onChange={handleExpiryChange}
                variant="outlined"
                InputLabelProps={{ style: { color: "#fff" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#fff" },
                    "&:hover fieldset": { borderColor: "#61dafb" },
                  },
                  input: { color: "#fff" },
                }}
                error={Boolean(perrors.expiry)}
                helperText={perrors.expiry}
              />
            </Grid>

            {/* CVC */}
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                placeholder="CVC"
                name="cvc"
                value={cvc}
                onChange={handleCvcChange}
                variant="outlined"
                InputLabelProps={{ style: { color: "#fff" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#fff" },
                    "&:hover fieldset": { borderColor: "#61dafb" },
                  },
                  input: { color: "#fff" },
                }}
                error={Boolean(perrors.cvc)}
                helperText={perrors.cvc}
              />
            </Grid>

            {/* Promo Code */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                placeholder="Promo Code"
                name="promoCode"
                value={promoCode}
                disabled={firstMonthFree}
                onChange={(e) => handleChangePromoCode(e.target.value)}
                variant="outlined"
                InputLabelProps={{ style: { color: "#fff" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: firstMonthFree == true ? "black" : "#fff",
                    },
                    "&:hover fieldset": {
                      borderColor: firstMonthFree == true ? "black" : "#61dafb",
                    },
                  },
                  input: { color: "#fff" },
                }}
              />
            </Grid>

            {promoCodeMessage && (
              <Grid item xs={12}>
                <Typography>{promoCodeMessage}</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onClose}
            variant="contained"
            color="secondary"
            sx={{
              textTransform: "none",
              py: 1.5,
              fontSize: "16px",
              fontWeight: "bold",
              color: "#fff",
              "&:hover": { backgroundColor: "#444" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={isProcessing}
            sx={{
              textTransform: "none",
              py: 1.5,
              fontSize: "16px",
              fontWeight: "bold",
              color: "#fff",
              "&:hover": { backgroundColor: "#61dafb" },
              "&:disabled": { backgroundColor: "#666", color: "#ccc" },
            }}
          >
            {isProcessing ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      <PaymentDialog
        open={dialogState.open}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </Suspense>
  );
}
