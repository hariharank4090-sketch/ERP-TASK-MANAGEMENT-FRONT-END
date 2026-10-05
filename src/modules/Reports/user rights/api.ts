/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'react-toastify';
import { fetchLink } from '../../../Components/customFetch';
import type { RightsParam, UserRightsData, UserMaster } from './variable';


export function extractArrayResponse<T>(res: any): { success: boolean; data: T[] } {
    if (!res) return { success: false, data: [] };

    if (Array.isArray(res)) {
        return { success: true, data: res };
    }

    const isOk = res.success === true || res.status === true || res.status === 'success' || res.status === 200;
    if (isOk && Array.isArray(res.data)) {
        return { success: true, data: res.data };
    }

    if (res.data && Array.isArray(res.data.data)) {
        const innerOk = res.data.success === true || res.data.status === true || res.data.status === 'success';
        if (innerOk) {
            return { success: true, data: res.data.data };
        }
    }

    if (Array.isArray(res.data)) {
        return { success: true, data: res.data };
    }

    return { success: false, data: [] };
}


export const postCheck = async (
    
    paramOrArray: RightsParam | any[],
    Menu_id?: number | (() => void),
    UserId?: number | string | (() => void),
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<{ success: boolean; message?: string }> => {
   
    let body: any;
    let onFn = loadingOn;
    let offFn = loadingOff;

    if (Array.isArray(paramOrArray)) {
        body = paramOrArray;
        if (typeof Menu_id === 'function') onFn = Menu_id;
        if (typeof UserId === 'function') offFn = UserId;
    } else if (typeof Menu_id === 'number') {
        body = {
            MenuId: Menu_id,
            User: Number(UserId),
            ReadRights: (paramOrArray as RightsParam).readRights === true ? 1 : 0,
            AddRights: (paramOrArray as RightsParam).addRights === true ? 1 : 0,
            EditRights: (paramOrArray as RightsParam).editRights === true ? 1 : 0,
            DeleteRights: (paramOrArray as RightsParam).deleteRights === true ? 1 : 0,
            PrintRights: (paramOrArray as RightsParam).printRights === true ? 1 : 0
        };
    } else {
        body = paramOrArray;
    }

    if (onFn) onFn();
    try {
        const res = await fetchLink({
            address: `configuration/appMenu/userRights`,
            method: 'PUT',
            bodyData: body,
            headers: { 'Content-Type': 'application/json' }
        });
        
        let isOk = res && (res.success === true || (res as any).status === true || (res as any).status === 'success' || (res as any).status === 200);
        if (!isOk) {
            // Fallback attempt for userTypeBased if body contains UserTypeId
            const isUserTypePayload = Array.isArray(body) && body.some((item: any) => item?.UserTypeId !== undefined || item?.User_Type_Id !== undefined);
            if (isUserTypePayload) {
                const fallbackRes = await fetchLink({
                    address: `configuration/appMenu/userRights/userTypeBased`,
                    method: 'PUT',
                    bodyData: body,
                    headers: { 'Content-Type': 'application/json' }
                }).catch(() => null);
                if (fallbackRes && (fallbackRes.success === true || (fallbackRes as any).status === true || (fallbackRes as any).status === 'success' || (fallbackRes as any).status === 200)) {
                    isOk = true;
                }
            }
        }

        if (!isOk) {
           
            toast.error((res as any)?.message || 'Failed to update rights');
          
            return { success: false, message: (res as any)?.message };
        }
        return { success: true };
    
    } catch (e: any) {
        console.error("Error posting user rights:", e);
        toast.error("Error saving user rights");
        return { success: false, message: e?.message };
    } finally {
        if (offFn) offFn();
    }
};

export const fetchUserRights = async (
    userId: number | string,
    loadingOn?: () => void,
    loadingOff?: () => void
) => {
    const res = await fetchLink({
        address: `configuration/appMenu/userRights/userBased?UserId=${userId}`,
        loadingOn,
        loadingOff
    });
    return extractArrayResponse<UserRightsData>(res);
};

export const fetchUsersList = async () => {
    const res = await fetchLink({
        address: `masters/users`
    });
    return extractArrayResponse<UserMaster>(res);
};

export const fetchUserTypes = async () => {
    try {
        const res = await fetchLink({
            address: `masters/userType`
        }).catch(() => null);

        
        const extracted = extractArrayResponse<any>(res);
        if (extracted.success && extracted.data.length > 0) {
            return extracted;
        }
    } catch {
        // Endpoint failure handled gracefully
    }

    try {
        const usersRes = await fetchUsersList();
        if (usersRes.success && usersRes.data.length > 0) {
            const map = new Map<string | number, string>();
            
            usersRes.data.forEach((u: any) => {
                const id = u.UserTypeId ?? u.UserType ?? u.user_type_id ?? u.User_Type_Id;
                const name = u.UserType ?? u.UserTypeName ?? u.user_type ?? u.User_Type;
                if (id !== undefined && id !== null && name) {
                    map.set(id, String(name));
                }
            });
            const derived = Array.from(map.entries()).map(([Id, UserType]) => ({
                Id,
                UserType
            }));
            if (derived.length > 0) {
                return { success: true, data: derived };
            }
        }
    } catch {
        // Fallback failure handled gracefully
    }

    return { success: false, data: [] };
};

export const fetchUserTypeRights = async (
    userTypeId: number | string,
    loadingOn?: () => void,
    loadingOff?: () => void
) => {
    try {
        const res = await fetchLink({
            address: `configuration/appMenu/userRights/userTypeBased?UserTypeId=${userTypeId}`,
            loadingOn,
            loadingOff
        }).catch(() => null);

        const extracted = extractArrayResponse<UserRightsData>(res);
        if (extracted.success) {
            return extracted;
        }
    } catch {
        // Endpoint failure handled gracefully
    }

    try {
        const res2 = await fetchLink({
            address: `configuration/appMenu/userTypeRights?UserTypeId=${userTypeId}`,
            loadingOn,
            loadingOff
        }).catch(() => null);

        const extracted2 = extractArrayResponse<UserRightsData>(res2);
        if (extracted2.success) {
            return extracted2;
        }
    } catch {
        // Fallback failure handled gracefully
    }

    return { success: false, data: [] };
};



