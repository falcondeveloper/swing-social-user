"use client";
import { useEffect, useRef, useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Block, Close } from "@mui/icons-material";
import DialogActions from "@mui/material/DialogActions";
import { useRouter } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { Calendar, MapPin, Clock } from "lucide-react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface UserProfileModalProps {
  handleGrantAccess: () => void;
  handleClose: () => void;
  open: boolean;
  userid: string | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  handleGrantAccess,
  handleClose,
  open,
  userid,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [advertiser, setAdvertiser] = useState<any>({});
  const [events, setEvents] = useState<any>([]);
  const [rsvp, setRsvp] = useState<any>([]);
  const [selectedTab, setSelectedTab] = useState("All Events");
  const [grantOpen, setGrantOpen] = useState(false);
  const [privateOpen, setPrivateOpen] = useState(false);
  const [profileId, setProfileId] = useState<any>();
  const [profileImages, setProfileImages] = useState<any>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [openImageModal, setOpenImageModal] = useState<boolean>(false);
  const [modalImageSrc, setModalImageSrc] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    if (!userid) return;

    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("loginInfo");

      if (token) {
        try {
          const decodeToken = jwtDecode<any>(token);
          setUserName(decodeToken?.profileName || "User");
        } catch (error) {
          console.error("Invalid token:", error);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }

      try {
        const userProfileID = localStorage.getItem("logged_in_profile");
        setProfileId(userProfileID);

        const getJson = async (url: string) => {
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
          } catch (err) {
            console.error("Fetch error:", err);
            return null;
          }
        };

        const [advertiserRes, eventsRes, rsvpRes, imagesRes] =
          await Promise.all([
            getJson(`/api/user/sweeping/user?id=${userid}`),
            getJson(`/api/user/sweeping/events`),
            getJson(`/api/user/sweeping/rsvp?id=${userid}`),
            getJson(`/api/user/sweeping/images/profile?id=${userid}`),
          ]);

        setAdvertiser(advertiserRes?.user || undefined);
        setEvents(eventsRes?.events || []);
        setRsvp(rsvpRes?.rsvp || []);
        setProfileImages(imagesRes?.images || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userid]);

  const filteredEvents = selectedTab === "RSVP" ? [] : events;

  const handleAddFriend = async (): Promise<void> => {
    try {
      const safeToId = userid ?? "";

      const BASE_URL = "https://swing-social-user.vercel.app";

      const acceptUrl = `${BASE_URL}/mailbox/${encodeURIComponent(safeToId)}`;

      const declineUrl = `${BASE_URL}/mailbox/${encodeURIComponent(safeToId)}`;

      const subject = `${userName} sent you a friend request on Swing Social`;

      const htmlBody = `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#333; margin:0; padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa; padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                
                <tr>
                  <td style="padding:20px 24px; text-align:center;">
                    <h1 style="margin:0; font-size:22px; color:#111;">Swing Social</h1>
                    <p style="margin:8px 0 0; color:#666;">You have a new friend request</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 32px; border-top:1px solid #eee;">
                    <p style="font-size:16px; margin:0 0 12px; color:#222;">
                      <strong>${userName}</strong> wants to connect with you.
                    </p>

                    <p style="margin:0 0 18px; color:#555; line-height:1.5;">
                      Click below to view their profile or respond to the request.
                    </p>

                    

                    <table cellpadding="0" cellspacing="0" style="margin:18px 0;">
                      <tr>
                        <td align="center" style="padding-right:8px;">
                          <a href="${acceptUrl}" target="_blank" rel="noopener"
                            style="display:inline-block; padding:12px 22px; background:#4CAF50; color:#ffffff; 
                                   text-decoration:none; border-radius:6px; font-weight:600;">
                            Accept
                          </a>
                        </td>

                        <td align="center" style="padding-left:8px;">
                          <a href="${declineUrl}" target="_blank" rel="noopener"
                            style="display:inline-block; padding:12px 22px; background:#f44336; color:#ffffff; 
                                   text-decoration:none; border-radius:6px; font-weight:600;">
                            Decline
                          </a>
                        </td>
                      </tr>
                    </table>

                    <hr style="border:none; border-top:1px solid #eee; margin:18px 0;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

      const textBody = `${userName} has sent you a friend request on Swing Social.

Accept: ${acceptUrl}
Decline: ${declineUrl}

If you didn't expect this, ignore this message.
`;

      const mailResponse = await fetch("/api/user/mailbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromId: profileId,
          toId: userid,
          subject,
          htmlBody,
          textBody,
        }),
      });

      if (!mailResponse.ok) {
        throw new Error(`Failed to send email. Status: ${mailResponse.status}`);
      }

      toast.success("Friend request sent 🎉", { autoClose: 1000 });

      const notifyResponse = await fetch(
        "/api/user/notification/requestfriend",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userid,
            title: "New Friend Request!",
            body: `${userName} sent you a friend request!`,
            type: "friend_request",
            url: `https://swing-social-user.vercel.app/mailbox/${userid}`,
          }),
        },
      );
      if (!notifyResponse.ok) {
        throw new Error(`Failed to notify. Status: ${notifyResponse.status}`);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.message ?? "Something went wrong", {
        autoClose: 4000,
      });
    }
  };

  const handleBlockFriend = async () => {
    try {
      const checkResponse = await fetch("/api/user/profile/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: profileId,
          targetId: userid,
        }),
      });

      const checkData = await checkResponse.json();

      if (checkResponse.ok) {
        toast.success("Friend has been blocked successfully!");
        handleClose();
      } else {
        toast.error(checkData.message || "Failed to block friend.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleGrantModal = () => {
    handleGrantAccess();
    setGrantOpen(false);
  };

  const handlePrivateModal = () => {
    setPrivateOpen(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.pageY - (scrollContainerRef.current?.offsetTop || 0));
    setScrollTop(scrollContainerRef.current?.scrollTop || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const y = e.pageY - (scrollContainerRef.current.offsetTop || 0);
    const walk = (y - startY) * 2;
    scrollContainerRef.current.scrollTop = scrollTop - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(
      e.touches[0].pageY - (scrollContainerRef.current?.offsetTop || 0),
    );
    setScrollTop(scrollContainerRef.current?.scrollTop || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const y = e.touches[0].pageY - (scrollContainerRef.current.offsetTop || 0);
    const walk = (y - startY) * 2;
    scrollContainerRef.current.scrollTop = scrollTop - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleOpenImage = (src: string | null | undefined) => {
    if (!src) return;
    setModalImageSrc(src);
    setOpenImageModal(true);
  };

  const handleCloseImageModal = () => {
    setOpenImageModal(false);
    setModalImageSrc(null);
  };

  useEffect(() => {
    if (!open) return;

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();

      if (open) {
        handleClose();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open, handleClose]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        scroll="paper"
        fullWidth
        maxWidth="md"
        aria-labelledby="user-profile-dialog"
        PaperProps={{
          sx: {
            backgroundColor: "#121212",
            color: "white",
            maxHeight: "90vh",
            overflow: "hidden",
            borderRadius: 2,
            transition: "transform 0.3s ease-in-out",
          },
        }}
        sx={{
          backdropFilter: openImageModal ? "blur(6px)" : "none",
        }}
      >
        {loading ? (
          <>
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.7)",
                zIndex: 1301,
              }}
            >
              <CircularProgress size={60} color="secondary" />
            </Box>
          </>
        ) : (
          <>
            <DialogTitle
              id="user-profile-dialog"
              sx={{
                p: 2,
                fontWeight: "bold",
                backgroundColor: "#121212",
                color: "white",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              User Profile
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: "white",
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent
              dividers
              sx={{
                p: 0,
                maxHeight: "calc(90vh - 64px)",
                overflowY: "auto",
              }}
            >
              <Box
                ref={scrollContainerRef}
                sx={{
                  position: "relative",
                  background: "#121212",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  cursor: isDragging ? "grabbing" : "grab",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Banner Section */}
                <Box
                  onClick={() => handleOpenImage(advertiser?.ProfileBanner)}
                  sx={{
                    height: { lg: 450, sm: 200, xs: 200 },
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={advertiser?.ProfileBanner}
                    alt="Profile Banner"
                    loading="lazy"
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </Box>

                {/* Avatar and Basic Info */}
                <Box sx={{ position: "relative", mt: -8, px: 3 }}>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {/* Avatar */}
                    <Box
                      sx={{
                        width: 110,
                        height: 110,
                        minWidth: 110,
                        minHeight: 110,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "2px solid white",
                        boxShadow: 2,
                        bgcolor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                      onClick={() =>
                        handleOpenImage(advertiser?.Avatar ?? "/noavatar.png")
                      }
                    >
                      <img
                        src={advertiser?.Avatar}
                        alt="user-avatar"
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          borderRadius: "50%",
                        }}
                      />
                    </Box>

                    {/* Chips column */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.8,
                      }}
                    >
                      <Chip
                        label={advertiser?.AccountType}
                        color="primary"
                        size="small"
                        sx={{ width: "fit-content" }}
                      />

                      {advertiser?.selfie_verification_status === "true" && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            px: "10px",
                            py: "4px",
                            background:
                              "linear-gradient(135deg, #ff4d6d, #ff758f)",
                            borderRadius: "20px",
                            zIndex: 10,
                          }}
                        >
                          <Box
                            component="img"
                            src="/verified-badge.svg"
                            alt="Verified"
                            sx={{
                              width: 14,
                              height: 14,
                              filter: "brightness(0) invert(1)",
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: "10px",
                              color: "#fff",
                              fontWeight: 600,
                              lineHeight: 1,
                              whiteSpace: "nowrap",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Profile Verified
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Content Section */}
                <CardContent>
                  <Typography
                    color="#FFFFFF"
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      marginLeft: "15px",
                      marginBottom: "10px",
                    }}
                  >
                    <span>
                      {advertiser.Username},
                      {advertiser?.DateOfBirth
                        ? new Date().getFullYear() -
                          new Date(advertiser.DateOfBirth).getFullYear()
                        : ""}
                      {advertiser?.Gender === "Male"
                        ? "M"
                        : advertiser?.Gender === "Female"
                          ? "F"
                          : ""}
                      {advertiser?.PartnerDateOfBirth &&
                      advertiser?.PartnerGender
                        ? ` | ${
                            new Date().getFullYear() -
                            new Date(
                              advertiser.PartnerDateOfBirth,
                            ).getFullYear()
                          }${
                            advertiser.PartnerGender === "Male"
                              ? "M"
                              : advertiser.PartnerGender === "Female"
                                ? "F"
                                : ""
                          }`
                        : ""}
                    </span>
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    dangerouslySetInnerHTML={{ __html: advertiser?.Tagline }}
                    sx={{
                      color: "#FF1B6B",
                      marginLeft: "15px",
                      fontWeight: "bold",
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                    }}
                  ></Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: "#9C27B0",
                      marginLeft: "15px",
                      marginTop: "5px",
                    }}
                  >
                    {advertiser?.Location?.replace(", USA", "")}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: "#FFFFFF",
                      marginLeft: "15px",
                      marginTop: "5px",
                      marginBottom: "5px",
                    }}
                  >
                    {advertiser?.BodyType}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 0.5,
                      borderRadius: 2,
                      marginBottom: 1,
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={() =>
                        router.push(`/messaging/${advertiser?.Id}`)
                      }
                      sx={{
                        flex: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#555",
                        color: "white",
                        borderRadius: 1,
                        padding: 0.5,
                        minWidth: "80px",
                      }}
                    >
                      <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                        Chat with {advertiser?.Username}
                      </span>
                    </Button>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      borderRadius: 2,
                    }}
                  >
                    <Button
                      onClick={handleBlockFriend}
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#555",
                        color: "white",
                        borderRadius: 1,
                        padding: 1,
                        minWidth: "80px",
                      }}
                    >
                      <Block fontSize="small" />
                    </Button>

                    <Button
                      onClick={handleAddFriend}
                      variant="contained"
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#555",
                        color: "white",
                        borderRadius: 1,
                        padding: 1,
                        minWidth: "80px",
                      }}
                    >
                      <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                        Friend
                      </span>
                    </Button>

                    {/* <Button
                      variant="contained"
                      sx={{
                        flex: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#555",
                        color: "white",
                        borderRadius: 1,
                        padding: 1,
                        minWidth: "80px",
                      }}
                    >
                      <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                        Mail
                      </span>
                    </Button> */}
                  </Box>

                  <Typography
                    variant="subtitle1"
                    sx={{ marginTop: "15px" }}
                    color="white"
                  >
                    <strong>About:</strong>{" "}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: advertiser.About,
                      }}
                    />
                  </Typography>

                  <Grid container spacing={3} mt={2}>
                    <Grid item xs={12} md={12}>
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="white"
                        >
                          Details
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Table sx={{ borderRadius: 4 }}>
                          <TableBody>
                            <TableRow>
                              <TableCell
                                sx={{
                                  backgroundColor: "gray",
                                  width: "30%",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Typography variant="body2" color="white">
                                  Body Type:
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor: "darkgray",
                                  width: "70%",
                                }}
                              >
                                <Typography color="white">
                                  {advertiser?.BodyType || "N/A"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell
                                sx={{
                                  backgroundColor: "gray",
                                  width: "30%",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Typography variant="body2" color="white">
                                  Hair Color:
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor: "darkgray",
                                  width: "70%",
                                }}
                              >
                                <Typography color="white">
                                  {advertiser?.HairColor || "N/A"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell
                                sx={{
                                  backgroundColor: "gray",
                                  width: "30%",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Typography variant="body2" color="white">
                                  Eye Color:
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor: "darkgray",
                                  width: "70%",
                                }}
                              >
                                <Typography color="white">
                                  {advertiser?.EyeColor || "N/A"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell
                                sx={{
                                  backgroundColor: "gray",
                                  width: "30%",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Typography variant="body2" color="white">
                                  Miles (From Arlington):
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor: "darkgray",
                                  width: "70%",
                                }}
                              >
                                <Typography color="white">
                                  {advertiser?.miles?.toFixed(2) || "N/A"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell
                                sx={{
                                  backgroundColor: "gray",
                                  width: "30%",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Typography variant="body2" color="white">
                                  Sexual Orientation:
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor: "darkgray",
                                  width: "70%",
                                }}
                              >
                                <Typography color="white">
                                  {advertiser?.SexualOrientation || "N/A"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Box>
                      {/* Partner Details Section */}
                      {!advertiser.PartnerGender ? (
                        <Box mt={3}>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            color="white"
                          >
                            Partner Details
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          <Table sx={{ borderRadius: 4 }}>
                            <TableBody>
                              <TableRow>
                                <TableCell
                                  sx={{
                                    backgroundColor: "gray",
                                    width: "30%", // First cell (label) width
                                    whiteSpace: "nowrap", // Prevents text wrapping
                                  }}
                                >
                                  <Typography variant="body2" color="white">
                                    Age:
                                  </Typography>
                                </TableCell>
                                <TableCell
                                  sx={{
                                    backgroundColor: "darkgray",
                                    width: "70%",
                                  }}
                                >
                                  <Typography color="white">
                                    {advertiser?.PartnerAge || "N/A"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  sx={{ backgroundColor: "gray", width: "30%" }}
                                >
                                  <Typography variant="body2" color="white">
                                    Gender:
                                  </Typography>
                                </TableCell>
                                <TableCell
                                  sx={{
                                    backgroundColor: "darkgray",
                                    width: "70%",
                                  }}
                                >
                                  <Typography color="white">
                                    {advertiser?.PartnerGender || "N/A"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  sx={{ backgroundColor: "gray", width: "30%" }}
                                >
                                  <Typography variant="body2" color="white">
                                    Height:
                                  </Typography>
                                </TableCell>
                                <TableCell
                                  sx={{
                                    backgroundColor: "darkgray",
                                    width: "70%",
                                  }}
                                >
                                  <Typography color="white">
                                    {advertiser?.PartnerHeight || "N/A"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  sx={{ backgroundColor: "gray", width: "30%" }}
                                >
                                  <Typography variant="body2" color="white">
                                    Sexual Orientation:
                                  </Typography>
                                </TableCell>
                                <TableCell
                                  sx={{
                                    backgroundColor: "darkgray",
                                    width: "70%",
                                  }}
                                >
                                  <Typography color="white">
                                    {advertiser?.PartnerSexualOrientation ||
                                      "N/A"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  sx={{ backgroundColor: "gray", width: "30%" }}
                                >
                                  <Typography variant="body2" color="white">
                                    Body Type:
                                  </Typography>
                                </TableCell>
                                <TableCell
                                  sx={{
                                    backgroundColor: "darkgray",
                                    width: "70%",
                                  }}
                                >
                                  <Typography color="white">
                                    {advertiser?.PartnerBodyType || "N/A"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  sx={{ backgroundColor: "gray", width: "30%" }}
                                >
                                  <Typography variant="body2" color="white">
                                    Eye Color:
                                  </Typography>
                                </TableCell>
                                <TableCell
                                  sx={{
                                    backgroundColor: "darkgray",
                                    width: "70%",
                                  }}
                                >
                                  <Typography color="white">
                                    {advertiser?.PartnerEyeColor || "N/A"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  sx={{ backgroundColor: "gray", width: "30%" }}
                                >
                                  <Typography variant="body2" color="white">
                                    Hair Color:
                                  </Typography>
                                </TableCell>
                                <TableCell
                                  sx={{
                                    backgroundColor: "darkgray",
                                    width: "70%",
                                  }}
                                >
                                  <Typography color="white">
                                    {advertiser?.PartnerHairColor || "N/A"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Box>
                      ) : null}
                    </Grid>
                  </Grid>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      padding: 1,
                      borderRadius: 2,
                      mt: 3,
                    }}
                  >
                    {/* Button 1: Public Images */}
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: "#c2185b",
                        color: "white",
                        fontSize: "0.75rem",
                        padding: "12px 12px",
                        flex: 1,
                      }}
                    >
                      Public Images
                    </Button>

                    {/* Button 2: Grant Permission */}
                    <Button
                      onClick={() => setGrantOpen(true)}
                      variant="contained"
                      sx={{
                        backgroundColor: "#c2185b",
                        color: "white",
                        fontSize: "0.75rem",
                        padding: "12px 12px",
                        flex: 1,
                      }}
                    >
                      Grant Permission
                    </Button>

                    {/* Button 3: Private Images */}
                    <Button
                      onClick={() => {
                        setPrivateOpen(true);
                      }}
                      variant="contained"
                      sx={{
                        backgroundColor: "#c2185b",
                        color: "white",
                        fontSize: "0.75rem",
                        padding: "12px 12px",
                        flex: 1,
                      }}
                    >
                      Private Images
                    </Button>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: 2,
                      bgcolor: "#1e1e1e",
                      color: "white",
                      borderRadius: 2,
                      gap: 2,
                    }}
                  >
                    {/* Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        color: "white",
                        textAlign: "center",
                        marginBottom: 2,
                      }}
                    >
                      Profile Photos
                    </Typography>
                    {/* Photos Grid */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      {profileImages?.length > 0 ? (
                        profileImages?.map((image: any, index: number) => (
                          <Box
                            key={index}
                            sx={{
                              width: 215,
                              height: 280,
                              borderRadius: 2,
                              overflow: "hidden",
                              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
                            }}
                          >
                            <img
                              src={image?.Url}
                              alt={`Profile Photo ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </Box>
                        ))
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "gray",
                            textAlign: "center",
                          }}
                        >
                          No photos available
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      padding: 2,
                      borderRadius: 2,
                      mt: 3,
                      mb: 3,
                      background: "white",
                    }}
                  >
                    {/* Radio Tabs */}
                    <RadioGroup
                      row
                      value={selectedTab}
                      onChange={(e) => setSelectedTab(e.target.value)}
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 3,
                        alignItems: "center",
                      }}
                    >
                      <FormControlLabel
                        value="RSVP"
                        control={<Radio />}
                        label="RSVP"
                        sx={{
                          color: "black",
                          "& .MuiTypography-root": {
                            color: "black",
                          },
                          "& .MuiRadio-root": {
                            color: "#c2185b",
                          },
                        }}
                      />
                      <FormControlLabel
                        value="All Events"
                        control={<Radio />}
                        label="All Events"
                        sx={{
                          color: "black",
                          "& .MuiTypography-root": {
                            color: "black",
                          },
                          "& .MuiRadio-root": {
                            color: "#c2185b",
                          },
                        }}
                      />
                    </RadioGroup>
                  </Box>

                  {/* Event Cards */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 3,
                    }}
                  >
                    {filteredEvents.length > 0 ? (
                      filteredEvents.map((event: any) => (
                        <Card
                          key={event.Id}
                          sx={{
                            width: 340,
                            borderRadius: 4,
                            overflow: "hidden",
                            position: "relative",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                            transition: "all .3s",
                            "&:hover": {
                              transform: "translateY(-6px)",
                              boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
                            },
                          }}
                        >
                          {/* Image with gradient overlay */}
                          <Box sx={{ position: "relative" }}>
                            <CardMedia
                              component="img"
                              height="180"
                              image={event.CoverImageUrl}
                              alt={event.Name}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                inset: 0,
                                background:
                                  "linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(0,0,0,0.6))",
                              }}
                            />
                            <Typography
                              variant="h6"
                              sx={{
                                position: "absolute",
                                bottom: 12,
                                left: 16,
                                color: "white",
                                fontWeight: 700,
                                textShadow: "0 2px 6px rgba(0,0,0,0.5)",
                              }}
                            >
                              {event.Name}
                            </Typography>
                          </Box>

                          <CardContent>
                            {/* Description */}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                              dangerouslySetInnerHTML={{
                                __html:
                                  event.Description &&
                                  typeof event.Description === "string" &&
                                  event.Description.length > 160
                                    ? `${event.Description.slice(0, 160)}...`
                                    : event.Description || "",
                              }}
                            />

                            {/* Venue */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mt: 2,
                              }}
                            >
                              <MapPin size={18} style={{ marginRight: 6 }} />
                              <Typography variant="body2">
                                {event.Venue}
                              </Typography>
                            </Box>

                            {/* Time (if needed) */}
                            {event.StartTime && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mt: 1,
                                }}
                              >
                                <Clock size={18} style={{ marginRight: 6 }} />
                                <Typography variant="body2">
                                  {new Date(event.StartTime).toLocaleString()}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Grid container spacing={3} mt={1}>
                        {rsvp?.length > 0 &&
                          rsvp.map((item: any) => (
                            <Grid item xs={12} key={item.Id}>
                              <Card
                                sx={{
                                  borderRadius: 4,
                                  overflow: "hidden",
                                  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                                  transition: "all .3s",
                                  "&:hover": {
                                    transform: "translateY(-4px)",
                                  },
                                }}
                              >
                                {/* Image */}
                                <CardMedia
                                  component="img"
                                  height="220"
                                  image={item.CoverImageUrl}
                                  alt={item.Name}
                                />

                                <CardContent>
                                  {/* Title */}
                                  <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    gutterBottom
                                  >
                                    {item.Name}
                                  </Typography>

                                  {/* Tagline */}
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    gutterBottom
                                  >
                                    {item.Tagline}
                                  </Typography>

                                  {/* Avatar + username */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      mt: 1,
                                    }}
                                  >
                                    <Avatar
                                      src={item.Avatar}
                                      alt={item.Username}
                                      sx={{ mr: 1.5, width: 42, height: 42 }}
                                    />
                                    <Typography variant="body1">
                                      {item.Username}
                                    </Typography>
                                  </Box>

                                  {/* Start & End */}
                                  <Box sx={{ mt: 2 }}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      <Calendar
                                        size={16}
                                        style={{ marginRight: 6 }}
                                      />
                                      <strong>Start:</strong>{" "}
                                      {new Date(
                                        item.StartTime,
                                      ).toLocaleString()}
                                    </Typography>

                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      mt={0.5}
                                    >
                                      <Calendar
                                        size={16}
                                        style={{ marginRight: 6 }}
                                      />
                                      <strong>End:</strong>{" "}
                                      {new Date(item.EndTime).toLocaleString()}
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                      </Grid>
                    )}
                  </Box>
                </CardContent>
              </Box>
            </DialogContent>

            <Dialog open={grantOpen}>
              <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                Grant Permission Status
              </DialogTitle>
              <DialogContent>
                <Typography gutterBottom>
                  Click Ok to grant permission to this user to your private
                  pics.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button
                  autoFocus
                  onClick={handleGrantModal}
                  sx={{ color: "red" }}
                >
                  Ok
                </Button>
                <Button
                  autoFocus
                  onClick={() => setGrantOpen(false)}
                  sx={{ color: "red" }}
                >
                  Cancel
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog open={privateOpen}>
              <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                Permission Status
              </DialogTitle>
              <DialogContent>
                <Typography gutterBottom>
                  Click Ok to send a request to this user for access to their
                  private images.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button
                  autoFocus
                  onClick={handlePrivateModal}
                  sx={{ color: "red" }}
                >
                  Ok
                </Button>
                <Button
                  autoFocus
                  onClick={() => setPrivateOpen(false)}
                  sx={{ color: "red" }}
                >
                  Cancel
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={openImageModal}
              onClose={handleCloseImageModal}
              maxWidth="lg"
              fullWidth
              aria-labelledby="image-preview-dialog"
              PaperProps={{
                sx: {
                  backgroundColor: "#000",
                  boxShadow: "none",
                  borderRadius: 2,
                  overflow: "hidden",
                },
              }}
            >
              <DialogTitle
                sx={{
                  p: 1,
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  backgroundColor: "#000",
                }}
              >
                <IconButton
                  onClick={handleCloseImageModal}
                  sx={{
                    color: "#fff",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                    },
                  }}
                >
                  <X size={20} />
                </IconButton>
              </DialogTitle>
              <DialogContent
                sx={{
                  p: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#000",
                  height: fullScreen ? "100vh" : "80vh",
                }}
              >
                {modalImageSrc && (
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      maxHeight: "100%",
                      maxWidth: "100%",
                      borderRadius: "10px",
                    }}
                  >
                    <img
                      src={modalImageSrc}
                      alt="Full View"
                      loading="lazy"
                      style={{
                        objectFit: "contain",
                        width: "100%",
                        height: "100%",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    />
                  </Box>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </Dialog>
    </>
  );
};

export default UserProfileModal;
