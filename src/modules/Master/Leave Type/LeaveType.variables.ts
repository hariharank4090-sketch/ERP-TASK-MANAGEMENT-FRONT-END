export type leavetypeData = {
  Id: number;
    LeaveType: string;  
};

export type leavetypeCreateInput = {
   LeaveType: string;  
};

export type leavetypeUpdateInput = {
  Id: number;
    LeaveType: string;
};



export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data: unknown;
}

export const emptyleavetype: leavetypeCreateInput = {
   LeaveType: ""
};