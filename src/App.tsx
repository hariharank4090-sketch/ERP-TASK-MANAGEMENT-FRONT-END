import "./App.css";
import "./css/input.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/authContext";
import { RequireAuth } from "./auth/requireAuth";
import Login from "./auth/login";
import AppLayout from "./Layout/layout";
import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { CircularProgress } from "@mui/material";
import { appRoutes } from "./routes/indexRouter";
import type { MenuRow } from "./modules/configuration/types";
import { getAppMenuData } from "./modules/configuration/api";
import PageNotFound from "./Components/404page";
import { buildMenuTree } from "./utils/menuManagement";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useNavigate } from "react-router-dom";
import { flattenTree, type MenuTreeNode } from "./utils/menuManagement";

function getFirstMenuPath(navDetails: MenuTreeNode[]): string {
    const menus = flattenTree(navDetails ?? [])
        .filter((m) => m.menuType === 2)
        .sort((a, b) => {
            const as_ = a.sortOrder ?? 1000;
            const bs_ = b.sortOrder ?? 1000;
            return as_ !== bs_ ? as_ - bs_ : a.title.localeCompare(b.title);
        });

    if (menus.length > 0) {
        const menu = menus[0];
        const tUrl = menu.tUrl;
        if (tUrl && tUrl.trim() !== "") {
            const t = tUrl.trim();
            const path = t.startsWith("/") ? t : "/" + t;
            return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
        }
        const path = menu.fullPath && menu.fullPath !== "/"
            ? menu.fullPath
            : "/" + (menu.slug || "");
        return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
    }
    return "";
}

const RootRedirect: React.FC = () => {
    const { navDetails } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const targetPath = getFirstMenuPath(navDetails as MenuTreeNode[]);
        if (targetPath && targetPath !== "/") {
            navigate(targetPath, { replace: true });
        }
    }, [navDetails, navigate]);

    return (
        <div className="overlay">
            <CircularProgress className="spinner" />
        </div>
    );
};

function App() {
    const { isAuthenticated, setNavDetails, currentCompany, isSwitchingCompany } = useAuth();

    const [loadingCount, setLoadingCount] = useState<number>(0);
    const [menuData, setMenuData] = useState<MenuRow[]>([]);

    const loadingOn  = useCallback(() => setLoadingCount(c => c + 1), []);
    const loadingOff = useCallback(() => setLoadingCount(c => Math.max(0, c - 1)), []);
    const loading = loadingCount > 0;

    // ─── fetchMenuData ────────────────────────────────────────────────────────
    // ✅ FIX: not included in the useEffect dep array below to avoid infinite loops;
    //         instead we call it via a stable ref pattern using currentCompanyId.
    const fetchMenuData = useCallback(async () => {
        try {
            const res = await getAppMenuData(loadingOn, loadingOff);
            setMenuData(res);
        } catch (e) {
            console.error("Failed to fetch menu data:", e);
            setMenuData([]);
        }
    }, [loadingOn, loadingOff]);

    // ─── Fetch menu on login OR after company switch ──────────────────────────
    // ✅ FIX: depends on `currentCompany?.companyId` so a company switch (which
    //         changes companyId) always triggers a fresh menu fetch – even when
    //         the token itself doesn't change (e.g. same JWT, different DB).
    //         isSwitchingCompany acts as a gate: we skip the fetch while the
    //         switch is in progress and re-run once it completes (value → false).
    useEffect(() => {
        if (!isAuthenticated) {
            setMenuData([]);
            return;
        }

        // Wait until the switch is fully done before fetching
        if (isSwitchingCompany) return;

        fetchMenuData();
        // ✅ NOTE: fetchMenuData is intentionally omitted from deps because it is
        //          re-created only when loadingOn/loadingOff change (which are stable
        //          useCallback refs). Adding it would cause an extra fetch on every
        //          render cycle. If ESLint flags this, use the disable comment below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, currentCompany?.companyId, isSwitchingCompany]);

    // ─── Rebuild nav tree from raw menu data ──────────────────────────────────
    // ✅ FIX: useMemo so buildMenuTree is not called on every render – only when
    //         menuData reference changes (i.e. after a successful fetch).
    const navTree = useMemo(() => buildMenuTree(menuData), [menuData]);

    // Sync the tree into auth context whenever it changes
    useEffect(() => {
        setNavDetails(navTree);
    }, [navTree, setNavDetails]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            <ToastContainer />

            {/*
             * ✅ FIX: BrowserRouter is the single top-level router.
             *    The token-conditional rendering lives inside it so that
             *    <Navigate> / <Link> / useNavigate in children always work,
             *    even during the login → authenticated transition.
             */}
            <BrowserRouter>
                {!isAuthenticated ? (
                    <Routes>
                        <Route
                            path="*"
                            element={
                                <Login
                                    loading={loading}
                                    loadingOn={loadingOn}
                                    loadingOff={loadingOff}
                                />
                            }
                        />
                    </Routes>
                ) : (
                    <RequireAuth>
                        <AppLayout
                            loading={loading}
                            loadingOn={loadingOn}
                            loadingOff={loadingOff}
                        >
                            <Suspense
                                fallback={
                                    <div className="overlay">
                                        <CircularProgress className="spinner" />
                                    </div>
                                }
                            >
                                <Routes>
                                    <Route path="/" element={<RootRedirect />} />
                                    <Route path="/login" element={<Navigate to="/" replace />} />
                                    {appRoutes.map(({ path, component: Component }) => (
                                        <Route
                                            key={path}
                                            path={path}
                                            element={
                                                <Component
                                                    loading={loading}
                                                    loadingOn={loadingOn}
                                                    loadingOff={loadingOff}
                                                />
                                            }
                                        />
                                    ))}
                                    <Route path="*" element={<PageNotFound />} />
                                </Routes>
                            </Suspense>
                        </AppLayout>
                    </RequireAuth>
                )}
            </BrowserRouter>
        </>
    );
}

export default App;