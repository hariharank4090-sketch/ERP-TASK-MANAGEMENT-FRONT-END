import { lazy } from "react";
import { MenuGroupPage } from "../Layout/Submenu";
import type { componentRoute } from "./indexRouter";

const TaskType = lazy(() => import("../modules/Creation/Tasktype/TaskType"));
const ProjectMainPage = lazy(() => import("../modules/Creation/Projectcreation/Projectcreation"));
const TaskMainPage = lazy(() => import("../modules/Creation/Task/Task"));
const Process = lazy(() => import("../modules/Creation/Process/Process"));
const Parameters = lazy(() => import("../modules/Creation/Parameter/Parameter"));
const ProjectSchedule = lazy(() => import("../modules/Creation/Projectschedule/Projectschedule"));

export const creationRoutePath: componentRoute[] = [
    { path: '', component: MenuGroupPage },
    { path: 'tasktype', component: TaskType },
    { path: 'projects', component: ProjectMainPage },
    { path: 'task', component: TaskMainPage },
    { path: 'parameters', component: Parameters },
    { path: 'process', component: Process },
    { path: 'projectschedule', component: ProjectSchedule },
];