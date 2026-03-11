"use client";
import Header from "@/components/Header";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Modal,
  FormControlLabel,
  Checkbox,
  Container,
  CardMedia,
  CardActions,
  Chip,
  Fade,
  Paper,
  useMediaQuery,
  Avatar,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Flag,
  MoreVert,
  Verified,
  Add,
  Edit,
  Delete,
} from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import UserProfileModal from "@/components/UserProfileModal";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import Loader from "@/commonPage/Loader";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import CustomDialog from "@/components/CustomDialog";

export default function Whatshot() {
  const isMobile = useMediaQuery("(max-width: 480px)") ? true : false;
  const router = useRouter();
  const [posts, setPosts] = useState<any>([]);
  const [profileId, setProfileId] = useState<any>();
  const [currentName, setCurrentName] = useState<any>("");
  const [targetId, setTargetId] = useState<any>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [reportOptions, setReportOptions] = useState({
    reportUser: false,
    blockUser: false,
    reportImage: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"success" | "error">("success");
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const handleClose = () => {
    setShowDetail(false);
    setSelectedUserId(null);
    if (window.history.state?.modal === "userProfile") {
      window.history.back();
    }
  };

  const handleGrantAccess = async () => {
    try {
    } catch (error) {}
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("loginInfo");
      if (token) {
        try {
          const decodeToken = jwtDecode<any>(token);
          setCurrentName(decodeToken?.profileName);
          setProfileId(decodeToken?.profileId);
        } catch (e) {
          console.warn("Failed to decode token", e);
          setProfileId(null);
        }
      } else {
        router.push("/login");
      }
    }
  }, []);

  useEffect(() => {
    if (profileId) {
      handleWhatshotPosts();
    }
  }, [profileId]);

  const handleWhatshotPosts = async () => {
    try {
      const response = await fetch("/api/user/whatshot?id=" + profileId);
      const data = await response.json();
      setPosts(data?.posts || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handlePostLike = async ({
    postId,
    username,
    email,
  }: {
    postId: string;
    username: string;
    email: string;
  }) => {
    try {
      const response = await fetch("/api/user/whatshot/post/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          profileId: profileId,
          commenterName: currentName,
          profileUsername: username,
          email: email,
        }),
      });
      if (response.ok) {
        handleWhatshotPosts();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleReportModalToggle = (pid: any) => {
    setTargetId(pid);
    setIsReportModalOpen(!isReportModalOpen);
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

    try {
      if (reportOptions.reportImage) {
        await reportImageApi({
          reportedById: profileId,
          reportedByName: currentName,
          reportedUserId: targetId?.UserId,
          reportedUserName: targetId?.Username,
          image: targetId?.Avatar,
        });
      }

      if (reportOptions.reportUser || reportOptions.blockUser) {
        const res = await fetch("/api/user/sweeping/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileid: profileId,
            targetid: targetId?.UserId,
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

  if (posts?.length === 0) {
    return <Loader />;
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch("/api/user/whatshot/post/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete post");
      }

      setPosts((prev: any[]) => prev.filter((p) => p.Id !== postId));

      setDialogType("success");
      setDialogTitle("Success");
      setDialogMessage("Post deleted successfully.");
      setDialogOpen(true);
    } catch (error: any) {
      setDialogType("error");
      setDialogTitle("Error");
      setDialogMessage(
        error?.message || "Something went wrong while deleting post.",
      );
      setDialogOpen(true);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "#0A0A0A",
        minHeight: "100vh",
        color: "white",
        paddingBottom: 1,
        background: "linear-gradient(to bottom, #0A0A0A, #1A1A1A)",
      }}
    >
      <Header />

      {isMobile === false ? (
        <Container maxWidth="xl" sx={{ mt: 12, mb: 8 }}>
          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid item xs={12} md={12}>
              {/* <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> */}
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
              <Paper
                elevation={3}
                sx={{
                  bgcolor: "#1E1E1E",
                  borderRadius: 2,
                  p: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Box sx={{ color: "white" }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        background:
                          "linear-gradient(45deg, #fff 30%, #f50057 90%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        position: "relative",
                        animation: "glow 2s ease-in-out infinite",
                        "@keyframes glow": {
                          "0%": {
                            textShadow: "0 0 10px rgba(245, 0, 87, 0.5)",
                          },
                          "50%": {
                            textShadow:
                              "0 0 20px rgba(245, 0, 87, 0.8), 0 0 30px rgba(245, 0, 87, 0.4)",
                          },
                          "100%": {
                            textShadow: "0 0 10px rgba(245, 0, 87, 0.5)",
                          },
                        },
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          bottom: -8,
                          left: 0,
                          width: "50px",
                          height: "3px",
                          background: "#f50057",
                          transition: "width 0.3s ease",
                        },
                        "&:hover::after": {
                          width: "100px",
                        },
                      }}
                    >
                      What's Hot
                    </Typography>
                  </Box>
                  <Button
                    onClick={() => router.push("/whatshot/post/create")}
                    startIcon={<Add />}
                    variant="contained"
                    sx={{
                      bgcolor: "#f50057",
                      "&:hover": { bgcolor: "#c51162" },
                      borderRadius: 2,
                      textTransform: "none",
                      px: 3,
                    }}
                  >
                    Create Post
                  </Button>
                </Box>
                {/* </Box> */}

                <Grid container spacing={3}>
                  {posts.map((post: any, index: number) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Fade in={true} timeout={500 + index * 100}>
                        <Card
                          sx={{
                            bgcolor: "rgba(45, 45, 45, 0.8)",
                            backdropFilter: "blur(10px)",
                            borderRadius: 3,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                            position: "relative",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            cursor: "pointer",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: "0 12px 24px rgba(0, 0, 0, 0.3)",
                              "& .media-overlay": {
                                opacity: 1,
                              },
                            },
                          }}
                        >
                          {/* Ribbon */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: 20,
                              right: -40,
                              transform: "rotate(45deg)",
                              backgroundColor: "#f50057",
                              padding: "6px 30px",
                              color: "white",
                              fontWeight: "bold",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                              zIndex: 1,
                              "&::before, &::after": {
                                content: '""',
                                position: "absolute",
                                top: 0,
                                width: "7px",
                                height: "7px",
                              },
                              "&::before": {
                                left: 0,
                                borderLeft: "3px solid #b3003b",
                                borderBottom: "3px solid #b3003b",
                              },
                              "&::after": {
                                right: 0,
                                borderRight: "3px solid #b3003b",
                                borderBottom: "3px solid #b3003b",
                              },
                            }}
                          >
                            What's Hot!
                          </Box>

                          {/* User Info Header */}
                          <Box
                            sx={{
                              p: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                            // onClick={() => router.push(`/members/${post?.ProfileId}`)}
                            onClick={() => {
                              setShowDetail(true);
                              setSelectedUserId(post?.ProfileId);
                              window.history.pushState(
                                { modal: "userProfile" },
                                "",
                              );
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <Avatar
                                src={post?.Avatar}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  border: "2px solid #f50057",
                                }}
                              />
                              <Box>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ color: "white", fontWeight: "bold" }}
                                  >
                                    by {post?.Username}
                                  </Typography>
                                  <Verified
                                    sx={{ color: "#f50057", fontSize: 16 }}
                                  />
                                </Stack>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "rgba(255,255,255,0.6)" }}
                                >
                                  on{" "}
                                  {new Date(
                                    post?.CreatedAt,
                                  ).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>

                          {/* Main Image */}
                          <Box
                            sx={{ position: "relative", cursor: "pointer" }}
                            onClick={() =>
                              router.push(`/whatshot/post/detail/${post?.Id}`)
                            }
                            // onClick={() => {
                            //     setShowDetail(true);
                            //     setSelectedUserId(post?.ProfileId);
                            // }}
                          >
                            <CardMedia
                              component="img"
                              height="280"
                              image={post?.PhotoLink}
                              alt="Post"
                              sx={{
                                cursor: "pointer",
                                objectFit: "cover",
                              }}
                              // onClick={() => router.push(`/whatshot/post/detail/${post?.Id}`)}
                            />
                            <Box
                              className="media-overlay"
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background:
                                  "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)",
                                opacity: 0,
                                transition: "opacity 0.3s ease",
                              }}
                            />
                          </Box>

                          {/* Content */}
                          <CardContent sx={{ flexGrow: 1, p: 2 }}>
                            <Typography
                              sx={{
                                bgcolor: "rgba(245, 0, 87, 0.1)",
                                color: "#f50057",
                                width: "100%",
                                mb: 2,
                                fontWeight: "bold",
                                px: 1.5,
                                py: 1,
                                borderRadius: 1,
                                textAlign: "center",
                                fontSize: "0.95rem",
                                fontStyle: "italic",
                              }}
                            >
                              {post?.ImageCaption || "No Caption"}
                            </Typography>
                          </CardContent>

                          {/* Actions */}
                          <CardActions sx={{ p: 2, pt: 0 }}>
                            <Grid container spacing={1} alignItems="center">
                              <Grid item xs={6}>
                                <Button
                                  fullWidth
                                  onClick={() =>
                                    handlePostLike({
                                      postId: post?.Id,
                                      username: post?.Username,
                                      email: post?.Email,
                                    })
                                  }
                                  startIcon={
                                    post?.hasLiked ? (
                                      <Favorite />
                                    ) : (
                                      <FavoriteBorder />
                                    )
                                  }
                                  sx={{
                                    color: post?.hasLiked ? "#f50057" : "white",
                                    borderColor: post?.hasLiked
                                      ? "#f50057"
                                      : "rgba(255,255,255,0.3)",
                                    "&:hover": {
                                      borderColor: "#f50057",
                                      bgcolor: "rgba(245, 0, 87, 0.08)",
                                    },
                                    textTransform: "none",
                                  }}
                                  variant="outlined"
                                >
                                  {post?.LikesCount || 0} Likes
                                </Button>
                              </Grid>
                              <Grid item xs={6}>
                                <Button
                                  fullWidth
                                  onClick={() =>
                                    router.push(
                                      `/whatshot/post/detail/${post?.Id}`,
                                    )
                                  }
                                  startIcon={<Comment />}
                                  sx={{
                                    color: "white",
                                    borderColor: "rgba(255,255,255,0.3)",
                                    "&:hover": {
                                      borderColor: "white",
                                      bgcolor: "rgba(255, 255, 255, 0.08)",
                                    },
                                    textTransform: "none",
                                  }}
                                  variant="outlined"
                                >
                                  {post?.CommentsCount || 0} Comments
                                </Button>
                              </Grid>
                            </Grid>
                            <IconButton
                              size="small"
                              onClick={() => handleReportModalToggle(post)}
                              sx={{
                                color: "#f50057",
                                ml: 1,
                                "&:hover": {
                                  bgcolor: "rgba(245, 0, 87, 0.08)",
                                },
                              }}
                            >
                              <Flag fontSize="small" />
                            </IconButton>
                            {[
                              post.ProfileId,
                              "347313ee-89c1-4f81-a089-4cbc2e2358ca",
                              "4454da1b-010d-4daf-a580-e5a30f61dd08",
                              "b4fc8e46-0e0a-48b3-824a-0142c44739c1",
                            ].includes(profileId) ? (
                              <>
                                <IconButton
                                  size="small"
                                  sx={{ color: "white" }}
                                  onClick={(event) =>
                                    setAnchorEl(event.currentTarget)
                                  }
                                >
                                  <MoreVert />
                                </IconButton>
                                <Menu
                                  anchorEl={anchorEl}
                                  open={Boolean(anchorEl)}
                                  onClose={() => setAnchorEl(null)}
                                  PaperProps={{
                                    sx: {
                                      bgcolor: "#1A1A1A",
                                      color: "white",
                                    },
                                  }}
                                >
                                  <MenuItem
                                    onClick={() => {
                                      setAnchorEl(null);
                                      router.push(
                                        `/whatshot/post/detail/${post?.Id}`,
                                      );
                                    }}
                                    sx={{
                                      "&:hover": {
                                        bgcolor: "rgba(245, 0, 87, 0.1)",
                                      },
                                    }}
                                  >
                                    <ListItemIcon>
                                      <Edit sx={{ color: "#f50057" }} />
                                    </ListItemIcon>
                                    <ListItemText>
                                      Edit with Comments
                                    </ListItemText>
                                  </MenuItem>
                                  <MenuItem
                                    onClick={() => {
                                      setAnchorEl(null);
                                      // Add your delete handler here
                                      handleDeletePost(post?.Id);
                                    }}
                                    sx={{
                                      "&:hover": {
                                        bgcolor: "rgba(245, 0, 87, 0.1)",
                                      },
                                    }}
                                  >
                                    <ListItemIcon>
                                      <Delete sx={{ color: "#f50057" }} />
                                    </ListItemIcon>
                                    <ListItemText>Delete</ListItemText>
                                  </MenuItem>
                                </Menu>
                              </>
                            ) : null}
                          </CardActions>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      ) : (
        <Container
          maxWidth="md"
          sx={{
            pt: { xs: 2, sm: 2, md: 2 },
            pb: { xs: 8, sm: 9, md: 10 },
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          <UserProfileModal
            handleGrantAccess={handleGrantAccess}
            handleClose={handleClose}
            open={showDetail}
            userid={selectedUserId}
          />
          {/* Right Column (col-10) */}
          <Grid
            item
            xs={12}
            sm={12}
            lg={12}
            md={12}
            sx={{
              px: { xs: 0, sm: 0 },
            }}
          >
            <Card
              sx={{
                borderRadius: "10px",
                backgroundColor: "#0a0a0a",
                padding: "0px",
                mx: { xs: 0, sm: 0 }, // Remove horizontal margin for xs and sm breakpoints
              }}
            >
              <CardContent>
                <Typography variant="h5" color="white" textAlign={"center"}>
                  What's Hot
                </Typography>
                {/* Create New Post Button */}
                <Button
                  onClick={() => router.push("/whatshot/post/create")}
                  startIcon={<Add />}
                  variant="contained"
                  color="primary"
                  sx={{
                    mt: 1,
                    color: "#fff",
                    textTransform: "none",
                    backgroundColor: "#f50057",
                    fontSize: "16px",
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: "#c51162",
                    },
                  }}
                >
                  Create New Post
                </Button>
                <Box
                  sx={{
                    maxHeight: "700px", // Set max height for scroll
                    overflowY: "auto", // Enable vertical scroll
                    marginTop: "10px",
                  }}
                >
                  {/* Post Card */}
                  {posts.map((post: any, index: number) => {
                    return (
                      <Card
                        key={index}
                        sx={{
                          borderRadius: "10px",
                          marginBottom: "20px",
                          marginTop: "20px",
                          backgroundColor: "#2d2d2d",
                          mx: { xs: 0, sm: 0 }, // Remove horizontal margin for xs and sm breakpoints
                        }}
                      >
                        {/* Added Box for user information */}
                        <Box
                          sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                          //   onClick={() => router.push(`/members/${post?.ProfileId}`)}
                        >
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            onClick={() => {
                              setShowDetail(true);
                              setSelectedUserId(post?.ProfileId);
                              window.history.pushState(
                                { modal: "userProfile" },
                                "",
                              );
                            }}
                          >
                            <Avatar
                              src={post?.Avatar}
                              sx={{
                                width: 40,
                                height: 40,
                                border: "2px solid #f50057",
                              }}
                            />
                            <Box>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{ color: "white", fontWeight: "bold" }}
                                >
                                  by {post?.Username}
                                </Typography>
                                <Verified
                                  sx={{ color: "#f50057", fontSize: 16 }}
                                />
                              </Stack>
                              <Typography
                                variant="caption"
                                sx={{ color: "rgba(255,255,255,0.6)" }}
                              >
                                on{" "}
                                {new Date(post?.CreatedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Stack>
                          {[
                            post.ProfileId,
                            "347313ee-89c1-4f81-a089-4cbc2e2358ca",
                            "4454da1b-010d-4daf-a580-e5a30f61dd08",
                            "b4fc8e46-0e0a-48b3-824a-0142c44739c1",
                          ].includes(profileId) ? (
                            <>
                              <IconButton
                                size="small"
                                sx={{ color: "white" }}
                                onClick={(event) =>
                                  setAnchorEl(event.currentTarget)
                                }
                              >
                                <MoreVert />
                              </IconButton>
                              <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={() => setAnchorEl(null)}
                                PaperProps={{
                                  sx: {
                                    bgcolor: "#1A1A1A",
                                    color: "white",
                                  },
                                }}
                              >
                                <MenuItem
                                  onClick={() => {
                                    setAnchorEl(null);
                                    router.push(
                                      `/whatshot/post/detail/${post?.Id}`,
                                    );
                                  }}
                                  sx={{
                                    "&:hover": {
                                      bgcolor: "rgba(245, 0, 87, 0.1)",
                                    },
                                  }}
                                >
                                  <ListItemIcon>
                                    <Edit sx={{ color: "#f50057" }} />
                                  </ListItemIcon>
                                  <ListItemText>
                                    Edit with Comments
                                  </ListItemText>
                                </MenuItem>
                                <MenuItem
                                  onClick={() => {
                                    setAnchorEl(null);
                                    // Add your delete handler here
                                    handleDeletePost(post?.Id);
                                  }}
                                  sx={{
                                    "&:hover": {
                                      bgcolor: "rgba(245, 0, 87, 0.1)",
                                    },
                                  }}
                                >
                                  <ListItemIcon>
                                    <Delete sx={{ color: "#f50057" }} />
                                  </ListItemIcon>
                                  <ListItemText>Delete</ListItemText>
                                </MenuItem>
                              </Menu>
                            </>
                          ) : null}
                        </Box>
                        {/* Image Section */}
                        <Box
                          sx={{
                            padding: "10px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <img
                            onClick={() =>
                              router.push("/whatshot/post/detail/" + post?.Id)
                            }
                            // onClick={() => {
                            //     setShowDetail(true);
                            //     setSelectedUserId(post?.ProfileId);
                            // }}
                            src={post?.PhotoLink}
                            alt="Post Image"
                            style={{
                              width: "100%",
                              height: "200px",
                              borderRadius: "10px",
                              objectFit: "cover",
                            }}
                          />
                        </Box>
                        <CardContent
                          sx={{
                            padding: 0,
                            paddingBottom: { xs: 0, sm: 0, md: 0 },
                            "&:last-child": {
                              paddingBottom: 0,
                            },
                          }}
                        >
                          {post?.ImageCaption ? (
                            <Typography
                              variant="body1"
                              sx={{
                                marginBottom: "13px",
                                marginTop: "13px",
                                fontStyle: "italic",
                                padding: "10px 0 10px 0",
                                color: "#fff",
                                backgroundColor: "#f50057",
                                textAlign: "center",
                              }}
                            >
                              {post?.ImageCaption}
                            </Typography>
                          ) : (
                            <Typography
                              variant="body1"
                              sx={{
                                marginBottom: "10px",
                                color: "#fff",
                                backgroundColor: "#f50057",
                                textAlign: "center",
                              }}
                            >
                              No Caption
                            </Typography>
                          )}

                          <Grid container justifyContent="space-between">
                            <Grid item lg={5} md={5} sm={5} xs={5}>
                              <Button
                                onClick={() =>
                                  handlePostLike({
                                    postId: post?.Id,
                                    username: post?.Username,
                                    email: post?.Email,
                                  })
                                }
                                fullWidth
                                variant="contained"
                                color="primary"
                                sx={{
                                  textTransform: "none",
                                  backgroundColor: "#f50057",
                                  color: "#fff",
                                  py: 1.5,
                                  fontSize: "16px",
                                  fontWeight: "bold",
                                }}
                              >
                                Like {post?.LikesCount}
                              </Button>
                            </Grid>
                            <Grid item lg={5} md={5} sm={5} xs={5}>
                              <Button
                                onClick={() =>
                                  router.push(
                                    "/whatshot/post/detail/" + post?.Id,
                                  )
                                }
                                fullWidth
                                sx={{
                                  color: "#fff",
                                  backgroundColor: "transparent",
                                  textTransform: "none",
                                  py: 1.5,
                                  fontSize: {
                                    lg: "16px",
                                    md: "16px",
                                    sm: 12,
                                    xs: 12,
                                  },
                                  fontWeight: "bold",
                                  "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  },
                                }}
                              >
                                Comment {post?.CommentsCount}
                              </Button>
                            </Grid>
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
                                onClick={() => handleReportModalToggle(post)}
                              >
                                <Flag />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Container>
      )}

      {/* Report Modal */}
      <Modal
        open={isReportModalOpen}
        onClose={() => handleReportModalToggle("null")}
        closeAfterTransition
      >
        <Fade in={isReportModalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 300,
              bgcolor: "#1E1E1E",
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
            }}
          >
            <Typography variant="h6" color="white" gutterBottom>
              Report or Block User
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.reportImage}
                  onChange={(e) =>
                    setReportOptions((prev) => ({
                      ...prev,
                      reportImage: e.target.checked,
                    }))
                  }
                  sx={{
                    color: "#f50057",
                    "&.Mui-checked": { color: "#f50057" },
                  }}
                  name="reportImage"
                />
              }
              label="Inappropriate Image"
              sx={{ color: "white", display: "block", mb: 1 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.reportUser}
                  onChange={(e) =>
                    setReportOptions((prev) => ({
                      ...prev,
                      reportUser: e.target.checked,
                    }))
                  }
                  sx={{
                    color: "#f50057",
                    "&.Mui-checked": { color: "#f50057" },
                  }}
                />
              }
              label="Report User"
              sx={{ color: "white", display: "block", mb: 1 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.blockUser}
                  onChange={(e) =>
                    setReportOptions((prev) => ({
                      ...prev,
                      blockUser: e.target.checked,
                    }))
                  }
                  sx={{
                    color: "#f50057",
                    "&.Mui-checked": { color: "#f50057" },
                  }}
                />
              }
              label="Block User"
              sx={{ color: "white", display: "block", mb: 2 }}
            />
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={() => handleReportModalToggle("null")}
                sx={{ bgcolor: "#333", "&:hover": { bgcolor: "#444" } }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleReportSubmit}
                sx={{ bgcolor: "#f50057", "&:hover": { bgcolor: "#c51162" } }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Submit"
                )}
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      <CustomDialog
        open={dialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        confirmText="OK"
        cancelText="CLOSE"
        onClose={() => setDialogOpen(false)}
        onConfirm={() => setDialogOpen(false)}
      />

      {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}
    </Box>
  );
}
