/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import TicketDetailsDialog from "./TicketDetailsDialog";
import ImagePreviewDialog, { isAudioUrl, isDocumentUrl, isVideoUrl, resolveMediaUrl } from "../../Components/imagePreview";
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
} from "@mui/icons-material";
import { cleanNotificationId, getReadNotificationIds, markNotificationsAsRead } from "./notificationStorage";
import {
  isUserAdminOrDev,
  isTicketAssignedToUser,
  hasUserAcknowledgedTicket,
  isTicketAuthorizedForCompany,
  getAssignedUserIds,
  isDefaultAdminResponder,
  isUserInTicketTargetCompany,
} from "./ticketNotificationHelpers";

// eslint-disable-next-line react-refresh/only-export-components
export { useNotificationCount } from "./useNotificationCount";

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
  Ticket_Id?: string | number;
  From_CompanyId?: string;
  To_CompanyId?: string;
  rawEstSchStartDate?: string;
  rawEstSchEndDate?: string;
  involvedUserName?: string;
}

const SCHEDULED_OR_IN_PROGRESS_STATUSES = [
  "in progress",
  "inprocess",
  "in process",
  "inprogress",
  "scheduled",
];
const ALLOWED_NOTIFICATION_STATUSES = [
  "new",
  "open",
  "assigned",
  "1",
  "2",
  ...SCHEDULED_OR_IN_PROGRESS_STATUSES,
];

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

const extractTicketAttachmentUrl = (ticket: any): string | undefined => {
  if (!ticket) return undefined;
  const rawAttachment =
    ticket.Image_Url ||
    ticket.image_url ||
    ticket.imageUrl ||
    ticket.Video_Url ||
    ticket.video_url ||
    ticket.Attachment_Url ||
    ticket.attachment_url ||
    ticket.Attachment ||
    ticket.attachment ||
    (Array.isArray(ticket.Attachments) && ticket.Attachments.length > 0
      ? ticket.Attachments[0]?.Image_Url || ticket.Attachments[0]?.url || ticket.Attachments[0]
      : undefined);

  return resolveMediaUrl(typeof rawAttachment === "string" ? rawAttachment : undefined);
};

const NotificationScreen: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedTicket, setSelectedTicket] = useState<NotificationItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<
    { UserId: number; Name: string; UserTypeId?: number | null; candidateIds: string[] }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("self");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const usersListRef = useRef<
    { UserId: number; Name: string; UserTypeId?: number | null; candidateIds: string[] }[]
  >([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const isCompanyAdmin = useMemo(() => isUserAdminOrDev(user), [user]);

  const localData = typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;
  const parseData = useMemo(() => {
    if (!localData) return null;
    try {
      return JSON.parse(localData);
    } catch {
      try {
        return JSON.parse(atob(localData));
      } catch {
        return null;
      }
    }
  }, [localData]);

  const currentUserId =
    (user as any)?.Global_User_Id ??
    (user as any)?.GlobalUserID ??
    user?.Global_User_ID ??
    parseData?.Global_User_Id ??
    parseData?.GlobalUserID ??
    parseData?.Global_User_ID ??
    user?.id ??
    (user as any)?.Id ??
    parseData?.id ??
    parseData?.Id;

  const companyId =
    (typeof localStorage !== "undefined" && localStorage.getItem("COMPANY_ID")
      ? Number(localStorage.getItem("COMPANY_ID"))
      : undefined) ??
    (user as any)?.companyId ??
    user?.Company_Id ??
    parseData?.companyId ??
    parseData?.Company_Id ??
    undefined;

  const latestRequest = useRef(0);

  const fetchTickets = useCallback(async (isSilent = false) => {
    const requestId = ++latestRequest.current;
    if (!currentUserId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      if (!isSilent) {
        setLoading(true);
      }

      const resolveNumericParam = (...candidates: unknown[]): string => {
        for (const c of candidates) {
          if (c !== undefined && c !== null && c !== "" && c !== "undefined" && c !== "null") {
            const num = Number(c);
            if (!Number.isNaN(num) && num > 0) return String(num);
          }
        }
        return "1";
      };

      const userParam = resolveNumericParam(
        (user as any)?.Global_User_Id,
        (user as any)?.GlobalUserID,
        user?.Global_User_ID,
        (user as any)?.globalUserId,
        (user as any)?.global_user_id,
        parseData?.Global_User_Id,
        parseData?.GlobalUserID,
        parseData?.Global_User_ID,
        parseData?.globalUserId,
        parseData?.global_user_id,
        localStorage.getItem("GLOBAL_USER_ID"),
        currentUserId,
        user?.id,
        (user as any)?.Id,
        parseData?.id,
        parseData?.Id
      );

      const compParam = resolveNumericParam(
        localStorage.getItem("COMPANY_ID"),
        companyId,
        (user as any)?.companyId,
        user?.Company_Id,
        parseData?.companyId,
        parseData?.Company_Id
      );

      const resolveUserTypeIdParam = (...candidates: unknown[]): string => {
        for (const c of candidates) {
          if (c !== undefined && c !== null && c !== "" && c !== "undefined" && c !== "null") {
            const num = Number(c);
            if (!Number.isNaN(num) && num >= 0) return String(num);
          }
        }
        return "1";
      };

      const userTypeIdParam = resolveUserTypeIdParam(
        localStorage.getItem("USERTYPE_ID"),
        user?.UserTypeId,
        (user as any)?.userTypeId,
        (user as any)?.User_Type_Id,
        parseData?.UserTypeId,
        parseData?.userTypeId,
        parseData?.User_Type_Id
      );

      const localUserId =
        user?.Local_User_ID ??
        (user as any)?.localUserId ??
        parseData?.Local_User_ID ??
        parseData?.localUserId ??
        userParam;

      if (isCompanyAdmin && usersListRef.current.length === 0) {
        try {
          const [usersRes, empListRes] = await Promise.allSettled([
            fetchLink({
              address: "masters/users",
              method: "GET",
              autoHeaders: true,
              headers: { Db: compParam },
            }),
            fetchLink({
              address: "masters/employees",
              method: "GET",
              autoHeaders: true,
              headers: { Db: compParam },
            }),
          ]);

          const rawUsers =
            usersRes.status === "fulfilled" && usersRes.value
              ? (usersRes.value as any)?.data ?? usersRes.value
              : [];
          const userRows = Array.isArray(rawUsers) ? rawUsers : Array.isArray(rawUsers?.data) ? rawUsers.data : [];

          const rawEmps =
            empListRes.status === "fulfilled" && empListRes.value
              ? (empListRes.value as any)?.data ?? empListRes.value
              : [];
          const empRows = Array.isArray(rawEmps) ? rawEmps : Array.isArray(rawEmps?.data) ? rawEmps.data : [];

          const normalized = userRows
            .filter(
              (u: any) =>
                u &&
                (u.UserId ?? u.Global_User_Id ?? u.Global_User_ID ?? u.id ?? u.User_Id ?? u.user_id)
            )
            .map((u: any) => {
              const primaryId =
                u.Global_User_Id ??
                u.Global_User_ID ??
                u.GlobalUserID ??
                u.UserId ??
                u.id ??
                u.User_Id ??
                u.user_id;
              const rawType = u.UserTypeId ?? u.user_type_id ?? u.User_Type_Id;
              const userName = String(
                u.Name ?? u.name ?? u.User_Name ?? u.UserName ?? u.username ?? `User #${primaryId}`
              );
              const idSet = new Set<string>();
              const addCandidate = (v: unknown) => {
                if (v !== undefined && v !== null && String(v).trim() !== "" && String(v) !== "0") {
                  idSet.add(String(v).trim());
                }
              };
              addCandidate(u.UserId);
              addCandidate(u.User_Id);
              addCandidate(u.user_id);
              addCandidate(u.Global_User_Id);
              addCandidate(u.Global_User_ID);
              addCandidate(u.GlobalUserID);
              addCandidate(u.Local_User_ID);
              addCandidate(u.id);
              addCandidate(u.Id);
              addCandidate(u.Emp_Id);
              addCandidate(u.emp_id);
              addCandidate(u.Employee_Id);

              const userNameLower = userName.trim().toLowerCase();
              for (const emp of empRows) {
                if (!emp) continue;
                const empUserMgt =
                  emp.User_Mgt_Id ?? emp.user_mgt_id ?? emp.User_Id ?? emp.user_id ?? emp.Global_User_Id;
                const empNameLower = String(emp.Emp_Name ?? emp.emp_name ?? "").trim().toLowerCase();
                if (
                  (empUserMgt && idSet.has(String(empUserMgt).trim())) ||
                  (userNameLower && empNameLower === userNameLower)
                ) {
                  addCandidate(emp.Emp_Id ?? emp.emp_id);
                  addCandidate(empUserMgt);
                }
              }

              return {
                UserId: Number(primaryId),
                Name: userName,
                UserTypeId:
                  rawType !== undefined && rawType !== null && !Number.isNaN(Number(rawType))
                    ? Number(rawType)
                    : null,
                candidateIds: Array.from(idSet),
              };
            });
          if (normalized.length > 0) {
            usersListRef.current = normalized;
            setUsersList(normalized);
          }
        } catch {
          // Ignore users list fetch error
        }
      }

      const selectedUserObj =
        isCompanyAdmin && selectedUserId !== "self"
          ? usersListRef.current.find((u) => String(u.UserId) === String(selectedUserId))
          : null;

      const extractTicketList = (res: any): any[] => {
        if (!res) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
        return [];
      };

      const fetchTicketQuery = async (params: URLSearchParams, fromUserQuery = false): Promise<any[]> => {
        try {
          const mastersRes = await fetchLink({
            address: `masters/tickets?${params.toString()}`,
            method: "GET",
            autoHeaders: true,
            headers: { Db: compParam },
          });
          const rows = extractTicketList(mastersRes);
          return fromUserQuery ? rows.map((r: any) => ({ ...r, __fromUserSpecificQuery: true })) : rows;
        } catch {
          try {
            const createTicketRes = await fetchLink({
              address: `createTicket/list?${params.toString()}`,
              method: "GET",
              autoHeaders: true,
              headers: { Db: compParam },
            });
            const rows = extractTicketList(createTicketRes);
            return fromUserQuery ? rows.map((r: any) => ({ ...r, __fromUserSpecificQuery: true })) : rows;
          } catch {
            return [];
          }
        }
      };

      let list: any[] = [];

      if (isCompanyAdmin && selectedUserId !== "self") {
        const targetUserIdStr = String(selectedUserObj?.UserId || selectedUserId);
        const userSpecificParams = new URLSearchParams({
          companyId: compParam,
          userId: targetUserIdStr,
          Userid: targetUserIdStr,
          User_Id: targetUserIdStr,
          userTypeId: "3",
          usertypeid: "3",
        });

        const adminAllParams = new URLSearchParams({
          companyId: compParam,
          userId: userParam,
          Userid: userParam,
          User_Id: userParam,
          userTypeId: userTypeIdParam,
          usertypeid: userTypeIdParam,
          isAdmin: "true",
        });

        const results = await Promise.all([
          fetchTicketQuery(userSpecificParams, true),
          fetchTicketQuery(adminAllParams, false),
        ]);
        list = results.flat();
      } else {
        const queryParams = new URLSearchParams({
          companyId: compParam,
          userId: userParam,
          Userid: userParam,
          User_Id: userParam,
          userTypeId: userTypeIdParam,
          usertypeid: userTypeIdParam,
          ...(isCompanyAdmin ? { isAdmin: "true" } : { User_Id: userParam }),
        });
        list = await fetchTicketQuery(queryParams, false);
      }

      if (requestId !== latestRequest.current) return;

      const scheduledTicketIds = new Set<string>();
      let currentEmpId: number | null = null;
      try {
        const [scheduleRes, empMappingRes] = await Promise.allSettled([
          fetchLink({
            address: "masters/projectSchedule/?page=1&limit=1000",
            method: "GET",
            autoHeaders: true,
            headers: { Db: compParam },
          }),
          !isCompanyAdmin && localUserId
            ? fetchLink({
                address: `masters/ticketTasks/getEmpId/${localUserId}`,
                method: "GET",
                autoHeaders: true,
                headers: { Db: compParam },
              })
            : Promise.resolve(null),
        ]);

        if (empMappingRes.status === "fulfilled" && empMappingRes.value) {
          const empData = (empMappingRes.value as any).data ?? empMappingRes.value;
          const mapped = Array.isArray(empData)
            ? (empData[0]?.Emp_Id ?? empData[0]?.emp_id)
            : (empData?.Emp_Id ?? empData?.emp_id);
          if (mapped && !Number.isNaN(Number(mapped)) && Number(mapped) > 0) {
            currentEmpId = Number(mapped);
          }
        }

        const extractRows = (res: PromiseSettledResult<any>): any[] => {
          if (res.status !== "fulfilled" || !res.value) return [];
          const val = res.value;
          if (Array.isArray(val)) return val;
          if (Array.isArray(val.data)) return val.data;
          if (val.data && Array.isArray(val.data.data)) return val.data.data;
          return [];
        };

        for (const row of extractRows(scheduleRes)) {
          const mappedTicketId = cleanNotificationId(
            row?.Ticket_Id ?? row?.ticketId ?? row?.TicketId ?? row?.ticket_id ?? row?.Schedule_Ticket_Id
          );
          if (mappedTicketId) {
            scheduledTicketIds.add(mappedTicketId);
          }
        }
      } catch {
        // Ignore schedule mapping lookup errors
      }

      if (requestId !== latestRequest.current) return;

      const localDeletedIdsKey = `manually_deleted_notifications_${userParam}`;
      const localDeletedIds: string[] = JSON.parse(
        localStorage.getItem(localDeletedIdsKey) ||
          localStorage.getItem(`manually_deleted_notifications_${currentUserId}`) ||
          "[]"
      );

      const readIds = new Set<string>();
      if (isCompanyAdmin && selectedUserId !== "self") {
        const candidateReadUserIds = [
          String(selectedUserId),
          ...(selectedUserObj?.candidateIds ?? []),
        ];
        for (const uid of candidateReadUserIds) {
          getReadNotificationIds(compParam, uid).forEach((id) => readIds.add(id));
        }
      } else {
        getReadNotificationIds(compParam, userParam).forEach((id) => readIds.add(id));
      }

      const resolveInvolvedUserName = (ticket: any): string => {
        const directNames = [
          ticket.Employee_Name,
          ticket.Emp_Name,
          ticket.Involved_Employee_Name,
          ticket.Assigned_To_Name,
          ticket.assignedTo,
          ticket.Responder_Name,
          ticket.ResponderName,
          ticket.Repondername,
          ticket.repondername,
        ]
          .filter((n): n is string => typeof n === "string" && n.trim() !== "")
          .map((n) => n.trim());

        const assignedIds = getAssignedUserIds(ticket);
        if (ticket?.Emp_Id && !Number.isNaN(Number(ticket.Emp_Id))) {
          assignedIds.push(Number(ticket.Emp_Id));
        }

        for (const aId of assignedIds) {
          const matchedUser = usersListRef.current.find((u) =>
            u.candidateIds.includes(String(aId).trim())
          );
          if (matchedUser?.Name) {
            return matchedUser.Name;
          }
        }

        if (directNames.length > 0 && directNames[0].toLowerCase() !== "admin") {
          return directNames[0];
        }

        if (isCompanyAdmin && selectedUserId !== "self" && selectedUserObj?.Name) {
          return selectedUserObj.Name;
        }

        if (directNames.length > 0) {
          return directNames[0];
        }

        return String(user?.Name || user?.name || user?.UserName || "N/A");
      };

      if (isCompanyAdmin) {
        const allCompanyTickets = list.filter((t: any) =>
          isTicketAuthorizedForCompany(t, compParam, user?.Company_Name)
        );

        const isTicketForSelectedAdminUser = (ticket: any): boolean => {
          const assignedEmpIds = getAssignedUserIds(ticket);
          if (ticket?.Emp_Id && !Number.isNaN(Number(ticket.Emp_Id))) {
            assignedEmpIds.push(Number(ticket.Emp_Id));
          }
          if (selectedUserId === "self" || String(userParam) === String(selectedUserId)) {
            return (
              isTicketAssignedToUser(ticket, user, userParam) ||
              Boolean(currentEmpId && assignedEmpIds.includes(currentEmpId))
            );
          }
          const targetCandidateIds = new Set<string>([
            String(selectedUserId).trim(),
            ...(selectedUserObj?.candidateIds ?? []),
          ]);
          for (const aId of assignedEmpIds) {
            if (targetCandidateIds.has(String(aId).trim())) {
              return true;
            }
          }
          if (selectedUserObj) {
            const userNameLower = selectedUserObj.Name.trim().toLowerCase();
            if (userNameLower) {
              const ticketNames = [
                ticket.Repondername,
                ticket.repondername,
                ticket.Assigned_To_Name,
                ticket.assignedTo,
                ticket.Responder_Name,
                ticket.ResponderName,
                ticket.Employee_Name,
                ticket.Emp_Name,
              ]
                .filter((n): n is string => typeof n === "string" && n.trim() !== "")
                .map((n) => n.trim().toLowerCase());
              for (const tName of ticketNames) {
                const parts = tName.split(",").map((s) => s.trim().toLowerCase());
                if (tName === userNameLower || parts.includes(userNameLower)) return true;
              }
            }
          }
          return false;
        };

        const ticketMap = new Map<string, any>();
        allCompanyTickets
          .filter((t: any) => isTicketForSelectedAdminUser(t))
          .forEach((t: any) => {
            const id = String(t.Id || t.id || t.TicketId);
            ticketMap.set(id, t);
          });

        const activeTickets = Array.from(ticketMap.values()).filter((ticket: any) => {
          const rawId = String(ticket.Id || ticket.id || ticket.TicketId || "");
          const uniqueKey = ticket.T_Sch_Id ? `${ticket.Id || ticket.id || ticket.TicketId}_${ticket.T_Sch_Id}` : rawId;
          if (localDeletedIds.includes(uniqueKey) || localDeletedIds.includes(rawId)) return false;

          const status = String(ticket.Status || ticket.status || "").trim().toLowerCase();
          if (["closed", "resolved", "completed", "3"].includes(status)) return false;

          const cleanTicketId = cleanNotificationId(rawId);
          const cleanMappedTicketId = cleanNotificationId(ticket.Ticket_Id);
          if (
            (cleanTicketId && scheduledTicketIds.has(cleanTicketId)) ||
            (cleanMappedTicketId && scheduledTicketIds.has(cleanMappedTicketId))
          ) {
            return isUserInTicketTargetCompany(ticket, compParam, undefined, user);
          }

          const assignedEmpIds = getAssignedUserIds(ticket);
          const isStaffDirectlyAssigned = assignedEmpIds.length > 0 && !isDefaultAdminResponder(ticket);

          if (status.includes("change request") || status === "pending closure" || status === "closure requested") {
            return isUserInTicketTargetCompany(ticket, compParam, undefined, user);
          }

          const isTargetCompanyAdmin = isUserInTicketTargetCompany(ticket, compParam, undefined, user);
          if (!isTargetCompanyAdmin) return false;

          if (!ticket.T_Sch_Id) {
            return ALLOWED_NOTIFICATION_STATUSES.includes(status);
          }

          if (isStaffDirectlyAssigned) {
            return ALLOWED_NOTIFICATION_STATUSES.includes(status);
          }

          return ALLOWED_NOTIFICATION_STATUSES.includes(status);
        });

        const mapped: NotificationItem[] = activeTickets.map((ticket: any) => {
          const rawId = String(ticket.Id || ticket.id || ticket.TicketId || "");
          const uniqueKey = ticket.T_Sch_Id ? `${ticket.Id || ticket.id || ticket.TicketId}_${ticket.T_Sch_Id}` : rawId;
          const cleanId = cleanNotificationId(rawId);
          const cleanMappedTicketId = cleanNotificationId(ticket.Ticket_Id);
          const cleanUniqueId = cleanNotificationId(uniqueKey);
          const statusLower = String(ticket.Status || ticket.status || "").trim().toLowerCase();
          const isRead = Boolean(
            (cleanId && readIds.has(cleanId)) ||
            (cleanUniqueId && readIds.has(cleanUniqueId)) ||
            (cleanId && scheduledTicketIds.has(cleanId)) ||
            (cleanMappedTicketId && scheduledTicketIds.has(cleanMappedTicketId)) ||
            SCHEDULED_OR_IN_PROGRESS_STATUSES.includes(statusLower)
          );

          const priorityLower = String(ticket.Priority || ticket.ReqPriority || "").toLowerCase();
          const category: NotificationItem["category"] =
            priorityLower === "high" || priorityLower === "critical" || priorityLower === "emergency" ? "alert" :
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

          return {
            id: uniqueKey,
            title: ticket.Subject || ticket.subject || `Ticket #${ticket.Id || ticket.id || ticket.TicketId}`,
            message: ticket.Description || ticket.description || "No Description",
            time: getRelativeTime(ticket.Created_At || ticket.createdAt),
            category,
            isRead,
            important: priorityLower === "high" || priorityLower === "critical" || priorityLower === "emergency",
            ticketCode: `TCK-${String(ticket.Id || ticket.id || ticket.TicketId || "").replace(/\D/g, "").padStart(4, "0")}`,
            subject: ticket.Subject || ticket.subject || "N/A",
            customer: ticket.Created_By_Name || ticket.CustomerName || "N/A",
            From_Company_Name: ticket.From_Company_Name || ticket.Organisation || "N/A",
            categoryName: ticket.Category_Name || ticket.Category || "N/A",
            priority: ticket.Priority || ticket.ReqPriority || "Low",
            status: ticket.Status || ticket.status || "New",
            createdDate: formatDate(ticket.Created_At || ticket.createdAt),
            description: ticket.Description || ticket.description || "No Description",
            imageUrl: extractTicketAttachmentUrl(ticket),
            estSchStartDate: formatDate(ticket.Est_Sch_Start_Date || ticket.estSchStartDate),
            estSchEndDate: formatDate(ticket.Est_Sch_End_Date || ticket.estSchEndDate),
            T_Sch_Id: ticket.T_Sch_Id ? String(ticket.T_Sch_Id) : undefined,
            Employee_Involved_Id: ticket.Employee_Involved_Id ? String(ticket.Employee_Involved_Id) : undefined,
            ticketId: ticket.Id ? String(ticket.Id) : ticket.Ticket_Id ? String(ticket.Ticket_Id) : undefined,
            Ticket_Id: ticket.Ticket_Id || ticket.Id || ticket.TicketId,
            From_CompanyId: ticket.From_CompanyId ? String(ticket.From_CompanyId) : undefined,
            To_CompanyId: ticket.To_CompanyId ? String(ticket.To_CompanyId) : undefined,
            rawEstSchStartDate: ticket.Est_Sch_Start_Date || undefined,
            rawEstSchEndDate: ticket.Est_Sch_End_Date || undefined,
            involvedUserName: resolveInvolvedUserName(ticket),
          };
        });

        if (requestId === latestRequest.current) {
          setNotifications(mapped);
        }
      } else {
        const authorizedTickets = list.filter((t: any) =>
          isTicketAuthorizedForCompany(t, compParam, user?.Company_Name)
        );
        const ticketMap = new Map<string, any>();
        authorizedTickets.forEach((t: any) => {
          const id = String(t.Id || t.id || t.TicketId);
          ticketMap.set(id, t);
        });

        const userTickets = Array.from(ticketMap.values()).filter((ticket: any) => {
          const rawId = String(ticket.Id || ticket.id || ticket.TicketId || "");
          const uniqueKey = ticket.T_Sch_Id ? `${ticket.Id || ticket.id || ticket.TicketId}_${ticket.T_Sch_Id}` : rawId;
          if (localDeletedIds.includes(uniqueKey) || localDeletedIds.includes(rawId)) return false;

          const status = String(ticket.Status || ticket.status || "").trim().toLowerCase();
          if (["closed", "resolved", "completed", "3"].includes(status)) return false;

          const assignedEmpIds = getAssignedUserIds(ticket);
          const isAssigned =
            isTicketAssignedToUser(ticket, user, userParam) ||
            Boolean(currentEmpId && assignedEmpIds.includes(currentEmpId));
          const cleanTicketId = cleanNotificationId(rawId);
          const cleanMappedTicketId = cleanNotificationId(ticket.Ticket_Id);
          if (
            isAssigned &&
            ((cleanTicketId && scheduledTicketIds.has(cleanTicketId)) ||
              (cleanMappedTicketId && scheduledTicketIds.has(cleanMappedTicketId)))
          ) {
            return true;
          }
          const isStaffDirectlyAssigned = assignedEmpIds.length > 0 && !isDefaultAdminResponder(ticket);

          if (!ticket.T_Sch_Id) {
            return (
              isAssigned &&
              !status.includes("change request") &&
              ALLOWED_NOTIFICATION_STATUSES.includes(status)
            );
          }

          return (
            isAssigned &&
            !status.includes("change request") &&
            (isStaffDirectlyAssigned ||
              Boolean(ticket.Admin_Acknowledged_At) ||
              SCHEDULED_OR_IN_PROGRESS_STATUSES.includes(status) ||
              hasUserAcknowledgedTicket(ticket, user, userParam)) &&
            ALLOWED_NOTIFICATION_STATUSES.includes(status)
          );
        });

        const mapped: NotificationItem[] = userTickets.map((ticket: any) => {
          const rawId = String(ticket.Id || ticket.id || ticket.TicketId || "");
          const uniqueKey = ticket.T_Sch_Id ? `${ticket.Id || ticket.id || ticket.TicketId}_${ticket.T_Sch_Id}` : rawId;
          const cleanId = cleanNotificationId(rawId);
          const cleanMappedTicketId = cleanNotificationId(ticket.Ticket_Id);
          const cleanUniqueId = cleanNotificationId(uniqueKey);
          const statusLower = String(ticket.Status || ticket.status || "").trim().toLowerCase();
          const isRead = Boolean(
            (cleanId && readIds.has(cleanId)) ||
            (cleanUniqueId && readIds.has(cleanUniqueId)) ||
            (cleanId && scheduledTicketIds.has(cleanId)) ||
            (cleanMappedTicketId && scheduledTicketIds.has(cleanMappedTicketId)) ||
            SCHEDULED_OR_IN_PROGRESS_STATUSES.includes(statusLower)
          );

          const priorityLower = String(ticket.Priority || ticket.ReqPriority || "").toLowerCase();
          const category: NotificationItem["category"] =
            priorityLower === "high" || priorityLower === "critical" || priorityLower === "emergency" ? "alert" :
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

          return {
            id: uniqueKey,
            title: ticket.Subject || ticket.subject || `Ticket #${ticket.Id || ticket.id || ticket.TicketId}`,
            message: ticket.Description || ticket.description || "No Description",
            time: getRelativeTime(ticket.Created_At || ticket.createdAt),
            category,
            isRead,
            important: priorityLower === "high" || priorityLower === "critical" || priorityLower === "emergency",
            ticketCode: `TCK-${String(ticket.Id || ticket.id || ticket.TicketId || "").replace(/\D/g, "").padStart(4, "0")}`,
            subject: ticket.Subject || ticket.subject || "N/A",
            customer: ticket.Created_By_Name || ticket.CustomerName || "N/A",
            From_Company_Name: ticket.From_Company_Name || ticket.Organisation || "N/A",
            categoryName: ticket.Category_Name || ticket.Category || "N/A",
            priority: ticket.Priority || ticket.ReqPriority || "Low",
            status: ticket.Status || ticket.status || "New",
            createdDate: formatDate(ticket.Created_At || ticket.createdAt),
            description: ticket.Description || ticket.description || "No Description",
            imageUrl: extractTicketAttachmentUrl(ticket),
            estSchStartDate: formatDate(ticket.Est_Sch_Start_Date || ticket.estSchStartDate),
            estSchEndDate: formatDate(ticket.Est_Sch_End_Date || ticket.estSchEndDate),
            T_Sch_Id: ticket.T_Sch_Id ? String(ticket.T_Sch_Id) : undefined,
            Employee_Involved_Id: ticket.Employee_Involved_Id ? String(ticket.Employee_Involved_Id) : undefined,
            ticketId: ticket.Id ? String(ticket.Id) : ticket.Ticket_Id ? String(ticket.Ticket_Id) : undefined,
            Ticket_Id: ticket.Ticket_Id || ticket.Id || ticket.TicketId,
            From_CompanyId: ticket.From_CompanyId ? String(ticket.From_CompanyId) : undefined,
            To_CompanyId: ticket.To_CompanyId ? String(ticket.To_CompanyId) : undefined,
            rawEstSchStartDate: ticket.Est_Sch_Start_Date || undefined,
            rawEstSchEndDate: ticket.Est_Sch_End_Date || undefined,
            involvedUserName: resolveInvolvedUserName(ticket),
          };
        });

        if (requestId === latestRequest.current) {
          setNotifications(mapped);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false);
      }
    }
  }, [currentUserId, companyId, isCompanyAdmin, parseData, user, selectedUserId]);

  useEffect(() => {
    let running = false;
    let refreshRequested = false;

    const refresh = async (queueUpdate = false, silent = false): Promise<void> => {
      if (document.visibilityState === "hidden") return;
      if (running) {
        refreshRequested ||= queueUpdate;
        return;
      }
      running = true;
      try {
        await fetchTickets(silent);
      } finally {
        running = false;
        if (refreshRequested) {
          refreshRequested = false;
          void refresh(false, true);
        }
      }
    };

    void refresh(false, false);
    const interval = window.setInterval(() => {
      void refresh(false, true);
    }, 15000);

    const handleUpdate = () => {
      void refresh(true, true);
    };
    const handleVisible = () => {
      if (document.visibilityState === "visible") handleUpdate();
    };

    window.addEventListener("notifications_updated", handleUpdate);
    window.addEventListener("notification-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    window.addEventListener("online", handleUpdate);
    window.addEventListener("tickets-synced", handleUpdate);
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("notifications_updated", handleUpdate);
      window.removeEventListener("notification-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      window.removeEventListener("online", handleUpdate);
      window.removeEventListener("tickets-synced", handleUpdate);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [fetchTickets]);

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

  const deleteNotification = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    const userId = currentUserId || user?.Global_User_ID || user?.id || "";
    const compId = companyId || user?.Company_Id || "";
    if (userId) {
      markNotificationsAsRead([id], compId, userId);
      if (isCompanyAdmin && selectedUserId !== "self") {
        markNotificationsAsRead([id], compId, selectedUserId);
      }
      try {
        await fetchLink({
          address: "notifications/dismiss",
          method: "POST",
          bodyData: { notificationId: id, userId },
        }).catch(() => {});
      } catch {}
      const localDeletedIdsKey = `deleted_notifications_${userId}`;
      const localDeletedIds: string[] = JSON.parse(localStorage.getItem(localDeletedIdsKey) || "[]");
      if (!localDeletedIds.includes(id)) {
        localDeletedIds.push(id);
        localStorage.setItem(localDeletedIdsKey, JSON.stringify(localDeletedIds));
      }
      const manualDeletedKey = `manually_deleted_notifications_${userId}`;
      const manualDeletedIds: string[] = JSON.parse(localStorage.getItem(manualDeletedKey) || "[]");
      if (!manualDeletedIds.includes(id)) {
        manualDeletedIds.push(id);
        localStorage.setItem(manualDeletedKey, JSON.stringify(manualDeletedIds));
      }
      window.dispatchEvent(new Event("notification-update"));
      window.dispatchEvent(new Event("notifications_updated"));
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    const userId = currentUserId || user?.Global_User_ID || user?.id || "";
    const compId = companyId || user?.Company_Id || "";
    if (userId) {
      const ids = notifications.map((n) => n.id);
      markNotificationsAsRead(ids, compId, userId);
      if (isCompanyAdmin && selectedUserId !== "self") {
        markNotificationsAsRead(ids, compId, selectedUserId);
      }
      try {
        await fetchLink({
          address: "notifications/read-all",
          method: "POST",
          bodyData: { userId },
        }).catch(() => {});
      } catch {}
    }
  };

  const deleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications?")) return;
    setNotifications([]);
    const userId = currentUserId || user?.Global_User_ID || user?.id || "";
    const compId = companyId || user?.Company_Id || "";
    if (userId) {
      const ids = notifications.map((n) => n.id);
      markNotificationsAsRead(ids, compId, userId);
      if (isCompanyAdmin && selectedUserId !== "self") {
        markNotificationsAsRead(ids, compId, selectedUserId);
      }
      try {
        await fetchLink({
          address: "notifications/dismiss-all",
          method: "POST",
          bodyData: { userId },
        }).catch(() => {});
      } catch {}
      const localDeletedIdsKey = `deleted_notifications_${userId}`;
      const localDeletedIds: string[] = JSON.parse(localStorage.getItem(localDeletedIdsKey) || "[]");
      notifications.forEach((notif) => {
        if (!localDeletedIds.includes(notif.id)) {
          localDeletedIds.push(notif.id);
        }
      });
      localStorage.setItem(localDeletedIdsKey, JSON.stringify(localDeletedIds));
      const manualDeletedKey = `manually_deleted_notifications_${userId}`;
      const manualDeletedIds: string[] = JSON.parse(localStorage.getItem(manualDeletedKey) || "[]");
      notifications.forEach((notif) => {
        if (!manualDeletedIds.includes(notif.id)) {
          manualDeletedIds.push(notif.id);
        }
      });
      localStorage.setItem(manualDeletedKey, JSON.stringify(manualDeletedIds));
      window.dispatchEvent(new Event("notification-update"));
      window.dispatchEvent(new Event("notifications_updated"));
    }
  };

  const priorityFilteredNotifications = useMemo(() => {
    if (!isCompanyAdmin || selectedPriority === "all") return notifications;
    const target = selectedPriority.trim().toLowerCase();
    return notifications.filter(
      (notif) => String(notif.priority || "").trim().toLowerCase() === target
    );
  }, [isCompanyAdmin, notifications, selectedPriority]);

  const filteredNotifications = priorityFilteredNotifications.filter((notif) => {
    if (activeTab === 1) return !notif.isRead; // Unread
    if (activeTab === 2) return notif.isRead; // Read
    return true; // All
  });

  const unreadCount = priorityFilteredNotifications.filter((n) => !n.isRead).length;
  const readCount = priorityFilteredNotifications.filter((n) => n.isRead).length;

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
            </Box>
          </Box>

          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            {isCompanyAdmin && (
              <>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="notification-user-select-label" sx={{ color: "#b9925f" }}>
                    User
                  </InputLabel>
                  <Select
                    labelId="notification-user-select-label"
                    label="User"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(String(e.target.value))}
                    sx={{
                      borderRadius: 2,
                      fontSize: "0.85rem",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0c8ab" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b9925f" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#b9925f" },
                    }}
                  >
                    <MenuItem value="self">
                      My Tickets ({String(user?.Name || user?.name || "Admin")})
                    </MenuItem>
                    {usersList.map((u) => (
                      <MenuItem key={u.UserId} value={String(u.UserId)}>
                        {u.Name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="notification-priority-select-label" sx={{ color: "#b9925f" }}>
                    Priority
                  </InputLabel>
                  <Select
                    labelId="notification-priority-select-label"
                    label="Priority"
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(String(e.target.value))}
                    sx={{
                      borderRadius: 2,
                      fontSize: "0.85rem",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0c8ab" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b9925f" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#b9925f" },
                    }}
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
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
                label={priorityFilteredNotifications.length}
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
              Read
              <Chip
                label={readCount}
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
                        {notif.isRead && (
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
                              {isVideoUrl(notif.imageUrl) ? (
                                <Avatar
                                  sx={{ bgcolor: getCategoryColor(notif.category), width: 40, height: 40, overflow: "hidden" }}
                                >
                                  <video
                                    src={notif.imageUrl}
                                    muted
                                    preload="metadata"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                </Avatar>
                              ) : isAudioUrl(notif.imageUrl) || isDocumentUrl(notif.imageUrl) ? (
                                <Avatar
                                  sx={{ bgcolor: getCategoryColor(notif.category), width: 40, height: 40 }}
                                >
                                  {getCategoryIcon(notif.category)}
                                </Avatar>
                              ) : (
                                <Avatar
                                  src={notif.imageUrl}
                                  sx={{ bgcolor: getCategoryColor(notif.category), width: 40, height: 40 }}
                                >
                                  {getCategoryIcon(notif.category)}
                                </Avatar>
                              )}
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
                      slotProps={{
                        primary: { component: "div" },
                        secondary: { component: "div" },
                      }}
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography
                            variant="subtitle2"
                            fontWeight={notif.isRead ? 600 : 800}
                            color="#4a3b2c"
                          >
                            {notif.title}
                          </Typography>
                          {notif.priority && (
                            <Chip
                              label={notif.priority}
                              size="small"
                              color={
                                ["high", "critical", "emergency"].includes(
                                  String(notif.priority).trim().toLowerCase()
                                )
                                  ? "error"
                                  : String(notif.priority).trim().toLowerCase() === "medium"
                                  ? "warning"
                                  : "info"
                              }
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
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
        onConfirmSuccess={async () => {
          if (selectedTicket) {
            const targetId = selectedTicket.id;
            const targetTicketId = selectedTicket.ticketId ? String(selectedTicket.ticketId) : targetId;
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.id === targetId || String(notif.ticketId || notif.id) === targetTicketId
                  ? { ...notif, isRead: true, status: "in progress" }
                  : notif
              )
            );
            const userId = currentUserId || user?.Global_User_ID || user?.id || "";
            const compId = companyId || user?.Company_Id || "";
            if (userId) {
              markNotificationsAsRead([targetId, targetTicketId], compId, userId);
              if (isCompanyAdmin && selectedUserId !== "self") {
                markNotificationsAsRead([targetId, targetTicketId], compId, selectedUserId);
              }
              try {
                await fetchLink({
                  address: "notifications/read",
                  method: "POST",
                  bodyData: { notificationId: targetId, userId },
                }).catch(() => {});
              } catch {}
              window.dispatchEvent(new Event("notification-update"));
              window.dispatchEvent(new Event("notifications_updated"));
            }
          }
          await fetchTickets();
        }}
      />
    </Box>
  );
};

export default NotificationScreen;
