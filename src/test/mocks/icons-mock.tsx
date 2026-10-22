import React from 'react';

const createIcon = (name: string) => {
  const Component = (props: React.HTMLAttributes<HTMLSpanElement>) =>
    React.createElement('span', { 'data-testid': `${name}Icon`, ...props }, name);
  Component.displayName = name;
  return Component;
};

const handler = {
  get: (target: Record<string, unknown>, prop: string) => {
    if (prop === '__esModule') return true;
    if (prop === 'default') return () => null;
    if (!(prop in target)) {
      target[prop] = createIcon(prop);
    }
    return target[prop];
  },
};

const iconsMock = new Proxy({}, handler);

export default iconsMock;

// All icons imported across the app
export const Home = createIcon('Home');
export const Close = createIcon('Close');
export const Settings = createIcon('Settings');
export const Refresh = createIcon('Refresh');
export const Visibility = createIcon('Visibility');
export const VisibilityOff = createIcon('VisibilityOff');
export const Search = createIcon('Search');
export const Add = createIcon('Add');
export const Edit = createIcon('Edit');
export const Delete = createIcon('Delete');
export const FilterList = createIcon('FilterList');
export const FilterAlt = createIcon('FilterAlt');
export const Tune = createIcon('Tune');
export const ArrowBack = createIcon('ArrowBack');
export const ArrowForward = createIcon('ArrowForward');
export const ChevronLeft = createIcon('ChevronLeft');
export const ChevronRight = createIcon('ChevronRight');
export const ExpandMore = createIcon('ExpandMore');
export const ExpandLess = createIcon('ExpandLess');
export const Menu = createIcon('Menu');
export const MenuOpen = createIcon('MenuOpen');
export const MoreVert = createIcon('MoreVert');
export const Notifications = createIcon('Notifications');
export const Person = createIcon('Person');
export const AccountCircle = createIcon('AccountCircle');
export const Check = createIcon('Check');
export const CheckCircle = createIcon('CheckCircle');
export const Cancel = createIcon('Cancel');
export const Clear = createIcon('Clear');
export const Error = createIcon('Error');
export const ErrorOutline = createIcon('ErrorOutline');
export const Info = createIcon('Info');
export const Warning = createIcon('Warning');
export const CalendarToday = createIcon('CalendarToday');
export const DateRange = createIcon('DateRange');
export const Schedule = createIcon('Schedule');
export const Dashboard = createIcon('Dashboard');
export const Work = createIcon('Work');
export const Group = createIcon('Group');
export const Assignment = createIcon('Assignment');
export const Task = createIcon('Task');
export const Folder = createIcon('Folder');
export const Description = createIcon('Description');
export const Print = createIcon('Print');
export const Download = createIcon('Download');
export const Upload = createIcon('Upload');
export const CloudUpload = createIcon('CloudUpload');
export const CloudDownload = createIcon('CloudDownload');
export const Save = createIcon('Save');
export const Done = createIcon('Done');
export const DoneAll = createIcon('DoneAll');
export const Send = createIcon('Send');
export const ThumbUp = createIcon('ThumbUp');
export const Chat = createIcon('Chat');
export const Message = createIcon('Message');
export const Lock = createIcon('Lock');
export const LockOpen = createIcon('LockOpen');
export const Email = createIcon('Email');
export const Phone = createIcon('Phone');
export const Business = createIcon('Business');
export const LocationOn = createIcon('LocationOn');
export const AttachFile = createIcon('AttachFile');
export const MoreHoriz = createIcon('MoreHoriz');
export const KeyboardArrowDown = createIcon('KeyboardArrowDown');
export const KeyboardArrowUp = createIcon('KeyboardArrowUp');
export const KeyboardArrowRight = createIcon('KeyboardArrowRight');
export const PlayArrow = createIcon('PlayArrow');
export const Pause = createIcon('Pause');
export const Stop = createIcon('Stop');
export const NavigateNext = createIcon('NavigateNext');
export const NavigateBefore = createIcon('NavigateBefore');
export const FileDownload = createIcon('FileDownload');
export const PictureAsPdf = createIcon('PictureAsPdf');
export const TableChart = createIcon('TableChart');
export const InsertDriveFile = createIcon('InsertDriveFile');
export const ViewColumn = createIcon('ViewColumn');
export const FirstPage = createIcon('FirstPage');
export const LastPage = createIcon('LastPage');
export const RotateLeft = createIcon('RotateLeft');
export const ClearAll = createIcon('ClearAll');
export const Summarize = createIcon('Summarize');
export const History = createIcon('History');
export const Category = createIcon('Category');
export const People = createIcon('People');
export const ManageAccounts = createIcon('ManageAccounts');
export const SubdirectoryArrowRight = createIcon('SubdirectoryArrowRight');
export const Layers = createIcon('Layers');
export const Badge = createIcon('Badge');
export const Today = createIcon('Today');
export const TableView = createIcon('TableView');
export const Logout = createIcon('Logout');
export const Security = createIcon('Security');
export const CheckCircleOutline = createIcon('CheckCircleOutline');
export const HighlightOff = createIcon('HighlightOff');
export const ViewAgendaOutlined = createIcon('ViewAgendaOutlined');
export const ViewAgenda = createIcon('ViewAgenda');
