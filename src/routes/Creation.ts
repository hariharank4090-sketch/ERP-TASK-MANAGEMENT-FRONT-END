import { MenuGroupPage } from "../Layout/Submenu";
import TaskType from "../modules/Creation/Tasktype/TaskType";
import ProjectMainPage from "../modules/Creation/Projectcreation/Projectcreation";
import type { componentRoute } from "./indexRouter";
import TaskMainPage from "../modules/Creation/Task/Task";
import Process from "../modules/Creation/Process/Process";
import Parameters from "../modules/Creation/Parameter/Parameter";
import Membersgrouping from "../modules/Creation/Employee Involved/Projectemployeecreation";
import ProjectSchedule from "../modules/Creation/Projectschedule/Projectschedule";

export const creationRoutePath: componentRoute[] = [
    { path: '', component:MenuGroupPage },
    {  path: 'tasktype', component:TaskType },
    {  path: 'projects', component:ProjectMainPage },
     {  path: 'task', component:TaskMainPage },
     {  path: 'parameters', component:Parameters },
     {  path: 'process', component: Process },
     {  path: 'membersgrouping', component: Membersgrouping },
      {  path: 'projectschedule', component: ProjectSchedule },

];