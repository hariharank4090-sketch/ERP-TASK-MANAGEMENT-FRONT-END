export type processData = {
  Id: number;
  Process_Name: string;
};

export type ProcessMasterData = processData; // Alias for consistency

export type processCreateInput = {
  Process_Name: string;
};

export type ProcessMasterCreateInput = processCreateInput; // Alias

export type processUpdateInput = {
  Id: number;
  Process_Name: string;
};

export type ProcessMasterUpdateInput = processUpdateInput; // Alias

export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data: unknown;
}

export const emptyProcessMaster: ProcessMasterCreateInput = {
  Process_Name: ""
};

export const emptyprocess = emptyProcessMaster; // Alias for backward compatibility