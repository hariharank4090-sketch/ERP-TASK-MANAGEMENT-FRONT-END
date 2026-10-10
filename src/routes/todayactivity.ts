


import EmployeeDayAbstract from "../modules/todayActivity/todayactivity";
import type { componentRoute } from "./indexRouter";

export const todayactivityRoutePath: componentRoute[] = [
    {  
        path: '/todayactivity',  // Use full path starting with /all
        component: EmployeeDayAbstract 
    },
    
];