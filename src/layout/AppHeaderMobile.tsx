"use client";

import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import {
  Home,
  Users,
  MessageCircle,
  Heart,
  Menu,
  X,
  LogOut,
  Bell,
  Calendar,
} from "lucide-react";
import LazyAvatar from "@/utils/LazyAvatar";

const AppHeaderMobile = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("loginInfo");
    const pid = localStorage.getItem("logged_in_profile");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      setProfileId(decoded.profileId || pid);
    } catch {
      localStorage.clear();
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
    if (!profileId) return;

    fetch(`/api/user/sweeping/user?id=${profileId}`)
      .then((res) => res.json())
      .then(({ user }) => {
        setAvatar(user?.Avatar || null);
        setUserName(user?.Username || "");
      })
      .catch(console.error);
  }, [profileId]);

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  if (!isMobile) return null;

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Users, label: "Members", path: "/members" },
    {
      icon: "/661764-removebg-preview.png",
      label: "PineApple",
      path: "/pineapple",
    },
    {
      icon: MessageCircle,
      label: "Messaging",
      path: "/messaging",
    },
    { icon: Heart, label: "Matches", path: "/matches" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Calendar, label: "Events", path: "/events" },
    {
      icon: "/images/dollar_img.png",
      label: "Earn $$ for Referrals!",
      path: "/earn-money-referrals",
    },
  ];

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          zIndex: 1200,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: 0.5, py: 1 }}>
          <IconButton onClick={() => setMobileMenuOpen(true)}>
            <Menu color="#FF1B6B" size={25} />
          </IconButton>

          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
            sx={{ height: 34, cursor: "pointer" }}
            onClick={() => router.push("/home")}
          />

          <IconButton onClick={() => router.push("/profile")}>
            <LazyAvatar
              src={avatar || undefined}
              alt="Avatar"
              size={40}
              sx={{
                borderRadius: "10px",
              }}
              imgStyle={{
                objectFit: "cover",
                height: "100%",
                width: "100%",
              }}
            />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: "rgba(16,16,16,0.95)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          },
        }}
      >
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography sx={{ color: "#FF1B6B", fontWeight: 600 }}>
                SwingSocial
              </Typography>
              <IconButton onClick={() => setMobileMenuOpen(false)}>
                <X color="white" size={20} />
              </IconButton>
            </Box>

            <Box
              sx={{ display: "flex", gap: 2, cursor: "pointer" }}
              onClick={() => {
                router.push("/profile");
                setMobileMenuOpen(false);
              }}
            >
              <Avatar
                src={avatar || undefined}
                sx={{
                  width: 48,
                  height: 48,
                  border: "2px solid #FF1B6B",
                }}
              >
                {!avatar && userName?.charAt(0)}
              </Avatar>

              <Box>
                <Typography color="white" fontWeight={600}>
                  {userName}
                </Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.6)">
                  View Profile
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ flex: 1, py: 2 }}>
            <List sx={{ px: 2 }}>
              {navItems.map((item) => {
                const isActive = pathname === item.path;

                return (
                  <ListItem
                    key={item.label}
                    onClick={() => {
                      router.push(item.path);
                      setMobileMenuOpen(false);
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      cursor: "pointer",
                      backgroundImage: isActive
                        ? "linear-gradient(135deg,#FF1B6B,#FF6FA5)"
                        : "none",

                      "&:hover": {
                        backgroundImage: isActive
                          ? "linear-gradient(135deg,#FF1B6B,#FF6FA5)"
                          : "linear-gradient(135deg, rgba(255,27,107,0.15), rgba(255,27,107,0.15))",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {typeof item.icon === "string" ? (
                        <img src={item.icon} width={20} height={20} />
                      ) : (
                        <item.icon
                          size={20}
                          color={isActive ? "#fff" : "#FF6FA5"}
                        />
                      )}
                    </ListItemIcon>

                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        color: isActive ? "#fff" : "#FFD1E1",
                        fontWeight: isActive ? 700 : 500,
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>

          <Box sx={{ p: 3, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <ListItem
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                cursor: "pointer",
                bgcolor: "rgba(244,67,54,0.08)",
                "&:hover": { bgcolor: "rgba(244,67,54,0.15)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogOut size={18} color="#F44336" />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  color: "#F44336",
                  fontWeight: 600,
                }}
              />
            </ListItem>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ height: 69 }} />
    </>
  );
};

export default AppHeaderMobile;

// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   AppBar,
//   Toolbar,
//   Box,
//   IconButton,
//   Drawer,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Avatar,
//   Typography,
//   useTheme,
//   useMediaQuery,
// } from "@mui/material";
// import { useRouter, usePathname } from "next/navigation";
// import { jwtDecode } from "jwt-decode";
// import {
//   Home,
//   Users,
//   MessageCircle,
//   Heart,
//   Menu,
//   X,
//   LogOut,
//   Bell,
//   Calendar,
//   ArrowRight,
// } from "lucide-react";

// const AppHeaderMobile = () => {
//   const router = useRouter();
//   const pathname = usePathname();
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down("md"));

//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [avatar, setAvatar] = useState<string | null>(null);
//   const [userName, setUserName] = useState("");
//   const [profileId, setProfileId] = useState<string | null>(null);

//   useEffect(() => {
//     const token = localStorage.getItem("loginInfo");
//     const pid = localStorage.getItem("logged_in_profile");

//     if (!token) {
//       router.replace("/login");
//       return;
//     }

//     try {
//       const decoded: any = jwtDecode(token);
//       setProfileId(decoded.profileId || pid);
//     } catch {
//       localStorage.clear();
//       router.replace("/login");
//     }
//   }, []);

//   useEffect(() => {
//     if (!profileId) return;

//     fetch(`/api/user/sweeping/user?id=${profileId}`)
//       .then((res) => res.json())
//       .then(({ user }) => {
//         setAvatar(user?.Avatar || null);
//         setUserName(user?.Username || "");
//       })
//       .catch(console.error);
//   }, [profileId]);

//   const handleLogout = () => {
//     localStorage.clear();
//     router.replace("/login");
//   };

//   if (!isMobile) return null;

//   const navItems = [
//     { icon: Home, label: "Home", path: "/home" },
//     { icon: Users, label: "Members", path: "/members" },
//     {
//       icon: "/661764-removebg-preview.png",
//       label: "PineApple",
//       path: "/pineapple",
//     },
//     {
//       icon: MessageCircle,
//       label: "Messaging",
//       path: "/messaging",
//     },
//     { icon: Heart, label: "Matches", path: "/matches" },
//     { icon: Bell, label: "Notifications", path: "/notifications" },
//     { icon: Calendar, label: "Events", path: "/events" },
//     {
//       icon: "/images/dollar_img.png",
//       label: "Earn $$ for Referrals!",
//       path: "/earn-money-referrals",
//     },
//   ];

//   return (
//     <>
//       <AppBar
//         position="fixed"
//         elevation={0}
//         sx={{
//           bgcolor: "rgba(0,0,0,0.7)",
//           backdropFilter: "blur(18px)",
//           borderBottom: "1px solid rgba(255,255,255,0.06)",
//           zIndex: 1200,
//         }}
//       >
//         <Toolbar sx={{ justifyContent: "space-between", px: 0.5, py: 1 }}>
//           <IconButton onClick={() => setMobileMenuOpen(true)}>
//             <Menu color="#FF1B6B" size={25} />
//           </IconButton>

//           <Box
//             component="img"
//             src="/logo.png"
//             alt="Logo"
//             sx={{ height: 34, cursor: "pointer" }}
//             onClick={() => router.push("/home")}
//           />

//           <IconButton onClick={() => router.push("/profile")}>
//             <Avatar
//               src={avatar || undefined}
//               sx={{
//                 width: 36,
//                 height: 36,
//                 border: "2px solid #FF1B6B",
//                 borderRadius: "10px",
//               }}
//             >
//               {!avatar && userName?.charAt(0)}
//             </Avatar>
//           </IconButton>
//         </Toolbar>
//       </AppBar>

//       <Drawer
//         anchor="left"
//         open={mobileMenuOpen}
//         onClose={() => setMobileMenuOpen(false)}
//         PaperProps={{
//           sx: {
//             width: 280,
//             background:
//               "linear-gradient(135deg, rgba(10, 10, 20, 0.98), rgba(20, 10, 30, 0.95))",
//             backdropFilter: "blur(25px)",
//             borderRight: "1px solid rgba(255,27,107,0.15)",
//             boxShadow: "0 0 40px rgba(255,27,107,0.1)",
//             overflow: "hidden",
//             display: "flex",
//             flexDirection: "column",
//             "&::before": {
//               content: '""',
//               position: "absolute",
//               top: 0,
//               left: 0,
//               right: 0,
//               height: "1px",
//               background:
//                 "linear-gradient(90deg, transparent, #FF1B6B, transparent)",
//             },
//           },
//         }}
//       >
//         <Box
//           sx={{
//             p: 2.5,
//             borderBottom: "1px solid rgba(255,255,255,0.05)",
//             background:
//               "linear-gradient(to bottom, rgba(255,27,107,0.05), transparent)",
//             flexShrink: 0,
//             zIndex: 1,
//           }}
//         >
//           <Box
//             sx={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               mb: 3,
//             }}
//           >
//             <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//               <Box
//                 sx={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: "50%",
//                   background: "linear-gradient(135deg, #FF1B6B, #FF6FA5)",
//                   boxShadow: "0 0 10px #FF1B6B",
//                 }}
//               />
//               <Typography
//                 sx={{
//                   color: "#FF1B6B",
//                   fontWeight: 800,
//                   fontSize: "1.25rem",
//                   letterSpacing: "0.5px",
//                 }}
//               >
//                 SwingSocial
//               </Typography>
//             </Box>
//             <IconButton
//               onClick={() => setMobileMenuOpen(false)}
//               sx={{
//                 background: "rgba(255,255,255,0.05)",
//                 border: "1px solid rgba(255,255,255,0.1)",
//                 "&:hover": {
//                   background: "rgba(255,27,107,0.15)",
//                   borderColor: "rgba(255,27,107,0.3)",
//                 },
//               }}
//             >
//               <X color="#FF6FA5" size={18} />
//             </IconButton>
//           </Box>

//           <Box
//             sx={{
//               display: "flex",
//               gap: 2,
//               cursor: "pointer",
//               p: 2,
//               borderRadius: 2,
//               background: "rgba(255,255,255,0.02)",
//               border: "1px solid rgba(255,255,255,0.05)",
//               transition: "all 0.3s ease",
//               "&:hover": {
//                 background: "rgba(255,27,107,0.08)",
//                 borderColor: "rgba(255,27,107,0.2)",
//                 transform: "translateX(4px)",
//               },
//             }}
//             onClick={() => {
//               router.push("/profile");
//               setMobileMenuOpen(false);
//             }}
//           >
//             <Avatar
//               src={avatar || undefined}
//               sx={{
//                 width: 52,
//                 height: 52,
//                 border: "2px solid #FF1B6B",
//                 borderRadius: "10px",
//               }}
//             >
//               {!avatar && userName?.charAt(0).toUpperCase()}
//             </Avatar>

//             <Box sx={{ flex: 1 }}>
//               <Typography color="white" fontWeight={700} fontSize="1rem">
//                 {userName}
//               </Typography>
//               <Typography
//                 variant="caption"
//                 sx={{
//                   color: "#FF6FA5",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 0.5,
//                   fontWeight: 500,
//                 }}
//               >
//                 View Profile
//                 <ArrowRight size={12} />
//               </Typography>
//             </Box>
//           </Box>
//         </Box>

//         <Box
//           sx={{
//             flex: 1,
//             overflow: "auto",
//             position: "relative",
//             "&::-webkit-scrollbar": {
//               width: 4,
//             },
//             "&::-webkit-scrollbar-track": {
//               background: "rgba(255,255,255,0.02)",
//             },
//             "&::-webkit-scrollbar-thumb": {
//               background: "rgba(255,27,107,0.3)",
//               borderRadius: 2,
//             },
//           }}
//         >
//           <List
//             sx={{
//               p: 2,
//               pb: 10,
//             }}
//           >
//             {navItems.map((item, index) => {
//               const isActive = pathname === item.path;

//               return (
//                 <ListItem
//                   key={item.label}
//                   onClick={() => {
//                     router.push(item.path);
//                     setMobileMenuOpen(false);
//                   }}
//                   sx={{
//                     borderRadius: 2,
//                     mb: 1,
//                     cursor: "pointer",
//                     position: "relative",
//                     overflow: "hidden",
//                     background: isActive
//                       ? "linear-gradient(135deg, rgba(255,27,107,0.2), rgba(255,111,165,0.1))"
//                       : "transparent",
//                     border: isActive
//                       ? "1px solid rgba(255,27,107,0.3)"
//                       : "1px solid transparent",
//                     transition: "all 0.3s ease",
//                     "&:hover": {
//                       background:
//                         "linear-gradient(135deg, rgba(255,27,107,0.15), rgba(255,111,165,0.05))",
//                       borderColor: "rgba(255,27,107,0.2)",
//                       transform: "translateX(4px)",
//                       "&::before": {
//                         content: '""',
//                         position: "absolute",
//                         left: 0,
//                         top: 0,
//                         bottom: 0,
//                         width: "3px",
//                         background:
//                           "linear-gradient(to bottom, #FF1B6B, #FF6FA5)",
//                         borderRadius: "0 2px 2px 0",
//                       },
//                     },
//                     "&::after": isActive
//                       ? {
//                           content: '""',
//                           position: "absolute",
//                           right: 12,
//                           width: 6,
//                           height: 6,
//                           borderRadius: "50%",
//                           background: "#FF1B6B",
//                           boxShadow: "0 0 8px #FF1B6B",
//                         }
//                       : {},
//                   }}
//                 >
//                   <ListItemIcon
//                     sx={{
//                       minWidth: 0,
//                       background: isActive
//                         ? "rgba(255,255,255,0.1)"
//                         : "rgba(255,27,107,0.08)",
//                       borderRadius: 1,
//                       p: 1,
//                       mr: 2,
//                     }}
//                   >
//                     {typeof item.icon === "string" ? (
//                       <img
//                         src={item.icon}
//                         width={20}
//                         height={20}
//                         style={{
//                           filter: isActive
//                             ? "brightness(1.5)"
//                             : "brightness(1)",
//                         }}
//                       />
//                     ) : (
//                       <item.icon
//                         size={20}
//                         color={isActive ? "#FFD1E1" : "#FF6FA5"}
//                       />
//                     )}
//                   </ListItemIcon>

//                   <ListItemText
//                     primary={item.label}
//                     primaryTypographyProps={{
//                       color: isActive ? "#FFD1E1" : "#FF9EC0",
//                       fontWeight: isActive ? 700 : 600,
//                       fontSize: "0.95rem",
//                       letterSpacing: "0.3px",
//                     }}
//                   />
//                 </ListItem>
//               );
//             })}
//           </List>
//         </Box>

//         <Box
//           sx={{
//             p: 2.5,
//             borderTop: "1px solid rgba(255,255,255,0.05)",
//             background:
//               "linear-gradient(to top, rgba(10, 10, 20, 0.98), rgba(20, 10, 30, 0.95))",
//             position: "sticky",
//             bottom: 0,
//             zIndex: 1,
//             flexShrink: 0,
//           }}
//         >
//           <ListItem
//             onClick={handleLogout}
//             sx={{
//               borderRadius: 2,
//               cursor: "pointer",
//               background:
//                 "linear-gradient(135deg, rgba(244,67,54,0.1), rgba(244,67,54,0.05))",
//               border: "1px solid rgba(244,67,54,0.1)",
//               transition: "all 0.3s ease",
//               "&:hover": {
//                 background:
//                   "linear-gradient(135deg, rgba(244,67,54,0.15), rgba(244,67,54,0.08))",
//                 borderColor: "rgba(244,67,54,0.2)",
//                 transform: "translateX(4px)",
//                 boxShadow: "0 4px 12px rgba(244,67,54,0.1)",
//               },
//             }}
//           >
//             <ListItemIcon
//               sx={{
//                 minWidth: 0,
//                 background: "rgba(244,67,54,0.1)",
//                 borderRadius: 1,
//                 p: 1,
//                 mr: 2,
//               }}
//             >
//               <LogOut size={18} color="#F44336" />
//             </ListItemIcon>
//             <ListItemText
//               primary="Logout"
//               primaryTypographyProps={{
//                 color: "#F44336",
//                 fontWeight: 700,
//                 fontSize: "0.95rem",
//               }}
//             />
//           </ListItem>
//         </Box>
//       </Drawer>

//       <Box sx={{ height: 68 }} />
//     </>
//   );
// };

// export default AppHeaderMobile;
