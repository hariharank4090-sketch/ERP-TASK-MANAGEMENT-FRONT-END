// import React, { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
// import { Box, Card, CardContent, useMediaQuery, useTheme } from "@mui/material";

// import LayoutHeader from "./Header";
// import { findMenuByPath } from "../utils/menuManagement";
// import { useAuth } from "../auth/authContext";
// import TodayPlanCard from "../Components/TodayPlanCard";
// import CreditListPage from "../modules/TodayPlan/CreditListPage";

// interface AppLayoutProps {
//   children: React.ReactNode;
//   loading: boolean;
//   loadingOn: () => void;
//   loadingOff: () => void;
// }

// const AppLayout: React.FC<AppLayoutProps> = ({ children, loadingOn, loadingOff }) => {
//   const { navDetails, setCurrentPage } = useAuth();
//   const location = useLocation();
//   const theme = useTheme();

//   const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
//   const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

//   const [isTodayPlanOpen, setIsTodayPlanOpen] = useState(
//     (!isMobile && !isTablet) || ((isMobile || isTablet) && location.pathname === "/")
//   );

//   const toggleTodayPlan = () => setIsTodayPlanOpen((prev) => !prev);

//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     if (isMobile || isTablet) setIsTodayPlanOpen(location.pathname === "/");
//   }, [location.pathname, isMobile, isTablet]);

//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     if (isMobile) setIsTodayPlanOpen(location.pathname === "/");
//   }, [isMobile, location.pathname]);

//   useEffect(() => {
//     if (Array.isArray(navDetails) && navDetails.length > 0) {
//       const currentMenu = findMenuByPath(navDetails, location.pathname);
//       if (currentMenu && "menuId" in currentMenu) {
//         setCurrentPage(currentMenu);
//       } else {
//         setCurrentPage(null);
//       }
//     }
//   }, [location.pathname, navDetails, setCurrentPage]);

//   return (
//     <>
//       <LayoutHeader
//         onToggleTodayPlan={toggleTodayPlan}
//         todayPlanOpen={isTodayPlanOpen}
//         loadingOn={loadingOn}
//         loadingOff={loadingOff}
//       />

//       {/* BODY ROW — alignItems:"stretch" is the key fix so sidebar fills height */}
//       <Box
//         sx={{
//           height: { xs: "calc(100vh - 48px)", sm: "calc(100vh - 56px)" },
//           display: "flex",
//           flexDirection: "row",
//           alignItems: "stretch",          // ← children grow to full row height
//           gap: { xs: 0, sm: 0.5, md: 1 },
//           p: { xs: 0, sm: 0.5, md: 1 },
//           background: "linear-gradient(to bottom, #d6ad7c, #f7f7f7)",
//           overflow: "hidden",
//           boxSizing: "border-box",
//         }}
//       >
//         {/* ===== TODAY PLAN SIDEBAR ===== */}
//         {isTablet ? (
//           isTodayPlanOpen && (
//             <Box
//               sx={{
//                 position: "fixed",
//                 top: 56,
//                 left: 0,
//                 right: 0,
//                 bottom: 0,
//                 zIndex: 1300,
//                 backgroundColor: "rgba(0,0,0,0.45)",
//               }}
//               onClick={() => setIsTodayPlanOpen(false)}
//             >
//               <Box
//                 sx={{
//                   width: "300px",
//                   maxWidth: 340,
//                   height: "100%",
//                   backgroundColor: "#fff",
//                   boxShadow: "4px 0 16px rgba(0,0,0,0.2)",
//                   overflow: "hidden",
//                 }}
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <TodayPlanCard
//                   title="Today Plan"
//                   open={isTodayPlanOpen}
//                   onToggle={toggleTodayPlan}
//                   height="100%"
//                 >
//                   <Box 
//                     id="today-plan-inner"
//                     sx={{ 
//                     position: "relative",
//                     height: "100%", 
//                     overflowY: "auto",
//                     "&::-webkit-scrollbar": { 
//                       display: { xs: "none", sm: "block" }
//                     },
//                     scrollbarWidth: { xs: "none", sm: "auto" }
//                   }}>
//                     <CreditListPage />
//                   </Box>
//                 </TodayPlanCard>
//               </Box>
//             </Box>
//           )
//         ) : (
//           // Mobile and Desktop inline sidebar — TodayPlanCard stretches via alignItems:stretch above
//           <TodayPlanCard
//             title="Today Plan"
//             open={isTodayPlanOpen}
//             onToggle={toggleTodayPlan}
//             height="100%"
//           >
//             <Box
//               id="today-plan-inner"
//               sx={{
//                 position: "relative",
//                 height: "100%",
//                 overflowY: "auto",
//                 overflowX: "hidden",
//                 "&::-webkit-scrollbar": { 
//                   width: 4,
//                   display: { xs: "none", sm: "block" }
//                 },
//                 scrollbarWidth: { xs: "none", sm: "auto" },
//                 "&::-webkit-scrollbar-thumb": {
//                   backgroundColor: "rgba(0,0,0,0.2)",
//                   borderRadius: 4,
//                 },
//               }}
//             >
//               <CreditListPage />
//             </Box>
//           </TodayPlanCard>
//         )}

//         {/* ===== MAIN CONTENT ===== */}
//         <Box
//           sx={{
//             flex: 1,
//             display: (isMobile && isTodayPlanOpen) ? "none" : "flex",
//             minWidth: 0,
//             overflow: "hidden",
//           }}
//         >
//           <Card
//             sx={{
//               flex: 1,
//               display: "flex",
//               flexDirection: "column",
//               borderRadius: { xs: 0, sm: 2, md: 3 },
//               background: "linear-gradient(to bottom, #e1cdb0, #eeeeee)",
//               boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
//               overflow: "hidden",
//               minWidth: 0,
//             }}
//           >
//             <CardContent
//               id="main-card-inner"
//               sx={{
//                 position: "relative",
//                 flex: 1,
//                 p: { xs: 0.5, sm: 1, md: 1.25, lg: 1.5 },
//                 overflowY: "auto",
//                 overflowX: "hidden",
//                 WebkitOverflowScrolling: "touch",
//                 boxSizing: "border-box",
//                 "&:last-child": { pb: { xs: 0.5, sm: 1, md: 1.25, lg: 1.5 } },
//                 "&::-webkit-scrollbar": { 
//                   display: isMobile ? "none" : "block",
//                   width: isMobile ? 0 : 6 
//                 },
//                 scrollbarWidth: isMobile ? "none" : "auto",
//                 "&::-webkit-scrollbar-thumb": {
//                   backgroundColor: "rgba(0,0,0,0.2)",
//                   borderRadius: 4,
//                 },
//               }}
//             >
//               {children}
//             </CardContent>
//           </Card>
//         </Box>
//       </Box>
//     </>
//   );
// };

// export default AppLayout;


import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Card, CardContent, useMediaQuery, useTheme } from "@mui/material";

import "./layout.css";
import LayoutHeader from "./Header";
import { findMenuByPath } from "../utils/menuManagement";
import { useAuth } from "../auth/authContext";
import TodayPlanCard from "../Components/TodayPlanCard";
import CreditListPage from "../modules/TodayPlan/CreditListPage";

interface AppLayoutProps {
  children: React.ReactNode;
  loading: boolean;
  loadingOn: () => void;
  loadingOff: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, loadingOn, loadingOff }) => {
  const { navDetails, setCurrentPage } = useAuth();
  const location = useLocation();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [isTodayPlanOpen, setIsTodayPlanOpen] = useState(
    (!isMobile && !isTablet) || ((isMobile || isTablet) && location.pathname === "/")
  );

  const toggleTodayPlan = () => setIsTodayPlanOpen((prev) => !prev);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isMobile || isTablet) setIsTodayPlanOpen(location.pathname === "/");
  }, [location.pathname, isMobile, isTablet]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isMobile) setIsTodayPlanOpen(location.pathname === "/");
  }, [isMobile, location.pathname]);

  useEffect(() => {
    if (Array.isArray(navDetails) && navDetails.length > 0) {
      const currentMenu = findMenuByPath(navDetails, location.pathname);
      if (currentMenu && "menuId" in currentMenu) {
        setCurrentPage(currentMenu);
      } else {
        setCurrentPage(null);
      }
    }
  }, [location.pathname, navDetails, setCurrentPage]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "133.3vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zoom: 0.75,
      }}
    >
      <LayoutHeader
        onToggleTodayPlan={toggleTodayPlan}
        todayPlanOpen={isTodayPlanOpen}
        loadingOn={loadingOn}
        loadingOff={loadingOff}
      />

      {/* BODY ROW — alignItems:"stretch" is the key fix so sidebar fills height */}
      <Box
        sx={{
          height: { xs: "calc(133.3vh - 48px)", sm: "calc(133.3vh - 56px)" },
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",          // ← children grow to full row height
          gap: { xs: 0, sm: 0.5, md: 1 },
          p: { xs: 0, sm: 0.5, md: 1 },
          background: "linear-gradient(to bottom, #d6ad7c, #f7f7f7)",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* ===== TODAY PLAN SIDEBAR ===== */}
        {isTablet ? (
          isTodayPlanOpen && (
            <Box
              sx={{
                position: "fixed",
                top: 56,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1300,
                backgroundColor: "rgba(0,0,0,0.45)",
              }}
              onClick={() => setIsTodayPlanOpen(false)}
            >
              <Box
                sx={{
                  width: "300px",
                  maxWidth: 340,
                  height: "100%",
                  backgroundColor: "#fff",
                  boxShadow: "4px 0 16px rgba(0,0,0,0.2)",
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <TodayPlanCard
                  title="Today Plan"
                  open={isTodayPlanOpen}
                  onToggle={toggleTodayPlan}
                  height="100%"
                >
                  <Box
                    id="today-plan-inner"
                    sx={{
                    position: "relative",
                    height: "100%",
                    overflowY: "auto",
                    "&::-webkit-scrollbar": {
                      display: { xs: "none", sm: "block" }
                    },
                    scrollbarWidth: { xs: "none", sm: "auto" }
                  }}>
                    <CreditListPage />
                  </Box>
                </TodayPlanCard>
              </Box>
            </Box>
          )
        ) : (
          // Mobile and Desktop inline sidebar — TodayPlanCard stretches via alignItems:stretch above
          <TodayPlanCard
            title="Today Plan"
            open={isTodayPlanOpen}
            onToggle={toggleTodayPlan}
            height="100%"
          >
            <Box
              id="today-plan-inner"
              sx={{
                position: "relative",
                height: "100%",
                overflowY: "auto",
                overflowX: "hidden",
                "&::-webkit-scrollbar": {
                  width: 4,
                  display: { xs: "none", sm: "block" }
                },
                scrollbarWidth: { xs: "none", sm: "auto" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderRadius: 4,
                },
              }}
            >
              <CreditListPage />
            </Box>
          </TodayPlanCard>
        )}

        {/* ===== MAIN CONTENT ===== */}
        <Box
          sx={{
            flex: 1,
            display: (isMobile && isTodayPlanOpen) ? "none" : "flex",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Card
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              borderRadius: { xs: 0, sm: 2, md: 3 },
              background: "linear-gradient(to bottom, #e1cdb0, #eeeeee)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <CardContent
              id="main-card-inner"
              sx={{
                position: "relative",
                flex: 1,
                p: { xs: 0.5, sm: 1, md: 1.25, lg: 1.5 },
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                boxSizing: "border-box",
                "&:last-child": { pb: { xs: 0.5, sm: 1, md: 1.25, lg: 1.5 } },
                "&::-webkit-scrollbar": {
                  display: isMobile ? "none" : "block",
                  width: isMobile ? 0 : 6
                },
                scrollbarWidth: isMobile ? "none" : "auto",
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderRadius: 4,
                },
              }}
            >
              {children}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;