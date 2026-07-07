import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import type { PageProps } from "../routes/indexRouter";
import type { MenuTreeNode } from "../utils/menuManagement";
import { 
  flattenTree, 
  findMainMenuByChildPath,
  getSubmenusByMainMenuId 
} from "../utils/menuManagement";
import LoadingScreen from "../Components/loadingScreen";

export const MenuGroupPage: React.ComponentType<PageProps> = ({ loadingOn, loadingOff }) => {
  const { navDetails } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up("xl"));

  useEffect(() => {
    if (navDetails && navDetails.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, [navDetails]);

  // ── Flatten the entire tree for easy lookup ────────────
  const flatNodes = useMemo(() => {
    if (!navDetails || navDetails.length === 0) return [];
    return flattenTree(navDetails as MenuTreeNode[]);
  }, [navDetails]);

  // ── Find the current main menu node (menuType === 2) ────────
  const currentMainMenu = useMemo(() => {
    if (!navDetails || navDetails.length === 0) return null;
    const mainMenu = findMainMenuByChildPath(
      navDetails as MenuTreeNode[],
      location.pathname
    );
    
    // Debug log to verify the main menu is found
    if (mainMenu) {
      console.log("Found Main Menu:", {
        id: mainMenu.menuId,
        title: mainMenu.title,
        type: mainMenu.menuType,
        parentId: mainMenu.parentId
      });
    }
    
    return mainMenu;
  }, [navDetails, location.pathname]);

  // ── Get submenus: all nodes with parentId === currentMainMenu.menuId AND menuType === 3 ────
  const menusToDisplay: MenuTreeNode[] = useMemo(() => {
    if (!currentMainMenu || !flatNodes.length) return [];
    
    // Use the helper function to get all submenus by main menu ID
    const submenus = getSubmenusByMainMenuId(flatNodes, currentMainMenu.menuId);
    
    // Debug log to verify submenus are found
    if (submenus.length > 0) {
      console.log(`Found ${submenus.length} submenus for main menu "${currentMainMenu.title}":`, 
        submenus.map(sm => ({
          id: sm.menuId,
          title: sm.title,
          type: sm.menuType,
          parentId: sm.parentId,
          tUrl: sm.tUrl,
          fullPath: sm.fullPath
        }))
      );
    } else {
      console.log(`No submenus found for main menu "${currentMainMenu.title}" (ID: ${currentMainMenu.menuId})`);
      // Also log all nodes with menuType 3 for debugging
      const allType3 = flatNodes.filter(n => n.menuType === 3);
      console.log("All menuType 3 nodes in the system:", 
        allType3.map(n => ({ id: n.menuId, title: n.title, parentId: n.parentId, tUrl: n.tUrl }))
      );
    }
    
    return submenus;
  }, [currentMainMenu, flatNodes]);

  /**
   * Resolve the navigation path for a submenu tile.
   * IMPORTANT: Extracts the path segment from tUrl to match route definitions
   * Example: tUrl "/fingerprint" -> path "fingerprint"
   * Example: tUrl "/master/fingerprint" -> path "fingerprint" (if basePath is 'masters')
   */
  const resolveMenuPath = (menu: MenuTreeNode): string => {
    const tUrl = menu.tUrl;
    let path = "";
    
    if (tUrl && String(tUrl).trim() !== "") {
      let rawPath = String(tUrl).trim();
      // Remove leading slash if present
      if (rawPath.startsWith("/")) {
        rawPath = rawPath.substring(1);
      }
      // Get the last segment of the path (for nested paths like "master/fingerprint")
      const segments = rawPath.split('/');
      path = segments[segments.length - 1];
    } else {
      // Fallback to fullPath if tUrl is not available
      let fullPath = menu.fullPath || "/";
      if (fullPath.startsWith("/")) {
        fullPath = fullPath.substring(1);
      }
      const segments = fullPath.split('/');
      path = segments[segments.length - 1];
    }
    
    console.log(`Resolving path for "${menu.title}": tUrl="${menu.tUrl}" -> path="${path}"`);
    return path;
  };

  const handleMenuClick = (menu: MenuTreeNode) => {
    const path = resolveMenuPath(menu);
    if (path && path !== "") {
      if (loadingOn) loadingOn();
      navigate(path);
      if (loadingOff) setTimeout(() => loadingOff(), 50);
    } else {
      console.error(`Invalid path for menu: ${menu.title}`, menu);
    }
  };

  // Responsive grid
  const getGridColumns = () => {
    if (isMobile) return "repeat(2, 1fr)";
    if (isTablet) return "repeat(2, 1fr)";
    if (isLargeDesktop) return "repeat(5, 1fr)";
    return "repeat(4, 1fr)";
  };

  // Tile Component
  const MenuTile = ({ menu }: { menu: MenuTreeNode }) => {
    const firstLetter = menu.title
      ? menu.title.charAt(0).toUpperCase()
      : "M";

    return (
      <Box
        onClick={() => handleMenuClick(menu)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5, md: 2 },
          width: "100%",
          height: { xs: 60, sm: 74, md: 82, lg: 85 },
          background: "#ffffff",
          borderRadius: { xs: "8px", sm: "10px" },
          cursor: "pointer",
          padding: {
            xs: "8px 10px",
            sm: "10px 12px",
            md: "12px 14px",
          },
          boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
          border: "1px solid #eee",
          transition: "all 0.2s ease",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",

          "&:hover": {
            transform: {
              xs: "none",
              sm: "translateY(-2px)",
            },
            boxShadow: {
              xs: "0 3px 10px rgba(0,0,0,0.06)",
              sm: "0 8px 18px rgba(0,0,0,0.12)",
            },
          },

          "&:active": {
            transform: "scale(0.98)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          },
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: { xs: 28, sm: 32, md: 36 },
            height: { xs: 28, sm: 32, md: 36 },
            borderRadius: "8px",
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: {
              xs: "0.9rem",
              sm: "1rem",
              md: "1.1rem",
            },
            fontWeight: 600,
            color: "#fff",
          }}
        >
          {firstLetter}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: {
                xs: "0.72rem",
                sm: "0.78rem",
                md: "0.83rem",
                lg: "0.85rem",
              },
              color: "#222",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: { xs: 2, sm: 1 },
              WebkitBoxOrient: "vertical",
              whiteSpace: {
                xs: "normal",
                sm: "nowrap",
              },
            }}
          >
            {menu.title}
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: "0.62rem",
                sm: "0.66rem",
                md: "0.7rem",
              },
              color: "#888",
              mt: 0.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: {
                xs: "none",
                sm: "block",
              },
            }}
          >
            {`Manage ${menu.title.toLowerCase()}`}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Loader
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <LoadingScreen loading={true} message="Loading..." targetId="main-card-inner" />
      </Box>
    );
  }

  return (
    <Box>
      {/* Menu Grid */}
      {menusToDisplay.length > 0 && (
        <Box sx={{ mt: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: getGridColumns(),
              gap: { xs: 1.5, sm: 2, md: 2.5 },
            }}
          >
            {menusToDisplay.map((menu) => (
              <MenuTile
                key={menu.menuId}
                menu={menu}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {menusToDisplay.length === 0 && !loading && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
          }}
        >
          <Typography
            sx={{
              textAlign: "center",
              color: "#999",
              fontSize: {
                xs: "0.9rem",
                sm: "1rem",
                md: "1.1rem",
              },
            }}
          >
            No sub-menus available for{" "}
            {currentMainMenu?.title || "this section"}
          </Typography>
        </Box>
      )}
    </Box>
  );
};