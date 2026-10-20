import { lazy } from "react";
import { MenuGroupPage } from "../Layout/Submenu";
import type { componentRoute } from "./indexRouter";

const FingerPrintMainPage = lazy(() => import("../modules/Attendances/FingerPrint/FingerPrintMainPage"));
const SalesTeamAttendancePage = lazy(() => import("../modules/Attendances/Salesperson/SalespersonMainList"));

export const attendancesRoutePath: componentRoute[] = [
    { path: '', component: MenuGroupPage },
    { path: 'fingerprint', component: FingerPrintMainPage },
    { path: 'salesperson', component: SalesTeamAttendancePage },
];