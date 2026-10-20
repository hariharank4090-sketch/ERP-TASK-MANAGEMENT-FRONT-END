import { lazy } from "react";
import type { componentRoute } from "./indexRouter";

const LeaveMasterPage = lazy(() => import("../modules/Master/Leave/Leavemaster"));

export const leaveRoutePath: componentRoute[] = [
    {
        path: '/leavemodule',
        component: LeaveMasterPage
    },
];