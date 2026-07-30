/* eslint-disable @typescript-eslint/no-explicit-any */
export interface StaffBasedReportData {
  ST_Inv_Id?: string;
  Branch_Id?: number;
  Journal_no?: string;
  Stock_Journal_date?: string;
  Month_No?: number;
  Invoice_Month?: string;
  Invoice_Year?: number;
  Month_Year?: string;
  Bill_type?: string;
  Stock_Journal_Voucher_type?: string;
  Invoice_no?: string;
  Narration?: string;
  Product_Id?: string;
  Product_Name?: string;
  Godown_Id?: string;
  Godown_Name?: string;
  Batch_No?: string;
  Qty?: number | string;
  Act_Qty?: number | string;
  Rate?: number | string;
  Amt?: number | string;
  Unit?: string;
  Trans_Id?: string;
  Stock_Item?: string;
  Brand?: string;
  Group_ST?: string;
  Bag?: string;
  Stock_Group?: string;
  S_Sub_Group_1?: string;
  Grade_Item_Group?: string;
  Item_Name_Modified?: string;
  Date_Added?: string;
  POS_Group?: string;
  Active?: string;
  POS_Item_Name?: string;
  Brokerage?: string | null;
  Coolie?: string | null;
  Empty_Cost?: string;
  Primary_Cost?: string;
  Transporter_Name?: string;
  Broker_Name?: string;
  Load_Man?: string;
  Others1?: string;
  Others2?: string;
  Others3?: string;
  Checker?: string;
  Delivery_Man?: string;
  Others4?: string;
  Others5?: string;
  Others6?: string;
  Driver?: string;
  Owners?: string;
  Created_on?: string;
  Created_By?: string;
  Cost_Center_Id?: string | number;
  [key: string]: any;
}

export interface CostCenterData {
  Cost_Center_Id?: string | number;
  costCenterId?: string | number;
  id?: string | number;
  Cost_Center_Name?: string;
  costCenterName?: string;
  name?: string;
  [key: string]: any;
}

export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}
