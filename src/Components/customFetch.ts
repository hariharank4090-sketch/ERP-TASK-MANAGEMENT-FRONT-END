/* eslint-disable @typescript-eslint/no-explicit-any */
import baseURL from "../config/baseURL";

interface FetchLinkParams {
    address: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers?: Record<string, string>;
    
   
    bodyData?: Record<string, any> | FormData | null | any[] | any;
    others?: RequestInit;
    autoHeaders?: boolean;
    loadingOn?: () => void;
    loadingOff?: () => void;
}


export interface ApiResponse<T = any> {
  
    pagination: any;
    errors: boolean;
    currentPage: number;
    totalRecords: number;
    pageSize: number;
    totalPages: number;
    limit: number;
    page: number;
    total: number;
    success: boolean;
    data: T[];
    message: string;
   
    others?: Record<string, any>;
}


export const fetchLink = async <T = any>({
    address,
    method = "GET",
    headers = {},
    bodyData = null,
    others = {},
    autoHeaders = false,
    loadingOn,
    loadingOff,
}: FetchLinkParams): Promise<ApiResponse<T>> => {
    const token = localStorage.getItem('token');
    const isFormData = bodyData instanceof FormData;

    const defaultHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: 'Bearer ' + (token || ""),
    };

    const finalHeaders = autoHeaders
        ? defaultHeaders
        : { ...defaultHeaders, ...headers };

    if (isFormData) {
        delete finalHeaders["Content-Type"];
    }

    const options: RequestInit = {
        method,
        headers: finalHeaders,
        ...others,
    };

    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
        options.body = isFormData ? (bodyData as FormData) : JSON.stringify(bodyData || {});
    }

    try {
        if (loadingOn) loadingOn();

        const response = await fetch(baseURL + address.replace(/\s+/g, ""), options);

        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
           
            return null as any;
        }

        if ((finalHeaders["Content-Type"] || "").includes("application/json")) {
            const json = (await response.json()) as ApiResponse<T>;
            
            // Check for 200 OK responses that are actually token errors
            if (
                json &&
                (json.success === false || (json as any).status === "error" || (json as any).status === false) &&
                json.message &&
                (json.message.toLowerCase().includes("token") ||
                 json.message.toLowerCase().includes("jwt") ||
                 json.message.toLowerCase().includes("unauthorized") ||
                 json.message.toLowerCase().includes("session expired"))
            ) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
                return null as any;
            }
            
            if (json && !json.data) {
                json.data = [];
            }
            
            return json;
        } else {
            return (response as unknown) as ApiResponse<T>;
        }
        
    } catch (e) {
        console.error("Fetch Error", e);
        throw e;
    } finally {
        if (loadingOff) loadingOff();
    }
};
