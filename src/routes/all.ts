
import ProjectsOverview from "../modules/Dashboard/All";

import type { componentRoute } from "./indexRouter";

export const allRoutePath: componentRoute[] = [
    {  
        path: '/all',  // Use full path starting with /all
        component: ProjectsOverview  
    },
    
];