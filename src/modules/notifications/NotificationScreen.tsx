import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  Chip,
  Divider,
  Fade,
  Badge,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  Done as DoneIcon,
} from "@mui/icons-material";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  category: "task" | "status" | "alert" | "info";
  isRead: boolean;
  important?: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "New Task Assigned",
    message: "You have been assigned to the task 'Design UI Mockups' for Project ERP-TASK.",
    time: "10 mins ago",
    category: "task",
    isRead: false,
    important: true,
  },
  {
    id: "2",
    title: "Task Status Updated",
    message: "John Doe changed the status of 'Database Migration' to Completed.",
    time: "1 hour ago",
    category: "status",
    isRead: false,
  },
  {
    id: "3",
    title: "System Maintenance Alert",
    message: "The server will be undergoing scheduled maintenance tonight from 12:00 AM to 2:00 AM EST.",
    time: "4 hours ago",
    category: "alert",
    isRead: false,
    important: true,
  },
  {
    id: "4",
    title: "Leave Approved",
    message: "Your leave request for August 20th, 2026 has been approved by Admin.",
    time: "1 day ago",
    category: "info",
    isRead: true,
  },
  {
    id: "5",
    title: "Task Deadline Reminder",
    message: "The task 'API Integration' is due in 3 hours. Please submit your progress.",
    time: "1 day ago",
    category: "alert",
    isRead: true,
  },
  {
    id: "6",
    title: "Project Kickoff Meeting",
    message: "Meeting scheduled for the new project kickoff tomorrow at 10:00 AM.",
    time: "2 days ago",
    category: "task",
    isRead: true,
  },
];

const NotificationScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<number>(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "task":
        return <AssignmentIcon sx={{ color: "#b9925f" }} />;
      case "status":
        return <CheckCircleIcon sx={{ color: "#2e7d32" }} />;
      case "alert":
        return <WarningIcon sx={{ color: "#d32f2f" }} />;
      default:
        return <InfoIcon sx={{ color: "#1976d2" }} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "task":
        return "#fbf3e6";
      case "status":
        return "#e8f5e9";
      case "alert":
        return "#ffebee";
      default:
        return "#e3f2fd";
    }
  };


  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
  };

  const deleteAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 1) return !notif.isRead; // Unread
    if (activeTab === 2) return notif.important; // Important
    return true; // All
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Box p={isMobile ? 1 : 3} sx={{ maxWidth: "100%", margin: "0 auto" }}>
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 3,
          borderRadius: 4,
          border: "1px solid #e0c8ab",
          backgroundColor: "#fff",
          boxShadow: "0px 8px 24px rgba(223, 196, 160, 0.15)",
        }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: "#b9925f", width: 44, height: 44 }}>
              <NotificationsIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#4a3b2c">
                Notification Center
              </Typography>
              <Typography variant="caption" color="text.secondary">
                You have {unreadCount} unread notifications
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={1}>
            {unreadCount > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={markAllRead}
                sx={{
                  borderColor: "#b9925f",
                  color: "#b9925f",
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "0.8rem",
                  "&:hover": {
                    borderColor: "#a07a4f",
                    backgroundColor: "rgba(185, 146, 95, 0.04)",
                  },
                }}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="text"
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={deleteAll}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "0.8rem",
                }}
              >
                Clear all
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 2, borderColor: "#f3eada" }} />

        {/* Tabs styled using ToggleButtonGroup (Selected Method) */}
        <Box display="flex" justifyContent="center" mb={2.5}>
          <ToggleButtonGroup
            value={activeTab}
            exclusive
            onChange={(_e, newVal) => {
              if (newVal !== null) setActiveTab(newVal);
            }}
            sx={{
              bgcolor: "#fcf8f2",
              borderRadius: 5,
              p: 0.5,
              border: "1px solid #e0c8ab",
              "& .MuiToggleButton-root": {
                borderRadius: 5,
                border: "none",
                px: { xs: 2, sm: 3 },
                py: 0.5,
                fontSize: "0.85rem",
                fontWeight: "bold",
                textTransform: "none",
                color: "text.secondary",
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                "&.Mui-selected": {
                  bgcolor: "#d6ad7c",
                  color: "white",
                  "&:hover": { bgcolor: "#c99f65" },
                },
              },
            }}
          >
            <ToggleButton value={0}>
              All
              <Chip
                label={notifications.length}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.7rem",
                  bgcolor: activeTab === 0 ? "rgba(255,255,255,0.25)" : "#f1ebd9",
                  color: activeTab === 0 ? "#fff" : "text.secondary",
                }}
              />
            </ToggleButton>
            <ToggleButton value={1}>
              Unread
              {unreadCount > 0 && (
                <Chip
                  label={unreadCount}
                  size="small"
                  color={activeTab === 1 ? "default" : "error"}
                  sx={{
                    height: 18,
                    fontSize: "0.7rem",
                    bgcolor: activeTab === 1 ? "rgba(255,255,255,0.25)" : undefined,
                    color: activeTab === 1 ? "#fff" : undefined,
                  }}
                />
              )}
            </ToggleButton>
            <ToggleButton value={2}>
              Important
              <Chip
                label={notifications.filter((n) => n.important).length}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.7rem",
                  bgcolor: activeTab === 2 ? "rgba(255,255,255,0.25)" : "#e0e0e0",
                  color: activeTab === 2 ? "#fff" : "text.secondary",
                }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Box py={8} textAlign="center">
            <NotificationsIcon sx={{ fontSize: 60, color: "#e0d3c1", mb: 2 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              No notifications to display
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
              We'll notify you when something new arrives.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notif) => (
              <Fade in key={notif.id}>
                <Box>
                  <ListItem
                    secondaryAction={
                      <Box display="flex" gap={0.5}>
                        {!notif.isRead && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => markAsRead(notif.id)}
                              sx={{
                                color: "#b9925f",
                                "&:hover": { bgcolor: "rgba(185, 146, 95, 0.08)" },
                              }}
                            >
                              <DoneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => deleteNotification(notif.id)}
                            sx={{
                              color: "text.secondary",
                              "&:hover": { color: "#d32f2f", bgcolor: "rgba(211, 47, 47, 0.08)" },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                    sx={{
                      borderRadius: 2,
                      mb: 1.5,
                      p: isMobile ? 1.5 : 2,
                      bgcolor: notif.isRead ? "transparent" : "rgba(223, 196, 160, 0.08)",
                      border: notif.isRead ? "1px solid #f3eada" : "1px solid #dfc4a0",
                      alignItems: "flex-start",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: notif.isRead ? "rgba(0,0,0,0.01)" : "rgba(223, 196, 160, 0.12)",
                        transform: "translateY(-1px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ mt: 0.5 }}>
                      <Badge
                        color="error"
                        variant="dot"
                        invisible={notif.isRead}
                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                      >
                        <Avatar sx={{ bgcolor: getCategoryColor(notif.category), width: 40, height: 40 }}>
                          {getCategoryIcon(notif.category)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography
                            variant="subtitle2"
                            fontWeight={notif.isRead ? 600 : 800}
                            color="#4a3b2c"
                          >
                            {notif.title}
                          </Typography>
                          {notif.important && (
                            <Chip
                              label="Important"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box mt={0.5}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              lineHeight: 1.5,
                              fontWeight: notif.isRead ? 400 : 500,
                              pr: 6,
                            }}
                          >
                            {notif.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.75, opacity: 0.8 }}
                          >
                            {notif.time}
                          </Typography>
                        </Box>
                      }
                      sx={{ my: 0 }}
                    />
                  </ListItem>
                </Box>
              </Fade>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default NotificationScreen;
