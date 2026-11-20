/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../../auth/authContext";
import { fetchLink } from "../../Components/customFetch";
import { cleanNotificationId, getReadNotificationIds } from "./notificationStorage";
import {
  isUserAdminOrDev,
  isTicketAssignedToUser,
  hasUserAcknowledgedTicket,
  isTicketAuthorizedForCompany,
  getAssignedUserIds,
} from "./ticketNotificationHelpers";

export const useNotificationCount = (): number => {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);
  const latestRequest = useRef(0);

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

  const fetchCount = useCallback(async (signal?: AbortSignal) => {
    const requestId = ++latestRequest.current;
    if (!currentUserId) {
      setCount(0);
      return;
    }

    try {
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

      const queryParams = new URLSearchParams({
        companyId: compParam,
        userId: userParam,
        Userid: userParam,
        User_Id: userParam,
        userTypeId: userTypeIdParam,
        usertypeid: userTypeIdParam,
        ...(isCompanyAdmin ? { isAdmin: "true" } : { User_Id: userParam }),
      });

      let list: any[] = [];
      try {
        const mastersRes = await fetchLink({
          address: `masters/tickets?${queryParams.toString()}`,
          method: "GET",
          autoHeaders: true,
          headers: { Db: compParam },
          others: { signal } as any,
        });
        if (mastersRes) {
          list = Array.isArray(mastersRes.data)
            ? mastersRes.data
            : Array.isArray(mastersRes)
            ? (mastersRes as any[])
            : [];
        }
      } catch {
        try {
          const createTicketRes = await fetchLink({
            address: `createTicket/list?${queryParams.toString()}`,
            method: "GET",
            autoHeaders: true,
            headers: { Db: compParam },
            others: { signal } as any,
          });
          if (createTicketRes) {
            list = Array.isArray(createTicketRes.data)
              ? createTicketRes.data
              : Array.isArray(createTicketRes)
              ? (createTicketRes as any[])
              : [];
          }
        } catch {
          list = [];
        }
      }

      if (signal?.aborted || requestId !== latestRequest.current) return;

      const readIds = getReadNotificationIds(compParam, userParam);

      if (isCompanyAdmin) {
        const allCompanyTickets = list.filter((t: any) =>
          isTicketAuthorizedForCompany(t, compParam, user?.Company_Name)
        );

        const ticketMap = new Map<string, any>();
        allCompanyTickets.forEach((t: any) => {
          const id = String(t.Id || t.id || t.TicketId);
          ticketMap.set(id, t);
        });

        const pending = Array.from(ticketMap.values()).filter((ticket: any) => {
          const rawId = String(ticket.Id || ticket.id || ticket.TicketId || "");
          const cleanId = cleanNotificationId(rawId);
          if (cleanId && readIds.has(cleanId)) return false;

          const status = String(ticket.Status || ticket.status || "").trim().toLowerCase();
          if (["closed", "resolved", "completed", "3"].includes(status)) return false;
          const targetId = ticket.To_CompanyId ?? ticket.to_CompanyId ?? ticket.Repondercompany ?? ticket.repondercompany;
          if (targetId && String(targetId).trim() !== "" && String(targetId).trim() !== String(compParam)) {
            return false;
          }
          if (status.includes("change request") || status === "pending closure" || status === "closure requested") return true;

          const assignedEmpIds = getAssignedUserIds(ticket);
          const isStaffDirectlyAssigned = assignedEmpIds.length > 0;
          if (isStaffDirectlyAssigned) {
            return ["new", "open", "assigned", "1", "2"].includes(status);
          }

          return !ticket.Admin_Acknowledged_At && ["new", "open", "assigned", "1", "2"].includes(status);
        });

        if (!signal?.aborted && requestId === latestRequest.current) setCount(pending.length);
      } else {
        const pending = list
          .filter((t: any) => isTicketAuthorizedForCompany(t, compParam, user?.Company_Name))
          .filter((ticket: any) => {
            const rawId = String(ticket.Id || ticket.id || ticket.TicketId || "");
            const cleanId = cleanNotificationId(rawId);
            if (cleanId && readIds.has(cleanId)) return false;

            const status = String(ticket.Status || ticket.status || "").trim().toLowerCase();
            const isAssigned = isTicketAssignedToUser(ticket, user, userParam);
            const assignedEmpIds = getAssignedUserIds(ticket);
            const isStaffDirectlyAssigned = assignedEmpIds.length > 0;

            return (
              isAssigned &&
              !status.includes("change request") &&
              (isStaffDirectlyAssigned || Boolean(ticket.Admin_Acknowledged_At)) &&
              !hasUserAcknowledgedTicket(ticket, user, userParam) &&
              ["new", "open", "assigned", "1", "2"].includes(status)
            );
          });

        if (!signal?.aborted && requestId === latestRequest.current) setCount(pending.length);
      }
    } catch {
      // Ignore background notification check error
    }
  }, [currentUserId, companyId, isCompanyAdmin, parseData, user]);

  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    let refreshRequested = false;
    const refresh = async (queueUpdate = false): Promise<void> => {
      if (controller.signal.aborted || document.visibilityState === "hidden") return;
      if (running) {
        refreshRequested ||= queueUpdate;
        return;
      }
      running = true;
      try {
        await fetchCount(controller.signal);
      } finally {
        running = false;
        if (refreshRequested) {
          refreshRequested = false;
          void refresh();
        }
      }
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 5000);
    const handleUpdate = () => { void refresh(true); };
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
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("notifications_updated", handleUpdate);
      window.removeEventListener("notification-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      window.removeEventListener("online", handleUpdate);
      window.removeEventListener("tickets-synced", handleUpdate);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [fetchCount]);

  return count;
};

