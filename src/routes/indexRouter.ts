
// import { configurationRoutePath } from "./configuration";
import { mastersRoutePath } from "./Masters";
import { creationRoutePath } from "./Creation.ts";
import { attendancesRoutePath } from "./attendances.ts";
import { allRoutePath } from "./all.ts";

import {MytaskRoutePath} from "./MyTask.ts"
import { todayactivityRoutePath } from "./todayactivity.ts";
// import { discussionRoutePath} from "./discussion.ts";
import { leaveRoutePath } from "./leave.ts";
import { reportsRoutePath } from "./Reports.ts"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface componentRoute<P = any> {
    path: string;
    component: React.ComponentType<P>;
}

export interface PageProps {
    loading: boolean;
    loadingOn: () => void;
    loadingOff: () => void;
}

// Configuration routes - prepend with /configuration
// const configuration: componentRoute[] = configurationRoutePath.map(
//     route => ({  
//         ...route, 
//         path: `/configuration/${route.path}` 
//     })
// );

// Masters routes - prepend with /master
const masters: componentRoute[] = mastersRoutePath.map(
    route => ({  
        ...route, 
        path: `/master/${route.path}` 
    })
);

// Creation routes - prepend with /creation
const creation: componentRoute[] = creationRoutePath.map(
    route => ({  
        ...route, 
        path: `/creation/${route.path}` 
    })
);

// Attendance routes - prepend with /attendances
const attendances: componentRoute[] = attendancesRoutePath.map(
    route => ({  
        ...route, 
        path: `/attendances/${route.path}` 
    })
);

const reports: componentRoute[] = reportsRoutePath.map(
    route => ({  
        ...route, 
        path: `/reports/${route.path}` 
    })
);

// All routes - these are already full paths or don't need prefix
// Remove the map since allRoutePath already has correct paths
const all: componentRoute[] = [...allRoutePath]; // Just use as-is
const Mytask: componentRoute[] = [...MytaskRoutePath];
const Todayactivity: componentRoute[] = [...todayactivityRoutePath];
const leave: componentRoute[] = [...leaveRoutePath];
// const discussion: componentRoute[] = [...discussionRoutePath]; // Just use as-is
// const reports: componentRoute[] = [...reportsRoutePath];

// Combine all routes
export const appRoutes = ([] as componentRoute[]).concat(
    // configuration,
    masters,
    creation,
    attendances,
    all,
    Mytask,
    Todayactivity,
    leave,
    reports
    // discussion
);