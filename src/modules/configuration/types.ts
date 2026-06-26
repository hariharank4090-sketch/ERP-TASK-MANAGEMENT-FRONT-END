export type Boolish = boolean | 0 | 1 | null | undefined;

// ── Raw shape returned by the backend ──────────────────────────────────────

export interface BackendSubRoute {
    id: number;
    name: string;
    menu_type: number;
    parent_id: number | null;
    url: string | null;
    tUrl: string | null;
    rUrl: string | null;
    actionType: string;
    display_order: number;
    is_active: number;
    SubRoutes?: BackendSubRoute[];
    Read_Rights?: number;
    Add_Rights?: number;
    Edit_Rights?: number;
    Delete_Rights?: number;
    Print_Rights?: number;
}

export interface BackendChildMenuItem extends BackendSubRoute {
    SubRoutes: BackendSubRoute[];
}

export interface BackendSubMenuItem extends BackendSubRoute {
    ChildMenu: BackendChildMenuItem[];
    SubRoutes: BackendSubRoute[];
}

export interface BackendMenuItem extends BackendSubRoute {
    SubMenu: BackendSubMenuItem[];
    SubRoutes: BackendSubRoute[];
}

// ── Normalised flat row used everywhere in the front-end ───────────────────

export interface MenuRow {
    menuId: number;
    parentId: number | null;
    slug: string;
    title: string;
    iconKey?: string | null;
    menuType?: number;          // 0=route, 1=main, 2=sub, 3=child
    isActive?: Boolish;
    isVisible?: Boolish;
    sortOrder?: number | null;
    componentKey?: string | null;
    // tUrl / rUrl come straight from the backend – kept on every row so that
    // path resolution always prefers the backend-configured URL.
    tUrl?: string | null;
    rUrl?: string | null;
    // CRUD rights (0 / 1)
    readRights?: number;
    addRights?: number;
    editRights?: number;
    deleteRights?: number;
    printRights?: number;
}

export interface MenuPayload {
    parentId: number | null;
    slug: string;
    title: string;
    iconKey: string | null;
    menuType: number;
    isActive: boolean;
    isVisible: boolean;
    sortOrder: number | null;
    componentKey: string | null;
}

export interface ToastState {
    open: boolean;
    msg: string;
    severity: "success" | "error" | "info" | "warning";
}

export interface MenuFormState {
    menuId: number | null;
    parentId: number | null;
    slug: string;
    title: string;
    iconKey: string | null;
    menuType: number;
    isActive: boolean;
    isVisible: boolean;
    sortOrder: number | "" | null;
    componentKey: string | null;
}

export interface MenuFormDialogProps {
    open: boolean;
    onClose: (changed: boolean) => void;
    initial: MenuFormState | null;
    allMenus: MenuRow[];
    onSubmit: (menuId: number | null, payload: MenuPayload) => Promise<void>;
}