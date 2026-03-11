"use client";
import React, { memo, Suspense, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  useMediaQuery,
  useTheme,
  createTheme,
  ThemeProvider,
  Container,
  Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { useRouter } from "next/navigation";
import MembershipCheckPageContent from "@/app/membership-check/page";
import CustomDialog from "@/components/CustomDialog";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type Params = Promise<{ id: string }>;

interface ReferralValidationResult {
  valid: boolean;
  affiliateCode?: string | null;
  profileId?: string | null;
  message?: string;
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#FF2D55",
      light: "#FF617B",
      dark: "#CC1439",
    },
    secondary: {
      main: "#7000FF",
      light: "#9B4DFF",
      dark: "#5200CC",
    },
    success: {
      main: "#00D179",
    },
    background: {
      default: "#0A0118",
    },
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

export default function Pricing({ params }: { params: Params }) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [selectedTab, setSelectedTab] = useState(0);
  const [billingCycle, setBillingCycle] = useState("1");
  const [userName, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [firstMonthFree, setFirstMonthFree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [getAffCode, setGetAffCode] = useState<any>("");
  const [checkMemberShip, setCheckMembership] = useState<any>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogAction, setDialogAction] = useState<"success" | "error" | null>(
    null,
  );

  useEffect(() => {
    setFullName(localStorage.getItem("fullName") || "");
    setUsername(localStorage.getItem("userName") || "");
    setEmail(localStorage.getItem("email") || "");
    setPassword(localStorage.getItem("password") || "");
    setGetAffCode(localStorage.getItem("affiliate_code") || "");

    const initialize = async () => {
      const { id } = await params;
      setId(id);
      setIsLoading(true);

      try {
        const res = await fetch(`/api/user/state?userid=${id}`);
        const { user } = await res.json();
        const state = user.Location.split(", ")[1];

        const promoRes = await fetch("/api/user/promostate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state }),
        });

        const promoData = await promoRes.json();
        setFirstMonthFree(promoData.result == 1);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [params]);

  const plans = [
    {
      title: "Premium",
      price:
        billingCycle === "1"
          ? "$17.95"
          : billingCycle === "3"
            ? "$39.95"
            : billingCycle === "6"
              ? "$69.95"
              : "$129.95",
      features: [
        "Browse & Search Members",
        "Browse & Search Events",
        "Design Your Own Profile",
        "View Other Members Profiles",
        "Send Unlimited Messages to Members",
        "Get Tickets to Free & Paid Private Events",
      ],
      devFeatures: [
        "Browse Travel & Make Bookings",
        "Read Blog",
        "What's Hot & Upload",
        "Comment & React to What's Hot Posts",
        "Play Dates",
      ],
      availability: {
        features: [true, true, true, true, true, true],
        devFeatures: [true, true, true, true, true],
      },
    },
    {
      title: "Free",
      price: "$0",
      features: [
        "Browse & Search Members",
        "Browse & Search Events",
        "Design Your Own Profile",
        "View Other Members Profiles",
        "Send Unlimited Messages to Members",
        "Get Tickets to Free & Paid Private Events",
      ],
      devFeatures: [
        "Browse Travel & Make Bookings",
        "Read Blog",
        "What's Hot & Upload",
        "Comment & React to What's Hot Posts",
        "Play Dates",
      ],
      availability: {
        features: [true, true, true, true, false, false],
        devFeatures: [true, true, true, false, true],
      },
    },
  ];

  const handlePlanSelect = async (plan: string, price: string) => {
    setIsProcessing(true);

    try {
      if (plan === "Free") {
        await sendEmail(userName, email);

        setDialogTitle("You're All Set!");
        setDialogMessage(
          "Your free plan has been activated successfully.\n\nYou're now ready to explore the platform.",
        );
        setDialogAction("success");
        setDialogOpen(true);
      } else {
        localStorage.setItem("ssprice", price);
        localStorage.setItem("ssplan", plan);
        localStorage.setItem("ssunit", billingCycle);
        router.push(`/plan/payment/${id}`);
      }
    } catch (error) {
      setDialogTitle("Something went wrong");
      setDialogMessage("Please try again.");
      setDialogAction("error");
      setDialogOpen(true);

      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendEmail = async (username: string, email: string) => {
    await fetch("/api/user/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email }),
    });
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
    const response = await fetch("/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userName, pwd: password }),
    });

    const data = await response.json();

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

    const registrationKeys = [
      "password",
      "email",
      "userName",
      "fullName",
      "phone",
      "Avatar",
      "avatarS3Key",
      "avatarS3Uploaded",
      "selfieSkipped",
      "register_profile_id",
      "register_step1",
      "register_step3",
      `register_step5_${id}`,
    ];

    registrationKeys.forEach((key) => localStorage.removeItem(key));
    router.push("/home");
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
              {isLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <CircularProgress sx={{ color: "#fff" }} />
                  <Typography variant="h6" sx={{ color: "#fff" }}>
                    Checking Promo State...
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 3 }}>
                    <Button
                      onClick={() => router.back()}
                      sx={{
                        width: 40,
                        height: 40,
                        minWidth: 40,
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexShrink: 0,
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                      }}
                    >
                      <ArrowBackIcon fontSize="small" />
                    </Button>

                    <Tabs
                      value={selectedTab}
                      onChange={(_, value) => setSelectedTab(value)}
                      centered
                      variant={isMobile ? "fullWidth" : "standard"}
                      textColor="secondary"
                      indicatorColor="secondary"
                      sx={{ flex: 1 }}
                    >
                      <Tab
                        label="Premium"
                        sx={{ color: selectedTab === 0 ? "#f50057" : "#fff" }}
                      />
                      <Tab
                        label="Free"
                        sx={{ color: selectedTab === 1 ? "#f50057" : "#fff" }}
                      />
                    </Tabs>
                  </Box>

                  {selectedTab === 0 && (
                    <Box mt={3}>
                      <Typography
                        variant="body1"
                        mb={2}
                        textAlign="center"
                        sx={{ color: "#fff" }}
                      >
                        {firstMonthFree
                          ? "Enjoy your first month for just $1!"
                          : "Choose your billing cycle:"}
                      </Typography>

                      {!firstMonthFree && (
                        <Box
                          sx={{
                            overflowX: "auto",
                            whiteSpace: "nowrap",
                            display: { xs: "block", md: "flex" },
                            justifyContent: { md: "center" },
                            "&::-webkit-scrollbar": { display: "none" },
                          }}
                        >
                          <ToggleButtonGroup
                            value={billingCycle}
                            exclusive
                            onChange={(_, value) =>
                              value && setBillingCycle(value)
                            }
                            sx={{
                              display: "inline-flex",
                              flexWrap: "nowrap",
                              "& .MuiToggleButton-root": {
                                flex: "0 0 auto",
                                color: "#fff",
                                borderColor: "#f50057",
                                m: 0.5,
                                px: 2,
                                backgroundColor: "#1c1c1c",
                                borderRadius: 3,
                                whiteSpace: "nowrap",
                                "&.Mui-selected": {
                                  backgroundColor: "#f50057 !important",
                                  color: "#fff",
                                  borderColor: "#f50057",
                                },
                                "&:hover": {
                                  backgroundColor: "#f73378",
                                },
                              },
                            }}
                          >
                            <ToggleButton value="1">Monthly</ToggleButton>
                            <ToggleButton value="3">Quarterly</ToggleButton>
                            <ToggleButton value="6">Bi-Annually</ToggleButton>
                            <ToggleButton value="12">Annually</ToggleButton>
                          </ToggleButtonGroup>
                        </Box>
                      )}
                    </Box>
                  )}

                  <Box
                    mt={4}
                    width={isMobile ? "100%" : "100%"}
                    display="flex"
                    flexDirection={isMobile ? "column" : "row"}
                    margin={"30px auto"}
                    justifyContent="center"
                    alignItems="stretch"
                    gap={3}
                  >
                    {plans
                      .filter((_, i) => i === selectedTab)
                      .map((plan, i) => (
                        <Card
                          key={plan.title}
                          sx={{
                            flex: 1,
                            borderRadius: 3,
                            backgroundColor: "#1c1c1c",
                            border: "1px solid #333",
                            p: 1,
                          }}
                        >
                          <CardContent>
                            <Typography variant="h5" color="#f50057" mb={1}>
                              {plan.title}
                            </Typography>
                            <Typography
                              variant="h4"
                              color="#fff"
                              fontWeight="bold"
                              mb={2}
                            >
                              {firstMonthFree && selectedTab === 0
                                ? "$1"
                                : plan.price}
                              <Typography
                                component="span"
                                variant="body2"
                                ml={1}
                              >
                                USD
                              </Typography>
                            </Typography>

                            <Typography
                              variant="subtitle1"
                              color="#f50057"
                              gutterBottom
                            >
                              Features
                            </Typography>
                            {plan.features.map((text, idx) => (
                              <Box
                                key={idx}
                                display="flex"
                                alignItems="center"
                                mb={1}
                              >
                                {plan.availability.features[idx] ? (
                                  <CheckCircleIcon
                                    color="success"
                                    fontSize="small"
                                  />
                                ) : (
                                  <RemoveCircleIcon
                                    color="error"
                                    fontSize="small"
                                  />
                                )}
                                <Typography variant="body2" ml={1} color="#fff">
                                  {text}
                                </Typography>
                              </Box>
                            ))}

                            <Typography
                              variant="subtitle1"
                              color="#f50057"
                              mt={2}
                              gutterBottom
                            >
                              In Development
                            </Typography>
                            {plan.devFeatures.map((text, idx) => (
                              <Box
                                key={idx}
                                display="flex"
                                alignItems="center"
                                mb={1}
                              >
                                {plan.availability.devFeatures[idx] ? (
                                  <CheckCircleIcon
                                    color="success"
                                    fontSize="small"
                                  />
                                ) : (
                                  <RemoveCircleIcon
                                    color="error"
                                    fontSize="small"
                                  />
                                )}
                                <Typography variant="body2" ml={1} color="#fff">
                                  {text}
                                </Typography>
                              </Box>
                            ))}

                            <Button
                              variant="contained"
                              fullWidth
                              disabled={isProcessing}
                              sx={{
                                mt: 3,
                                color: "#fff",
                                backgroundColor: "#f50057",
                                "&:hover": {
                                  backgroundColor: "#c51162",
                                },
                              }}
                              onClick={() =>
                                handlePlanSelect(plan.title, plan.price)
                              }
                            >
                              {isProcessing ? (
                                <CircularProgress
                                  size={24}
                                  sx={{ color: "#fff" }}
                                />
                              ) : (
                                `Select ${plan.title} Plan`
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </Box>
                </>
              )}
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>

      <CustomDialog
        open={dialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        confirmText={dialogAction === "success" ? "Access Swingsocial" : "OK"}
        cancelText="Close"
        onClose={() => setDialogOpen(false)}
        onConfirm={async () => {
          setDialogOpen(false);

          if (dialogAction === "success") {
            await handleLogin(userName, password);
          }
        }}
      />
    </>
  );
}
