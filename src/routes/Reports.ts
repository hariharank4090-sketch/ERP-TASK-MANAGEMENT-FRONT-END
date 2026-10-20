import { lazy } from "react";
import { MenuGroupPage } from "../Layout/Submenu";
import type { componentRoute } from "./indexRouter";

const ProjectMasterPage = lazy(() => import("../modules/Reports/executionReports/ExecutionReports"));
const ProjectTaskComparison = lazy(() => import("../modules/Reports/comparisonReports/ProjectTaskComparison"));
const CostBasedReports = lazy(() => import("../modules/Reports/costReports/CostReports"));
const StaffBasedReports = lazy(() => import("../modules/Reports/staff based reports/staffbaseReports"));
const Projectprogress = lazy(() => import("../modules/Reports/Project Progress/ProjectProgress"));
const ProjectPlan = lazy(() => import("../modules/Reports/Project Plan/ProjectPlan"));
const UserBasedTreeView = lazy(() => import("../modules/Reports/user rights/user rights"));

export const reportsRoutePath: componentRoute[] = [
    { path: '', component: MenuGroupPage },
    { path: 'ExecutionReports', component: ProjectMasterPage },
    { path: 'comparisonreports', component: ProjectTaskComparison },
    { path: 'costcategoryreport', component: CostBasedReports },
    { path: 'Staffbasedreports', component: StaffBasedReports },
    { path: 'projectprogress', component: Projectprogress },
    { path: 'projectplan', component: ProjectPlan },
    { path: 'userrights', component: UserBasedTreeView }
];