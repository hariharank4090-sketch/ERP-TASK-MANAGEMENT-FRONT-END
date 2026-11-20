/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { cleanNotificationId } from "./notificationStorage";

export const isUserAdminOrDev = (user?: any): boolean => {
  if (user?.UserTypeId !== undefined && user?.UserTypeId !== null) {
    const num = Number(user.UserTypeId);
    if (num === 0 || num === 1) return true;
  }
  try {
    const storedTypeId = String(localStorage.getItem("USERTYPE_ID") || "").trim();
    if (storedTypeId === "0" || storedTypeId === "1") return true;
    const upper = storedTypeId.toUpperCase();
    if (upper === "ADMIN" || upper === "DEVELOPER" || upper === "DEV") return true;
  } catch {}
  try {
    const rawStored = localStorage.getItem("user");
    if (rawStored) {
      const parsed = JSON.parse(rawStored);
      if (parsed?.UserTypeId !== undefined && parsed?.UserTypeId !== null) {
        const pId = Number(parsed.UserTypeId);
        if (pId === 0 || pId === 1) return true;
      }
    }
  } catch {}
  const rawUserType = user?.UserType || localStorage.getItem("USER_TYPE");
  if (rawUserType) {
    const typeStr = String(rawUserType).trim().toLowerCase();
    if (["administrator", "admin", "developer", "dev"].includes(typeStr)) return true;
  }
  const userName = String(user?.Name || user?.name || "").trim().toLowerCase();
  if (userName === "admin" || userName === "developer") return true;
  return false;
};

export const getUserCandidateIds = (user?: any, fallbackId?: string | number | null): Set<string> => {
  const ids = new Set<string>();
  const addVal = (v: unknown) => {
    if (v !== undefined && v !== null && String(v).trim() !== "" && String(v) !== "0" && String(v) !== "NaN") {
      ids.add(String(v).trim());
    }
  };

  addVal(user?.Global_User_Id);
  addVal(user?.GlobalUserID);
  addVal(user?.Global_User_ID);
  addVal(user?.id);
  addVal(user?.Local_User_ID);
  addVal(user?.UserId);
  addVal(user?.Id);
  addVal(fallbackId);

  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const p = JSON.parse(raw);
      addVal(p.Global_User_Id);
      addVal(p.GlobalUserID);
      addVal(p.Global_User_ID);
      addVal(p.id);
      addVal(p.Local_User_ID);
      addVal(p.UserId);
      addVal(p.Id);
    }
  } catch {}
  return ids;
};

export const getAssignedUserIds = (ticket: any): number[] => {
  if (!ticket) return [];
  const ids = new Set<number>();
  const addId = (val: unknown) => {
    if (val === undefined || val === null) return;
    const n = Number(val);
    if (!Number.isNaN(n) && n > 0) ids.add(n);
  };

  addId(ticket.Employee_Involved_Id);
  addId(ticket.Assigned_Employee_Id);
  addId(ticket.Employee_Id);
  addId(ticket.employee_id);
  addId(ticket.Responder_Id);
  addId(ticket.responderId);

  if (Array.isArray(ticket.Employees)) {
    for (const e of ticket.Employees) {
      if (typeof e === "number" || typeof e === "string") {
        addId(e);
      } else if (e && typeof e === "object") {
        addId((e as any).Employee_Involved_Id ?? (e as any).Employee_Id ?? (e as any).id);
      }
    }
  }

  if (Array.isArray(ticket.Allocation) && ticket.Allocation.length > 0) {
    const alloc = ticket.Allocation[0];
    if (Array.isArray(alloc?.Employees)) {
      for (const e of alloc.Employees) {
        if (e && typeof e === "object") {
          addId((e as any).Employee_Involved_Id ?? (e as any).Employee_Id);
        }
      }
    }
  }

  return Array.from(ids);
};

export const isTicketAssignedToUser = (
  ticket: any,
  user?: any,
  fallbackId?: string | number | null
): boolean => {
  if (!ticket) return false;
  const candidateIds = getUserCandidateIds(user, fallbackId);
  const allocIds = [
    ticket.Employee_Involved_Id,
    ticket.Assigned_Employee_Id,
    ticket.Employee_Id,
    ticket.employee_id,
    ticket.Responder_Id,
    ticket.responderId,
  ];

  for (const aId of allocIds) {
    if (aId !== undefined && aId !== null && candidateIds.has(String(aId).trim())) {
      return true;
    }
  }

  if (Array.isArray(ticket.Employees)) {
    for (const e of ticket.Employees) {
      if (e !== undefined && e !== null && candidateIds.has(String(e).trim())) {
        return true;
      }
    }
  }

  const userNames = [user?.Name, user?.uniqueName, user?.UserName, user?.name]
    .filter((n): n is string => typeof n === "string" && n.trim() !== "")
    .map((n) => n.trim().toLowerCase());

  const ticketNames = [
    ticket.Repondername,
    ticket.repondername,
    ticket.Assigned_To_Name,
    ticket.assignedTo,
    ticket.Responder_Name,
    ticket.ResponderName,
  ]
    .filter((n): n is string => typeof n === "string" && n.trim() !== "")
    .map((n) => n.trim().toLowerCase());

  for (const tName of ticketNames) {
    for (const uName of userNames) {
      const parts = tName.split(",").map((s) => s.trim().toLowerCase());
      if (tName === uName || parts.includes(uName)) return true;
    }
  }

  if (ticket.__source === "assigned" || ticket.__source === "both") {
    return true;
  }

  return false;
};

export const hasUserAcknowledgedTicket = (
  ticket: any,
  user?: any,
  fallbackId?: string | number | null
): boolean => {
  if (!ticket) return false;
  const candidateIds = getUserCandidateIds(user, fallbackId);

  // 1. LocalStorage acknowledgment cache
  const cleanId = cleanNotificationId(ticket.id || ticket.TicketId || ticket.Id);
  try {
    const stored = localStorage.getItem(`TICKET_ACK_${cleanId}`);
    if (stored) {
      const ackUserIds = JSON.parse(stored);
      if (Array.isArray(ackUserIds)) {
        for (const cId of candidateIds) {
          if (ackUserIds.includes(Number(cId)) || ackUserIds.includes(String(cId))) {
            return true;
          }
        }
      }
    }
  } catch {}

  // 2. Allocation array with Ack_Status
  if (Array.isArray(ticket.Allocation) && ticket.Allocation.length > 0) {
    const alloc = ticket.Allocation[0];
    if (Array.isArray(alloc?.Employees)) {
      for (const emp of alloc.Employees) {
        if (emp && typeof emp === "object") {
          const empId = String((emp as any).Employee_Involved_Id ?? (emp as any).Employee_Id ?? "").trim();
          const ackStatus = (emp as any).Ack_Status;
          if (candidateIds.has(empId) && (Number(ackStatus) === 1 || String(ackStatus) === "1")) {
            return true;
          }
        }
      }
    }
  }

  // 3. Ack_Status directly on ticket
  if (ticket.Ack_Status !== undefined && ticket.Ack_Status !== null) {
    const ackStatusNum = Number(ticket.Ack_Status);
    if (ackStatusNum === 1 || String(ticket.Ack_Status) === "1") {
      const allocEmpId = ticket.Employee_Involved_Id ?? ticket.Assigned_Employee_Id;
      if (allocEmpId && candidateIds.has(String(allocEmpId).trim())) {
        return true;
      }
    }
  }

  // 4. Acknowledged_Employees / Acknowledged_Users array
  const ackList = ticket.Acknowledged_Employees || ticket.Acknowledged_Users || ticket.Acknowledged_By_List;
  if (Array.isArray(ackList)) {
    for (const id of ackList) {
      if (candidateIds.has(String(id).trim())) {
        return true;
      }
    }
  }

  // 5. If single user assigned and ticket.Acknowledged_At is set
  const assignedIds = getAssignedUserIds(ticket);
  if (assignedIds.length <= 1 && ticket.Acknowledged_At) {
    if (ticket.Acknowledged_By) {
      return candidateIds.has(String(ticket.Acknowledged_By).trim());
    }
    return true;
  }

  // 6. If ticket status has reached "In Progress", "Closed", or "Resolved"
  const status = String(ticket.Status || ticket.status || "").trim().toLowerCase();
  if (["in progress", "resolved", "closed", "completed", "3"].includes(status)) {
    return true;
  }

  return false;
};

const getTicketOriginatingCompanyId = (ticket: any): string => {
  if (!ticket) return "";
  const val =
    ticket.From_CompanyId ??
    ticket.from_CompanyId ??
    ticket.createdcompany ??
    ticket.Company_Id ??
    ticket.CompanyId ??
    "";
  return String(val).trim();
};

const getTicketReceivingCompanyId = (ticket: any): string => {
  if (!ticket) return "";
  const val =
    ticket.To_CompanyId ??
    ticket.to_CompanyId ??
    ticket.Repondercompany ??
    ticket.repondercompany ??
    "";
  return String(val).trim();
};

export const isTicketInternal = (ticket: any): boolean => {
  if (!ticket) return false;
  const rawType = String(ticket.Ticket_Type ?? ticket.ticket_type ?? ticket.TicketType ?? "").trim().toLowerCase();
  if (rawType === "internal") return true;
  if (rawType === "external") return false;

  const flag = String(ticket.Status_Flag ?? "").trim().toLowerCase();
  if (flag === "received" || flag === "synced" || flag === "external") {
    return false;
  }

  const from = getTicketOriginatingCompanyId(ticket);
  const to = getTicketReceivingCompanyId(ticket);

  if (from && to && from === to) return true;
  if (from && (!to || to === "0" || to === from)) return true;

  return !to || to === from;
};

export const isTicketAuthorizedForCompany = (
  ticket: any,
  activeCompanyId?: number | string | null,
  activeCompanyName?: string | null
): boolean => {
  if (!ticket) return false;
  if (!activeCompanyId) return true;

  const activeStr = String(activeCompanyId).trim();
  const activeNameLower = activeCompanyName ? activeCompanyName.trim().toLowerCase() : "";

  const from = getTicketOriginatingCompanyId(ticket);
  const to = getTicketReceivingCompanyId(ticket);

  if (!from && !to && !ticket.Organisation) {
    return true;
  }

  const statusFlag = String(ticket.Status_Flag ?? "").trim().toLowerCase();
  const isReceivedCopy = statusFlag === "received";

  const createdComp = String(ticket.createdcompany ?? ticket.Createdcompany ?? "").trim();
  const isOriginating = isReceivedCopy
    ? Boolean(createdComp && createdComp === activeStr)
    : Boolean(from && from === activeStr);

  if (isOriginating) {
    return true;
  }

  if (isTicketInternal(ticket)) {
    return false;
  }

  if (isReceivedCopy) {
    if (createdComp && to && createdComp === to) {
      return false;
    }
    const org = ticket.Organisation ? String(ticket.Organisation).trim().toLowerCase() : "";
    const resp = ticket.Repondercompany ? String(ticket.Repondercompany).trim().toLowerCase() : "";
    if (org && resp && org === resp && org !== activeNameLower) {
      return false;
    }
  }

  if (to && to === activeStr) return true;
  if (ticket.Repondercompany && String(ticket.Repondercompany).trim() === activeStr) return true;
  if (activeNameLower && ticket.Repondername && String(ticket.Repondername).trim().toLowerCase() === activeNameLower) return true;

  return false;
};

export const isDefaultAdminResponder = (ticket: any): boolean => {
  if (!ticket) return false;
  const names = String(ticket.Repondername || ticket.Assigned_To_Name || ticket.assignedTo || "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  return names.length > 0 && names.every((name) => name === "admin");
};

export const isUserInTicketTargetCompany = (
  ticket: any,
  activeCompanyId?: number | string | null,
  companyOptions?: any[],
  user?: any
): boolean => {
  if (!ticket || !activeCompanyId) return false;
  const activeStr = String(activeCompanyId).trim();

  let activeCompName = user?.Company_Name?.trim().toLowerCase();
  if (!activeCompName && companyOptions && companyOptions.length > 0) {
    const activeComp = companyOptions.find(
      (c) => String(c.Global_Comp_Id || c.Id) === activeStr
    );
    activeCompName = activeComp?.Company_Name?.trim().toLowerCase();
  }
  if (!activeCompName) {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        let storedUser: any = null;
        try {
          storedUser = JSON.parse(rawUser);
        } catch {
          storedUser = JSON.parse(atob(rawUser));
        }
        activeCompName = (storedUser?.Company_Name || storedUser?.companyName || "").trim().toLowerCase();
      }
      if (!activeCompName) {
        const rawCompanies = localStorage.getItem("companies");
        const storedCompanies = rawCompanies ? JSON.parse(rawCompanies) : [];
        if (Array.isArray(storedCompanies)) {
          const found = storedCompanies.find(
            (c: any) => String(c.id || c.Global_Comp_Id || c.Id) === activeStr
          );
          activeCompName = (found?.name || found?.Company_Name || "").trim().toLowerCase();
        }
      }
    } catch {}
  }

  const flag = String(ticket.Status_Flag || "").trim().toLowerCase();
  const localCompanyId = String(ticket.From_CompanyId ?? ticket.from_CompanyId ?? ticket.createdcompany ?? "").trim();
  if (flag === "received") return Boolean(localCompanyId && localCompanyId === activeStr);
  if (flag === "synced" || flag === "external") return false;

  if (ticket.Organisation && activeCompName) {
    const orgName = String(ticket.Organisation).trim().toLowerCase();
    if (orgName !== activeCompName) return false;
  }

  const toCompId = String(ticket.To_CompanyId ?? ticket.to_CompanyId ?? ticket.Repondercompany ?? ticket.repondercompany ?? "").trim();
  const fromCompId = String(ticket.From_CompanyId ?? ticket.from_CompanyId ?? ticket.createdcompany ?? ticket.Company_Id ?? ticket.CompanyId ?? "").trim();

  if (toCompId && fromCompId && toCompId !== fromCompId) {
    if (fromCompId === activeStr && toCompId !== activeStr) {
      return false;
    }
    if (toCompId === activeStr) {
      return true;
    }
  }

  return true;
};

