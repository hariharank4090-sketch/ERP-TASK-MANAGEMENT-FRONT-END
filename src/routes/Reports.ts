

// src/routes/Masters.ts
import { MenuGroupPage } from "../Layout/Submenu";
import ProjectTaskComparison from "../modules/mytask/ProjectTaskComparison";
import ProjectMasterPage from "../modules/Reports/ExecutionReports";

import type { componentRoute } from "./indexRouter";

export const reportsRoutePath: componentRoute[] = [
    { path: '', component: MenuGroupPage },
    { path: 'Execution Reports', component: ProjectMasterPage },
    { path: 'Comparison Reports', component: ProjectTaskComparison },
   
];