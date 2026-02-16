"use client";

import Header from "@/components/Header";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  IconButton,
  TextField,
  Avatar,
  Modal,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  CircularProgress,
  FormHelperText,
  Container,
  Paper,
  Tooltip,
  Fade,
  Grow,
  Slide,
  useTheme,
  useMediaQuery,
  Alert,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import DTicketListComponent from "@/components/DTicketListComponent";
import MTicketListComponent from "@/components/MTicketListComponent";
import RSVPListComponent from "@/components/RSVPListComponent";
import AttendeesListComponent from "@/components/AttendeesListComponent";
import { Editor } from "@tinymce/tinymce-react";
import { useRouter } from "next/navigation";
import * as Papa from "papaparse";
import {
  Flag,
  Add as AddIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  ChevronLeft,
  ChevronRight,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import UserProfileModal from "@/components/UserProfileModal";
import ProfileImgCheckerModel from "@/components/ProfileImgCheckerModel";
import { formatDateEST } from "@/utils/formatDateEST";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";

type Params = Promise<{ id: string }>;

export default function EventDetail(props: { params: Params }) {
  const [id, setId] = useState<string>("");
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  const [membership, setMembership] = useState(0);
  const [loginProfileId, setLoginProfileId] = useState<any>("");
  const [eventDetail, setEventDetail] = useState<any>(null);
  const [rsvp, setRsvp] = useState<any>([]);
  const [attendees, setAttendees] = useState<any>([]);
  const [tickets, setTicket] = useState<any>([]);
  const [summary, setSummary] = useState<any>({
    totalQuantity: 0,
    totalPrice: 0,
    ticketName: "",
    ticketType: "",
  });
  const [showDetail, setShowDetail] = useState<any>(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [emailDescriptionData, setEmailDescriptionData] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setError] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isMobile = useMediaQuery("(max-width: 480px)") ? true : false;
  const [profileId, setProfileId] = useState<any>();
  const [profileUsername, setProfileUsername] = useState<any>();
  const [targetId, setTargetId] = useState<any>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    reportUser: false,
    blockUser: false,
    reportImage: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    emailDescription: eventDetail?.Description,
    emailSubject: eventDetail?.Name,
    rsvpChecked: false,
    attendeeChecked: false,
  });
  const [openSaveRsvp, setOpenSaveRsvp] = useState(false);
  const [openDownloadModal, setOpenDownloadModal] = useState(false);
  const [downloadAttendee, setDownloadAttendee] = useState(false);
  const [downloadRsvp, setDownloadRsvp] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [openModalUser, setOpenModalUser] = useState<{
    state: boolean;
    id: null | string;
  }>({
    state: false,
    id: null,
  });

  const handleUpgrade = () => {
    router.push("/membership");
  };

  useEffect(() => {
    const token = localStorage.getItem("loginInfo");
    const profileId = localStorage.getItem("logged_in_profile");
    if (token) {
      const decodeToken = jwtDecode<any>(token);
      setMembership(decodeToken.membership);
      setLoginProfileId(profileId);
    } else {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    const getIdFromParam = async () => {
      const params = await props.params;
      const pid: any = params.id;
      setId(pid);
    };
    getIdFromParam();
  }, [props]);

  useEffect(() => {
    if (id) {
      handleGetEventDetail(id);
    }
  }, [id]);

  useEffect(() => {
    setShowContent(true);
  }, []);

  const handleTicketsChange = useCallback(
    (quantity: any = 0, price: any = 0, name: any, type: any) => {
      if (isMobile) {
        setSummary({
          totalQuantity: quantity,
          totalPrice: price,
          ticketName: name,
          ticketType: type,
        });
      }
    },
    [isMobile],
  );

  const handleGetEventDetail = async (eventId: any) => {
    try {
      const checkResponse = await fetch("/api/user/events?eventId=" + eventId, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const eventData = await checkResponse.json();
      const eventDescription = eventData?.event?.Description;
      eventData?.tickets.forEach((ticket: any) => {
        ticket.Description = eventDescription;
      });

      setEventDetail(eventData?.event);
      setRsvp(eventData?.rsvp);
      setAttendees(eventData?.attendees);
      setTicket(eventData?.tickets);
      setEmailDescriptionData(eventData?.event?.EmailDescription);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProfileId(localStorage.getItem("logged_in_profile"));
      setProfileUsername(localStorage.getItem("profileUsername"));
    }
  }, []);

  const handleReportModalToggle = (pid: string) => {
    setTargetId(pid);
    setIsReportModalOpen((prev) => !prev);
  };

  const handleCheckboxChange = (event: any) => {
    const { name, checked } = event.target;
    setReportOptions((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleEmailCheckboxChange = (field: any) => {
    setFormState((prev: any) => ({ ...prev, [field]: !prev[field] }));
  };

  const reportImageApi = async ({
    reportedById,
    reportedByName,
    reportedUserId,
    reportedUserName,
    image,
  }: {
    reportedById: string;
    reportedByName: string;
    reportedUserId: string;
    reportedUserName: string;
    image: string;
  }) => {
    try {
      const response = await fetch("/api/user/reportedUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportedById,
          reportedByName,
          reportedUserId,
          reportedUserName,
          image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.message || "Failed to report image.");
        return false;
      }

      toast.success("Image reported successfully!");
      return true;
    } catch (err) {
      console.error("Error reporting image:", err);
      toast.error("Error reporting image.");
      return false;
    }
  };

  const handleReportSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem("loginInfo");
    const decodeToken = token ? jwtDecode<any>(token) : {};
    const reportedByName = decodeToken?.profileName || "Me";

    try {
      if (reportOptions.reportImage) {
        await reportImageApi({
          reportedById: profileId,
          reportedByName,
          reportedUserId: eventDetail?.OrganizerId,
          reportedUserName: eventDetail?.Username,
          image: eventDetail?.Avatar,
        });
      }

      if (reportOptions.reportUser || reportOptions.blockUser) {
        const res = await fetch("/api/user/sweeping/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileid: profileId,
            targetid: targetId,
          }),
        });

        if (!res.ok) {
          toast.error("Failed to report user.");
          return null;
        }

        await res.json();
        toast.success("User reported successfully");
      }

      if (
        reportOptions.reportImage ||
        reportOptions.reportUser ||
        reportOptions.blockUser
      ) {
        setIsReportModalOpen(false);
        setReportOptions({
          reportUser: false,
          blockUser: false,
          reportImage: false,
        });
      }
    } catch (err) {
      toast.error("An error occurred while reporting.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [profileId, reportOptions]);

  const handleSendEmail = async (): Promise<void> => {
    setLoading(true);

    try {
      let recipients: any[] = [];

      if (formState.rsvpChecked) {
        recipients = [...recipients, ...rsvp];
      }

      if (formState.attendeeChecked) {
        recipients = [...recipients, ...attendees];
      }

      recipients = Array.from(new Set(recipients));

      if (recipients.length === 0) {
        setError(
          "Please select at least one recipient group (RSVP or Attendee).",
        );
        setLoading(false);
        return;
      }

      if (recipients.length > 0) {
        setError("");
      }

      const response = await fetch("/api/user/events/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients,
          subject: formState.emailSubject,
          htmlBody: formState.emailDescription,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email. Status: ${response.status}`);
      }

      const data = await response.json();

      Swal.fire({
        title: "Emails Sent!",
        html: `
        <p>Total Recipients: <strong>${data.totalRecipients}</strong></p>
        <p>Successfully Sent: <strong>${data.totalSent}</strong></p>
        <p>Failed to Send: <strong>${data.totalFailed}</strong></p>
      `,
        icon: "success",
        confirmButtonText: "OK",
      });
      setOpen(false);
    } catch (error: any) {
      console.error("Error sending bulk email:", error);
      setError("Failed to send emails.");

      Swal.fire({
        title: "Error!",
        text: "Something went wrong while sending emails.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditorChange = (field: any, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (event: any) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpen = () => {
    formState.emailDescription = eventDetail?.Description;
    formState.emailSubject = eventDetail?.Name;
    setOpen(true);
  };

  const handleCloseHere = () => setOpen(false);

  const handleSaveRsvp = async (eventId: any) => {
    const response = await fetch("/api/user/events/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: eventId,
        profileId: profileId,
      }),
    });

    const data = await response.json();

    if (data.status == 200) {
      setOpenSaveRsvp(!openSaveRsvp);
    }
  };

  const deleteEvent = async (eventId: any) => {
    const response = await fetch("/api/user/events/delete/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: eventId,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      router.push("/events");
    } else {
      toast.error("Failed to delete this event");
    }
  };

  const handleCloseDownloadModal = () => setOpenDownloadModal(false);

  const handleDownloadAttendeeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDownloadAttendee(event.target.checked);
  };

  const handleDownloadRsvpChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDownloadRsvp(event.target.checked);
  };

  const handleDownloadList = () => {
    if (!downloadAttendee && !downloadRsvp) {
      alert("Please select at least one option to download.");
      return;
    }

    // Check if downloadAttendee is selected
    if (downloadAttendee && attendees.length > 0) {
      handleExportCSV("Attendees", attendees);
    } else if (downloadAttendee) {
      alert("No Attendee data available to export.");
    }

    // Check if downloadRsvp is selected
    if (downloadRsvp && rsvp.length > 0) {
      handleExportCSV("RSVP", rsvp);
    } else if (downloadRsvp) {
      alert("No RSVP data available to export.");
    }

    handleCloseDownloadModal(); // Close the modal after the download action
  };

  const handleExportCSV = async (type: any, data: any) => {
    if (!data || data.length === 0) {
      alert(`Not data available to export ${type}.`);
      return;
    }

    try {
      const profileIds = data
        .filter((entry: any) => entry.ProfileId)
        .map((entry: any) => entry.ProfileId);

      if (profileIds.length === 0) {
        return;
      }

      const userResponse = await fetch(`/api/user/reports/user-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileIds }),
      });

      if (!userResponse.ok) {
        throw new Error(
          `Error al obtener datos de usuario: ${userResponse.statusText}`,
        );
      }

      const userData = await userResponse.json();

      if (!userData.users || !Array.isArray(userData.users)) {
        throw new Error("Formato de respuesta inválido del servidor");
      }

      const csvData = userData.users.map((user: any) => {
        const originalEntry = data.find(
          (entry: any) => entry.ProfileId === user.ProfileId,
        );

        return {
          ProfileId: user.ProfileId || originalEntry?.ProfileId || "N/A",
          Username: user.Username || "N/A",
          Name: user.Name || user.FullName || "N/A",
          Email: user.Email || "N/A",

          Phone: originalEntry?.Phone || user.Phone || "N/A",
          TicketId: originalEntry?.TicketId || "N/A",
          TicketType: originalEntry?.TicketType || "N/A",
          Price: originalEntry?.Price || "N/A",
          Status:
            type === "RSVP"
              ? originalEntry?.RSVPStatus || "N/A"
              : originalEntry?.AttendanceStatus || "N/A",
        };
      });

      const BOM = "\uFEFF";
      const csvContent = Papa.unparse(csvData, {
        header: true,
        quotes: true,
      });

      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[-:T]/g, "");

      link.setAttribute("href", url);
      link.setAttribute("download", `${type}_List_${timestamp}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exportando CSV:", error);
    }
  };

  const handleSlideChange = (direction: string) => {
    const imagesLength = eventDetail?.Images?.length || 0;
    if (direction === "next") {
      setCurrentImageIndex((prev) => (prev + 1) % imagesLength);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + imagesLength) % imagesLength);
    }
  };

  const handleGrantAccess = async () => {
    try {
      // const checkResponse = await fetch('/api/user/sweeping/grant', {
      //     method: 'POST',
      //     headers: {
      //         'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({ profileid: profileId, targetid: userProfiles[currentIndex]?.Id }),
      // });

      // const checkData = await checkResponse.json();
      const checkData = "121212";
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleClose = () => {
    setShowDetail(false);
    setSelectedUserId(null);
    if (window.history.state?.modal === "userProfile") {
      window.history.back();
    }
  };

  const handleEmailRequest = async () => {
    if (!attendees || attendees.length === 0) {
      Swal.fire({
        title: "No Attendees",
        text: "There are no attendees to send.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    const usernames = attendees.map((attendee: any) => attendee.Username);

    const payload = {
      usernames,
    };

    setLoadingEmail(true);

    try {
      const response = await fetch("/api/user/sendAttendeesList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Swal.fire({
          title: "Email Sent",
          text: "The attendees list was successfully emailed to the organizer.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: "Failed to Send Email",
          text:
            errorData.message ||
            "An error occurred while sending the attendees list.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Email error:", error);
      Swal.fire({
        title: "Error",
        text: "Something went wrong while sending the email.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "#0A0A0A",
        minHeight: "100vh",
        color: "white",
        pb: 8,
        background: "linear-gradient(to bottom, #0A0A0A, #1A1A1A)",
      }}
    >
      <Header />
      <Grid container spacing={2} sx={{ marginTop: 10 }}>
        {isMobile ? (
          <Grid item xs={12} sm={12} lg={12}>
            <UserProfileModal
              handleGrantAccess={handleGrantAccess}
              handleClose={handleClose}
              open={showDetail}
              userid={selectedUserId}
            />
            <Card
              sx={{
                borderRadius: "10px",
                backgroundColor: "#1d1d1d",
                marginBottom: 5,
              }}
            >
              <CardContent
                sx={{
                  backgroundColor: "#0a0a0a",
                }}
              >
                <Typography variant="h2" color="white" textAlign={"center"}>
                  {eventDetail?.Name}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginTop: "8px",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    style={{ color: "white" }}
                  >
                    <strong style={{ color: "white" }}>Start at:</strong>
                    <Typography color="white">
                      {formatDateEST(eventDetail?.StartTime)}
                    </Typography>
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    style={{ color: "white" }}
                  >
                    <strong style={{ color: "white" }}>End at:</strong>{" "}
                    <Typography color="white">
                      {formatDateEST(eventDetail?.EndTime)}
                    </Typography>
                  </Typography>
                </Box>

                {/* Post Card */}
                <Card
                  sx={{
                    borderRadius: "10px",
                    marginTop: 10,
                    background: "#000000",
                  }}
                >
                  <img
                    src={eventDetail?.CoverImageUrl} // Placeholder image for the post
                    alt="Post Image"
                    style={{
                      width: "100%",
                      borderTopLeftRadius: "10px",
                      borderTopRightRadius: "10px",
                    }}
                  />
                  <CardContent sx={{ padding: 0, paddingBottom: 0 }}>
                    {profileUsername === eventDetail?.Username ? (
                      <Grid
                        container
                        sx={{ paddingBottom: 0, justifyContent: "right" }}
                      >
                        <Grid item lg={6} md={6} sm={6} xs={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={() => deleteEvent(eventDetail.EventId)}
                            sx={{
                              textTransform: "none",
                              backgroundColor: "#f50057",
                              py: 1.5,
                              marginLeft: 1,
                              fontSize: "16px",
                              fontWeight: "bold",
                            }}
                          >
                            Delete
                          </Button>
                        </Grid>
                        <Grid item lg={6} md={6} sm={6} xs={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={() =>
                              router.push(
                                `/events/edit?q=${eventDetail?.EventId}`,
                              )
                            }
                            sx={{
                              textTransform: "none",
                              backgroundColor: "#f50057",
                              py: 1.5,
                              marginLeft: 1,
                              fontSize: "16px",
                              fontWeight: "bold",
                            }}
                          >
                            Edit
                          </Button>
                        </Grid>
                      </Grid>
                    ) : (
                      <Grid
                        container
                        sx={{ paddingBottom: 0, justifyContent: "right" }}
                      >
                        <Grid
                          item
                          lg={2}
                          md={2}
                          sm={2}
                          xs={2}
                          sx={{ textAlign: "right" }}
                        >
                          <IconButton
                            sx={{ color: "#f50057" }}
                            onClick={() =>
                              handleReportModalToggle(eventDetail?.UserId)
                            }
                          >
                            <Flag sx={{ fontSize: "40px" }} />
                          </IconButton>
                        </Grid>
                      </Grid>
                    )}
                  </CardContent>
                </Card>

                <Box>
                  <Typography variant="h6" fontWeight="bold" color="white">
                    Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Table sx={{ borderRadius: 4 }}>
                    <TableBody>
                      <TableRow>
                        <TableCell
                          sx={{
                            backgroundColor: "lightgray",
                            width: "30%", // First cell takes 30% of the row
                            whiteSpace: "nowrap", // Prevents text wrapping
                          }}
                        >
                          <Typography variant="body2" color="white">
                            Start Time:
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{ backgroundColor: "darkgray", width: "70%" }}
                        >
                          <Typography color="white">
                            {formatDateEST(eventDetail?.StartTime)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          sx={{
                            backgroundColor: "lightgray",
                            width: "30%",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Typography variant="body2" color="white">
                            End Time
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{ backgroundColor: "darkgray", width: "70%" }}
                        >
                          <Typography color="white">
                            {formatDateEST(eventDetail?.EndTime)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          sx={{
                            backgroundColor: "lightgray",
                            width: "30%",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Typography variant="body2" color="white">
                            Venue
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{ backgroundColor: "darkgray", width: "70%" }}
                        >
                          <Typography color="white">
                            {eventDetail?.isVenueHidden !== 0
                              ? "Hidden"
                              : eventDetail?.Venue || "N/A"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          sx={{
                            backgroundColor: "lightgray",
                            width: "30%",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Typography variant="body2" color="white">
                            Address
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{ backgroundColor: "darkgray", width: "70%" }}
                        >
                          <Typography color="white">
                            {eventDetail?.isVenueHidden !== 0
                              ? "Hidden"
                              : eventDetail?.Venue}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          sx={{
                            backgroundColor: "lightgray",
                            width: "30%",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Typography variant="body2" color="white">
                            Type
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{ backgroundColor: "darkgray", width: "70%" }}
                        >
                          <Typography color="white">
                            {eventDetail?.Category}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow
                        onClick={() => {
                          setShowDetail(true);
                          setSelectedUserId(eventDetail?.OrganizerId);
                          window.history.pushState(
                            { modal: "userProfile" },
                            "",
                          );
                        }}
                      >
                        <TableCell
                          sx={{
                            backgroundColor: "lightgray",
                            width: "30%",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Typography variant="body2" color="white">
                            Host
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{ backgroundColor: "darkgray", width: "70%" }}
                        >
                          <Typography color="white">
                            {eventDetail?.Username}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>

                <Box sx={{ marginTop: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      border: "1px solid white",
                      padding: 2,
                      borderRadius: "10px",
                      backgroundColor: "transparent",
                      textAlign: "center", // Center align the text inside the box
                    }}
                  >
                    {/* Heading */}
                    <Typography
                      color="white"
                      variant="h5"
                      sx={{ fontWeight: "bold" }}
                    >
                      Join the fun
                    </Typography>

                    {/* Paragraph */}
                    <Typography variant="body1" color="white">
                      Be one of the first to RSVP
                    </Typography>

                    {/* RSVP Button */}
                    <Button
                      variant="contained"
                      onClick={() => handleSaveRsvp(eventDetail?.EventId)}
                      sx={{
                        background: "#aa1f72",
                        width: "20%",
                        color: "#fff",
                        marginLeft: "auto",
                        marginRight: "auto",
                        marginTop: 2,
                        borderRadius: "10px", // Rounded corners
                        padding: "10px 20px", // Adjust padding to make it look better
                      }}
                    >
                      RSVP
                    </Button>
                  </Box>
                </Box>

                {Number(eventDetail?.HideTicketOption) === 0 && (
                  <>
                    {membership === 0 ? (
                      <>
                        <Card
                          sx={{
                            mb: 4,
                            mt: 4,
                            bgcolor: "#1a1a1a",
                            borderRadius: 2,
                            border: "0.0625rem solid rgb(55, 58, 64)",
                          }}
                        >
                          <CardContent sx={{ textAlign: "center", py: 3 }}>
                            <Typography
                              variant="h6"
                              color="white"
                              sx={{ mb: 2 }}
                            >
                              Premium membership required to purchase
                            </Typography>
                            <Button
                              variant="contained"
                              onClick={handleUpgrade}
                              sx={{
                                bgcolor: "#880E4F",
                                "&:hover": { bgcolor: "#560027" },
                              }}
                            >
                              Upgrade
                            </Button>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <>
                        {tickets?.length > 0 && (
                          <MTicketListComponent
                            tickets={tickets}
                            onTicketsChange={handleTicketsChange}
                            summary={summary}
                            emailDescriptions={emailDescriptionData}
                            eventDetail={eventDetail}
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                <Box sx={{ marginTop: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      border: "1px solid white",
                      padding: 2,
                      borderRadius: "10px",
                      backgroundColor: "transparent",
                      textAlign: "center", // Center align the text inside the box
                    }}
                  >
                    {/* Heading */}
                    <Typography
                      color="white"
                      variant="h5"
                      sx={{ fontWeight: "bold" }}
                    >
                      Remind RSVPs & Attendees
                    </Typography>

                    {/* RSVP Button */}
                    <Button
                      variant="contained"
                      disabled={loginProfileId !== eventDetail?.OrganizerId}
                      onClick={handleOpen}
                      sx={{
                        bgcolor: "#880E4F",
                        "&:hover": { bgcolor: "#560027" },
                        "&.Mui-disabled": {
                          bgcolor: "#880E4F",
                          color: "white",
                          opacity: 0.5,
                        },
                      }}
                    >
                      Send Email
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ marginTop: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      border: "1px solid white",
                      padding: 2,
                      borderRadius: "10px",
                      backgroundColor: "transparent",
                      textAlign: "center", // Center align the text inside the box
                    }}
                  >
                    {/* Heading */}
                    <Typography
                      color="white"
                      variant="h5"
                      sx={{ fontWeight: "bold" }}
                    >
                      Email Organizer for Attendees List
                    </Typography>

                    {/* RSVP Button */}
                    <Button
                      variant="contained"
                      onClick={handleEmailRequest}
                      sx={{
                        background: "#aa1f72",
                        width: { lg: "30%", md: "30%", sm: "100%", xs: "100%" },
                        marginLeft: "auto",
                        marginRight: "auto",
                        color: "#fff",
                        marginTop: 2,
                        borderRadius: "10px", // Rounded corners
                        padding: "10px 20px", // Adjust padding to make it look better
                      }}
                    >
                      Email
                    </Button>
                  </Box>
                </Box>
                <Box
                  sx={{ marginTop: 4, color: "#fff" }}
                  dangerouslySetInnerHTML={{ __html: eventDetail?.Description }}
                />

                <Typography variant="body1" color="white" sx={{ marginTop: 4 }}>
                  RSVP List ({rsvp?.length}):
                </Typography>

                <Box
                  sx={{
                    marginTop: 1,
                    maxHeight: "400px",
                    overflowY: "auto",
                    border: "1px solid white",
                    padding: 2,
                    borderRadius: "10px",
                    backgroundColor: "transparent",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      justifyContent:
                        rsvp?.length === 0 ? "center" : "space-between",
                      width: "100%",
                      py: rsvp?.length === 0 ? 3 : 0,
                    }}
                  >
                    {rsvp?.length === 0 ? (
                      <Typography
                        sx={{
                          textAlign: "center",
                          width: "100%",
                          color: "rgba(255,255,255,0.7)",
                          fontSize: "16px",
                        }}
                      >
                        No RSVP yet
                      </Typography>
                    ) : (
                      rsvp?.map((item: any) => (
                        <Box
                          key={item.ProfileId}
                          sx={{
                            width: {
                              lg: "30%",
                              md: "30%",
                              sm: "30%",
                              xs: "25%",
                            },
                            textAlign: "center",
                          }}
                        >
                          <Avatar
                            src={item.Avatar}
                            alt={item.Name}
                            onClick={() => {
                              setOpenModalUser({
                                state: true,
                                id: item.ProfileId,
                              });
                            }}
                            sx={{
                              width: "100%",
                              height: "auto",
                              aspectRatio: "1",
                              borderRadius: "10px",
                              cursor: "pointer",
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="white"
                            sx={{ marginTop: 1, overflowWrap: "break-word" }}
                          >
                            {item.Username}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>

                <Typography variant="body1" color="white" sx={{ marginTop: 4 }}>
                  Attendees List ({attendees?.length}):
                </Typography>
                <AttendeesListComponent
                  attendees={attendees}
                  loginId={profileId}
                  eventId={id}
                />
              </CardContent>
            </Card>
          </Grid>
        ) : (
          <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
            <Button
              onClick={() => router.back()}
              startIcon={<ArrowLeft />}
              sx={{
                textTransform: "none",
                color: "rgba(255, 255, 255, 0.7)",
                textAlign: "center",
                minWidth: "auto",
                fontSize: "16px",
                fontWeight: "medium",
                "&:hover": {
                  color: "#fff",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              Back
            </Button>

            <UserProfileModal
              handleGrantAccess={handleGrantAccess}
              handleClose={handleClose}
              open={showDetail}
              userid={selectedUserId}
            />

            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Left Column - 8/12 width */}
              <Grid item xs={12} md={8}>
                {/* Event Title */}
                <Fade in={showContent} timeout={1000}>
                  <Box
                    sx={{
                      pt: 4,
                      pb: 4,
                      textAlign: "center",
                      background:
                        "linear-gradient(45deg, #880E4F 30%, #4A148C 90%)",
                      borderRadius: "0 0 16px 16px",
                      mb: 4,
                      boxShadow: "0 3px 5px 2px rgba(136, 14, 79, .3)",
                      position: "relative",
                    }}
                  >
                    {profileUsername === eventDetail?.Username ? (
                      <IconButton
                        sx={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          bgcolor: "rgba(255,255,255,0.9)",
                        }}
                        onClick={() =>
                          router.push(`/events/edit?q=${eventDetail?.EventId}`)
                        }
                      >
                        <EditIcon sx={{ color: "#880E4F" }} />
                      </IconButton>
                    ) : (
                      <></>
                    )}

                    {profileUsername === eventDetail?.Username && (
                      <IconButton
                        sx={{
                          position: "absolute",
                          top: 70,
                          right: 16,
                          bgcolor: "rgba(255,255,255,0.9)",
                        }}
                        onClick={() => deleteEvent(eventDetail?.EventId)}
                      >
                        <DeleteIcon sx={{ color: "#880E4F" }} />
                      </IconButton>
                    )}

                    <Typography
                      variant="h2"
                      color="white"
                      sx={{
                        fontWeight: "bold",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      {eventDetail?.Name}
                    </Typography>
                    <Typography
                      variant="h6"
                      color="white"
                      sx={{ mt: 2, opacity: 0.9 }}
                    >
                      {formatDateEST(eventDetail?.StartTime)}
                    </Typography>
                  </Box>
                </Fade>

                {/* Cover Image */}
                <Grow in={showContent} timeout={1000}>
                  <Card
                    sx={{
                      mb: 4,
                      position: "relative",
                      borderRadius: 2,
                      bgcolor: "#1a1a1a",
                      border: "0.0625rem solid rgb(55, 58, 64)",
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <img
                        src={eventDetail?.CoverImageUrl}
                        alt="Event Cover"
                        style={{
                          width: "100%",
                          // height: "400px",
                          objectFit: "cover",
                          borderRadius: "8px 8px 0 0",
                        }}
                      />
                      <IconButton
                        sx={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          bgcolor: "rgba(255,255,255,0.9)",
                        }}
                        onClick={() =>
                          handleReportModalToggle(eventDetail?.UserId)
                        }
                      >
                        <Flag sx={{ color: "#880E4F" }} />
                      </IconButton>
                    </Box>
                  </Card>
                </Grow>

                {/* Image Slider */}
                {eventDetail?.Images?.length > 0 && (
                  <Card
                    sx={{
                      mb: 4,
                      bgcolor: "#1a1a1a",
                      border: "0.0625rem solid rgb(55, 58, 64)",
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ position: "relative", height: "300px" }}>
                      {/* Slider Navigation */}
                      <IconButton
                        onClick={() => handleSlideChange("prev")}
                        sx={{
                          position: "absolute",
                          left: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 2,
                          bgcolor: "rgba(255,255,255,0.9)",
                          "&:hover": { bgcolor: "white" },
                        }}
                      >
                        <ChevronLeft sx={{ color: "#880E4F" }} />
                      </IconButton>

                      <IconButton
                        onClick={() => handleSlideChange("next")}
                        sx={{
                          position: "absolute",
                          right: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 2,
                          bgcolor: "rgba(255,255,255,0.9)",
                          "&:hover": { bgcolor: "white" },
                        }}
                      >
                        <ChevronRight sx={{ color: "#880E4F" }} />
                      </IconButton>

                      {/* Images */}
                      {eventDetail.Images.map((imageUrl: any, index: any) => (
                        <Box
                          key={index}
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            opacity: currentImageIndex === index ? 1 : 0,
                            transition: "opacity 0.5s ease-in-out",
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`Event image ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Box>
                      ))}

                      {/* Slider Indicators */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 16,
                          left: "50%",
                          transform: "translateX(-50%)",
                          display: "flex",
                          gap: 1,
                          zIndex: 2,
                        }}
                      >
                        {eventDetail.Images.map((_: any, index: any) => (
                          <Box
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor:
                                currentImageIndex === index
                                  ? "#880E4F"
                                  : "rgba(255,255,255,0.5)",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "scale(1.2)",
                                bgcolor:
                                  currentImageIndex === index
                                    ? "#880E4F"
                                    : "rgba(255,255,255,0.8)",
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Card>
                )}

                <Grid
                  sx={{
                    backgroundColor: "#1a1a1a",
                    px: 4,
                    borderRadius: 2,
                    border: "0.0625rem solid rgb(55, 58, 64)",
                    mb: 5,
                  }}
                >
                  <Typography
                    sx={{
                      maringLeft: 4,
                      marginTop: 4,
                      marginBottom: 4,
                      color: "#fff",
                      lineHeight: 3,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: eventDetail?.Description,
                    }}
                  />
                </Grid>

                {/* RSVP & Attendees Lists - Kept as is */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Slide direction="right" in={showContent} timeout={1000}>
                      <Card
                        sx={{
                          bgcolor: "#1a1a1a",
                          borderRadius: 2,
                          p: 3,
                          border: "0.0625rem solid rgb(55, 58, 64)",
                        }}
                      >
                        <Typography variant="h6" color="white" sx={{ mb: 3 }}>
                          RSVP List ({rsvp?.length || 0})
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                            justifyContent: "center",
                          }}
                        >
                          {rsvp?.map((person: any, index: any) => (
                            <Tooltip
                              key={index}
                              title={person.Name}
                              arrow
                              componentsProps={{
                                tooltip: {
                                  sx: {
                                    bgcolor: "#880E4F",
                                    color: "white",
                                    fontSize: "0.9rem",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                                  },
                                },
                                arrow: {
                                  sx: {
                                    color: "#880E4F",
                                  },
                                },
                              }}
                            >
                              <Avatar
                                key={index}
                                alt={person.Name}
                                src={person.Avatar}
                                onClick={() => {
                                  setOpenModalUser({
                                    state: true,
                                    id: person.ProfileId,
                                  });
                                }}
                                sx={{
                                  width: 56,
                                  height: 56,
                                  border: "2px solid #880E4F",
                                  transition: "all 0.3s ease",
                                  bgcolor: person.Avatar
                                    ? "transparent"
                                    : "#880E4F",
                                  "&:hover": {
                                    transform: "scale(1.1)",
                                    boxShadow:
                                      "0 4px 8px rgba(136, 14, 79, 0.4)",
                                    cursor: "hand",
                                  },
                                }}
                              >
                                {!person.Avatar && person.Name?.charAt(0)}
                              </Avatar>
                            </Tooltip>
                          ))}
                          {rsvp?.length === 0 && (
                            <Typography color="grey.500" sx={{ py: 2 }}>
                              No RSVPs yet
                            </Typography>
                          )}
                        </Box>
                      </Card>
                    </Slide>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Slide direction="left" in={showContent} timeout={1000}>
                      <Card
                        sx={{
                          bgcolor: "#1a1a1a",
                          borderRadius: 2,
                          p: 3,
                          border: "0.0625rem solid rgb(55, 58, 64)",
                        }}
                      >
                        <Typography variant="h6" color="white" sx={{ mb: 3 }}>
                          Attendees ({attendees?.length || 0})
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                            justifyContent: "center",
                          }}
                        >
                          {attendees?.map((person: any, index: any) => (
                            <Tooltip
                              key={index}
                              title={person.Name}
                              arrow
                              componentsProps={{
                                tooltip: {
                                  sx: {
                                    bgcolor: "#880E4F",
                                    color: "white",
                                    fontSize: "0.9rem",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                                  },
                                },
                                arrow: {
                                  sx: {
                                    color: "#880E4F",
                                  },
                                },
                              }}
                            >
                              <Avatar
                                key={index}
                                alt={person.Name}
                                src={person.Avatar || `/api/placeholder/56/56`}
                                onClick={() => {
                                  setOpenModalUser({
                                    state: true,
                                    id: person.ProfileId,
                                  });
                                }}
                                sx={{
                                  width: 56,
                                  height: 56,
                                  border: "2px solid #880E4F",
                                  transition: "all 0.3s ease",
                                  bgcolor: person.Avatar
                                    ? "transparent"
                                    : "#880E4F",
                                  "&:hover": {
                                    transform: "scale(1.1)",
                                    boxShadow:
                                      "0 4px 8px rgba(136, 14, 79, 0.4)",
                                  },
                                }}
                              >
                                {!person.Avatar && person.Name?.charAt(0)}
                              </Avatar>
                            </Tooltip>
                          ))}
                          {attendees?.length === 0 && (
                            <Typography color="grey.500" sx={{ py: 2 }}>
                              No attendees yet
                            </Typography>
                          )}
                        </Box>
                      </Card>
                    </Slide>
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Column - 4/12 width */}
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 2,
                    mb: 4,
                    borderRadius: 2,
                    bgcolor: "#1a1a1a",
                    color: "white",
                    border: "0.0625rem solid rgb(55, 58, 64)",
                  }}
                >
                  <Table sx={{ padding: "0px" }}>
                    <TableBody>
                      {[
                        {
                          icon: <AccessTimeIcon />,
                          label: "Start Time",
                          value: formatDateEST(eventDetail?.StartTime),
                        },
                        {
                          icon: <AccessTimeIcon />,
                          label: "End Time",
                          value: formatDateEST(eventDetail?.EndTime),
                        },

                        {
                          icon: <LocationOnIcon />,
                          label: "Venue",
                          value:
                            eventDetail?.isVenueHidden !== 0
                              ? "Hidden"
                              : eventDetail?.Venue,
                        },
                        {
                          icon: <LocationOnIcon />,
                          label: "Address",
                          value:
                            eventDetail?.isVenueHidden !== 0
                              ? "Hidden"
                              : eventDetail?.Venue,
                        },
                        {
                          icon: <CategoryIcon />,
                          label: "Type",
                          value: eventDetail?.Category,
                        },
                        {
                          icon: <PersonIcon />,
                          label: "Host",
                          value: eventDetail?.Username,
                        },
                      ].map((item, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            "&:hover": {
                              bgcolor: "rgba(136, 14, 79, 0.1)",
                              transition: "background-color 0.3s ease",
                            },
                          }}
                          onClick={
                            item.label === "Host"
                              ? () => {
                                  setShowDetail(true);
                                  setSelectedUserId(eventDetail?.OrganizerId);
                                  window.history.pushState(
                                    { modal: "userProfile" },
                                    "",
                                  );
                                }
                              : undefined
                          }
                        >
                          <TableCell
                            sx={{
                              width: "40px",
                              color: "#880E4F",
                              border: "none",
                            }}
                          >
                            {item.icon}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              width: "30%",
                              color: "white",
                              border: "none",
                            }}
                          >
                            {item.label}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "#b3b3b3",
                              border: "none",
                            }}
                          >
                            {item.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
                <Card
                  sx={{
                    mb: 4,
                    borderRadius: 2,
                    background:
                      "linear-gradient(45deg, #880E4F 30%, #4A148C 90%)",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="h4" color="white" sx={{ mb: 2 }}>
                      Join the Fun
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Be one of the first to RSVP
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => handleSaveRsvp(eventDetail?.EventId)}
                      sx={{
                        bgcolor: "white",
                        color: "#880E4F",
                        "&:hover": {
                          bgcolor: "#f5f5f5",
                        },
                      }}
                    >
                      RSVP Now
                    </Button>
                  </CardContent>
                </Card>

                {/* Tickets Section */}
                {Number(eventDetail?.HideTicketOption) === 0 && (
                  <>
                    {membership === 0 ? (
                      <>
                        <Card
                          sx={{
                            mb: 4,
                            mt: 4,
                            bgcolor: "#1a1a1a",
                            borderRadius: 2,
                            border: "0.0625rem solid rgb(55, 58, 64)",
                          }}
                        >
                          <CardContent sx={{ textAlign: "center", py: 3 }}>
                            <Typography
                              variant="h6"
                              color="white"
                              sx={{ mb: 2 }}
                            >
                              Premium membership required to purchase
                            </Typography>
                            <Button
                              variant="contained"
                              onClick={handleUpgrade}
                              sx={{
                                bgcolor: "#880E4F",
                                "&:hover": { bgcolor: "#560027" },
                              }}
                            >
                              Upgrade
                            </Button>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <>
                        {tickets?.length > 0 && (
                          <Card
                            sx={{
                              mb: 4,
                              bgcolor: "#1a1a1a",
                              borderRadius: 2,
                              border: "0.0625rem solid rgb(55, 58, 64)",
                            }}
                          >
                            <CardContent>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mb: 2,
                                  px: 4,
                                  pt: 2,
                                }}
                              >
                                <Typography
                                  variant="h5"
                                  sx={{ fontWeight: "bold", color: "white" }}
                                >
                                  Available Tickets
                                </Typography>
                                <IconButton
                                  disabled={membership === 0 ? true : false}
                                  onClick={() => setExpanded(!expanded)}
                                  sx={{
                                    color: "white",
                                    transition: "transform 0.3s ease",
                                    transform: expanded
                                      ? "rotate(45deg)"
                                      : "rotate(0deg)",
                                  }}
                                >
                                  <AddIcon />
                                </IconButton>
                              </Box>
                              <Grow in={expanded} timeout={500}>
                                <Box
                                  sx={{
                                    display: expanded ? "block" : "none",
                                    px: 5,
                                  }}
                                >
                                  <>
                                    <DTicketListComponent
                                      tickets={tickets}
                                      emailDescriptions={emailDescriptionData}
                                      onTicketsChange={handleTicketsChange}
                                    />
                                  </>
                                </Box>
                              </Grow>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )}
                  </>
                )}

                <Card
                  sx={{
                    mb: 4,
                    mt: 4,
                    bgcolor: "#1a1a1a",
                    borderRadius: 2,
                    border: "0.0625rem solid rgb(55, 58, 64)",
                  }}
                >
                  {loginProfileId !== eventDetail?.OrganizerId && (
                    <>
                      <Alert
                        variant="filled"
                        severity="info"
                        style={{ marginBottom: "16px" }}
                      >
                        Only the organzier can send the email.
                      </Alert>
                    </>
                  )}
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <EmailIcon sx={{ fontSize: 40, color: "#880E4F", mb: 2 }} />
                    <Typography variant="h6" color="white" sx={{ mb: 2 }}>
                      Remind RSVP & Attendees
                    </Typography>
                    <Button
                      variant="contained"
                      disabled={loginProfileId !== eventDetail?.OrganizerId}
                      onClick={handleOpen}
                      sx={{
                        bgcolor: "#880E4F",
                        "&:hover": { bgcolor: "#560027" },
                        "&.Mui-disabled": {
                          bgcolor: "#880E4F",
                          color: "white",
                          opacity: 0.5,
                        },
                      }}
                    >
                      Send Email
                    </Button>
                  </CardContent>
                </Card>

                {/* Download List Card */}
                {loginProfileId !== eventDetail?.OrganizerId ? (
                  <Alert variant="filled" severity="info">
                    Only the organizer has access to the attendees list. You can
                    email the organizer to request it.
                  </Alert>
                ) : null}

                {loginProfileId !== eventDetail?.OrganizerId ? (
                  <Card
                    sx={{
                      mb: 4,
                      bgcolor: "#1a1a1a",
                      borderRadius: 2,
                      border: "0.0625rem solid rgb(55, 58, 64)",
                    }}
                  >
                    <CardContent sx={{ textAlign: "center", py: 3 }}>
                      <DownloadIcon
                        sx={{ fontSize: 40, color: "#880E4F", mb: 2 }}
                      />
                      <Typography variant="h6" color="white" sx={{ mb: 2 }}>
                        Email Organizer for Attendees List
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleEmailRequest}
                        disabled={loadingEmail}
                        sx={{
                          bgcolor: "#880E4F",
                          color: "#fff",
                          "&:hover": { bgcolor: "#560027" },
                        }}
                      >
                        {loadingEmail ? "Sending..." : "Email"}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </Grid>
            </Grid>
          </Container>
        )}
      </Grid>

      {profileId && <ProfileImgCheckerModel profileId={profileId} />}

      {/* Modal */}
      <Dialog
        open={openDownloadModal}
        onClose={handleCloseDownloadModal}
        transitionDuration={500} // Smooth transition for the modal
        sx={{
          "& .MuiDialog-paper": {
            padding: "20px",
            borderRadius: "12px",
            backgroundColor: "#333", // Dark background for modal
          },
        }}
      >
        <DialogTitle sx={{ color: "#fff", fontWeight: "bold" }}>
          Download List
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          {/* Attendees Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={downloadAttendee}
                onChange={handleDownloadAttendeeChange}
                sx={{
                  color: "#fff",
                  "&.Mui-checked": {
                    color: "#4caf50", // Green when checked
                  },
                }}
              />
            }
            label="Attendees"
            sx={{ color: "#fff" }}
          />
          {/* RSVP Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={downloadRsvp}
                onChange={handleDownloadRsvpChange}
                sx={{
                  color: "#fff",
                  "&.Mui-checked": {
                    color: "#4caf50", // Green when checked
                  },
                }}
              />
            }
            label="RSVP"
            sx={{ color: "#fff" }}
          />
        </DialogContent>

        {/* Modal Actions (Download Button) */}
        <DialogActions>
          <Button
            onClick={handleDownloadList}
            variant="contained"
            sx={{
              backgroundColor: "#4caf50",
              "&:hover": {
                backgroundColor: "#45a049",
              },
              padding: "10px 20px",
              borderRadius: "8px",
              textTransform: "capitalize",
              transition: "background-color 0.3s ease", // Cool button hover effect
            }}
          >
            Download Attendees & RSVP
          </Button>
        </DialogActions>
      </Dialog>

      <Modal open={isReportModalOpen} onClose={handleReportModalToggle}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 300,
            bgcolor: "#1e1e1e", // Dark background
            color: "white", // Default text color for dark background
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Report or Block User
          </Typography>
          <FormControlLabel
            sx={{
              color: "white",
              "& .MuiCheckbox-root": {
                color: "#9c27b0",
              },
              "& .MuiCheckbox-root.Mui-checked": {
                color: "#9c27b0",
              },
            }}
            control={
              <Checkbox
                checked={reportOptions.reportImage}
                onChange={handleCheckboxChange}
                name="reportImage"
              />
            }
            label="Inappropriate Image"
          />
          <FormControlLabel
            sx={{
              color: "white", // Label color
              "& .MuiCheckbox-root": {
                color: "#9c27b0", // Checkbox color
              },
              "& .MuiCheckbox-root.Mui-checked": {
                color: "#9c27b0", // Checked checkbox color
              },
            }}
            control={
              <Checkbox
                checked={reportOptions.reportUser}
                onChange={handleCheckboxChange}
                name="reportUser"
              />
            }
            label="Report User"
          />
          <FormControlLabel
            sx={{
              color: "white", // Label color
              "& .MuiCheckbox-root": {
                color: "#9c27b0", // Checkbox color
              },
              "& .MuiCheckbox-root.Mui-checked": {
                color: "#9c27b0", // Checked checkbox color
              },
            }}
            control={
              <Checkbox
                checked={reportOptions.blockUser}
                onChange={handleCheckboxChange}
                name="blockUser"
              />
            }
            label="Block User"
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              onClick={handleReportSubmit}
              variant="contained"
              color="secondary"
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Submit"
              )}
            </Button>
            <Button
              style={{ marginLeft: 10 }}
              onClick={() => handleReportModalToggle("null")}
              variant="contained"
              color="secondary"
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* MUI Dialog */}
      <Dialog open={open} onClose={handleCloseHere} maxWidth="sm" fullWidth>
        <DialogContent
          sx={{
            backgroundColor: isMobile ? "#000" : "#1A1A1A", // Dialog background color
            color: "white", // Text color
          }}
        >
          {/* Checkboxes */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                backgroundColor: "#2d2d2d",
                borderRadius: 2,
              }}
            >
              <Checkbox
                color="primary"
                sx={{
                  color: "white", // Default color when unchecked
                  "&.Mui-checked": {
                    color: "#9c27b0", // Custom color when checked
                  },
                }}
                checked={formState.rsvpChecked}
                onChange={() => handleEmailCheckboxChange("rsvpChecked")}
              />
              <Box>
                <Typography variant="h6">RSVP</Typography>
                <Typography>Send email to RSVPs</Typography>
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                backgroundColor: "#2d2d2d",
                borderRadius: 2,
              }}
            >
              <Checkbox
                sx={{
                  color: "white", // Default color when unchecked
                  "&.Mui-checked": {
                    color: "#9c27b0", // Custom color when checked
                  },
                }}
                checked={formState.attendeeChecked}
                onChange={() => handleEmailCheckboxChange("attendeeChecked")}
              />
              <Box>
                <Typography variant="h6">Attendee</Typography>
                <Typography>Send email to attendees</Typography>
              </Box>
            </Box>
            {errors && <FormHelperText error>{errors}</FormHelperText>}
          </Box>

          {/* Card for Email Subject and Description */}
          <Card
            sx={{
              padding: 2,
              marginTop: 2,
              backgroundColor: "#2d2d2d",
              color: "white",
              borderRadius: "10px",
            }}
          >
            <TextField
              fullWidth
              name="emailSubject"
              variant="outlined"
              value={formState.emailSubject}
              onChange={handleInputChange}
              sx={{
                marginBottom: 2,
                input: { color: "white" },
                "& .MuiInputLabel-root": { color: "white" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "white" },
                  "&:hover fieldset": { borderColor: "#61c800" },
                },
              }}
            />
            <Typography>Email Description</Typography>
            <Editor
              apiKey={"3yffl36ic8qni4zhtxbmc0t1sujg1m25sc4l638375rwb5vs"}
              value={formState?.emailDescription}
              onEditorChange={(content) =>
                handleEditorChange("emailDescription", content)
              }
              init={{
                height: 200, // Ensures the editor displays correctly
                menubar: false,
                toolbar:
                  "bold italic underline | alignleft aligncenter alignright | bullist numlist",
                statusbar: false,
                plugins: ["advlist", "autolink", "lists", "link", "image"],
                content_style:
                  "body { background-color: #2d2d2d; color: white; font-family: Arial, sans-serif; }",
                skin: "oxide-dark", // Dark mode for editor
              }}
            />
          </Card>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: isMobile ? "#000" : "#1A1A1A", // Dialog footer background color
          }}
        >
          <Button
            onClick={handleCloseHere}
            sx={{ background: "white", borderColor: "white", color: "#880E4F" }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              background: "#880E4F",
              borderColor: "#880E4F",
              color: "white",
            }}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSaveRsvp}>
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Confirm
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>RSVP Successfully save</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            onClick={() => {
              setOpenSaveRsvp(!openSaveRsvp);
            }}
            sx={{ color: "red" }}
          >
            Ok
          </Button>
        </DialogActions>
      </Dialog>
      {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}

      <UserProfileModal
        handleGrantAccess={handleGrantAccess}
        open={openModalUser.state}
        userid={openModalUser.id}
        handleClose={() => setOpenModalUser({ state: false, id: null })}
      />
    </Box>
  );
}
