"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Typography,
  IconButton,
  TextField,
  CircularProgress,
  Badge,
  Drawer,
} from "@mui/material";
import axios from "axios";
import { Delete } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useSocketContext } from "@/context/SocketProvider";
import Loader from "@/commonPage/Loader";
import LazyAvatar from "@/utils/LazyAvatar";
import CustomDialog from "@/components/CustomDialog";

interface ChatItem {
  ChatId: string;
  ToProfileId: string;
  Username: string;
  Avatar?: string;
  Conversation: string;
  LastUp: string;
  NewMessages: number;
}

const DesktopChat = () => {
  const { socket, isConnected } = useSocketContext();
  const router = useRouter();
  const [profileId, setProfileId] = useState<any>();
  const [userProfiles, setUserProfiles] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [typingChats, setTypingChats] = useState<Record<string, boolean>>({});
  const typingTimeouts = useRef<Record<string, any>>({});
  const [loadingChats, setLoadingChats] = useState<boolean>(true);

  // Global dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogAction, setDialogAction] = useState<"success" | "error" | null>(
    null,
  );

  // For confirm delete
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProfileId(localStorage.getItem("logged_in_profile"));
    }
  }, []);

  useEffect(() => {
    if (profileId) {
      getCurrentLocation();
      fetchAllChats();
    }
  }, [profileId]);

  const formatLastUpSmart = (value?: string) => {
    if (!value) return "";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "";

    const now = new Date();

    const isSameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    if (isSameDay) {
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    if (isYesterday) {
      return "Yesterday";
    }

    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    if (!isConnected) return;

    socket.on("typing:start", ({ from }) => {
      setTypingChats((prev) => ({ ...prev, [from]: true }));

      clearTimeout(typingTimeouts.current[from]);
      typingTimeouts.current[from] = setTimeout(() => {
        setTypingChats((prev) => ({ ...prev, [from]: false }));
      }, 3000);
    });

    socket.on("typing:stop", ({ from }) => {
      setTypingChats((prev) => ({ ...prev, [from]: false }));
    });

    socket.on("chat:receive", (msg) => {
      setChatList((prev) => {
        const profileId = localStorage.getItem("logged_in_profile");

        const otherUserId =
          msg.MemberIdFrom === profileId ? msg.MemberIdTo : msg.MemberIdFrom;

        const lastUp = msg.CreatedAt;

        const index = prev.findIndex((c) => c.ToProfileId === otherUserId);

        if (index !== -1) {
          const updated = {
            ...prev[index],
            Conversation: msg.Conversation,
            LastUp: lastUp,
            NewMessages:
              msg.MemberIdFrom === profileId
                ? 0
                : Number(prev[index].NewMessages || 0) + 1,
          };

          const copy = [...prev];
          copy.splice(index, 1);
          return [updated, ...copy];
        }

        return [
          {
            ChatId: `temp-${Date.now()}`,
            ToProfileId: otherUserId,
            Username: msg.FromUsername || "User",
            Avatar: msg.AvatarFrom,
            Conversation: msg.Conversation,
            LastUp: lastUp,
            NewMessages: msg.MemberIdFrom === profileId ? 0 : 1,
          },
          ...prev,
        ];
      });
    });

    return () => {
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("chat:receive");
    };
  }, [isConnected]);

  const fetchAllChats = async () => {
    try {
      setLoadingChats(true);
      const profileid = localStorage.getItem("logged_in_profile");
      const response = await axios.get(
        `/api/user/messaging?profileid=${profileid}`,
      );
      setChatList(response.data.data || []);
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationName = await getLocationName(latitude, longitude);
          await sendLocationToAPI(locationName, latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
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

  const sendLocationToAPI = async (
    locationName: string,
    latitude: number,
    longitude: number,
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      setSearchQuery(searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchUserProfiles = async () => {
      if (loading || !hasMore) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/user/sweeping?page=${page}&size=100&search=${encodeURIComponent(
            searchQuery,
          )}`,
        );
        const data = await response.json();

        if (data?.profiles?.length > 0) {
          setUserProfiles((prev: any) =>
            page === 1 ? data.profiles : [...prev, ...data.profiles],
          );
        } else {
          setHasMore(false);
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchUserProfiles();
  }, [page, searchQuery]);

  const deleteChat = (chatId: string) => {
    const token = localStorage.getItem("loginInfo");

    if (!token) {
      router.push("/login");
      return;
    }

    const decodeToken = jwtDecode<any>(token);

    if (decodeToken?.membership === 0) {
      setDialogTitle("Upgrade your membership");
      setDialogMessage(
        "Sorry, to delete chats, you need to upgrade your membership.",
      );
      setDialogAction("error");
      setDialogOpen(true);
      return;
    }

    // Ask for confirmation
    setPendingDeleteChatId(chatId);
    setDialogTitle("Are you sure?");
    setDialogMessage("This chat will be deleted permanently!");
    setDialogAction("error");
    setDialogOpen(true);
  };

  const openChatDetails = (chat: any) => {
    const token = localStorage.getItem("loginInfo");

    if (token) {
      const decodeToken = jwtDecode<any>(token);
      if (decodeToken?.membership == 0) {
        setDialogTitle("Upgrade your membership");
        setDialogMessage(
          "Sorry, to access this page, you need to upgrade your membership.",
        );
        setDialogAction("error");
        setDialogOpen(true);
      } else {
        router.push(`/messaging/${chat}`);
      }
    } else {
      router.push("/login");
    }
  };

  const HEADER_HEIGHT = 90.5;
  const sortProfilesAZ = (profiles: any[]) => {
    return [...profiles].sort((a, b) =>
      (a.Username || "").localeCompare(b.Username || "", undefined, {
        sensitivity: "base",
      }),
    );
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "ig");

    return text.split(regex).map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ color: "#FF1B6B", fontWeight: 700 }}>
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  if (loadingChats) {
    return (
      <Box
        sx={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#121212",
        }}
      >
        <AppHeaderDesktop />

        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#0A0A0A",
          color: "white",
          flexDirection: "column",
          display: "flex",
        }}
      >
        <AppHeaderDesktop />

        <Box
          sx={{
            display: "flex",
            flex: 1,
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <Drawer
            variant="permanent"
            sx={{
              width: 350,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: {
                width: 350,
                boxSizing: "border-box",
                bgcolor: "#1A1A1A",
                color: "white",
                top: `${HEADER_HEIGHT}px`,
                height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                borderRight: "1px solid rgba(255,255,255,0.08)",
              },
            }}
          >
            <Box sx={{ display: "flex", borderBottom: "1px solid #333" }}>
              <Typography
                onClick={() => router.push("/messaging")}
                sx={{
                  width: "50%",
                  textAlign: "center",
                  py: 2,
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 700,
                  borderBottom: "3px solid #FF1B6B",
                }}
              >
                Chat
              </Typography>

              <Typography
                onClick={() => router.push("/mailbox")}
                sx={{
                  width: "50%",
                  textAlign: "center",
                  py: 2,
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Mailbox
              </Typography>
            </Box>

            <Box sx={{ px: 2, py: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "#444" },
                    "&:hover fieldset": { borderColor: "#fff" },
                    "&.Mui-focused fieldset": { borderColor: "#FF1B6B" },
                  },
                }}
              />
            </Box>

            <List sx={{ px: 1 }}>
              {loading && searchQuery && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={26} sx={{ color: "#FF1B6B" }} />
                </Box>
              )}

              {searchQuery ? (
                sortProfilesAZ(userProfiles).length > 0 ? (
                  sortProfilesAZ(userProfiles).map((user: any) => (
                    <ListItem
                      key={user.Id}
                      onClick={() => openChatDetails(user.Id)}
                      sx={{
                        px: 1.5,
                        py: 1.2,
                        mt: 0.8,
                        borderRadius: 3,
                        cursor: "pointer",
                        bgcolor: "rgba(255,255,255,0.02)",
                        transition: "all 0.2s ease",
                        alignItems: "flex-start",
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.07)",
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 56 }}>
                        <LazyAvatar
                          src={user.Avatar}
                          alt="avatar"
                          size={46}
                          border="2px solid #FF1B6B"
                        />
                      </ListItemAvatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          noWrap
                          component="span"
                          sx={{
                            flex: 1,
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#FF1B6B",
                          }}
                        >
                          {highlightText(user.Username, searchQuery)}
                        </Typography>

                        <Typography
                          component="div"
                          noWrap
                          sx={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.65)",
                            marginTop: "2px",
                          }}
                        >
                          {user?.Location || "No location set"}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))
                ) : (
                  !loading && (
                    <Typography
                      variant="body2"
                      color="gray"
                      textAlign="center"
                      sx={{ py: 3 }}
                    >
                      No users found
                    </Typography>
                  )
                )
              ) : chatList.length > 0 ? (
                chatList.map((chat: any) => {
                  const hasImage = /<img.*?src=/.test(chat.Conversation);

                  return (
                    <ListItem
                      key={chat.ChatId}
                      onClick={() => openChatDetails(chat.ToProfileId)}
                      disableGutters
                      sx={{
                        px: 1.5,
                        py: 1.2,
                        mt: 0.8,
                        borderRadius: 3,
                        cursor: "pointer",
                        bgcolor: "rgba(255,255,255,0.02)",
                        transition: "all 0.2s ease",
                        alignItems: "flex-start",
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.07)",
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 56 }}>
                        {chat.NewMessages > 0 ? (
                          <Badge
                            badgeContent={chat.NewMessages}
                            color="error"
                            overlap="circular"
                            anchorOrigin={{
                              vertical: "top",
                              horizontal: "right",
                            }}
                          >
                            <LazyAvatar
                              src={chat.Avatar}
                              size={46}
                              border="2px solid #FF1B6B"
                            />
                          </Badge>
                        ) : (
                          <LazyAvatar
                            src={chat.Avatar}
                            size={46}
                            border="2px solid #FF1B6B"
                          />
                        )}
                      </ListItemAvatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          noWrap
                          sx={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#FF1B6B",
                          }}
                        >
                          {chat.Username}
                        </Typography>

                        {typingChats[chat.ToProfileId] ? (
                          <Typography
                            sx={{ fontSize: 13, color: "#4CAF50", mt: 0.3 }}
                          >
                            Typing…
                          </Typography>
                        ) : (
                          <Typography
                            noWrap
                            sx={{
                              fontSize: 13,
                              color: "rgba(255,255,255,0.65)",
                              mt: 0.3,
                            }}
                          >
                            {hasImage ? "📷 Sent an image" : chat.Conversation}
                          </Typography>
                        )}
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                          height: 46,
                          ml: 1,
                          flexShrink: 0,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.45)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatLastUpSmart(chat.LastUp)}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.ChatId);
                          }}
                          sx={{
                            color: "rgba(255,255,255,0.35)",
                            "&:hover": {
                              color: "#ff4d4f",
                              bgcolor: "rgba(255,0,0,0.15)",
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  );
                })
              ) : (
                <Typography
                  variant="body2"
                  color="gray"
                  textAlign="center"
                  sx={{ py: 3 }}
                >
                  No Chats Found
                </Typography>
              )}
            </List>
          </Drawer>

          <Box
            sx={{
              flex: 1,
              height: `calc(100vh - ${HEADER_HEIGHT}px)`,
              bgcolor: "#121212",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mt: "90.5px",
            }}
          >
            <Box
              sx={{
                maxWidth: 420,
                width: "100%",
                textAlign: "center",
                p: 5,
                borderRadius: 4,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,27,107,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3,
                }}
              >
                <ChatBubbleOutlineIcon
                  sx={{
                    fontSize: 36,
                    color: "#FF1B6B",
                  }}
                />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  color: "#FF1B6B",
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                Please select a chat
              </Typography>

              <Typography
                sx={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                Start messaging your friends by selecting a chat from the list
                on the left.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <CustomDialog
        open={dialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        confirmText={
          pendingDeleteChatId
            ? "Delete"
            : dialogTitle.includes("Upgrade")
              ? "Upgrade"
              : "OK"
        }
        cancelText={pendingDeleteChatId ? "Cancel" : "Close"}
        onClose={() => {
          setDialogOpen(false);
          setPendingDeleteChatId(null);
        }}
        onConfirm={async () => {
          setDialogOpen(false);

          // 🔴 If upgrading
          if (dialogTitle.includes("Upgrade")) {
            router.push("/membership");
            return;
          }

          // 🗑 If deleting chat
          if (pendingDeleteChatId) {
            try {
              const response = await fetch("/api/user/messaging/chat/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId: pendingDeleteChatId }),
              });

              if (!response.ok) {
                throw new Error("Delete failed");
              }

              setDialogTitle("Deleted!");
              setDialogMessage("The chat has been deleted.");
              setDialogAction("success");
              setDialogOpen(true);

              fetchAllChats();
            } catch (error) {
              setDialogTitle("Error!");
              setDialogMessage("Failed to delete the chat.");
              setDialogAction("error");
              setDialogOpen(true);
            }

            setPendingDeleteChatId(null);
          }
        }}
      />
    </>
  );
};

export default DesktopChat;
