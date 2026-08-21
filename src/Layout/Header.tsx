/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Badge,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Settings,
  Notifications,
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  Logout,
} from "@mui/icons-material";
import { useAuth } from "../auth/authContext";
import { parseJSON } from "../utils/helper";
import MainMenuList from "./mainMenu";
import { useNavigate } from "react-router-dom";
import { fetchLink } from "../Components/customFetch";

interface LayoutHeaderProps {
  onToggleTodayPlan?: () => void;
  todayPlanOpen?: boolean;
  viewMore?: boolean;
  loadingOn?: () => void;
  loadingOff?: () => void;
}

interface UserDetails {
  name: string;
  email?: string;
}

const LayoutHeader: React.FC<LayoutHeaderProps> = ({
  onToggleTodayPlan,
  todayPlanOpen = false,
  viewMore = false,
  loadingOn,
  loadingOff,
}) => {
  const { currentPage, navDetails, logout, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  const fetchUnreadCount = React.useCallback(async () => {
    if (!user) return;
    try {
      const userId = user.Global_User_ID || user.id || "";
      const companyId = user.Company_Id || user.Company_Id || "";
      if (!userId || !companyId) return;

      const res = await fetchLink({
        address: `masters/tickets?User_Id=${userId}&Company_Id=${companyId}`,
        method: "GET",
      });

      if (res && res.success && Array.isArray(res.data)) {
        const localReadIdsKey = `read_notifications_${userId}`;
        const localDeletedIdsKey = `deleted_notifications_${userId}`;
        const localReadIds: string[] = JSON.parse(localStorage.getItem(localReadIdsKey) || "[]");
        const localDeletedIds: string[] = JSON.parse(localStorage.getItem(localDeletedIdsKey) || "[]");

        const seenTicketIds = new Set<string>();

        const filtered = res.data.filter((ticket: any) => {
          const ticketCompanyId = (ticket.To_CompanyId === null || String(ticket.To_CompanyId) === "null" || !ticket.To_CompanyId)
            ? ticket.From_CompanyId 
            : ticket.To_CompanyId;
          if (String(ticketCompanyId) !== String(companyId)) return false;

          const uniqueKey = ticket.T_Sch_Id ? `${ticket.Id}_${ticket.T_Sch_Id}` : String(ticket.Id);
          if (localDeletedIds.includes(uniqueKey)) return false;

          const isAdmin = user?.UserTypeId === 0 || user?.UserTypeId === 1;
          if (!isAdmin) {
            if (ticket.Employee_Involved_Id && String(ticket.Employee_Involved_Id) !== String(userId)) {
              return false;
            }
          } else {
            if (seenTicketIds.has(uniqueKey)) {
              return false;
            }
            seenTicketIds.add(uniqueKey);
          }

          return true;
        });

        const unread = filtered.filter((ticket: any) => {
          const uniqueKey = ticket.T_Sch_Id ? `${ticket.Id}_${ticket.T_Sch_Id}` : String(ticket.Id);
          const isRead =
            localReadIds.includes(uniqueKey) ||
            ["in progress", "inprocess", "in process", "resolved", "closed"].includes(
              String(ticket.Status || "").toLowerCase().trim()
            );
          return !isRead;
        });

        setUnreadCount(unread.length);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user]);

  React.useEffect(() => {
    fetchUnreadCount();

    const handleUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener("notification-update", handleUpdate);
    return () => {
      window.removeEventListener("notification-update", handleUpdate);
    };
  }, [fetchUnreadCount]);

  let displayTitle = currentPage?.title;
  if (!displayTitle && navDetails) {
    const searchTitle = (nodes: any[]): string | undefined => {
      const normLoc = decodeURI(window.location.pathname).toLowerCase().replace(/\/+$/, "") || "/";
      for (const n of nodes) {
        if (n.fullPath) {
          let fp = String(n.fullPath).trim().replace(/\/+$/, "");
          if (!fp.startsWith("/")) fp = "/" + fp;
          if (fp.toLowerCase() === normLoc) return n.title;
        }
        if (n.tUrl) {
          let tu = String(n.tUrl).trim().replace(/\/+$/, "");
          if (!tu.startsWith("/")) tu = "/" + tu;
          if (tu.toLowerCase() === normLoc) return n.title;
        }
        let lastSegment = "";
        if (n.tUrl) {
          const segs = String(n.tUrl).split("/").filter(Boolean);
          if (segs.length > 0) lastSegment = "/" + segs[segs.length - 1];
        } else if (n.fullPath) {
          const segs = String(n.fullPath).split("/").filter(Boolean);
          if (segs.length > 0) lastSegment = "/" + segs[segs.length - 1];
        }
        if (lastSegment && normLoc.endsWith(lastSegment.toLowerCase())) return n.title;
        
        if (n.children && n.children.length) {
           const found = searchTitle(n.children);
           if (found) return found;
        }
        if (n.subMenus && n.subMenus.length) {
           const found = searchTitle(n.subMenus);
           if (found) return found;
        }
      }
    };
    displayTitle = searchTitle(navDetails as any[]);
  }

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const storedUser = parseJSON(localStorage.getItem("user") || "{}");
  const userDetails: UserDetails | null = storedUser?.data ?? null;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    logout();
    navigate("/login");
  };

  const handleSettings = () => {
    handleClose();
    navigate("/settings");
  };

  return (
    <AppBar
      position="static"
      sx={{
        height: { xs: 48, sm: 56 },
        backgroundColor: "#dfc4a0",
        boxShadow: 1,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          px: { xs: 1, sm: 2 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* LEFT – Today Plan Toggle */}
        <LeftSection>
          {!viewMore && (
            <>
              {isMobile ? (
                <MainMenuList mobileLeftMode={true} onToggleTodayPlan={onToggleTodayPlan} loading={false} loadingOn={loadingOn!} loadingOff={loadingOff!} />
              ) : (
                <IconButton
                  size="small"
                  onClick={onToggleTodayPlan}
                  sx={{
                    color: "#000",
                    backgroundColor: "#fff",
                    mr: { xs: 0.5, sm: 1 },
                    "&:hover": { backgroundColor: "#e0e0e0" },
                    borderRadius: 1,
                    p: 0.5,
                  }}
                >
                  {todayPlanOpen ? <MenuOpenIcon fontSize="medium" /> : <MenuIcon fontSize="medium" />}
                </IconButton>
              )}
              <Typography
                sx={{
                  color: "#354854",
                  fontSize: { xs: 18, sm: 13 },
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  cursor: "default",
                  ml: isMobile ? 1.5 : 0,
                }}
              >
                {isMobile && !todayPlanOpen ? displayTitle || (window.location.pathname === "/" ? "Dashboard" : "") : "Today Plan"}
              </Typography>
            </>
          )}
        </LeftSection>

        {/* CENTER – Menu */}
        <CenterSection>
          <MainMenuList loading={false} loadingOn={loadingOn!} loadingOff={loadingOff!} />
          {currentPage?.title && !isMobile && (
            <Typography
              sx={{
                color: "#000",
                fontSize: { xs: 11, sm: 14 },
                fontWeight: 500,
                opacity: 0.9,
                mb: 0.6,
                whiteSpace: "nowrap",
              }}
            >
              {/* intentionally left blank as per original */}
            </Typography>
          )}
        </CenterSection>

        {/* RIGHT – User Info + Actions */}
        <RightSection>
          {/* Settings icon */}
          <IconButton
            size="small"
            sx={{ color: "#000", backgroundColor: "#fff", "&:hover": { backgroundColor: "#e0e0e0" }, width: { xs: 30, sm: 36 }, height: { xs: 30, sm: 36 }, borderRadius: "50%" }}
            onClick={handleSettings}
          >
            <Settings fontSize="medium" />
          </IconButton>

          {/* Notifications icon */}
          <IconButton
            size="small"
            sx={{ color: "#000", backgroundColor: "#fff", "&:hover": { backgroundColor: "#e0e0e0" }, width: { xs: 30, sm: 36 }, height: { xs: 30, sm: 36 }, borderRadius: "50%" }}
            onClick={() => navigate("/notifications")}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications fontSize="medium" />
            </Badge>
          </IconButton>

          {/* Avatar + Username (stacked vertically) */}
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center"
            sx={{ 
              ml: { xs: 1.5, sm: 3 },
              mr: { xs: 1, sm: 1.5 },
              position: "relative",
              height: "100%"
            }}
          >
            <IconButton onClick={handleAvatarClick} size="small" sx={{ p: 0, mt: "-5px" }}>
              <Avatar
                sx={{ 
                  width: { xs: 30, sm: 36 }, 
                  height: { xs: 30, sm: 36 }, 
                  border: "1.5px solid rgba(0,0,0,0.12)", 
                  cursor: "pointer",
                  bgcolor: "#fff",
                  color: "#354854",
                  fontSize: { xs: 13, sm: 18 },
                  fontWeight: 800
                }}
              >
                {userDetails?.name ? userDetails.name.charAt(0).toUpperCase() : "U"}
              </Avatar>
            </IconButton>
            {!isMobile && userDetails?.name && (
              <Typography 
                sx={{ 
                  color: "#354854", 
                  fontSize: 12.5, 
                  fontWeight: 800,
                  opacity: 0.9, 
                  whiteSpace: "nowrap", 
                  maxWidth: 90, 
                  overflow: "hidden", 
                  textOverflow: "ellipsis",
                  position: "absolute",
                  bottom: 2,
                  left: "50%",
                  transform: "translateX(-50%)",
                  lineHeight: 1
                }}
              >
                {userDetails.name}
              </Typography>
            )}
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{ sx: { minWidth: 180 } }}
          >
            <MenuItem disabled>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {userDetails?.name || "User"}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {userDetails?.email || "No email provided"}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSettings}>
              <Settings fontSize="small" sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            {/* Show Notifications in mobile menu */}
            {isMobile && (
              <MenuItem onClick={() => { handleClose(); navigate("/notifications"); }}>
                <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1.5 }}>
                  <Notifications fontSize="small" />
                </Badge>
                Notifications
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout} sx={{ color: "#d32f2f" }}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </RightSection>
      </Toolbar>
    </AppBar>
  );
};

/* ================= STYLES ================= */

const LeftSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  minWidth: 40,
  [theme.breakpoints.up("sm")]: { minWidth: 120 },
  [theme.breakpoints.up("md")]: { minWidth: 160 },
}));

const CenterSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
});

const RightSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  height: "100%",
  gap: 4,
  minWidth: 40,
  [theme.breakpoints.up("sm")]: { gap: 6, minWidth: 120 },
  [theme.breakpoints.up("md")]: { minWidth: 160 },
}));

export default LayoutHeader;