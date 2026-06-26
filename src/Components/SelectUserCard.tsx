import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

interface SelectUserCardProps {
  name: string;
  company: string;
  selected?: boolean;
  onSelect: () => void;
  isMultiSelect?: boolean;
}

const SelectUserCard: React.FC<SelectUserCardProps> = ({
  name,
  company,
  selected,
  onSelect,
  isMultiSelect = false,
}) => {
  // Get initials from name
  const getInitials = (fullName: string) => {
    if (!fullName) return "";
    return fullName
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      onClick={onSelect}
      sx={{
        width: "150px",
        height: "200px",
        borderRadius: "16px",
        cursor: "pointer",
        display: "flex",
        position: "relative",
        border: selected
          ? "2px solid #d2a56d"
          : "1px solid #f0f0f0",
        boxShadow: selected
          ? "0 8px 20px rgba(210,165,109,0.15)"
          : "0 4px 12px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          border: selected ? "2px solid #d2a56d" : "1px solid #d2a56d",
        },
      }}
    >
      <CardContent
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          p: 1.5,
          position: "relative",
        }}
      >
        {/* Selection Icon - Top Right */}
        <Box 
          position="absolute" 
          top={8} 
          right={8}
          sx={{
            zIndex: 1,
          }}
        >
          {isMultiSelect ? (
            selected ? (
              <CheckCircleIcon sx={{ color: "#d2a56d", fontSize: 22 }} />
            ) : (
              <RadioButtonUncheckedIcon sx={{ color: "#ccc", fontSize: 22 }} />
            )
          ) : (
            selected ? (
              <CheckCircleIcon sx={{ color: "#d2a56d", fontSize: 22 }} />
            ) : (
              <RadioButtonUncheckedIcon sx={{ color: "#ccc", fontSize: 22 }} />
            )
          )}
        </Box>

        {/* Content Wrapper - Perfect Centering */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Avatar */}
          <Avatar
            sx={{
              bgcolor: selected ? "#d2a56d" : "#f5f5f5",
              color: selected ? "white" : "#666",
              width: 70,
              height: 70,
              fontSize: 24,
              fontWeight: 500,
              mb: 1.5,
              boxShadow: selected ? "0 4px 8px rgba(210,165,109,0.3)" : "none",
              transition: "all 0.2s ease-in-out",
            }}
          >
            {getInitials(name)}
          </Avatar>

          {/* Name - Below Avatar */}
          <Typography 
            fontWeight={600} 
            fontSize={15} 
            sx={{
              lineHeight: 1.2,
              mb: 0.5,
              width: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              px: 1,
              color: selected ? "#d2a56d" : "text.primary",
            }}
          >
            {name}
          </Typography>

          {/* Company - Below Name */}
          <Typography 
            fontSize={12} 
            color="text.secondary"
            sx={{
              lineHeight: 1.2,
              mb: 0.5,
              width: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              px: 1,
            }}
          >
            {company}
          </Typography>

          {/* Tech Badge - Below Company */}
          <Typography 
            fontSize={11} 
            color={selected ? "#d2a56d" : "text.disabled"}
            sx={{
              lineHeight: 1.2,
              mt: 0.5,
              fontWeight: selected ? 500 : 400,
            }}
          >
            • Tech •
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SelectUserCard;