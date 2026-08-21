import React, { useState } from "react";
import {
  Typography,
  Box,
  Chip,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import AppDialog from "../../Components/appDialog";
import { fetchLink } from "../../Components/customFetch";
import { toast } from "react-toastify";
import { getProjectMaster } from "../Master/Projects/Projects.api";
import { getTaskTypesByProject, gettasktype } from "../Master/Tasktype/TaskType.api";
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
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleConfirm = async () => {
    if (!ticket) return;
    try {
      setConfirmLoading(true);

      // 1. Fetch projects to find the default project
      const projects = await getProjectMaster();
      const unassignedProj = projects.find(
        (p) =>
          p.Project_Name.trim().toUpperCase() === "UN ASSIGNED WORK" ||
          p.Project_Name.trim().toUpperCase() === "UNASSIGNED WORK"
      );

      const unassignedProjectId = unassignedProj ? unassignedProj.Project_Id : null;
      if (!unassignedProjectId) {
        toast.error("Unassigned project not found in Project Master");
        return;
      }

      // 2. Fetch task types for that project to get the Task_Type_Id
      const taskTypes = await getTaskTypesByProject(unassignedProjectId);
      let taskTypeId = null;
      if (taskTypes && taskTypes.length > 0) {
        taskTypeId = taskTypes[0].Task_Type_Id;
      } else {
        // Fallback: fetch all task types and find the first active one
        const allTaskTypes = await gettasktype();
        const activeTaskType = allTaskTypes.find((t) => t.Status === 1 || t.IsActive === 1);
        if (activeTaskType) {
          taskTypeId = activeTaskType.Task_Type_Id;
        }
      }

      if (!taskTypeId) {
        toast.error("No task group/type configured in the system");
        return;
      }

      // 3. Create the Task first
      const taskPayload = {
        Task_Name: ticket.subject || "N/A",
        Task_Desc: ticket.description || "No Description",
        Company_Id: ticket.To_CompanyId ? Number(ticket.To_CompanyId) : null,
        Task_Type_Id: taskTypeId,
        Project_Id: unassignedProjectId,
      };

      const taskRes = await fetchLink({
        address: "masters/tasks",
        method: "POST",
        bodyData: taskPayload,
      });

      if (!taskRes || !taskRes.success) {
        toast.error(taskRes?.message || "Failed to create task");
        return;
      }

      const createdTask = Array.isArray(taskRes.data) ? taskRes.data[0] : taskRes.data;
      const taskId = createdTask?.data?.Task_Id !== undefined
        ? createdTask.data.Task_Id
        : (createdTask?.Task_Id || null);

      if (!taskId) {
        toast.error("Failed to retrieve generated Task ID");
        return;
      }

      // 4. Save the Ticket Task mapping
      const ticketTaskPayload = {
        id: taskId,
        project_id: unassignedProjectId,
        Ticket_Id: ticket.ticketId ? Number(ticket.ticketId) : null,
        Est_Sch_Start_Date: ticket.rawEstSchStartDate || null,
        Est_Sch_End_Date: ticket.rawEstSchEndDate || null,
        From_CompanyId: ticket.From_CompanyId ? Number(ticket.From_CompanyId) : null,
        To_CompanyId: ticket.To_CompanyId ? Number(ticket.To_CompanyId) : null,
        Employee_Involved_Id: ticket.Employee_Involved_Id ? Number(ticket.Employee_Involved_Id) : null,
        ticket_acc_date: new Date().toISOString(),
        tick_com_date: new Date().toISOString(),
        Task_Id: taskId,
      };

      const res = await fetchLink({
        address: "masters/ticketTasks",
        method: "POST",
        bodyData: ticketTaskPayload,
      });

      if (res && res.success) {
        console.log("TicketDetailsDialog: ticketTasks created successfully.", {
          T_Sch_Id: ticket.T_Sch_Id,
          Employee_Involved_Id: ticket.Employee_Involved_Id,
          rawEstSchStartDate: ticket.rawEstSchStartDate,
          rawEstSchEndDate: ticket.rawEstSchEndDate
        });
        
        // 5. Save tbl_Task_Details mapping if T_Sch_Id and Employee_Involved_Id are present
        if (ticket.T_Sch_Id && ticket.Employee_Involved_Id) {
          console.log("TicketDetailsDialog: Fetching mapped Emp_Id for Global_User_ID:", ticket.Employee_Involved_Id);
          const empMappingRes = await fetchLink({
            address: `masters/ticketTasks/getEmpId/${ticket.Employee_Involved_Id}`,
            method: "GET",
          });
          console.log("TicketDetailsDialog: getEmpId response:", empMappingRes);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const empData = empMappingRes.data as any;
          const resolvedEmpId = Array.isArray(empData)
            ? (empData[0]?.Emp_Id || empData[0]?.emp_id)
            : (empData?.Emp_Id || empData?.emp_id);

          if (!resolvedEmpId) {
            console.error("TicketDetailsDialog: Failed to resolve employee ID mapping. Response:", empMappingRes);
            toast.error(empMappingRes?.message || "Failed to resolve employee ID mapping");
            return;
          }
          console.log("TicketDetailsDialog: Resolved employee Emp_Id:", resolvedEmpId);

          // Calculate dates in range (inclusive)
          const dates: string[] = [];
          if (ticket.rawEstSchStartDate && ticket.rawEstSchEndDate) {
            const start = new Date(ticket.rawEstSchStartDate);
            const end = new Date(ticket.rawEstSchEndDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
              const final = new Date(end.getFullYear(), end.getMonth(), end.getDate());
              while (current <= final) {
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, '0');
                const d = String(current.getDate()).padStart(2, '0');
                dates.push(`${y}-${m}-${d}`);
                current.setDate(current.getDate() + 1);
              }
            }
          }
          console.log("TicketDetailsDialog: Calculated task dates:", dates);

          const taskDetailsPayload = {
            Project_Id: unassignedProjectId,
            Sch_Id: Number(ticket.T_Sch_Id),
            Task_Id: taskId,
            Emp_Ids: [resolvedEmpId],
            taskDates: dates.length > 0 ? dates : undefined,
          };
          console.log("TicketDetailsDialog: Submitting task details payload:", taskDetailsPayload);

          const detailsRes = await fetchLink({
            address: "masters/projectScheduleEmp/create",
            method: "POST",
            bodyData: taskDetailsPayload,
          });
          console.log("TicketDetailsDialog: Task details creation response:", detailsRes);

          if (!detailsRes || !detailsRes.success) {
            console.error("TicketDetailsDialog: Failed to create task details:", detailsRes);
            toast.error(detailsRes?.message || "Failed to create task details");
            return;
          }
        } else {
          console.warn("TicketDetailsDialog: Skipping Task Details creation because T_Sch_Id or Employee_Involved_Id is missing.");
        }

        // 6. Update the Ticket status in backend to "in progress"
        const updateStatusRes = await fetchLink({
          address: "masters/tickets",
          method: "PUT",
          bodyData: {
            Id: ticket.ticketId ? Number(ticket.ticketId) : null,
            Status: "in progress",
          },
        });

        if (!updateStatusRes || !updateStatusRes.success) {
          console.error("TicketDetailsDialog: Failed to update ticket status to in progress:", updateStatusRes);
          toast.error(updateStatusRes?.message || "Failed to update ticket status");
          return;
        }

        toast.success("Tasks confirmed and saved successfully");
        if (onConfirmSuccess) {
          onConfirmSuccess();
        }
        onClose();
      } else {
        toast.error(res?.message || "Failed to create ticket task");
      }
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
          </Grid>
        </Box>
      )}
    </AppDialog>
  );
};

export default TicketDetailsDialog;
