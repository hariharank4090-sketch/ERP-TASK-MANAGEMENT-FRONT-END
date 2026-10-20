import { lazy } from "react";
import type { componentRoute } from "./indexRouter";

const ProjectsOverview = lazy(() => import("../modules/Dashboard/All"));
const NotificationScreen = lazy(() => import("../modules/notifications/NotificationScreen"));

export const allRoutePath: componentRoute[] = [
    {
        path: '/all',
        component: ProjectsOverview
    },
    {
        path: '/notifications',
        component: NotificationScreen
    }
];