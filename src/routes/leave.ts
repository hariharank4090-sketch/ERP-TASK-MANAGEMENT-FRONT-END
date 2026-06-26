
import LeaveMasterPage from "../modules/Master/Leave/Leavemaster";

import type { componentRoute } from "./indexRouter";

export const leaveRoutePath: componentRoute[] = [
    {  
        path: '/leavemodule',  // Use full path starting with /all
        component: LeaveMasterPage  
    },
    
];