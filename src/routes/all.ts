
import ProjectsOverview from "../modules/Dashboard/All";
import NotificationScreen from "../modules/notifications/NotificationScreen";

import type { componentRoute } from "./indexRouter";

export const allRoutePath: componentRoute[] = [
    {
        path: '/all',  // Use full path starting with /all
        component: ProjectsOverview
    },
    {
        path: '/notifications',
        component: NotificationScreen
    }
];