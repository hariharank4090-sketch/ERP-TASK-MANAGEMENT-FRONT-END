import type { StylesConfig } from 'react-select';

export interface TableHeaderColumn {
    id: number | string;
    headname: string;
    variant?: 'head' | 'body';
    align?: 'left' | 'center' | 'right' | 'justify';
    width?: string | number;
}

export const MainMenu: TableHeaderColumn[] = [
    { id: 1, headname: "Menu ID", width: 100 },
    { id: 2, headname: "Menu Name", width: 300 },
    { id: 3, headname: "Read", width: 80 },
    { id: 4, headname: "Add", width: 80 },
    { id: 5, headname: "Edit", width: 80 },
    { id: 6, headname: "Delete", width: 80 },
    { id: 7, headname: "Print", width: 80 },
    { id: 8, headname: "Action", width: 100 }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const customSelectStyles: StylesConfig<any, false> = {
    control: (provided) => ({
        ...provided,
        minHeight: '38px',
        fontSize: '14px',
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 9999,
    }),
};

export interface RightsParam {
    readRights: boolean;
    addRights: boolean;
    editRights: boolean;
    deleteRights: boolean;
    printRights: boolean;
}

export interface UserRightsData {
    id: number;
    name: string;
    is_active: number;
    Read_Rights?: number;
    Add_Rights?: number;
    Edit_Rights?: number;
    Delete_Rights?: number;
    Print_Rights?: number;
    SubMenu?: UserRightsData[];
    ChildMenu?: UserRightsData[];
    SubRoutes?: UserRightsData[];
}

export interface UserOption {
    value: number | string;
    label: string;
}

export interface AppTypeOption {
    value: number;
    label: string;
}

export interface UserMaster {
    UserId: number;
    Name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface TreeRowProps {
    data: UserRightsData;
    UserId: number | string;
    level: number;
    loadingOn?: () => void;
    loadingOff?: () => void;
    appType: number;
}

export interface UserBasedTreeViewProps {
    loadingOn?: () => void;
    loadingOff?: () => void;
}
