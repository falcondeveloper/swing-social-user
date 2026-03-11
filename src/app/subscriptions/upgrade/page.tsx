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
  ThemeProvider,
  Container,
  Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import CustomDialog from "@/components/CustomDialog";

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

export default function Pricing() {
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

  const [profileId, setProfileId] = useState<any>();
  const [profile, setProfile] = useState<any>();
  const [currentName, setCurrentName] = useState<any>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogAction, setDialogAction] = useState<"login" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tokenDevice = localStorage.getItem("loginInfo");
      if (tokenDevice) {
        const decodeToken = jwtDecode<any>(tokenDevice);
        setCurrentName(decodeToken?.profileName);
        setProfileId(decodeToken?.profileId);
        setProfile(decodeToken);
      }
    }
  }, []);

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
        toast.success("Subscribed to Free plan!");
        await sendEmail(userName, email);

        setDialogTitle("You're All Set!");
        setDialogMessage(
          "Your free plan has been activated successfully. You're now ready to explore the platform.",
        );
        setDialogAction("login");
        setDialogOpen(true);
        return;
      } else {
        localStorage.setItem("ssprice", price);
        localStorage.setItem("ssplan", plan);
        localStorage.setItem("ssunit", billingCycle);
        router.push(`/plan/payment/${id}`);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
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

  const handleLogin = async (userName: string, password: string) => {
    const response = await fetch("/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userName, pwd: password }),
    });

    const data = await response.json();
    localStorage.setItem("loginInfo", data.jwtToken);
    localStorage.setItem("logged_in_profile", data.currentProfileId);
    localStorage.setItem("profileUsername", data.currentuserName);
    localStorage.setItem("memberalarm", data.memberAlarm);
    localStorage.setItem("memberShip", data.memberShip);
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
                  <Tabs
                    value={selectedTab}
                    onChange={(_, value) => setSelectedTab(value)}
                    centered
                    variant={isMobile ? "fullWidth" : "standard"}
                    textColor="secondary"
                    indicatorColor="secondary"
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
        confirmText="ACCESS SWINGSOCIAL"
        cancelText="CLOSE"
        onClose={() => setDialogOpen(false)}
        onConfirm={async () => {
          setDialogOpen(false);

          if (dialogAction === "login") {
            await handleLogin(userName, password);
          }
        }}
      />
    </>
  );
}
