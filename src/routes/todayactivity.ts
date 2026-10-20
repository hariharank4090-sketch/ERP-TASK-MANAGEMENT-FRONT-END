import { lazy } from "react";
import type { componentRoute } from "./indexRouter";

const EmployeeDayAbstract = lazy(() => import("../modules/todayActivity/todayactivity"));

export const todayactivityRoutePath: componentRoute[] = [
    {
        path: '/todayactivity',
        component: EmployeeDayAbstract
    },
];