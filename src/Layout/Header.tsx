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
  const { currentPage, navDetails, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

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
          {/* Show name only on tablet+ */}
          {!isMobile && userDetails?.name && (
            <Typography sx={{ color: "#000", fontSize: { sm: 12, md: 13 }, opacity: 0.9, mr: 0.5, whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
              {userDetails.name}
            </Typography>
          )}

          {/* Settings icon */}
          <IconButton
            size="small"
            sx={{ color: "#000", backgroundColor: "#fff", "&:hover": { backgroundColor: "#e0e0e0" }, width: 32, height: 32, borderRadius: "50%" }}
            onClick={handleSettings}
          >
            <Settings fontSize="small" />
          </IconButton>

          {/* Notifications icon */}
          <IconButton
            size="small"
            sx={{ color: "#000", backgroundColor: "#fff", "&:hover": { backgroundColor: "#e0e0e0" }, width: 32, height: 32, borderRadius: "50%" }}
          >
            <Notifications fontSize="small" />
          </IconButton>

          {/* Avatar + Dropdown */}
          <IconButton onClick={handleAvatarClick} size="small" sx={{ p: 0, ml: { xs: 0.5, sm: 0 } }}>
            <Avatar
              src="/admin.png"
              sx={{ width: { xs: 26, sm: 28 }, height: { xs: 26, sm: 28 }, border: "2px solid rgba(0,0,0,0.2)", cursor: "pointer" }}
            />
          </IconButton>

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
              <MenuItem>
                <Notifications fontSize="small" sx={{ mr: 1 }} />
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
  gap: 4,
  minWidth: 40,
  [theme.breakpoints.up("sm")]: { gap: 6, minWidth: 120 },
  [theme.breakpoints.up("md")]: { minWidth: 160 },
}));

export default LayoutHeader;