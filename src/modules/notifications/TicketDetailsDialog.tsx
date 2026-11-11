import React, { useState } from "react";
import {
  Typography,
  Box,
  Chip,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import AppDialog from "../../Components/appDialog";
import ImagePreviewDialog, { isVideoUrl, isAudioUrl, isDocumentUrl, resolveMediaUrl } from "../../Components/imagePreview";
import { fetchLink } from "../../Components/customFetch";
import { toast } from "react-toastify";
import { getProjectMaster } from "../Master/Projects/Projects.api";
import { getTaskTypesByProject, gettasktype } from "../Master/Tasktype/TaskType.api";
import { useAuth } from "../../auth/authContext";
import CloseIcon from "@mui/icons-material/Close";

export interface TicketDetailsData {
  id: string;
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

interface TicketDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  ticket: TicketDetailsData | null;
  onConfirmSuccess?: () => void;
}

const TicketDetailsDialog: React.FC<TicketDetailsDialogProps> = ({
  open,
  onClose,
  ticket,
  onConfirmSuccess,
}) => {
  const { user } = useAuth();
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleConfirm = async () => {
    if (!ticket) return;
    try {
      setConfirmLoading(true);

      // 1. Fetch projects to find the default project
      const projects = await getProjectMaster();
      let unassignedProj = projects.find(
        (p) =>
          p.Project_Name &&
          (p.Project_Name.trim().toUpperCase() === "UN ASSIGNED WORK" ||
            p.Project_Name.trim().toUpperCase() === "UNASSIGNED WORK" ||
            p.Project_Name.toLowerCase().replace(/[^a-z]/g, "") === "unassignedwork" ||
            p.Project_Name.toLowerCase().includes("unassigned") ||
            p.Project_Name.toLowerCase().includes("un assigned"))
      );
      if (!unassignedProj && projects.length > 0) {
        unassignedProj = projects[0];
      }

      const unassignedProjectId = unassignedProj ? unassignedProj.Project_Id : null;
      if (!unassignedProjectId) {
        toast.error("Unassigned project not found in Project Master");
        return;
      }

      // 2. Fetch task types for that project to get the Task_Type_Id
      const taskTypes = await getTaskTypesByProject(unassignedProjectId);
      let taskTypeId: number | null = null;
      if (taskTypes && taskTypes.length > 0) {
        taskTypeId = taskTypes[0].Task_Type_Id;
      } else {
        // Fallback: fetch all task types and find the first active one
        const allTaskTypes = await gettasktype();
        const activeTaskType = allTaskTypes.find((t) => t.Status === 1 || t.IsActive === 1);
        if (activeTaskType) {
          taskTypeId = activeTaskType.Task_Type_Id;
        } else if (allTaskTypes.length > 0) {
          taskTypeId = allTaskTypes[0].Task_Type_Id;
        }
      }

      if (!taskTypeId) {
        toast.error("No task group/type configured in the system");
        return;
      }

      // 3. Create the Task first (or reuse if it already exists with this name)
      const taskName = (ticket.subject || "Ticket Task").trim();
      const taskPayload = {
        Task_Name: taskName,
        Task_Desc: ticket.description || "No Description",
        Company_Id: ticket.To_CompanyId
          ? Number(ticket.To_CompanyId)
          : user?.Company_Id
          ? Number(user.Company_Id)
          : null,
        Task_Type_Id: taskTypeId,
        Project_Id: unassignedProjectId,
      };

      let taskId: number | null = null;
      const taskRes = await fetchLink({
        address: "masters/tasks",
        method: "POST",
        bodyData: taskPayload,
      });

      if (taskRes && taskRes.success) {
        const createdTask = Array.isArray(taskRes.data) ? taskRes.data[0] : taskRes.data;
        taskId =
          createdTask?.data?.Task_Id !== undefined
            ? Number(createdTask.data.Task_Id)
            : createdTask?.Task_Id
            ? Number(createdTask.Task_Id)
            : null;
      } else {
        // If task already exists in this project/type, retrieve it so we can proceed to schedule & assign
        try {
          const allTasksRes = await fetchLink({
            address: `masters/tasks/project/${unassignedProjectId}`,
            method: "GET",
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const taskList = Array.isArray(allTasksRes?.data)
            ? allTasksRes.data
            : (allTasksRes?.data as any)?.data || [];
          if (Array.isArray(taskList)) {
            const existing = taskList.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (t: any) =>
                t.Task_Name &&
                t.Task_Name.trim().toLowerCase() === taskName.toLowerCase() &&
                Number(t.Task_Type_Id) === Number(taskTypeId)
            );
            if (existing?.Task_Id) {
              taskId = Number(existing.Task_Id);
            }
          }
        } catch (findErr) {
          console.warn("Could not find existing task:", findErr);
        }

        if (!taskId) {
          toast.error(taskRes?.message || "Failed to create task");
          return;
        }
      }

      // 4. Resolve Employee ID for assignment
      let resolvedEmpId: number | null = null;
      const targetUserId =
        ticket.Employee_Involved_Id ||
        user?.Global_User_ID ||
        user?.id ||
        user?.Local_User_ID;

      if (targetUserId) {
        try {
          const empMappingRes = await fetchLink({
            address: `masters/ticketTasks/getEmpId/${targetUserId}`,
            method: "GET",
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const empData = empMappingRes.data as any;
          const mapped = Array.isArray(empData)
            ? (empData[0]?.Emp_Id || empData[0]?.emp_id)
            : (empData?.Emp_Id || empData?.emp_id);
          if (mapped) resolvedEmpId = Number(mapped);
        } catch (e) {
          console.warn("Could not resolve employee ID via getEmpId:", e);
        }
      }

      // Fallback: fetch from masters/employees/active or masters/employees/ if not resolved
      if (!resolvedEmpId) {
        try {
          const empListRes = await fetchLink({
            address: "masters/employees/active",
            method: "GET",
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const empList = Array.isArray(empListRes?.data)
            ? empListRes.data
            : (empListRes?.data as any)?.data || empListRes;
          if (Array.isArray(empList) && empList.length > 0) {
            const match = empList.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (e: any) =>
                (targetUserId &&
                  (Number(e.Emp_Id) === Number(targetUserId) ||
                    Number(e.User_Mgt_Id) === Number(targetUserId))) ||
                (user?.name &&
                  e.Emp_Name &&
                  String(e.Emp_Name).toLowerCase().trim() === String(user.name).toLowerCase().trim())
            );
            if (match?.Emp_Id) {
              resolvedEmpId = Number(match.Emp_Id);
            } else if (empList[0]?.Emp_Id) {
              resolvedEmpId = Number(empList[0].Emp_Id);
            }
          }
        } catch (e) {
          console.warn("Could not fallback to employee list:", e);
        }
      }

      // Fallback: If still unresolved, use targetUserId or 1
      if (!resolvedEmpId) {
        resolvedEmpId = targetUserId ? Number(targetUserId) : 1;
      }

      // 5. Calculate task dates in range (inclusive) in YYYY-MM-DD format
      const formatDateToYMD = (d: Date | string | null | undefined): string => {
        if (!d) return new Date().toISOString().split("T")[0];
        const parsed = new Date(d);
        if (isNaN(parsed.getTime())) return new Date().toISOString().split("T")[0];
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, "0");
        const day = String(parsed.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const startYMD = formatDateToYMD(ticket.rawEstSchStartDate);
      const endYMD = formatDateToYMD(ticket.rawEstSchEndDate || ticket.rawEstSchStartDate);
      const startDateObj = new Date(startYMD);
      const endDateObj = new Date(endYMD);

      const dates: string[] = [];
      if (endDateObj >= startDateObj) {
        const curr = new Date(startDateObj);
        while (curr <= endDateObj) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, "0");
          const d = String(curr.getDate()).padStart(2, "0");
          dates.push(`${y}-${m}-${d}`);
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        dates.push(startYMD);
      }

      // 6. Save the Ticket Task mapping
      const ticketTaskPayload = {
        project_id: unassignedProjectId,
        Ticket_Id: ticket.ticketId
          ? Number(ticket.ticketId)
          : ticket.id && !isNaN(Number(ticket.id))
          ? Number(ticket.id)
          : null,
        Est_Sch_Start_Date: startYMD,
        Est_Sch_End_Date: endYMD,
        From_CompanyId: ticket.From_CompanyId ? Number(ticket.From_CompanyId) : null,
        To_CompanyId: ticket.To_CompanyId ? Number(ticket.To_CompanyId) : null,
        Employee_Involved_Id: resolvedEmpId,
        ticket_acc_date: new Date().toISOString(),
        tick_com_date: new Date().toISOString(),
        Task_Id: taskId,
      };

      await fetchLink({
        address: "masters/ticketTasks",
        method: "POST",
        bodyData: ticketTaskPayload,
      });

      // 7. Create Project Schedule in tbl_Project_Schedule & tbl_Project_Sch_Task_DT
      const currentYear = new Date().getFullYear();
      const cleanTicketCode = (ticket.ticketCode || ticket.ticketId || ticket.id || String(Date.now()))
        .replace(/[^a-zA-Z0-9-]/g, "")
        .slice(0, 30);

      const schedulePayload = {
        Sch_No: `SCH-${currentYear}-${cleanTicketCode}`,
        Sch_Date: startYMD,
        Task_Id: Number(taskId),
        Task_Type_Id: Number(taskTypeId),
        Sch_Plan_Id: 5, // Specific Day / Dates
        Sch_Type: 1, // 1 = One-Time
        Sch_Start_Date: startYMD,
        Sch_End_Date: endYMD,
        Task_Sch_Timer_Based: false,
        Sch_Est_Start_Time: "09:00",
        Sch_Est_End_Time: "18:00",
        Task_Sch_Duaration: 8,
        Sch_Status: 1, // 1 = Inprocess
        Entry_By: Number(user?.Global_User_ID || user?.id || 1),
        Project_Id: Number(unassignedProjectId),
        specificDates: dates,
      };

      const scheduleRes = await fetchLink({
        address: "masters/projectSchedule/",
        method: "POST",
        bodyData: schedulePayload,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schData = Array.isArray(scheduleRes?.data)
        ? scheduleRes.data[0]
        : (scheduleRes?.data as any)?.data || scheduleRes?.data;

      let createdSchId: number | null =
        schData?.Sch_Id !== undefined
          ? Number(schData.Sch_Id)
          : schData?.schId !== undefined
          ? Number(schData.schId)
          : null;

      // If createdSchId not immediately returned, look up schedule by taskId
      if (!createdSchId) {
        try {
          const checkSchRes = await fetchLink({
            address: `masters/projectSchedule?taskId=${taskId}`,
            method: "GET",
          });
          const list = Array.isArray(checkSchRes?.data) ? checkSchRes.data : [];
          if (list.length > 0 && (list[0].Sch_Id || list[0].schId)) {
            createdSchId = Number(list[0].Sch_Id || list[0].schId);
          }
        } catch (e) {
          console.warn("Could not retrieve created schedule ID:", e);
        }
      }

      const finalSchId = createdSchId || (ticket.T_Sch_Id ? Number(ticket.T_Sch_Id) : null);

      // 8. Assign task to employee in tbl_Task_Details (masters/projectScheduleEmp/create)
      if (finalSchId && resolvedEmpId) {
        const taskDetailsPayload = {
          Project_Id: Number(unassignedProjectId),
          Sch_Id: Number(finalSchId),
          Task_Id: Number(taskId),
          Emp_Ids: [Number(resolvedEmpId)],
          taskDates: dates.length > 0 ? dates : undefined,
        };

        const detailsRes = await fetchLink({
          address: "masters/projectScheduleEmp/create",
          method: "POST",
          bodyData: taskDetailsPayload,
        });

        if (!detailsRes || !detailsRes.success) {
          console.error("TicketDetailsDialog: Failed to assign task details:", detailsRes);
          toast.warning(detailsRes?.message || "Task scheduled, but employee assignment had a warning");
        }
      } else {
        console.warn("TicketDetailsDialog: Missing schedule ID or employee ID for assignment", {
          finalSchId,
          resolvedEmpId,
        });
        toast.warning("Task created, but schedule or employee ID was not available for assignment");
      }

      // 9. Update the Ticket status in backend to "in progress"
      const ticketIdNum = ticket.ticketId ? Number(ticket.ticketId) : Number(ticket.id);
      if (ticketIdNum && !isNaN(ticketIdNum)) {
        await fetchLink({
          address: "masters/tickets",
          method: "PUT",
          bodyData: {
            Id: ticketIdNum,
            Status: "in progress",
          },
        });
      }

      toast.success("Tasks confirmed, scheduled, and assigned successfully");
      if (onConfirmSuccess) {
        onConfirmSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error confirming ticket task:", err);
      toast.error("Error creating ticket task");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      onSubmit={handleConfirm}
      submitText={confirmLoading ? "Confirming..." : "Confirm"}
      closeText="Cancel"
      maxWidth="sm"
      fullWidth
      PaperPropsSx={{
        backgroundColor: "#fffbee", // Cream background matching mockup
        border: "1px solid #e0c8ab",
        boxShadow: "0px 12px 32px rgba(74, 59, 44, 0.15)",
        p: { xs: 2.5, sm: 4 },
        "& .MuiDialogContent-root": {
          padding: "0px !important",
          backgroundColor: "transparent !important",
          border: "none !important",
          overflowY: "auto !important",
        },
        "& .MuiDialogActions-root": {
          padding: "0px !important",
          marginTop: "20px !important",
          borderTop: "none !important",
          backgroundColor: "transparent !important",
          justifyContent: "flex-end !important",
        },
        "& .MuiDialogActions-root button.MuiButton-contained": {
          backgroundColor: "#f28f3b !important", // Matches mockup close button color
          color: "#0d1b2a !important",
          fontWeight: "800 !important",
          borderRadius: "20px !important",
          paddingLeft: "36px !important",
          paddingRight: "36px !important",
          paddingTop: "8px !important",
          paddingBottom: "8px !important",
          fontSize: "0.9rem !important",
          textTransform: "none !important",
          boxShadow: "none !important",
          "&:hover": {
            backgroundColor: "#e07a2d !important",
            boxShadow: "none !important",
          },
        },
        "& .MuiDialogActions-root button.MuiButton-text": {
          color: "#8c7b6c !important",
          fontWeight: "800 !important",
          textTransform: "none !important",
          borderRadius: "20px !important",
          paddingLeft: "24px !important",
          paddingRight: "24px !important",
          paddingTop: "8px !important",
          paddingBottom: "8px !important",
          fontSize: "0.9rem !important",
          "&:hover": {
            backgroundColor: "rgba(140, 123, 108, 0.08) !important",
          },
        }
      }}
    >
      {ticket && (
        <Box>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h5" fontWeight={800} color="#4a3b2c">
              Ticket Details
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  bgcolor: "#f1ebd9",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  border: "1px solid #e0c8ab",
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} color="#4a3b2c" sx={{ fontSize: "0.85rem" }}>
                  {ticket.ticketCode}
                </Typography>
              </Box>
              <IconButton onClick={onClose} size="small" sx={{ color: "#8c7b6c" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Details Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="#8c7b6c"
                fontWeight={800}
                sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
              >
                SUBJECT
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#4a3b2c" sx={{ fontSize: "0.95rem" }}>
                {ticket.subject}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="#8c7b6c"
                fontWeight={800}
                sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
              >
                CUSTOMER
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#4a3b2c" sx={{ fontSize: "0.95rem" }}>
                {ticket.customer}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="#8c7b6c"
                fontWeight={800}
                sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
              >
                FROM COMPANY
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#4a3b2c" sx={{ fontSize: "0.95rem" }}>
                {ticket.From_Company_Name}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="#8c7b6c"
                fontWeight={800}
                sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
              >
                CATEGORY
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#4a3b2c" sx={{ fontSize: "0.95rem" }}>
                {ticket.categoryName}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="#8c7b6c"
                fontWeight={800}
                sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
              >
                PRIORITY
              </Typography>
              <Chip
                label={ticket.priority}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  bgcolor:
                    String(ticket.priority).toLowerCase() === "high" ||
                    String(ticket.priority).toLowerCase() === "critical"
                      ? "#fce8e6"
                      : "#e3f2fd",
                  color:
                    String(ticket.priority).toLowerCase() === "high" ||
                    String(ticket.priority).toLowerCase() === "critical"
                      ? "#c53929"
                      : "#1976d2",
                  border: "none",
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="#8c7b6c"
                fontWeight={800}
                sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
              >
                STATUS
              </Typography>
              <Chip
                label={ticket.status}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  bgcolor:
                    String(ticket.status).toLowerCase() === "resolved" ||
                    String(ticket.status).toLowerCase() === "closed"
                      ? "#1b9e5c"
                      : "#ff9800",
                  color: "#fff",
                  border: "none",
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="#8c7b6c"
                fontWeight={800}
                sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
              >
                CREATED DATE
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#4a3b2c" sx={{ fontSize: "0.95rem" }}>
                {ticket.createdDate}
              </Typography>
            </Grid>

            {/* Placeholder to push EST. START DATE and EST. END DATE to a new row together */}
            <Grid item xs={12} sm={6} />

            {ticket.estSchStartDate && ticket.estSchStartDate !== "N/A" && (
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="caption"
                  color="#8c7b6c"
                  fontWeight={800}
                  sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
                >
                  EST. START DATE
                </Typography>
                <Typography variant="body1" fontWeight={700} color="#4a3b2c" sx={{ fontSize: "0.95rem" }}>
                  {ticket.estSchStartDate}
                </Typography>
              </Grid>
            )}

            {ticket.estSchEndDate && ticket.estSchEndDate !== "N/A" && (
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="caption"
                  color="#8c7b6c"
                  fontWeight={800}
                  sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
                >
                  EST. END DATE
                </Typography>
                <Typography variant="body1" fontWeight={700} color="#4a3b2c" sx={{ fontSize: "0.95rem" }}>
                  {ticket.estSchEndDate}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography
                variant="caption"
                color="#8c7b6c"
                fontWeight={800}
                sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
              >
                DESCRIPTION
              </Typography>
              <Typography variant="body1" color="#4a3b2c" sx={{ whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>
                {ticket.description}
              </Typography>
            </Grid>

            {resolveMediaUrl(ticket.imageUrl) && (
              <Grid item xs={12}>
                <Typography
                  variant="caption"
                  color="#8c7b6c"
                  fontWeight={800}
                  sx={{ letterSpacing: 0.5, display: "block", mb: 0.5, fontSize: "0.75rem" }}
                >
                  ATTACHMENT
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid #e0c8ab",
                    bgcolor: "#f1ebd9",
                    display: "inline-flex",
                    maxWidth: "100%",
                  }}
                >
                  {isVideoUrl(resolveMediaUrl(ticket.imageUrl)) ? (
                    <video
                      src={resolveMediaUrl(ticket.imageUrl)}
                      controls
                      preload="metadata"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 240,
                        display: "block",
                      }}
                    />
                  ) : isAudioUrl(resolveMediaUrl(ticket.imageUrl)) ? (
                    <audio
                      src={resolveMediaUrl(ticket.imageUrl)}
                      controls
                      preload="metadata"
                      style={{
                        width: "100%",
                        minWidth: 260,
                        maxWidth: 420,
                        display: "block",
                      }}
                    />
                  ) : isDocumentUrl(resolveMediaUrl(ticket.imageUrl)) ? (
                    <ImagePreviewDialog url={resolveMediaUrl(ticket.imageUrl)!}>
                      <Box
                        sx={{
                          px: 2,
                          py: 1.25,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          cursor: "pointer",
                          color: "#4a3b2c",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                        }}
                      >
                        <span>📄 View Attachment ({resolveMediaUrl(ticket.imageUrl)?.split("/").pop()})</span>
                      </Box>
                    </ImagePreviewDialog>
                  ) : (
                    <ImagePreviewDialog url={resolveMediaUrl(ticket.imageUrl)!}>
                      <Box
                        component="img"
                        src={resolveMediaUrl(ticket.imageUrl)}
                        alt={ticket.subject || "Ticket Attachment"}
                        sx={{
                          maxWidth: "100%",
                          maxHeight: 240,
                          objectFit: "contain",
                          display: "block",
                          cursor: "pointer",
                        }}
                      />
                    </ImagePreviewDialog>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </AppDialog>
  );
};

export default TicketDetailsDialog;
