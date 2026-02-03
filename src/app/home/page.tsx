"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Container,
  Typography,
  Chip,
  useMediaQuery,
  Grid,
  alpha,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import ProfileImgCheckerModel from "@/components/ProfileImgCheckerModel";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";

const categories = [
  {
    title: "Events",
    description: "Discover exciting community events",
    img: "/images/event.png",
    url: "/events",
  },
  {
    title: "Learning & Blogs",
    description: "Expand your knowledge",
    img: "/images/learning-blog.jpg",
    url: "https://swingsocial.co/blog/",
  },
  {
    title: "What's Hot",
    description: "Trending in the community",
    img: "/images/whatshot.jpg",
    url: "/whatshot",
  },
  {
    title: "Marketplace",
    description: "Buy and sell in the community",
    img: "/images/marketplace.jpg",
    url: "/marketplace",
    isComingSoon: false,
  },
  {
    title: "Search",
    description: "Find your interests",
    img: "/images/search.jpg",
    url: "/members",
    isComingSoon: false,
  },
  {
    title: "Travel",
    description: "Explore new destinations",
    img: "/images/travel.jpg",
    url: "https://swingsocial.co/travel/",
  },
];

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [profileId, setProfileId] = useState<any>();
  const [currentName, setCurrentName] = useState<any>("");
  const [isNewMessage, setNewMessage] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isNewMessage") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tokenDevice = localStorage.getItem("loginInfo");
      if (tokenDevice) {
        const decodeToken = jwtDecode<any>(tokenDevice);
        setCurrentName(decodeToken?.profileName);
        setProfileId(decodeToken?.profileId);
      }
    }
  }, []);

  const resetNewMessage = () => {
    setNewMessage(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("isNewMessage", "false");
    }
  };


  useEffect(() => {
    if (profileId) {
      getCurrentLocation();
    }
  }, [profileId]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationName = await getLocationName(latitude, longitude);
          await sendLocationToAPI(locationName, latitude, longitude);
        } catch (error) {
          console.error("Error processing location:", error);
        }
      },
      (error) => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const getLocationName = async (latitude: number, longitude: number) => {
    const apiKey = "AIzaSyBEr0k_aQ_Sns6YbIQ4UBxCUTdPV9AhdF0";

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
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

  const sendLocationToAPI = async (
    locationName: string,
    latitude: number,
    longitude: number
  ) => {
    if (!profileId) {
      console.error("Profile ID is missing.");
      return;
    }

    try {
      const response = await fetch("/api/user/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          locationName,
          latitude,
          longitude,
        }),
      });

      const data = await response.json();
      if (response.ok) {
      } else {
        console.error("Error sending location:", data.message);
      }
    } catch (error) {
      console.error("Error sending location to API:", error);
    }
  };

  const handleNavigate = (category: any) => {
    if (category?.isComingSoon) {
      Swal.fire({
        title: "Coming Soon",
        timer: 2000,
      });
    } else {
      router.push(category?.url);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("logged_in_profile");

    const trackUser = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const aff = urlParams.get("aff");
        const refer = urlParams.get("refer");

        const getOS = () => {
          const ua = window.navigator.userAgent;
          if (ua.includes("Win")) return "Windows";
          if (ua.includes("Mac")) return "MacOS";
          if (ua.includes("Android")) return "Android";
          if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
          if (ua.includes("Linux")) return "Linux";
          return "Unknown";
        };

        const ipRes = await fetch("https://ipapi.co/json");
        const ipData = await ipRes.json();

        const payload = {
          affiliate: aff,
          referral: refer,
          OS: getOS(),
          page: "home",
          url: window.location.href,
          userid: id || null,
          ip: ipData?.ip || null,
          city: ipData?.city || null,
          region: ipData?.region || null,
          country_name: ipData?.country_name || null,
        };

        if (id) setProfileId(id);

        await fetch("/api/user/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("❌ Tracking failed:", err);
      }
    };

    trackUser();
  }, []);

  return (
    <>
      {isMobileOrTablet ? (
        <Box sx={{ color: "white", padding: "16px", paddingBottom: "80px" }}>
          <AppHeaderMobile />

          <Box
            sx={{
              width: "100%",
              aspectRatio: "4/1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: 'url("/images/home-hero-bg.png")',
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              marginTop: { lg: "98px", md: "90px", sm: "70px", xs: "0px" },
              borderRadius: "20px",
              position: "relative",
            }}
          ></Box>

          <Box
            sx={{
              padding: {
                xs: "12px",
                sm: "16px",
                md: 0,
                lg: 0,
              },
              marginTop: "24px",
              maxWidth: "100%",
            }}
          >
            <Grid
              container
              spacing={{ xs: 1.5, sm: 2 }}
              sx={{
                justifyContent: "center",
                alignItems: "stretch",
                width: "100%",
                margin: 0,
              }}
            >
              {categories.map((category, index) => (
                <Grid
                  item
                  xs={6}
                  sm={4}
                  md={6}
                  lg={6}
                  key={index}
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "0 !important",
                  }}
                >
                  <Card
                    onClick={() => handleNavigate(category)}
                    sx={{
                      backgroundColor: "#0a0a0a",
                      color: "white",
                      position: "relative",
                      overflow: "hidden",
                      width: "100%",
                      maxWidth: { xs: "160px", sm: "180px" },
                      height: { xs: "160px", sm: "180px", lg: 570, md: 570 },
                      aspectRatio: "1",
                      borderRadius: "20px",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-6px) scale(1.02)",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.5)",
                      },
                      "&:active": {
                        transform: "translateY(-3px) scale(0.98)",
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        height: "100%",
                        position: "relative",
                        padding: { xs: "10px", sm: "12px" },
                        "&:last-child": {
                          paddingBottom: { xs: "10px", sm: "12px" },
                        },
                      }}
                    >
                      {/* Background Image */}
                      <Box
                        sx={{
                          backgroundImage: `url(${category.img})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          width: "100%",
                          height: "100%",
                          position: "absolute",
                          top: 0,
                          left: 0,
                          borderRadius: "inherit",
                        }}
                      />
                      {/* Overlay */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)",
                          borderRadius: "inherit",
                        }}
                      />
                      {/* Title */}
                      <Box
                        sx={{
                          position: "relative",
                          zIndex: 2,
                          textAlign: "center",
                          width: "100%",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            color: "white",
                            fontWeight: "bold",
                            textShadow: "3px 3px 6px rgba(0,0,0,0.9)",
                            fontSize: { xs: "12px", sm: "14px" },
                            lineHeight: 1.2,
                          }}
                        >
                          {category.title}
                        </Typography>
                        {category.isComingSoon && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#FF1B6B",
                              fontWeight: "bold",
                              marginTop: "2px",
                              fontSize: { xs: "9px", sm: "10px" },
                              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                            }}
                          >
                            Coming Soon
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
          <AppFooterMobile />
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: "#121212",
            minHeight: "100vh",
            color: "white",
          }}
        >
          <AppHeaderDesktop />
          <Box
            sx={{
              pt: 15,
              pb: 10,
              position: "relative",
              background:
                'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("/images/home-hero-bg.png")',
              backgroundSize: "cover",
              backgroundPosition: "center",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "linear-gradient(180deg, rgba(18,18,18,0) 0%, #121212 100%)",
              },
            }}
          >
            <Container maxWidth="lg" sx={{ position: "relative" }}>
              <Typography
                variant="h1"
                align="center"
                sx={{
                  fontSize: { xs: "2.5rem", md: "4rem" },
                  fontWeight: 800,
                  background: "linear-gradient(45deg, #FF1B6B, #FF758C)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 2,
                }}
              >
                Swing Social Community
              </Typography>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              >
                <Typography
                  variant="h5"
                  align="center"
                  sx={{
                    color: "rgba(255,255,255,0.7)",
                    maxWidth: 800,
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  Welcome back, {currentName}! 👋
                </Typography>
              </motion.div>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 3,
                  flexWrap: "wrap",
                }}
              >
                <Box
                  sx={{
                    bgcolor: alpha("#FF1B6B", 0.1),
                    padding: "17px 13px 9px 13px",
                    borderRadius: "50%",
                    textAlign: "center",
                    width: 100,
                    height: 100,
                    cursor: "pointer",
                    transition: "transform 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                    "&:active": {
                      transform: "scale(0.95)",
                    },
                  }}
                  onClick={() => router.push("/members")}
                >
                  <img
                    src="/icons/members.png"
                    alt="Members"
                    style={{ height: 60 }}
                  />
                </Box>

                <Box
                  sx={{
                    bgcolor: alpha("#FF1B6B", 0.1),
                    padding: "17px 13px 9px 13px",
                    borderRadius: "50%",
                    textAlign: "center",
                    width: 100,
                    height: 100,
                    cursor: "pointer",
                    transition: "transform 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                    "&:active": {
                      transform: "scale(0.95)",
                    },
                  }}
                  onClick={() => router.push("/pineapple")}
                >
                  <img
                    src="/icons/pineapple.png"
                    alt="Pineapple"
                    style={{ height: 60 }}
                  />
                </Box>

                <Box
                  sx={{
                    bgcolor: alpha("#FF1B6B", 0.1),
                    padding: "17px 13px 9px 13px",
                    borderRadius: "50%",
                    textAlign: "center",
                    width: 100,
                    height: 100,
                    cursor: "pointer",
                    transition: "transform 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                    "&:active": {
                      transform: "scale(0.95)",
                    },
                  }}
                  onClick={() => router.push("/matches")}
                >
                  <img
                    src="/icons/matches.png"
                    alt="Matches"
                    style={{ height: 60 }}
                  />
                </Box>

                <Box
                  sx={{
                    position: "relative",
                    bgcolor: alpha("#FF1B6B", 0.1),
                    padding: "17px 13px 9px 13px",
                    borderRadius: "50%",
                    textAlign: "center",
                    width: 100,
                    height: 100,
                    cursor: "pointer",
                    transition: "transform 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                    "&:active": {
                      transform: "scale(0.95)",
                    },
                  }}
                  onClick={() => {
                    router.push("/messaging");
                    resetNewMessage();
                  }}
                >
                  <img
                    src="/icons/messaging.png"
                    alt="Message"
                    style={{ height: 60 }}
                  />

                  {/* New Message Indicator */}
                  {isNewMessage && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 0,
                        width: 20,
                        height: 20,
                        bgcolor: "#a445ea",
                        borderRadius: "50%",
                        animation: "blink 1.5s infinite",
                        "@keyframes blink": {
                          "0%": { opacity: 1 },
                          "50%": { opacity: 0.3 },
                          "100%": { opacity: 1 },
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Container>
          </Box>

          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {categories.map((category, index) => (
                <Card
                  key={index}
                  onClick={() => handleNavigate(category)}
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    bgcolor: "rgba(255,255,255,0.05)",
                    borderRadius: 3,
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                      "& .card-overlay": {
                        bgcolor: "rgba(0,0,0,0.3)",
                      },
                    },
                  }}
                >
                  <Box
                    className="card-overlay"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: "rgba(0,0,0,0.5)",
                      transition: "all 0.3s ease",
                      zIndex: 1,
                    }}
                  />
                  <CardMedia
                    component="img"
                    height="240"
                    image={category.img}
                    alt={category.title}
                  />
                  <CardContent
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      width: "100%",
                      zIndex: 2,
                      background:
                        "linear-gradient(transparent, rgba(0,0,0,0.9))",
                      p: 3,
                    }}
                  >
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{
                        fontWeight: "bold",
                        color: "white",
                      }}
                    >
                      {category.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        mb: 2,
                      }}
                    >
                      {category.description}
                    </Typography>
                    {category.isComingSoon && (
                      <Chip
                        label="Coming Soon"
                        size="small"
                        sx={{
                          bgcolor: "#FF1B6B",
                          color: "white",
                          fontWeight: "medium",
                          borderRadius: 1,
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Container>
          <AppFooterDesktop />
        </Box>
      )}

      {profileId && <ProfileImgCheckerModel profileId={profileId} />}
    </>
  );
};

export default Home;
