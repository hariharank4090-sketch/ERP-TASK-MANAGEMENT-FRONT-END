// src/routes/Reports.ts
import { MenuGroupPage } from "../Layout/Submenu";
import ProjectTaskComparison from "../modules/Reports/comparision reports/ProjectTaskComparison";
import ProjectMasterPage from "../modules/Reports/Execution reports/ExecutionReports";
import CostBasedReports from "../modules/Reports/costReports/CostReports";

import type { componentRoute } from "./indexRouter";
import StaffBasedReports from "../modules/Reports/staff based reports/staffbaseReports";
import Projectprogress from "../modules/Reports/Project Progress/ProjectProgress";
import ProjectPlan from "../modules/Reports/Project Plan/ProjectPlan";
import UserBasedTreeView from "../modules/Reports/user rights/user rights";

export const reportsRoutePath: componentRoute[] = [
    { path: '', component: MenuGroupPage },
    { path: 'Execution Reports', component: ProjectMasterPage },
    { path: 'Comparison Reports', component: ProjectTaskComparison },
    { path: 'cost category report', component: CostBasedReports },
    { path: 'Staff based reports', component: StaffBasedReports },
    { path: 'Project Progress', component: Projectprogress },
    { path: 'Project Plan', component: ProjectPlan },
    { path: 'User Rights', component: UserBasedTreeView }
];