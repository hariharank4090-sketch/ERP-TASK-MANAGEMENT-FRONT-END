import { MenuGroupPage } from "../Layout/Submenu";
// import AttendanceMainPage from "../modules/Attendances/Employee/AttendanceTable";/

import FingerPrintMainPage from "../modules/Attendances/FingerPrint/FingerPrintMainPage";
import SalesTeamAttendancePage from "../modules/Attendances/Salesperson/SalespersonMainList";




import type { componentRoute } from "./indexRouter";

export const attendancesRoutePath: componentRoute[] = [
    { path: '', component:MenuGroupPage },
    {  path: 'fingerprint', component:FingerPrintMainPage },
    {  path: 'salesperson', component:SalesTeamAttendancePage },
//   {  path: 'employee', component:AttendanceMainPage },
  
     
      ];