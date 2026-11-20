/**
 * Utilities for tracking read/cleared notifications per company and user.
 */

const getStorageKey = (companyId?: string | number, userId?: string | number): string => {
  const cId = String(companyId ?? "").trim() || "all";
  const uId = String(userId ?? "").trim() || "all";
  return `READ_NOTIFICATIONS_${cId}_${uId}`;
};

const getLocalStorage = (): Storage | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }
  return null;
};

export const cleanNotificationId = (raw: unknown): string => {
  if (raw === undefined || raw === null) return "";
  const s = String(raw).trim();
  const digits = s.replace(/\D/g, "");
  if (digits) {
    const num = Number(digits);
    if (!Number.isNaN(num) && num > 0) {
      return String(num);
    }
    return digits;
  }
  return s;
};

export const getReadNotificationIds = (
  companyId?: string | number,
  userId?: string | number
): Set<string> => {
  const storage = getLocalStorage();
  const set = new Set<string>();
  if (!storage) return set;

  const cId = String(companyId ?? "").trim() || "all";
  const uId = String(userId ?? "").trim() || "all";

  try {
    const raw = storage.getItem(getStorageKey(cId, uId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.map(cleanNotificationId).filter(Boolean).forEach((id) => set.add(id));
      }
    }
  } catch {
    // Ignore storage parse error
  }

  // Also check legacy key read_notifications_${userId}
  try {
    const rawLegacy = storage.getItem(`read_notifications_${uId}`);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      if (Array.isArray(parsedLegacy)) {
        parsedLegacy.map(cleanNotificationId).filter(Boolean).forEach((id) => set.add(id));
      }
    }
  } catch {
    // Ignore storage parse error
  }

  return set;
};

export const markNotificationsAsRead = (
  ticketIds: (string | number)[],
  companyId?: string | number,
  userId?: string | number
): void => {
  const storage = getLocalStorage();
  if (!storage) return;

  const cId = String(companyId ?? "").trim() || "all";
  const uId = String(userId ?? "").trim() || "all";

  try {
    const existing = getReadNotificationIds(cId, uId);
    for (const id of ticketIds) {
      const cleanId = cleanNotificationId(id);
      if (cleanId) {
        existing.add(cleanId);
      }
    }
    const key = getStorageKey(cId, uId);
    storage.setItem(key, JSON.stringify(Array.from(existing)));

    // Also update legacy key
    const legacyKey = `read_notifications_${uId}`;
    try {
      const rawLegacy = storage.getItem(legacyKey);
      const parsedLegacy: string[] = rawLegacy ? JSON.parse(rawLegacy) : [];
      for (const id of ticketIds) {
        const strId = String(id);
        if (!parsedLegacy.includes(strId)) parsedLegacy.push(strId);
      }
      storage.setItem(legacyKey, JSON.stringify(parsedLegacy));
    // eslint-disable-next-line no-empty
    } catch {}

    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      try {
        const evt = typeof CustomEvent === "function" ? new CustomEvent("notifications_updated") : { type: "notifications_updated" };
        window.dispatchEvent(evt as Event);
      } catch {
        window.dispatchEvent({ type: "notifications_updated" } as Event);
      }
      window.dispatchEvent(new Event("notification-update"));
    }
  } catch {
    // ignore storage errors
  }
};

