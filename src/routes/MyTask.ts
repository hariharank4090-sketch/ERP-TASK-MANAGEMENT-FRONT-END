import { lazy } from "react";
import { MenuGroupPage } from "../Layout/Submenu";
import type { componentRoute } from "./indexRouter";
import MyList from "../modules/mytask/My List/MyList";


   
const CreditListPage = lazy(() => import("../modules/mytask/calendar view/TodayTaskMain"));


export const MytaskRoutePath: componentRoute[] = [
    { path: '', component: MenuGroupPage },
    { path: 'mytaskcalendar', component: CreditListPage },
    { path: 'mylist', component: MyList }

];