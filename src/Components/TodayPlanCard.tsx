import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  styled,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { ChevronLeft, ChevronRight, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

interface TodayPlanCardProps {
  title: string;
  children: React.ReactNode;
  height?: string | number;
  open: boolean;
  onToggle: () => void;
}

const TodayPlanCard: React.FC<TodayPlanCardProps> = ({
  title,
  children,
  height = "100%",
  open,
  onToggle,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [mobileExpanded, setMobileExpanded] = useState(true);

  // Reset mobileExpanded to true whenever the card is opened globally
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMobileExpanded(true);
    }
  }, [open]);

  // Responsive sidebar width — narrow enough so main content still has room
  const cardWidth = isMobile ? "100%" : isTablet ? 280 : 320;
  
  // Determine the effective height based on mobile expanded state
  const effectiveHeight = (isMobile && !mobileExpanded) ? "44px" : height;

  return (
    <CardWrapper open={open} cardWidth={cardWidth}>
      <CardContainer
        open={open}
        cardHeight={effectiveHeight}
        cardWidth={cardWidth}
        elevation={2}
      >
        {/* HEADER */}
        <CardHeader>
          {open && (
            <Typography
              fontWeight={600}
              color="white"
              noWrap
              sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem", md: "0.95rem" } }}
            >
              {title}
            </Typography>
          )}
          <IconButton
            size="small"
            onClick={(e) => {
              if (isMobile) {
                e.stopPropagation();
                setMobileExpanded(!mobileExpanded);
              } else {
                onToggle();
              }
            }}
            sx={{
              color: "white",
              marginLeft: open ? 0 : "auto",
              p: 0.5,
              flexShrink: 0,
            }}
          >
            {open ? (
              isMobile ? (
                mobileExpanded ? <KeyboardArrowUp sx={{ fontSize: 20 }} /> : <KeyboardArrowDown sx={{ fontSize: 20 }} />
              ) : (
                <ChevronLeft sx={{ fontSize: 20 }} />
              )
            ) : (
              isMobile ? <KeyboardArrowDown sx={{ fontSize: 20 }} /> : <ChevronRight sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </CardHeader>

        {/* CONTENT — fills remaining height exactly, no dead space */}
        {open && (
          <CardContentStyled>
            {children}
          </CardContentStyled>
        )}
      </CardContainer>
    </CardWrapper>
  );
};

export default TodayPlanCard;

/* ===================== STYLED COMPONENTS ===================== */

interface CardWrapperProps {
  open: boolean;
  cardWidth: string | number;
}

const CardWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "cardWidth",
})<CardWrapperProps>(({ open, cardWidth }) => ({
  position: "relative",
  // Animate open/close width smoothly
  width: open ? cardWidth : 0,
  minWidth: open ? (typeof cardWidth === "number" ? cardWidth : undefined) : 0,
  transition: "width 0.3s ease, min-width 0.3s ease",
  overflow: "hidden",
  flexShrink: 0,
  // Stretch to full parent height — eliminates the empty space below the card
  height: "100%",
  alignSelf: "stretch",
}));

interface CardContainerProps {
  open: boolean;
  cardHeight: string | number;
  cardWidth: string | number;
}

const CardContainer = styled(Card, {
  shouldForwardProp: (prop) =>
    prop !== "open" && prop !== "cardHeight" && prop !== "cardWidth",
})<CardContainerProps>(({ theme, open, cardHeight, cardWidth }) => ({
  width: typeof cardWidth === "number" ? cardWidth : "100%",
  minWidth: typeof cardWidth === "number" ? cardWidth : "100%",
  // "100%" height fills the wrapper completely — no gap at bottom
  height: open ? cardHeight : "44px",
  display: "flex",
  flexDirection: "column",
  borderRadius: `${Number(theme.shape.borderRadius) * 2}px`,
  background: "linear-gradient(180deg, #d2a86d 0%, #f4ede4 100%)",
  transition: "height 0.3s ease",
  overflow: "hidden",
}));

const CardHeader = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "#d2a86d",
  borderBottom: "1px solid rgba(255,255,255,0.25)",
  flexShrink: 0,
  minHeight: 44,
  boxSizing: "border-box",
  gap: 8,
}));

const CardContentStyled = styled(CardContent)(({ theme }) => ({
  // flex:1 makes this section grow to fill remaining height after header
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  // Tight padding — inner content (table, chips) uses full available width
  padding: theme.spacing(1),
  background: "linear-gradient(to bottom, #e1cdb0, #eeeeee)",
  boxSizing: "border-box",
  "&::-webkit-scrollbar": { width: 4 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 4,
  },
  // Override MUI's default extra bottom padding
  "&:last-child": {
    paddingBottom: theme.spacing(1),
  },
  [theme.breakpoints.down("sm")]: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
    scrollbarWidth: "none",
  },
}));