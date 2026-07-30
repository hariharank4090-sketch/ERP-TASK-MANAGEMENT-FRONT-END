

// src/routes/Masters.ts
import { MenuGroupPage } from "../Layout/Submenu";
import ProjectTaskComparison from "../modules/Reports/comparision reports/ProjectTaskComparison";
import ProjectMasterPage from "../modules/Reports/Execution reports/ExecutionReports";
import CostBasedReports from "../modules/Reports/costReports/CostReports";

import type { componentRoute } from "./indexRouter";
import StaffBasedReports from "../modules/Reports/staff based reports/staffbaseReports";

export const reportsRoutePath: componentRoute[] = [
    { path: '', component: MenuGroupPage },
    { path: 'Execution Reports', component: ProjectMasterPage },
    { path: 'Comparison Reports', component: ProjectTaskComparison },
    { path: 'cost category report', component: CostBasedReports },
    { path: 'Staff based reports', component: StaffBasedReports },


];