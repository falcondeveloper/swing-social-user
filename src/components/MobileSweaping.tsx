"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  Typography,
  Avatar,
  Button,
  FormControlLabel,
  Checkbox,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Fade,
  Chip,
} from "@mui/material";
import InstructionModal from "@/components/InstructionModal";
import UserProfileModal from "@/components/UserProfileModal";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import PreferencesSheet from "./PreferencesSheet";
import Loader from "@/commonPage/Loader";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppFooterMobile from "@/layout/AppFooterMobile";
import { ArrowRight, Camera, Crown, Lock, Upload } from "lucide-react";

export interface DetailViewHandle {
  open: (id: string) => void;
}

const spring = "cubic-bezier(0.175, 0.885, 0.32, 1.275)";

const SwipeIndicator = ({ type, opacity }: any) => {
  if (!type) return null;
  const style = {
    position: "absolute",
    top: "40%",
    borderRadius: "12px",
    fontSize: "2rem",
    fontWeight: "bold",
    textTransform: "uppercase",
    padding: "0.5rem 1rem",
    opacity: opacity,
    transition: "opacity 0.2s ease-in-out",
    zIndex: 10,
    userSelect: "none",
    pointerEvents: "none",
  };
  const typeStyles: any = {
    delete: {
      right: "5%",
      transform: "rotate(-25deg)",
      color: `#F44336`,
    },
    like: {
      left: "5%",
      transform: "rotate(25deg)",
      color: `#4CAF50`,
    },
    maybe: {
      left: "50%",
      top: "50%",
      transform: "translateX(-50%)",
      color: `#FFC107`,
    },
  };
  return (
    <div style={{ ...style, ...typeStyles[type] }}>
      {type === "maybe" ? (
        <img
          src="/maybe.png"
          alt="Maybe"
          style={{ width: "80px", height: "80px" }}
        />
      ) : type === "delete" ? (
        <img
          src="/swiping-card/no.svg"
          alt="Delete"
          style={{ width: "80px", height: "80px" }}
        />
      ) : (
        <img
          src="/swiping-card/like.svg"
          alt="Like"
          style={{ width: "80px", height: "80px" }}
        />
      )}
    </div>
  );
};

export default function MobileSweaping() {
  const lastSwipeTimeRef = useRef<number>(0);
  const SWIPE_THROTTLE_MS = 0;
  const currentCardRef = useRef<HTMLDivElement | null>(null);
  const isSwiping = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });
  const swipeDeltaRef = useRef({ x: 0, y: 0 });
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const DAILY_LIMIT = 30;
  const [profileId, setProfileId] = useState<any>();
  const [showDetail, setShowDetail] = useState<any>(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [membership, setMembership] = useState(0);
  const [id, setId] = useState("");
  const [memberalarm, setMemberAlarm] = useState("0");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    reportUser: false,
    blockUser: false,
    reportImage: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const [cardStyles, setCardStyles] = useState<any>({ active: {}, next: {} });
  const [isExiting, setIsExiting] = useState(false);
  const [pendingSwipeAction, setPendingSwipeAction] = useState<string | null>(
    null,
  );
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageStyle, setImageStyle] = useState({
    transform: "translate(0,0)",
    transition: "transform 0s",
  });
  const [data, setData] = useState<any>(null);
  const prefsOpenRef = useRef(false);
  const showDetailRef = useRef(false);
  const reportOpenRef = useRef(false);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const openPrefs = () => {
    setPrefsOpen(true);
    window.history.pushState({}, "");
  };

  const closePrefs = () => {
    setPrefsOpen(false);
  };

  useEffect(() => {
    prefsOpenRef.current = prefsOpen;
  }, [prefsOpen]);

  useEffect(() => {
    showDetailRef.current = showDetail;
  }, [showDetail]);

  useEffect(() => {
    reportOpenRef.current = isReportModalOpen;
  }, [isReportModalOpen]);

  useEffect(() => {
    const onPopState = () => {
      if (reportOpenRef.current) {
        setIsReportModalOpen(false);
        return;
      }

      if (showDetailRef.current) {
        setShowDetail(false);
        setSelectedUserId(null);
        return;
      }

      if (prefsOpenRef.current) {
        setPrefsOpen(false);
        return;
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const visibleProfiles = useMemo(() => {
    return userProfiles.slice(currentIndex, currentIndex + 2);
  }, [userProfiles, currentIndex]);

  const preloadProfiles = useMemo(() => {
    return userProfiles;
  }, [userProfiles]);

  const currentProfile = useMemo(() => {
    return userProfiles[currentIndex];
  }, [userProfiles, currentIndex]);

  const sendNotification = useCallback(
    async (message: any, targetProfile: any) => {
      const response = await fetch("/api/user/notification/requestfriend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: targetProfile?.Id,
          title: "❤️ New Match!",
          body: message,
          type: "new_match",
          url: `https://swing-social-user.vercel.app/members/${profileId}`,
        }),
      });

      return await response.json();
    },
    [profileId],
  );

  const handleUpdateLikeMatch = useCallback(
    async (targetProfile: any) => {
      try {
        const response = await fetch("/api/user/sweeping/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileid: profileId,
            targetid: targetProfile?.Id,
          }),
        });
        const username = localStorage.getItem("profileUsername");
        const data = await response.json();
        if (data?.isMatch) {
          setMatchedProfile(targetProfile);
          setShowMatchPopup(true);
          setId(targetProfile?.Id);
          sendNotification(
            `You have a new match with ${username}!`,
            targetProfile,
          );
        }
        return data;
      } catch (error) {
        console.error("Error:", error);
        return null;
      }
    },
    [profileId, sendNotification],
  );

  useEffect(() => {
    if (!profileId) return;

    fetch(`/api/user/sweeping/user?id=${profileId}`)
      .then((res) => res.json())
      .then(({ user }) => {
        setData(user || null);
      })
      .catch(console.error);
  }, [profileId]);

  const getUserList = useCallback(async (profileId: string) => {
    try {
      const response = await fetch(
        "/api/user/sweeping/swipes?id=" + profileId,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      const profiles = data?.swipes || [];
      setUserProfiles(profiles);
      preloadProfileImages(profiles);
    } catch (error) {
      console.error("Error fetching user profiles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePrefsSaved = useCallback(() => {
    setLoading(true);
    if (profileId) {
      getUserList(profileId);
      setSnack({
        open: true,
        message: "Preferences updated successfully",
        severity: "success",
      });
    }
  }, [getUserList, profileId]);

  const handleSnackClose = useCallback(
    (event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") return;
      setSnack((prev) => ({ ...prev, open: false }));
    },
    [],
  );

  const preloadProfileImages = useCallback(
    (profiles: any[]) => {
      if (!profiles?.length) return;

      const canAccessPrivate = membership === 1;

      profiles.forEach((profile) => {
        const urls = getPreloadImages(profile, canAccessPrivate);

        urls.forEach((url) => {
          if (!preloadedImages.has(url)) {
            const img = new Image();
            img.src = url;
            img.onload = () => {
              setPreloadedImages((prev) => new Set(prev).add(url));
            };
          }
        });
      });
    },
    [membership, preloadedImages],
  );

  useEffect(() => {
    const nextProfiles = userProfiles.slice(currentIndex, currentIndex + 3);
    preloadProfileImages(nextProfiles);
  }, [currentIndex, userProfiles, preloadProfileImages]);

  const handleUpdateCategoryRelation = useCallback(
    async (category: any, targetProfile: any) => {
      try {
        const response = await fetch("/api/user/sweeping/relation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pid: profileId,
            targetid: targetProfile?.Id,
            newcategory: category,
          }),
        });
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error:", error);
        return null;
      }
    },
    [profileId],
  );

  const handleGrantAccess = useCallback(async () => {
    try {
      const response = await fetch("/api/user/sweeping/grant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileid: profileId,
          targetid: currentProfile?.Id,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }, [profileId, currentProfile]);

  const fetchNextBatchAndAppend = useCallback(async () => {
    if (!profileId) return;

    if (isFetchingMore) return;
    setIsFetchingMore(true);

    const MAX_RETRIES = 4;
    const RETRY_DELAY_MS = 700;
    const PREFETCH_THRESHOLD = 4;
    let attempt = 0;
    let appended = false;

    while (attempt < MAX_RETRIES && !appended) {
      attempt += 1;
      try {
        const response = await fetch(
          `/api/user/sweeping/swipes?id=${profileId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        const data = await response.json();
        const profiles = data?.swipes || [];

        // Filter out any IDs we already have locally (defensive)
        const existingIds = new Set(userProfiles.map((p) => p.Id));
        const newProfiles = profiles.filter((p: any) => !existingIds.has(p.Id));

        if (newProfiles.length > 0) {
          // append
          setUserProfiles((prev) => [...prev, ...newProfiles]);
          preloadProfileImages(newProfiles);
          appended = true;
          break;
        } else {
          // If backend returned 0 or only already-known IDs, wait and retry once or twice
          // This helps in case the relationship write hasn't fully committed yet
          await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
        }
      } catch (err) {
        console.error("Error while trying to fetch next batch:", err);
        // wait a bit and retry
        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      }
    }

    setIsFetchingMore(false);
  }, [profileId, userProfiles, preloadProfileImages]);

  const isUserPremium = () => membership === 1;
  const hasReachedSwipeLimit = () => swipeCount >= DAILY_LIMIT;

  const processSwipe = useCallback(
    (direction: string, targetProfile: any) => {
      setImageIndex(0);
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;

        const PREFETCH_THRESHOLD = 20;
        const remaining = Math.max(0, userProfiles.length - nextIndex);

        if (profileId && !isFetchingMore && remaining <= PREFETCH_THRESHOLD) {
          fetchNextBatchAndAppend().catch((err) =>
            console.error("Prefetch failed:", err),
          );
        }

        if (profileId && nextIndex >= userProfiles.length && !isFetchingMore) {
          fetchNextBatchAndAppend().catch((err) =>
            console.error("fetchNextBatch error:", err),
          );
        }

        return nextIndex;
      });

      setCardStyles({
        active: {
          transform: "scale(1)",
          transition: `transform 0.5s ${spring}`,
        },
        next: {
          transform: "scale(0.95)",
          transition: `transform 0.5s ${spring}`,
        },
      });

      const apiCalls: Promise<any>[] = [];

      if (direction === "left") {
        apiCalls.push(handleUpdateCategoryRelation("Denied", targetProfile));
      } else if (direction === "right") {
        apiCalls.push(handleUpdateCategoryRelation("Liked", targetProfile));
        apiCalls.push(handleUpdateLikeMatch(targetProfile));
      } else if (direction === "down") {
        apiCalls.push(handleUpdateCategoryRelation("Maybe", targetProfile));
      }

      Promise.all(apiCalls).catch((error) => {
        console.error("Swipe API error:", error);
      });

      if (!isUserPremium() && hasReachedSwipeLimit()) {
        setShowLimitPopup(true);
      } else if (!isUserPremium()) {
        setSwipeCount((prev) => prev + 1);
      }

      setIsProcessingSwipe(false);
      setIsExiting(false);
      setPendingSwipeAction(null);
    },
    [
      userProfiles.length,
      isUserPremium,
      hasReachedSwipeLimit,
      handleUpdateCategoryRelation,
      handleUpdateLikeMatch,
      setSwipeCount,
      setShowLimitPopup,
      setCurrentIndex,
      fetchNextBatchAndAppend,
      isFetchingMore,
      profileId,
    ],
  );

  const getEventPoint = (e: any) => (e.touches ? e.touches[0] : e);

  const hasMoreProfiles = currentIndex < userProfiles.length;

  const handleSwipeStart = (e: any) => {
    if (!currentProfile || !hasMoreProfiles || isProcessingSwipe || isExiting) {
      return;
    }
    isSwiping.current = true;
    const point = getEventPoint(e);
    startPoint.current = { x: point.clientX, y: point.clientY };
    swipeDeltaRef.current = { x: 0, y: 0 };

    setCardStyles((prev: any) => ({
      ...prev,
      active: { ...prev.active, transition: "transform 0s" },
    }));
    setImageStyle((prev) => ({ ...prev, transition: "none" }));
  };

  const handleSwipeMove = (e: any) => {
    if (!isSwiping.current || isProcessingSwipe || isExiting) return;
    const point = getEventPoint(e);
    const deltaX = point.clientX - startPoint.current.x;
    const deltaY = point.clientY - startPoint.current.y;
    const rotate = deltaX * 0.1;

    let swipeType: string | null = null;
    let swipeOpacity = 0;
    const nextCardScale = 0.95 + Math.min(Math.abs(deltaX) / 2000, 0.05);

    const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

    swipeDeltaRef.current = { x: deltaX, y: deltaY };

    if (isVertical) {
      if (deltaY > 0) {
        if (deltaY > 50) swipeType = "maybe";
        swipeOpacity = Math.min(deltaY / 100, 1);

        setCardStyles({
          active: {
            transform: `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${rotate}deg)`,
            swipeType,
            swipeOpacity,
            transition: "transform 0s",
          },
          next: {
            transform: `scale(${nextCardScale})`,
            transition: `transform 0.2s ease-out`,
          },
        });
        setImageStyle({ transform: "translate(0,0)", transition: "none" });
      } else {
        // Upward swipe -> Move Image Only
        setCardStyles({
          active: {
            transform: `scale(1)`,
            swipeType: null,
            swipeOpacity: 0,
            transition: "transform 0s",
          },
          next: {
            transform: `scale(${nextCardScale})`,
            transition: `transform 0.2s ease-out`,
          },
        });
        setImageStyle({
          transform: `translateY(${deltaY}px)`,
          transition: "none",
        });
      }
    } else {
      if (deltaX > 50) swipeType = "like";
      if (deltaX < -50) swipeType = "delete";
      swipeOpacity = Math.min(Math.abs(deltaX) / 100, 1);

      setCardStyles({
        active: {
          transform: `translateX(${deltaX}px) translateY(0px) rotate(${rotate}deg)`,
          swipeType,
          swipeOpacity,
          transition: "transform 0s",
        },
        next: {
          transform: `scale(${nextCardScale})`,
          transition: `transform 0.2s ease-out`,
        },
      });
      setImageStyle({ transform: "translate(0,0)", transition: "none" });
    }
  };

  const triggerExitAnimation = useCallback(
    (action: string) => {
      const now = Date.now();
      if (now - lastSwipeTimeRef.current < SWIPE_THROTTLE_MS) {
        return;
      }
      lastSwipeTimeRef.current = now;

      if (isProcessingSwipe || isExiting) return;

      const targetProfile = currentProfile;
      if (!targetProfile) return;

      setIsExiting(true);
      setIsProcessingSwipe(true);
      setPendingSwipeAction(action);

      let exitTransform = "";
      let finalRotate = 0;
      if (action === "like") {
        exitTransform = "translateX(200vw)";
        finalRotate = 30;
      } else if (action === "delete") {
        exitTransform = "translateX(-200vw)";
        finalRotate = -30;
      } else if (action === "maybe") {
        exitTransform = "translateY(200vh)";
        finalRotate = 0;
      }

      setCardStyles((prev: any) => ({
        ...prev,
        active: {
          transform: `${exitTransform} rotate(${finalRotate}deg)`,
          transition: `transform 0.1s ease-out`,
          swipeType: action,
          swipeOpacity: 1,
        },
        next: {
          transform: "scale(1)",
          transition: `transform 0.01s ease-in`,
        },
      }));
    },
    [
      currentProfile,
      router,
      isProcessingSwipe,
      isExiting,
      setCardStyles,
      setPendingSwipeAction,
      setIsExiting,
      setIsProcessingSwipe,
    ],
  );

  const handleSwipeEnd = useCallback(() => {
    isSwiping.current = false;

    const swipeThreshold = 120;
    const { x: deltaX, y: deltaY } = swipeDeltaRef.current;

    let action = null;
    if (deltaX > swipeThreshold) action = "like";
    else if (deltaX < -swipeThreshold) action = "delete";
    else if (deltaY > swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX))
      action = "maybe";
    else if (deltaY < -swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
      // Swipe Up -> Next Image Animation
      // 1. Slide out to top
      setImageStyle({
        transform: `translateY(${-window.innerHeight}px)`,
        transition: "transform 0.3s ease-out",
      });

      setTimeout(() => {
        // 2. Change Image
        const { all } = getAllImages(currentProfile);
        setImageIndex((prev) => (prev === all.length - 1 ? 0 : prev + 1));

        // 3. Reset to bottom (instant)
        setImageStyle({
          transform: `translateY(${window.innerHeight}px)`,
          transition: "none",
        });

        // 4. Slide in from bottom
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setImageStyle({
              transform: "translateY(0)",
              transition: "transform 0.3s ease-out",
            });
          });
        });
      }, 300);

      // Reset card styles just in case
      setCardStyles({
        active: {
          transform: "scale(1)",
          transition: `transform 0.4s ${spring}`,
          swipeType: null,
          swipeOpacity: 0,
        },
        next: {
          transform: "scale(0.95)",
          transition: `transform 0.4s ${spring}`,
        },
      });
      return;
    }

    if (action) {
      if (!isUserPremium() && hasReachedSwipeLimit()) {
        setShowLimitPopup(true);
        setCardStyles({
          active: {
            transform: "scale(1)",
            transition: `transform 0.4s ${spring}`,
            swipeType: null,
            swipeOpacity: 0,
          },
          next: {
            transform: "scale(0.95)",
            transition: `transform 0.4s ${spring}`,
          },
        });
        return;
      }
      triggerExitAnimation(action);
    } else {
      // Reset Image if it was moved but not enough
      setImageStyle({
        transform: "translateY(0)",
        transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      });

      setCardStyles({
        active: {
          transform: "scale(1)",
          transition: `transform 0.4s ${spring}`,
          swipeType: null,
          swipeOpacity: 0,
        },
        next: {
          transform: "scale(0.95)",
          transition: `transform 0.4s ${spring}`,
        },
      });
    }
  }, [
    cardStyles,
    isProcessingSwipe,
    isExiting,
    isUserPremium,
    hasReachedSwipeLimit,
    triggerExitAnimation,
  ]);

  useEffect(() => {
    setCardStyles({
      active: { transform: "scale(1)", transition: `transform 0.5s ${spring}` },
      next: {
        transform: "scale(0.95)",
        transition: `transform 0.5s ${spring}`,
      },
    });
  }, [currentIndex]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (prefsOpen) return;

      if (
        window.scrollY === 0 &&
        e.touches &&
        e.touches.length === 1 &&
        e.touches[0].clientY > 0
      ) {
        if (e.cancelable) e.preventDefault();
      }
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [prefsOpen]);

  const handleClose = () => {
    setShowDetail(false);
    setSelectedUserId(null);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("loginInfo");
      const count = localStorage.getItem("memberalarm");
      setMemberAlarm(count ?? "0");
      if (token) {
        const decodeToken = jwtDecode<any>(token);
        setProfileId(decodeToken?.profileId);
        setMembership(decodeToken?.membership);
        getUserList(decodeToken?.profileId);
      } else {
        router.push("/login");
      }
    }
  }, []);

  const handleReportModalToggle = () => {
    setIsReportModalOpen((prev) => !prev);
    window.history.pushState({}, "");
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
      setIsReportModalOpen(false);
      setReportOptions({
        reportUser: false,
        blockUser: false,
        reportImage: false,
      });
    } catch (err) {
      console.error("Error reporting image:", err);
      toast.error("Error reporting image.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = useCallback(async () => {
    if (!currentProfile) return;

    setIsSubmitting(true);

    const token = localStorage.getItem("loginInfo");
    const decodeToken = token ? jwtDecode<any>(token) : {};
    const reportedByName = decodeToken?.profileName || "Me";

    try {
      if (reportOptions.reportImage) {
        await reportImageApi({
          reportedById: profileId,
          reportedByName,
          reportedUserId: currentProfile?.Id,
          reportedUserName: currentProfile?.Username,
          image: currentProfile?.Avatar,
        });
      }

      if (reportOptions.reportUser || reportOptions.blockUser) {
        const res = await fetch("/api/user/sweeping/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileid: profileId,
            targetid: currentProfile?.Id,
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
  }, [currentProfile, profileId, reportOptions]);

  const getAge = (dob?: string) => {
    if (!dob) return null;
    return new Date().getFullYear() - new Date(dob).getFullYear();
  };

  const getAllImages = (profile: any) => {
    const publicImgs: string[] = [];
    const privateImgs: string[] = [];

    if (profile.Avatar) {
      publicImgs.push(profile.Avatar);
    }

    for (let i = 1; i <= 6; i++) {
      const key = profile[`imgpub${i}`];
      if (key) publicImgs.push(key);
    }

    for (let i = 1; i <= 6; i++) {
      const key = profile[`imgpriv${i}`];
      if (key) privateImgs.push(key);
    }

    return {
      publicImgs,
      privateImgs,
      all: [...publicImgs, ...privateImgs],
    };
  };

  const ProfileImage = ({
    src,
    isPrivate,
    isPublic,
    isAvatar,
    isPremium,
    publicImageCount,
    onUpgrade,
  }: {
    src: string;
    isPrivate?: boolean;
    isPublic?: boolean;

    isAvatar?: boolean;
    isPremium: boolean;
    publicImageCount: number;
    onUpgrade: () => void;
  }) => {
    const isPrivateLocked = isPrivate && !isPremium;
    const MIN_PUBLIC_IMAGES = 2;
    const remainingPublicImages = Math.max(
      MIN_PUBLIC_IMAGES - publicImageCount,
      0,
    );

    const isPublicLocked =
      isPublic && !isAvatar && publicImageCount < MIN_PUBLIC_IMAGES;

    return (
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        <Box
          component="img"
          src={src}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: isPrivateLocked || isPublicLocked ? "blur(20px)" : "none",
          }}
        />

        {isPublicLocked && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "24px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.12)",
              // zIndex: 200,
              pointerEvents: "auto",
            }}
          >
            {/* Icon */}
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: "20px",
              }}
            >
              <Camera style={{ color: "#fff", width: 32, height: 32 }} />
            </Box>

            {/* Title */}
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "22px",
                mb: "8px",
              }}
            >
              Public Photos Required
            </Typography>

            {/* Progress */}
            <Typography
              sx={{
                color: "#F50057",
                fontWeight: 700,
                fontSize: "16px",
                mb: "6px",
              }}
            >
              {publicImageCount} / {MIN_PUBLIC_IMAGES} uploaded
            </Typography>

            {/* Explanation */}
            <Typography
              sx={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "14px",
                lineHeight: 1.6,
                maxWidth: 300,
                mb: "8px",
              }}
            >
              Upload <b>{remainingPublicImages}</b> more public photo
              {remainingPublicImages > 1 ? "s" : ""} to view other members’
              public photos.
            </Typography>

            {/* CTA */}
            <Button
              variant="contained"
              onClick={() => router.push("/profile")}
              sx={{
                background: "linear-gradient(135deg, #F50057 0%, #D5004C 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "15px",
                mb: "6px",
                padding: "14px 36px",
                borderRadius: "30px",
                textTransform: "none",
                boxShadow: "0 6px 20px rgba(245,0,87,0.35)",
                display: "flex",
                alignItems: "center",
                zIndex: 9999,
                gap: "8px",
                "&:hover": {
                  transform: "translateY(-2px)",
                },
              }}
            >
              Go to Profile
              <ArrowRight size={18} strokeWidth={2.4} />
            </Button>

            {/* How-to */}
            <Typography
              sx={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "13px",
                mb: "22px",
              }}
            >
              Go to <b>Profile → Edit → Public Photos</b>
            </Typography>
          </Box>
        )}

        {!isPublicLocked && isPrivateLocked && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "28px 24px",
              borderRadius: "18px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                backgroundColor: "rgba(245, 0, 87, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                border: "2px solid rgba(245, 0, 87, 0.35)",
              }}
            >
              <Lock
                style={{
                  color: "#F50057",
                  width: "30px",
                  height: "30px",
                  strokeWidth: "2.5px",
                }}
              />
            </Box>

            <Typography
              sx={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "22px",
                letterSpacing: "-0.2px",
                marginBottom: "8px",

                textShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }}
            >
              Private Photos Locked
            </Typography>

            <Typography
              sx={{
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: "14px",
                lineHeight: "1.5",
                maxWidth: "280px",
                marginBottom: "24px",
                fontWeight: 400,
                opacity: 0.9,
              }}
            >
              Upgrade your account to unlock and view this member's private
              photos. Connect on a deeper level.
            </Typography>

            <Button
              variant="contained"
              sx={{
                backgroundColor: "#F50057",
                background: "linear-gradient(135deg, #F50057 0%, #D5004C 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "15px",
                padding: "14px 36px",
                borderRadius: "30px",
                textTransform: "none",
                boxShadow: "0 6px 20px rgba(245, 0, 87, 0.35)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #E00050 0%, #C00044 100%)",
                  boxShadow: "0 8px 24px rgba(245, 0, 87, 0.45)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s ease",
                minWidth: "200px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                zIndex: 9999,
              }}
              onClick={onUpgrade}
            >
              <Crown
                style={{
                  width: "18px",
                  height: "18px",
                  strokeWidth: "2.2px",
                }}
              />
              Upgrade to View
            </Button>
            <Typography
              sx={{
                color: "rgba(255, 255, 255, 0.45)",
                fontSize: "11px",
                marginTop: "18px",
                maxWidth: "260px",
                lineHeight: 1.4,
              }}
            >
              🔒 Private photos are only visible to premium members for enhanced
              privacy
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const getPreloadImages = (
    profile: any,
    canAccessPrivate: boolean,
  ): string[] => {
    const urls: string[] = [];

    if (profile.Avatar) urls.push(profile.Avatar);

    for (let i = 1; i <= 6; i++) {
      const img = profile[`imgpub${i}`];
      if (img) urls.push(img);
    }

    if (canAccessPrivate) {
      for (let i = 1; i <= 6; i++) {
        const img = profile[`imgpriv${i}`];
        if (img) urls.push(img);
      }
    }

    return urls;
  };

  const ImageDots = ({
    total,
    active,
    onSelect,
  }: {
    total: number;
    active: number;
    onSelect: (index: number) => void;
  }) => {
    if (total <= 1) return null;

    return (
      <Box
        sx={{
          position: "absolute",
          right: 14,
          bottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 10,
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === active;

          return (
            <Box
              key={i}
              onClick={() => onSelect(i)}
              onTouchStart={() => onSelect(i)}
              sx={{
                width: 8,
                height: isActive ? 20 : 8,
                borderRadius: 10,
                backgroundColor: isActive ? "#fff" : "rgba(255,255,255,0.4)",
                transition: "all 0.2s ease",
                cursor: "pointer",

                "&:active": {
                  transform: "scale(1.2)",
                },
              }}
            />
          );
        })}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#121212",
        }}
      >
        <AppHeaderMobile />
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
        <AppFooterMobile />
      </Box>
    );
  }

  return (
    <>
      <AppHeaderMobile />
      <div style={{ display: "none" }}>
        {preloadProfiles.map((profile, index) =>
          profile?.Avatar ? (
            <img
              key={index}
              src={profile.Avatar}
              alt="preload"
              onLoad={() => {
                setPreloadedImages((prev) => {
                  const updated = new Set(prev);
                  updated.add(profile.Avatar);
                  return updated;
                });
              }}
            />
          ) : null,
        )}
      </div>

      <div className="mobile-sweeping-container">
        {userProfiles.length > 0 && hasMoreProfiles ? (
          visibleProfiles.map((profile: any, index: number) => (
            <Card
              key={profile.Id}
              ref={index === 0 ? currentCardRef : null}
              elevation={0}
              sx={{
                position: "absolute",
                inset: 0,
                background: "transparent",
                boxShadow: "none",
                transform:
                  index === 0
                    ? cardStyles.active.transform
                    : cardStyles.next.transform,
                transition:
                  index === 0
                    ? cardStyles.active.transition
                    : cardStyles.next.transition,
                zIndex: index === 0 ? 2 : 1,
              }}
              onTransitionEnd={(e) => {
                if (
                  index === 0 &&
                  isExiting &&
                  e.propertyName === "transform" &&
                  pendingSwipeAction
                ) {
                  const actionMap: any = {
                    delete: "left",
                    like: "right",
                    maybe: "down",
                  };
                  processSwipe(actionMap[pendingSwipeAction], profile);
                }
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 6,
                  touchAction: "none",
                }}
                onTouchStart={handleSwipeStart}
                onTouchMove={handleSwipeMove}
                onTouchEnd={handleSwipeEnd}
                onTouchCancel={handleSwipeEnd}
              />
              <Box className="profile-gradient-bg">
                <Box
                  sx={{
                    height: "100%",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <Box sx={{ height: "75%", position: "relative" }}>
                    {(() => {
                      const { publicImgs, privateImgs, all } =
                        getAllImages(profile);

                      const isAvatar = imageIndex === 0 && !!profile.Avatar;

                      const isPublic = imageIndex < publicImgs.length;

                      const isPrivate =
                        imageIndex >= publicImgs.length &&
                        privateImgs.length > 0;

                      const currentSrc =
                        all[imageIndex] ||
                        profile.Avatar ||
                        "/fallback-avatar.png";

                      return (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            border: "2px solid rgba(255,255,255,0.35)",
                            borderRadius: "20px",
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              transform:
                                index === 0 ? imageStyle.transform : "none",
                              transition:
                                index === 0 ? imageStyle.transition : "none",
                            }}
                          >
                            <ProfileImage
                              src={currentSrc}
                              isPrivate={isPrivate}
                              isPublic={isPublic}
                              isAvatar={isAvatar}
                              isPremium={membership === 1}
                              publicImageCount={data?.PublicImage ?? 0}
                              onUpgrade={() => router.push("/membership")}
                            />
                          </Box>

                          <ImageDots
                            total={all.length}
                            active={imageIndex}
                            onSelect={(index) => {
                              setImageIndex(index);
                            }}
                          />

                          {profile?.selfie_verification_status === "true" && (
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 8,
                                left: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                px: "10px",
                                py: "6px",
                                bgcolor: "rgba(0,0,0,0.6)",
                                backdropFilter: "blur(40px)",
                                WebkitBackdropFilter: "blur(40px)",
                                borderRadius: "14px",
                                zIndex: 10,
                              }}
                            >
                              <Box
                                component="img"
                                src="/verified-badge.svg"
                                alt="Verified"
                                sx={{ width: 14, height: 14 }}
                              />
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  color: "#fff",
                                  fontWeight: 500,
                                  lineHeight: 1,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Profile Verified
                              </Typography>
                            </Box>
                          )}

                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              zIndex: 2,
                              touchAction: "none",
                            }}
                            onTouchStart={handleSwipeStart}
                            onTouchMove={handleSwipeMove}
                            onTouchEnd={handleSwipeEnd}
                            onTouchCancel={handleSwipeEnd}
                          />
                        </Box>
                      );
                    })()}

                    {index === 0 && cardStyles.active && (
                      <SwipeIndicator
                        type={cardStyles.active.swipeType}
                        opacity={cardStyles.active.swipeOpacity}
                      />
                    )}

                    <IconButton
                      onClick={openPrefs}
                      sx={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        width: 36,
                        height: 36,
                        bgcolor: "rgba(114, 114, 148, 0.5)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        borderRadius: "50%",
                        zIndex: 10,
                        "&:hover": {
                          bgcolor: "rgba(114, 114, 148, 0.65)",
                        },
                      }}
                    >
                      <img
                        src="/swiping-card/preferences.svg"
                        alt="preferences"
                        style={{
                          width: 16,
                          height: 16,
                          objectFit: "contain",
                        }}
                      />
                    </IconButton>

                    <IconButton
                      onClick={() => {
                        setShowDetail(true);
                        setSelectedUserId(profile?.Id);
                        window.history.pushState({}, "");
                      }}
                      sx={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        width: 36,
                        height: 36,
                        bgcolor: "rgba(114, 114, 148, 0.5)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        zIndex: 10,
                        justifyContent: "center",
                        padding: 0,
                        "&:hover": {
                          bgcolor: "rgba(114, 114, 148, 0.65)",
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src="/swiping-card/info.svg"
                        alt="info button"
                        sx={{
                          width: 18,
                          height: 18,
                          display: "block",
                        }}
                      />
                    </IconButton>

                    {/* <IconButton
                      onClick={handleReportModalToggle}
                      sx={{
                        position: "absolute",
                        bottom: 24,
                        right: 14,
                        width: 36,
                        height: 36,
                        bgcolor: "rgba(114, 114, 148, 0.5)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        borderRadius: "50%",
                        display: "flex",
                        zIndex: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        "&:hover": {
                          bgcolor: "rgba(114, 114, 148, 0.65)",
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src="/swiping-card/flag.svg"
                        alt="info button"
                        sx={{
                          width: 16,
                          height: 16,
                          display: "block",
                        }}
                      />
                    </IconButton> */}

                    {/* {[
                      profile?.imgpriv1,
                      profile?.imgpriv2,
                      profile?.imgpriv3,
                      profile?.imgpriv4,
                      profile?.imgpriv5,
                      profile?.imgpriv6,
                      profile?.imgpub1,
                      profile?.imgpub2,
                      profile?.imgpub3,
                      profile?.imgpub4,
                      profile?.imgpub5,
                      profile?.imgpub6,
                    ].some(Boolean) ? (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 14,
                          right: 14,
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <IconButton
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            bgcolor: "rgba(114, 114, 148, 0.5)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            zIndex: 10,
                            padding: 0,
                            "&:hover": {
                              bgcolor: "rgba(114, 114, 148, 0.65)",
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const { all } = getAllImages(profile);

                            setImageIndex((prev) =>
                              prev === 0 ? all.length - 1 : prev - 1,
                            );
                          }}

                        // disabled={imageIndex === 0}
                        >
                          <Box
                            component="img"
                            src="/swiping-card/left-arrow.svg"
                            alt="previous"
                            sx={{
                              width: 16,
                              height: 16,
                              display: "block",
                            }}
                          />
                        </IconButton>

                        <IconButton
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            bgcolor: "rgba(114, 114, 148, 0.5)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            zIndex: 10,
                            padding: 0,
                            "&:hover": {
                              bgcolor: "rgba(114, 114, 148, 0.65)",
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const { all } = getAllImages(profile);

                            setImageIndex((prev) =>
                              prev === all.length - 1 ? 0 : prev + 1,
                            );
                          }}
                        >
                          <Box
                            component="img"
                            src="/swiping-card/right-arrow.svg"
                            alt="next"
                            sx={{
                              width: 16,
                              height: 16,
                              display: "block",
                            }}
                          />
                        </IconButton>
                      </Box>
                    ) : null} */}
                  </Box>

                  <Box
                    sx={{
                      pt: "8px",
                      px: "8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <Box
                      onClick={() => {
                        setShowDetail(true);
                        setSelectedUserId(profile?.Id);
                        window.history.pushState({}, "");
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: "2px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        justifyContent: "center",
                        zIndex: 10,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "20px",
                          fontWeight: 600,
                          color: "#F50057",
                          lineHeight: "34px",
                          maxWidth: "100%",
                          textAlign: "center",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flexShrink: 1,
                          minWidth: 0,
                          letterSpacing: "0",
                        }}
                      >
                        {profile.Username},
                      </Typography>

                      {profile?.DateOfBirth && profile?.Gender && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexShrink: 0,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "20px",
                              fontWeight: 600,
                              color: "#F50057",
                              lineHeight: "34px",
                              letterSpacing: "0",
                            }}
                          >
                            {getAge(profile.DateOfBirth)}
                          </Typography>

                          <Box
                            component="img"
                            src={
                              profile.Gender === "Male"
                                ? "/swiping-card/male.svg"
                                : "/swiping-card/female.svg"
                            }
                            alt={profile.Gender}
                            sx={{ width: 16, height: 16 }}
                          />
                        </Box>
                      )}

                      {profile?.PartnerDateOfBirth &&
                        profile?.PartnerGender && (
                          <Box
                            component="img"
                            src="/swiping-card/separator.svg"
                            alt="|"
                            sx={{
                              width: 2,
                              height: 25,
                              objectFit: "cover",
                              objectPosition: "center",
                              display: "block",
                              flexShrink: 0,
                              mx: "3px",
                            }}
                          />
                        )}

                      {profile?.PartnerDateOfBirth &&
                        profile?.PartnerGender && (
                          <>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexShrink: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "20px",
                                  fontWeight: 600,
                                  color: "#F50057",
                                  lineHeight: "34px",
                                  letterSpacing: "0",
                                }}
                              >
                                {getAge(profile.PartnerDateOfBirth)}
                              </Typography>

                              <Box
                                component="img"
                                src={
                                  profile.PartnerGender === "Male"
                                    ? "/swiping-card/male.svg"
                                    : "/swiping-card/female.svg"
                                }
                                alt={profile.PartnerGender}
                                sx={{ width: 16, height: 16 }}
                              />
                            </Box>
                          </>
                        )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                        justifyContent: "center",
                        width: "100%",
                        mb: "10px",
                      }}
                    >
                      <Box
                        component="img"
                        src="/swiping-card/location.svg"
                        alt="Location"
                        sx={{ width: 16, height: 16 }}
                      />
                      <Typography
                        sx={{
                          fontSize: 14,
                          color: "#FFFFFF",
                          fontWeight: "400",
                          lineHeight: "18px",
                        }}
                      >
                        {profile.Location?.replace(", USA", "")}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "13px",
                        mb: "14px",
                        lineHeight: "16px",
                        color: "rgba(255,255,255,0.7)",
                        fontWeight: 400,
                        letterSpacing: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textAlign: "center",
                        textOverflow: "ellipsis",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: profile?.About ? profile?.About : ".",
                      }}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "nowrap",
                        justifyContent: "center",
                        gap: 1,
                        width: "100%",
                        overflow: "hidden",
                      }}
                    >
                      {profile?.SwingStyleTags?.slice(0, 4).map(
                        (tag: string, index: number) => {
                          return (
                            <Chip
                              key={`${tag}-${index}`}
                              label={tag}
                              sx={{
                                bgcolor: "#4D354B",
                                color: "rgba(255,255,255,0.7)",
                                fontSize: "13px",
                                height: "24px",
                                borderRadius: "8px",
                                fontWeight: 400,
                                textTransform: "capitalize",
                                flexShrink: 1,
                                minWidth: 0,
                                maxWidth: "25%",

                                "& .MuiChip-label": {
                                  px: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                },
                              }}
                            />
                          );
                        },
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Card>
          ))
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "white",
              px: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                maxWidth: 340,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  lineHeight: "26px",
                }}
              >
                No more profiles right now ❤️
              </Typography>

              <Typography
                sx={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: "20px",
                }}
              >
                You’ve seen everyone that matches your current preferences. Try
                adjusting them to discover more people.
              </Typography>

              <Box
                sx={{
                  textAlign: "left",
                  width: "100%",
                  mt: 1,
                  px: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 600,
                    mb: 0.5,
                    color: "#F50057",
                  }}
                >
                  Try adjusting:
                </Typography>

                <Typography
                  sx={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}
                >
                  • Max Distance / location
                  <br />• Gender or partner preferences
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={openPrefs}
                sx={{
                  mt: 2,
                  px: 3,
                  py: 1,
                  color: "white",
                  borderRadius: "999px",
                  backgroundColor: "#F50057",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#c51162",
                  },
                }}
              >
                Adjust Preferences
              </Button>

              <Typography
                sx={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                  mt: 0.5,
                }}
              >
                Check back later for new matches ✨
              </Typography>
            </Box>
          </Box>
        )}
      </div>
      <AppFooterMobile />

      <PreferencesSheet
        open={prefsOpen}
        onOpen={openPrefs}
        onClose={closePrefs}
        profileId={profileId}
        onSaved={handlePrefsSaved}
      />

      {memberalarm && parseInt(memberalarm) > 2 ? null : <InstructionModal />}

      {selectedUserId && (
        <UserProfileModal
          open={showDetail}
          userid={selectedUserId}
          handleClose={handleClose}
          handleGrantAccess={handleGrantAccess}
        />
      )}

      <Modal
        open={isReportModalOpen}
        onClose={handleReportModalToggle}
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
                onClick={handleReportModalToggle}
                sx={{
                  bgcolor: "#333",
                  color: "#fff",
                  "&:hover": { bgcolor: "#444" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleReportSubmit}
                sx={{
                  bgcolor: "#f50057",
                  color: "#fff",
                  "&:hover": { bgcolor: "#c51162" },
                }}
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

      <Dialog
        open={showLimitPopup}
        onClose={(event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
          }
          setShowLimitPopup(false);
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#121212",
            color: "#ffffff",
          },
        }}
      >
        <DialogTitle sx={{ color: "#e91e63" }}>Daily Limit Reached</DialogTitle>
        <DialogContent>
          <Typography>
            You've reached your daily limit of {DAILY_LIMIT} swipes. Upgrade
            your membership to swipe more!
          </Typography>
          <Button
            onClick={() => router.push(`/membership`)}
            sx={{
              mt: 2,
              backgroundColor: "#e91e63",
              color: "white",
              "&:hover": {
                backgroundColor: "#d81b60",
              },
            }}
          >
            Upgrade
          </Button>
          <Button
            onClick={() => setShowLimitPopup(false)}
            sx={{
              mt: 2,
              marginLeft: 1,
              color: "white",
              "&:hover": {
                backgroundColor: "#d81b60",
              },
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showMatchPopup}
        onClose={() => setShowMatchPopup(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#121212",
            color: "#ffffff",
          },
        }}
      >
        <DialogTitle sx={{ color: "#03dac5" }}>It's a Match!</DialogTitle>
        <DialogContent>
          {matchedProfile && (
            <Box textAlign="center">
              <Avatar
                src={matchedProfile.Avatar}
                alt={matchedProfile.Username}
                sx={{
                  width: 100,
                  height: 100,
                  margin: "auto",
                  border: "2px solid #03dac5",
                }}
              />
              <Typography
                sx={{ mt: 2 }}
              >{`You've matched with ${matchedProfile.Username}!`}</Typography>
              <Box display="flex" justifyContent="center" gap={2} mt={2}>
                <Button
                  onClick={() => {
                    setShowDetail(true);
                    setSelectedUserId(matchedProfile?.Id);
                    window.history.pushState({}, "");
                  }}
                  variant="contained"
                  sx={{
                    backgroundColor: "#03dac5",
                    color: "#121212",
                    "&:hover": {
                      backgroundColor: "#00c4a7",
                    },
                  }}
                >
                  View Profile
                </Button>
                <Button
                  onClick={() => router.push(`/messaging/${id}`)}
                  variant="contained"
                  sx={{
                    backgroundColor: "#03dac5",
                    color: "#121212",
                    "&:hover": {
                      backgroundColor: "#00c4a7",
                    },
                  }}
                >
                  Chat
                </Button>

                <Button
                  onClick={() => setShowMatchPopup(false)}
                  variant="outlined"
                  sx={{
                    color: "#03dac5",
                    borderColor: "#03dac5",
                    "&:hover": {
                      borderColor: "#00c4a7",
                      color: "#00c4a7",
                    },
                  }}
                >
                  Continue Swiping
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snack.open}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={2000}
        onClose={handleSnackClose}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          variant="filled"
          sx={{
            backgroundColor: "white",
            color: "#fc4c82",
            fontWeight: "bold",
            alignItems: "center",
            borderRight: "5px solid #fc4c82",
          }}
          icon={
            <Box
              component="img"
              src="/icon.png"
              alt="Logo"
              sx={{ width: 20, height: 20 }}
            />
          }
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
