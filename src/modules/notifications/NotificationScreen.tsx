import React, { useState, useEffect } from "react";
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
  CircularProgress,
} from "@mui/material";
import TicketDetailsDialog from "./TicketDetailsDialog";
import ImagePreviewDialog from "../../Components/imagePreview";
import { useAuth } from "../../auth/authContext";
import { fetchLink } from "../../Components/customFetch";
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
  ticketCode?: string;
  subject?: string;
  customer?: string;
  From_Company_Name?: string;
  categoryName?: string;
  priority?: string;
  status?: string;
  createdDate?: string;
  description?: string;
  imageUrl?: string;
  estSchStartDate?: string;
  estSchEndDate?: string;
  T_Sch_Id?: string;
  Employee_Involved_Id?: string;
  ticketId?: string;
  From_CompanyId?: string;
  To_CompanyId?: string;
  rawEstSchStartDate?: string;
  rawEstSchEndDate?: string;
}

const getRelativeTime = (dateString?: string | Date) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return String(dateString);
  
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

const NotificationScreen: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedTicket, setSelectedTicket] = useState<NotificationItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchTickets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userId = user.Global_User_ID || user.id || "";
      const companyId = user.Company_Id || user.Company_Id || "";
      
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

        const mapped: NotificationItem[] = res.data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((ticket: any) => {
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
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((ticket: any) => {
            const priorityLower = String(ticket.Priority || "").toLowerCase();
            const category: NotificationItem["category"] = 
              priorityLower === "high" || priorityLower === "critical" ? "alert" :
              priorityLower === "medium" ? "task" :
              priorityLower === "low" ? "info" : "status";

            const formatDate = (dateStr?: string | Date) => {
              if (!dateStr) return "N/A";
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) return String(dateStr);
              return date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
            };

            const uniqueKey = ticket.T_Sch_Id ? `${ticket.Id}_${ticket.T_Sch_Id}` : String(ticket.Id);

            return {
              id: uniqueKey,
              title: ticket.Subject || `Ticket #${ticket.Id}`,
              message: ticket.Description || "No Description",
              time: getRelativeTime(ticket.Created_At),
              category,
              isRead:
                localReadIds.includes(uniqueKey) ||
                ["in progress", "inprocess", "in process", "resolved", "closed"].includes(
                  String(ticket.Status || "").toLowerCase().trim()
                ),
              important: priorityLower === "high" || priorityLower === "critical",
              ticketCode: `TCK-${String(ticket.Id).padStart(4, "0")}`,
              subject: ticket.Subject || "N/A",
              customer: ticket.Created_By_Name || "N/A",
              From_Company_Name: ticket.From_Company_Name || "N/A",
              categoryName: ticket.Category_Name || ticket.Category || "N/A",
              priority: ticket.Priority || "Low",
              status: ticket.Status || "New",
              createdDate: formatDate(ticket.Created_At),
              description: ticket.Description || "No Description",
              imageUrl: ticket.Image_Url || undefined,
              estSchStartDate: formatDate(ticket.Est_Sch_Start_Date),
              estSchEndDate: formatDate(ticket.Est_Sch_End_Date),
              T_Sch_Id: ticket.T_Sch_Id ? String(ticket.T_Sch_Id) : undefined,
              Employee_Involved_Id: ticket.Employee_Involved_Id ? String(ticket.Employee_Involved_Id) : undefined,
              ticketId: ticket.Id ? String(ticket.Id) : undefined,
              From_CompanyId: ticket.From_CompanyId ? String(ticket.From_CompanyId) : undefined,
              To_CompanyId: ticket.To_CompanyId ? String(ticket.To_CompanyId) : undefined,
              rawEstSchStartDate: ticket.Est_Sch_Start_Date || undefined,
              rawEstSchEndDate: ticket.Est_Sch_End_Date || undefined,
            };
          });
        setNotifications(mapped);
        window.dispatchEvent(new Event("notification-update"));
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    const userId = user?.Global_User_ID || user?.id || "";
    if (userId) {
      const localReadIdsKey = `read_notifications_${userId}`;
      const localReadIds: string[] = JSON.parse(localStorage.getItem(localReadIdsKey) || "[]");
      if (!localReadIds.includes(id)) {
        localReadIds.push(id);
        localStorage.setItem(localReadIdsKey, JSON.stringify(localReadIds));
      }
      window.dispatchEvent(new Event("notification-update"));
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    const userId = user?.Global_User_ID || user?.id || "";
    if (userId) {
      const localDeletedIdsKey = `deleted_notifications_${userId}`;
      const localDeletedIds: string[] = JSON.parse(localStorage.getItem(localDeletedIdsKey) || "[]");
      if (!localDeletedIds.includes(id)) {
        localDeletedIds.push(id);
        localStorage.setItem(localDeletedIdsKey, JSON.stringify(localDeletedIds));
      }
      window.dispatchEvent(new Event("notification-update"));
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    const userId = user?.Global_User_ID || user?.id || "";
    if (userId) {
      const localReadIdsKey = `read_notifications_${userId}`;
      const localReadIds: string[] = JSON.parse(localStorage.getItem(localReadIdsKey) || "[]");
      notifications.forEach((notif) => {
        if (!localReadIds.includes(notif.id)) {
          localReadIds.push(notif.id);
        }
      });
      localStorage.setItem(localReadIdsKey, JSON.stringify(localReadIds));
      window.dispatchEvent(new Event("notification-update"));
    }
  };

  const deleteAll = () => {
    setNotifications([]);
    const userId = user?.Global_User_ID || user?.id || "";
    if (userId) {
      const localDeletedIdsKey = `deleted_notifications_${userId}`;
      const localDeletedIds: string[] = JSON.parse(localStorage.getItem(localDeletedIdsKey) || "[]");
      notifications.forEach((notif) => {
        if (!localDeletedIds.includes(notif.id)) {
          localDeletedIds.push(notif.id);
        }
      });
      localStorage.setItem(localDeletedIdsKey, JSON.stringify(localDeletedIds));
      window.dispatchEvent(new Event("notification-update"));
    }
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
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress sx={{ color: "#b9925f" }} />
          </Box>
        ) : filteredNotifications.length === 0 ? (
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
                    onClick={() => {
                      setSelectedTicket(notif);
                      setDetailsOpen(true);
                    }}
                    secondaryAction={
                      <Box display="flex" gap={0.5}>
                        {!notif.isRead ? (
                          <Tooltip title="Mark as read">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              sx={{
                                color: "#b9925f",
                                "&:hover": { bgcolor: "rgba(185, 146, 95, 0.08)" },
                              }}
                            >
                              <DoneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Delete">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              sx={{
                                color: "text.secondary",
                                "&:hover": { color: "#d32f2f", bgcolor: "rgba(211, 47, 47, 0.08)" },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    }
                    sx={{
                      cursor: "pointer",
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
                        {notif.imageUrl ? (
                          <span onClick={(e) => e.stopPropagation()}>
                            <ImagePreviewDialog url={notif.imageUrl}>
                              <Avatar
                                src={notif.imageUrl}
                                sx={{ bgcolor: getCategoryColor(notif.category), width: 40, height: 40 }}
                              />
                            </ImagePreviewDialog>
                          </span>
                        ) : (
                          <Avatar
                            sx={{ bgcolor: getCategoryColor(notif.category), width: 40, height: 40 }}
                          >
                            {getCategoryIcon(notif.category)}
                          </Avatar>
                        )}
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

      {/* Ticket Details Dialog */}
      <TicketDetailsDialog
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onConfirmSuccess={fetchTickets}
      />
    </Box>
  );
};

export default NotificationScreen;
