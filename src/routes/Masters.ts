import { lazy } from "react";
import { MenuGroupPage } from "../Layout/Submenu";
import type { componentRoute } from "./indexRouter";

const LeaveTypeMainPage = lazy(() => import("../modules/Master/leaveType/LeaveTypeMainlist"));
const ParameterDataTypeMainPage = lazy(() => import("../modules/Master/Parameters/ParametersMainList"));
const ProcessMasterMain = lazy(() => import("../modules/Master/processMaster/Process MasterMain"));
const ProjectScheduleMainPage = lazy(() => import("../modules/Master/Project Schedule/Project ScheduleMain"));
const ProjectMainPage = lazy(() => import("../modules/Master/Projects/Projectsmain"));
const TaskMainPage = lazy(() => import("../modules/Master/Task/TaskMain"));
const EmpSchedulesMainPage = lazy(() => import("../modules/Master/nonworkMaster/EmpScheduleMain"));
const TaskTypeMainPage = lazy(() => import("../modules/Master/Tasktype/TaskType.list"));

export const mastersRoutePath: componentRoute[] = [
    { path: '', component: MenuGroupPage },
    { path: 'tasktype', component: TaskTypeMainPage },
    { path: 'projects', component: ProjectMainPage },
    { path: 'task', component: TaskMainPage },
    { path: 'parameters', component: ParameterDataTypeMainPage },
    { path: 'processmaster', component: ProcessMasterMain },
    { path: 'leavetype', component: LeaveTypeMainPage },
    { path: 'projectschedule', component: ProjectScheduleMainPage },
    { path: 'workMaster', component: EmpSchedulesMainPage },
];