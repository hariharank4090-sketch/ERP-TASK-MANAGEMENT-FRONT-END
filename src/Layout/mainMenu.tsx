// src/Layout/mainMenu.tsx
import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    Divider,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import baseURL from "../config/baseURL";
import type { MenuTreeNode } from "../utils/menuManagement";
import { flattenTree } from "../utils/menuManagement";
import type { PageProps } from "../routes/indexRouter";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
import useMediaQuery from "@mui/material/useMediaQuery";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface MenuItemProps {
    title: string;
    /** Exact navigable path — tUrl wins, slug-chain is fallback */
    path: string;
    isExternal?: boolean;
}

const STATIC_TICKETING_MENU: MenuItemProps = {
    title: "Ticketing Tool",
    path: "https://ticketing.pukalerp.in/login",
    // path: "https://testticket.pukaltechnologies.in/login",
    isExternal: true,
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function normalizePath(p: string): string {
    if (!p) return "/";
    return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

/**
 * Resolve the display path for a main menu node.
 * tUrl is the authoritative source — use it directly when present.
 * Falls back to fullPath (slug-chain) set by buildMenuTree.
 */
const convertMenuTreeNodeToItem = (menu: MenuTreeNode): MenuItemProps => {
    const tUrl = menu.tUrl;
    if (tUrl && tUrl.trim() !== "") {
        const t = tUrl.trim();
        const path = t.startsWith("/") ? t : "/" + t;
        return { title: menu.title || "", path: normalizePath(path) };
    }
    const path = menu.fullPath && menu.fullPath !== "/"
        ? normalizePath(menu.fullPath)
        : normalizePath("/" + (menu.slug || ""));
    return { title: menu.title || "", path };
};

/**
 * Case-insensitive active check so "/All" stored in DB matches
 * "/all" as seen in the browser address bar.
 */
function isActive(menuPath: string, currentPath: string): boolean {
    const norm = normalizePath(currentPath).toLowerCase();
    const mp   = normalizePath(menuPath).toLowerCase();
    if (mp === "/") return norm === "/";
    return norm === mp || norm.startsWith(mp + "/");
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const HeaderWrapper = styled(Box)(() => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
}));

const MenuPill = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: "4px 6px",
    gap: 4,
    width: "100%",
    maxWidth: "100%",
    flexWrap: "nowrap",
    overflow: "hidden",
    [theme.breakpoints.up("md")]: {
        gap: 4,
    },
    [theme.breakpoints.up("lg")]: {
        gap: 6,
    },
}));

const MenuButton = styled(Button)(({ theme }) => ({
    textTransform: "none",
    fontSize: "0.72rem",
    borderRadius: 20,
    padding: "4px 8px",
    minHeight: 28,
    whiteSpace: "nowrap",
    backgroundColor: "transparent",
    color: "#333",
    fontWeight: 500,
    minWidth: "auto",

    "&:hover": { backgroundColor: "rgba(0,0,0,0.05)" },
    "&.active": { backgroundColor: "#d2a15f", color: "#fff", fontWeight: 600 },

    [theme.breakpoints.up("sm")]: {
        fontSize: "0.75rem",
        padding: "4px 10px",
        minHeight: 28,
    },
    [theme.breakpoints.up("md")]: {
        fontSize: "0.75rem",
        padding: "5px 10px",
        minHeight: 30,
    },
    [theme.breakpoints.up("lg")]: {
        fontSize: "0.8rem",
        padding: "6px 16px",
    },
}));

/* ─── Mobile Drawer ──────────────────────────────────────────────────────── */

const MobileMenuDrawer: React.FC<{
    menus: MenuItemProps[];
    open: boolean;
    onClose: () => void;
    currentPath: string;
    onNavigate: (path: string, isExternal?: boolean) => void;
    onToggleTodayPlan?: () => void;
}> = ({ menus, open, onClose, currentPath, onNavigate, onToggleTodayPlan }) => (
    <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        PaperProps={{
            sx: {
                backgroundColor: "#dfc4a0",
                width: 260,
                pt: 1,
                pb: 2,
                px: 2,
                borderRadius: "0 16px 16px 0",
                boxShadow: "4px 0 20px rgba(0,0,0,0.2)",
            },
        }}
    >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography sx={{ fontWeight: 700, color: "#333", fontSize: "0.95rem" }}>
                Navigation
            </Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: "#333" }}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
        <Divider sx={{ mb: 1, borderColor: "rgba(0,0,0,0.15)" }} />
        <List disablePadding>
            {onToggleTodayPlan && (
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => {
                            onToggleTodayPlan();
                            onClose();
                        }}
                        sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.07)" },
                        }}
                    >
                        <ListItemText
                            primary="Home"
                            primaryTypographyProps={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                            }}
                        />
                    </ListItemButton>
                </ListItem>
            )}
            {menus.map((menu) => (
                <ListItem key={menu.path} disablePadding>
                    <ListItemButton
                        selected={!menu.isExternal && isActive(menu.path, currentPath)}
                        onClick={() => {
                            if (menu.path) onNavigate(menu.path, menu.isExternal);
                            onClose();
                        }}
                        sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            "&.Mui-selected": {
                                backgroundColor: "#d2a15f",
                                color: "#fff",
                                "&:hover": { backgroundColor: "#c4924e" },
                            },
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.07)" },
                        }}
                    >
                        <ListItemText
                            primary={menu.title}
                            primaryTypographyProps={{
                                fontSize: "0.875rem",
                                fontWeight: isActive(menu.path, currentPath) ? 600 : 400,
                            }}
                        />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    </Drawer>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */

interface MainMenuProps extends PageProps {
    mobileLeftMode?: boolean;
    onToggleTodayPlan?: () => void;
}

const MainMenuList: React.FC<MainMenuProps> = ({ mobileLeftMode, onToggleTodayPlan }) => {
    const { navDetails, token, user, currentCompany, availableCompanies } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [verifiedTokens, setVerifiedTokens] = useState<Record<string, string>>({});

    useEffect(() => {
        const rawAuth = (
            currentCompany?.token ||
            token ||
            (typeof localStorage !== "undefined" ? localStorage.getItem("token") : "") ||
            ""
        )
            .replace(/^Bearer\s+/i, "")
            .trim();

        if (!rawAuth || typeof fetch !== "function") return;

        const compId = currentCompany?.companyId ?? user?.Company_Id;
        const headers: Record<string, string> = {
            Authorization: `Bearer ${rawAuth}`,
        };
        if (compId !== undefined && compId !== null) {
            headers["X-Company-Id"] = String(compId);
            headers["Db"] = String(compId);
        }

        let cancelled = false;
        fetch(`${baseURL}configuration/login/verify`, {
            method: "GET",
            headers,
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
                if (cancelled || !json?.data?.currentCompany) return;
                const list = Array.isArray(json.data.currentCompany) ? json.data.currentCompany : [];
                const nextMap: Record<string, string> = {};
                for (const item of list) {
                    if (item?.companyId != null && item?.token) {
                        nextMap[String(item.companyId)] = String(item.token)
                            .replace(/^Bearer\s+/i, "")
                            .trim();
                    }
                }
                if (Object.keys(nextMap).length > 0) {
                    setVerifiedTokens(nextMap);
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [token, currentCompany?.token, currentCompany?.companyId, user?.Company_Id]);

    const buildExternalSsoUrl = (baseUrl: string): string => {
        try {
            const url = new URL(baseUrl);
            const activeCompanyId =
                currentCompany?.companyId ??
                user?.Company_Id ??
                localStorage.getItem("companyId") ??
                "";
            const matchedCompany = Array.isArray(availableCompanies)
                ? availableCompanies.find((c) => String(c.companyId) === String(activeCompanyId))
                : undefined;
            const rawToken =
                (activeCompanyId !== "" ? verifiedTokens[String(activeCompanyId)] : "") ||
                currentCompany?.token ||
                matchedCompany?.token ||
                token ||
                localStorage.getItem("token") ||
                "";
            const activeToken = rawToken.replace(/^Bearer\s+/i, "").trim();
            const activeUsername =
                user?.UserName ||
                user?.uniqueName ||
                user?.Name ||
                user?.name ||
                "";

            if (activeToken) {
                url.searchParams.set("Auth", activeToken);
            }
            if (activeCompanyId !== "" && activeCompanyId !== null && activeCompanyId !== undefined) {
                url.searchParams.set("company_id", String(activeCompanyId));
            }
            if (activeUsername) {
                url.searchParams.set("username", activeUsername);
            }
            return url.toString();
        } catch {
            return baseUrl;
        }
    };

    const handleNavigation = (path: string, isExternal?: boolean) => {
        if (isExternal || /^https?:\/\//i.test(path)) {
            const targetUrl = buildExternalSsoUrl(path);
            window.open(targetUrl, "_blank", "noopener,noreferrer");
            setDrawerOpen(false);
            return;
        }
        navigate(path);
        setDrawerOpen(false); // Close drawer on mobile navigation
    };

    // Flatten the entire tree then filter menuType === 2 (main menu nodes).
    // Sorting ascending by sortOrder then title.
    const dynamicMenus: MenuItemProps[] = flattenTree(
        (navDetails as MenuTreeNode[] | undefined) ?? []
    )
        .filter((m) => m.menuType === 2)
        .sort((a, b) => {
            const as_ = a.sortOrder ?? 1000;
            const bs_ = b.sortOrder ?? 1000;
            return as_ !== bs_ ? as_ - bs_ : a.title.localeCompare(b.title);
        })
        .map(convertMenuTreeNodeToItem);

    const menus: MenuItemProps[] = [...dynamicMenus, STATIC_TICKETING_MENU];

    const currentPath = normalizePath(location.pathname);
    const MAX_TABLET_ITEMS = 4;

    // Automatically navigate to the first menu button page when on root path "/"
    useEffect(() => {
        if (currentPath === "/" && dynamicMenus.length > 0 && dynamicMenus[0]?.path) {
            navigate(dynamicMenus[0].path, { replace: true });
        }
    }, [currentPath, dynamicMenus, navigate]);


    // ── Mobile ────────────────────────────────────────────────────────────────
    if (isMobile) {
        if (mobileLeftMode) {
            return (
                <>
                    <IconButton
                        size="small"
                        onClick={() => setDrawerOpen(true)}
                        sx={{
                            color: "#000",
                            backgroundColor: "#fff",
                            "&:hover": { backgroundColor: "#e0e0e0" },
                            borderRadius: "50%",
                            width: 32,
                            height: 32,
                        }}
                    >
                        <MenuIcon fontSize="small" />
                    </IconButton>
                    <MobileMenuDrawer
                        menus={menus}
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        currentPath={currentPath}
                        onNavigate={handleNavigation}
                        onToggleTodayPlan={onToggleTodayPlan}
                    />
                </>
            );
        }
        return null;
    }

    // ── Tablet with overflow ──────────────────────────────────────────────────
    if (isTablet && menus.length > MAX_TABLET_ITEMS) {
        const visibleMenus   = menus.slice(0, MAX_TABLET_ITEMS);
        const overflowActive = menus
            .slice(MAX_TABLET_ITEMS)
            .some((m) => isActive(m.path, currentPath));

        return (
            <HeaderWrapper>
                <MenuPill>
                    {visibleMenus.map((menu) => (
                        <MenuButton
                            key={menu.path}
                            onClick={() => menu.path && handleNavigation(menu.path, menu.isExternal)}
                            className={!menu.isExternal && isActive(menu.path, currentPath) ? "active" : ""}
                        >
                            {menu.title}
                        </MenuButton>
                    ))}
                    <MenuButton
                        onClick={() => setDrawerOpen(true)}
                        className={overflowActive ? "active" : ""}
                        sx={{ color: overflowActive ? undefined : "#666" }}
                    >
                        ••• More
                    </MenuButton>
                </MenuPill>
                <MobileMenuDrawer
                    menus={menus}
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    currentPath={currentPath}
                    onNavigate={handleNavigation}
                />
            </HeaderWrapper>
        );
    }

    // ── Desktop: all items inline ─────────────────────────────────────────────
    return (
        <HeaderWrapper>
            <MenuPill>
                {menus.map((menu) => (
                    <MenuButton
                        key={menu.path}
                        onClick={() => menu.path && handleNavigation(menu.path, menu.isExternal)}
                        className={!menu.isExternal && isActive(menu.path, currentPath) ? "active" : ""}
                    >
                        {menu.title}
                    </MenuButton>
                ))}
            </MenuPill>
        </HeaderWrapper>
    );
};

export default MainMenuList;