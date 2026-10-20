import { lazy } from "react";
import type { componentRoute } from "./indexRouter";

const CreditListPage = lazy(() => import("../modules/mytask/TodayTaskMain"));

export const MytaskRoutePath: componentRoute[] = [
    {
        path: '/mytask',
        component: CreditListPage
    },
];