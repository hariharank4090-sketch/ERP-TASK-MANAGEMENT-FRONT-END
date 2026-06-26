// src/routes/Masters.ts
import { MenuGroupPage } from "../Layout/Submenu";
import LeaveTypeMainPage from "../modules/Master/Leave Type/LeaveTypeMainlist";
import ParameterDataTypeMainPage from "../modules/Master/Parameters/ParametersMainList";
import ProcessMasterMain from "../modules/Master/Process Master/Process MasterMain";
import ProjectScheduleMainPage from "../modules/Master/Project Schedule/Project ScheduleMain";
import ProjectEmployeeMainPage from "../modules/Master/Projectemployee/Projectemployee";
import ProjectMainPage from "../modules/Master/Projects/Projectsmain";
import TaskMainPage from "../modules/Master/Task/TaskMain";
import EmpSchedulesMainPage from "../modules/Master/nonworkMaster/EmpScheduleMain";
import TaskTypeMainPage from "../modules/Master/Tasktype/TaskType.list";
import type { componentRoute } from "./indexRouter";

export const mastersRoutePath: componentRoute[] = [
    { path: '', component: MenuGroupPage },
    { path: 'tasktype', component: TaskTypeMainPage },
    { path: 'projects', component: ProjectMainPage },
    { path: 'task', component: TaskMainPage },
    { path: 'parameters', component: ParameterDataTypeMainPage },
    { path: 'processmaster', component: ProcessMasterMain },
    { path: 'leavetype', component: LeaveTypeMainPage },
    { path: 'employeeinvolved', component: ProjectEmployeeMainPage },
    { path: 'projectschedule', component: ProjectScheduleMainPage },
    { path: 'workMaster', component: EmpSchedulesMainPage },
];