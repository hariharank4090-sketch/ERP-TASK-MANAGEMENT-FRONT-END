


import EmployeeDayAbstract from "../modules/today activitty/todayactivity";
import type { componentRoute } from "./indexRouter";

export const todayactivityRoutePath: componentRoute[] = [
    {  
        path: '/todayactivity',  // Use full path starting with /all
        component: EmployeeDayAbstract 
    },
    
];