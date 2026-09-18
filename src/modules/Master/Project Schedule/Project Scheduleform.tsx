/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Box,
 
  FormControl,
  InputLabel,
 
  FormControlLabel,
  Checkbox,
  Typography,
  CircularProgress,
  Radio,
  RadioGroup,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  type SelectChangeEvent,
} from "@mui/material";

import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { PickersDay, type PickersDayProps } from "@mui/x-date-pickers/PickersDay";

import DeleteIcon from "@mui/icons-material/Delete";

import dayjs, { Dayjs } from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from "dayjs/plugin/customParseFormat";

import AppDialog from "../../../Components/appDialog";
import SearchableSelect from "../../../Components/SearchableSelect";

import type {
  projectscheduleCreateInput,
  taskDropdown,
  taskTypeDropdown,
  ProjectDropdown,
  schedulePlanDropdown,
} from "./Project Schedule.variables";
import { toast } from "react-toastify";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(customParseFormat);

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProjectScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (isExtension?: boolean) => void;
  type: "create" | "edit" | "view" | "delete";
  scheduleObj?: projectscheduleCreateInput;
  setScheduleObj?: React.Dispatch<
    React.SetStateAction<projectscheduleCreateInput>
  >;
  taskOptions?: taskDropdown[];
  taskTypeOptions?: taskTypeDropdown[];
  projectOptions?: ProjectDropdown[];
  schedulePlanOptions?: schedulePlanDropdown[];
  selectedId?: number | null;
  isLoading?: boolean;
  readOnly?: boolean;
  disableTaskSelection?: boolean;
  onProjectChange?: (projectId: number) => Promise<void>;
  onTaskTypeChange?: (taskTypeId: number) => Promise<void>;
}

// ─── Custom calendar day ──────────────────────────────────────────────────────
const CustomPickersDay = (
  props: PickersDayProps & { selectedDates?: Dayjs[] }
) => {
  const { selectedDates = [], day, ...other } = props;
  const isSelected = selectedDates.some((d) => d.isSame(day, "day"));
  return (
    <PickersDay
      {...other}
      day={day}
      sx={{
        ...(isSelected && {
          backgroundColor: "#d2a56d !important",
          color: "white !important",
          "&:hover": { backgroundColor: "#d2a56d !important" },
        }),
      }}
    />
  );
};

// ─── Local UI state ───────────────────────────────────────────────────────────
interface LocalUIState {
  durationType: "oneTime" | "repetitive" | "";
  scheduleSubType: "time" | "days" | "weekly" | "monthly" | "specific" | "";
  startTime: string;
  endTime: string;
  isTimerBased: boolean;
  selectedDays: string[];
  selectedWeekDays: string[];
  selectedMonthlyWeekDays: string[];
  specificDates: string[];
  sectionStartDate: Dayjs | null;
  sectionEndDate: Dayjs | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_NAME_TO_NUM: { [k: string]: number } = {
  Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
  Friday: 5, Saturday: 6, Sunday: 7,
};
const DAY_NUM_TO_NAME: { [k: number]: string } = {
  1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday",
  5: "Friday", 6: "Saturday", 7: "Sunday",
};
const ALL_WEEKDAY_NAMES = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const isoWeekday = (d: Dayjs): number => {
  const js = d.day();
  return js === 0 ? 7 : js;
};

const weekdayNamesToMonthDayNumbers = (
  start: Dayjs,
  end: Dayjs,
  weekdayNames: string[]
): number[] => {
  if (weekdayNames.length === 0) return [];
  const wantedNums = new Set(weekdayNames.map((n) => DAY_NAME_TO_NUM[n]).filter(Boolean));
  const result = new Set<number>();
  let cur = start;
  while (cur.isSameOrBefore(end, "day")) {
    if (wantedNums.has(isoWeekday(cur))) result.add(cur.date());
    cur = cur.add(1, "day");
  }
  return Array.from(result).sort((a, b) => a - b);
};

const weekdayNamesToDateStrings = (
  start: Dayjs | null,
  end: Dayjs | null,
  weekdayNames: string[]
): string[] => {
  if (!start || !end || weekdayNames.length === 0) return [];
  const wantedNums = new Set(weekdayNames.map((n) => DAY_NAME_TO_NUM[n]).filter(Boolean));
  const result: string[] = [];
  let cur = start;
  while (cur.isSameOrBefore(end, "day")) {
    if (wantedNums.has(isoWeekday(cur))) {
      result.push(cur.format("YYYY-MM-DD"));
    }
    cur = cur.add(1, "day");
  }
  return result.sort();
};

const calcDurationHours = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some(isNaN)) return 0;
  let diffMins = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMins < 0) diffMins += 24 * 60;
  return Math.round((diffMins / 60) * 100) / 100;
};

const formatDurationString = (hours: number): string => {
  if (hours === 0) return "0 hrs";
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h} hr${h !== 1 ? "s" : ""} ${m > 0 ? `${m} min${m !== 1 ? "s" : ""}` : ""}`.trim();
  return `${m} min${m !== 1 ? "s" : ""}`;
};

const normalizeDateStr = (s: string): string => {
  let str = String(s).trim();
  if (str.includes('T')) str = str.split('T')[0];
  if (str.includes(' ')) str = str.split(' ')[0];
  // Convert from DD-MM-YYYY to YYYY-MM-DD if needed
  if (str.includes('-') && str.split('-')[2]?.length === 4) {
    const parts = str.split('-');
    if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return str;
};

// ─── Component ────────────────────────────────────────────────────────────────
export const ProjectScheduleDialog: React.FC<ProjectScheduleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  type,
  scheduleObj,
  setScheduleObj,
  taskOptions = [],
  taskTypeOptions = [],
  projectOptions = [],
  selectedId,
  isLoading = false,
  readOnly = false,
  disableTaskSelection = false,
  onProjectChange,
  onTaskTypeChange,
}) => {
  const isViewMode     = type === "view" || readOnly;
  const isDeleteMode   = type === "delete";
  const isCreateMode   = type === "create";
  const isEditMode     = type === "edit";
  const isFormDisabled = isViewMode || isDeleteMode;

  const [localUI, setLocalUI] = useState<LocalUIState>({
    durationType: "",
    scheduleSubType: "",
    startTime: "09:00",
    endTime: "18:00",
    isTimerBased: false,
    selectedDays: [],
    selectedWeekDays: [],
    selectedMonthlyWeekDays: [],
    specificDates: [],
    sectionStartDate: null,
    sectionEndDate: null,
  });

  const [calendarKey, setCalendarKey]   = useState(0);
  const [, setLoadingCascade] = useState(false);
  const [dateError, setDateError]           = useState("");
  const [initialSavedDates, setInitialSavedDates] = useState<string[]>([]);

  // ── Auto-sync timer duration ──────────────────────────────────────────────
  useEffect(() => {
    if (!localUI.isTimerBased || !setScheduleObj || !scheduleObj) return;
    const computed = calcDurationHours(localUI.startTime, localUI.endTime);
    if (scheduleObj.Task_Sch_Duaration !== computed) {
      setScheduleObj((prev) => ({ ...prev, Task_Sch_Duaration: computed }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localUI.startTime, localUI.endTime, localUI.isTimerBased]);

  useEffect(() => {
    if (open && (type === "edit" || type === "view") && scheduleObj) {
      const dates = (scheduleObj.specificDates || [])
        .map(s => normalizeDateStr(s))
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
      setInitialSavedDates(dates);
    }
  }, [open, type, scheduleObj]);

  // ── Time helpers ──────────────────────────────────────────────────────────
  const convertTo24H = (t: string): string => {
    if (!t) return "09:00";
    if (/^\d{2}:\d{2}$/.test(t)) return t;
    try {
      if (t.includes("AM") || t.includes("PM")) {
        const [tc, period] = t.split(" ");
        const [h, m] = tc.split(":").map(Number);
        if (period === "PM" && h < 12)
          return `${h + 12}:${String(m).padStart(2, "0")}`;
        if (period === "AM" && h === 12)
          return `00:${String(m).padStart(2, "0")}`;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    } catch { /* ignore */ }
    return "09:00";
  };

  const formatTimeDisplay = (t: string): string => {
    if (!t) return "-";
    try {
      const [hStr, rest] = t.split(":");
      const h = parseInt(hStr, 10);
      const m = (rest || "00").split(" ")[0];
      return `${String(h % 12 || 12).padStart(2, "0")}:${m} ${h >= 12 ? "PM" : "AM"}`;
    } catch { return t; }
  };

  // ── Date validation ───────────────────────────────────────────────────────
  const validateDates = (start: Dayjs | null, end: Dayjs | null): boolean => {
    if (!start || !end) { setDateError(""); return true; }
    if (end.isBefore(start, "day")) {
      setDateError("End date cannot be before start date");
      return false;
    }
    setDateError("");
    return true;
  };

  // ── Days-of-week available in the selected range ──────────────────────────
  const getAvailWeekdaysInRange = (
    start: Dayjs | null,
    end: Dayjs | null
  ): string[] => {
    if (!start || !end) return [];
    const found = new Set<string>();
    let cur = start;
    while (cur.isSameOrBefore(end, "day")) {
      found.add(cur.format("dddd"));
      cur = cur.add(1, "day");
    }
    return ALL_WEEKDAY_NAMES.filter((d) => found.has(d));
  };

  // ── Specific-dates helpers ────────────────────────────────────────────────
  const deriveRangeFromSpecific = (
    dates: string[]
  ): { start: Dayjs | null; end: Dayjs | null } => {
    if (dates.length === 0) return { start: null, end: null };
    const sorted = [...dates].sort();
    return { start: dayjs(sorted[0]), end: dayjs(sorted[sorted.length - 1]) };
  };

  // ── Hydrate localUI on edit / view ────────────────────────────────────────
  useEffect(() => {
    if (type === "create") return;
    if (!scheduleObj) return;
    
    // For edit/view mode, we need to set the UI based on existing data
    const planId = scheduleObj.Sch_Plan_Id;
    
    if (!planId || planId === 0) return;

    let sub: LocalUIState["scheduleSubType"] = "";
    if      (planId === 1) sub = "time";
    else if (planId === 2) sub = "days";
    else if (planId === 3) sub = "weekly";
    else if (planId === 4) sub = "monthly";
    else if (planId === 5) sub = "specific";

    const start: Dayjs | null = scheduleObj.Sch_Start_Date
      ? dayjs(scheduleObj.Sch_Start_Date) : null;
    const end: Dayjs | null   = scheduleObj.Sch_End_Date
      ? dayjs(scheduleObj.Sch_End_Date) : null;

    let selectedDays: string[]            = [];
    let selectedWeekDays: string[]        = [];
    let selectedMonthlyWeekDays: string[] = [];
    let specificDates: string[]           = [];

    // Handle Days selection (Plan 2) and Time selection (Plan 1)
    if (sub === "days" || sub === "time") {
      const specDates = scheduleObj.specificDates || [];
      if (specDates.length > 0) {
        selectedDays = ALL_WEEKDAY_NAMES.filter((name) => {
          const wNum = DAY_NAME_TO_NUM[name];
          return specDates.some((dStr) => {
            const d = dayjs(normalizeDateStr(dStr));
            return d.isValid() && isoWeekday(d) === wNum;
          });
        });
      } else if (scheduleObj.selectedDays && scheduleObj.selectedDays.length > 0) {
        selectedDays = scheduleObj.selectedDays
          .map((n) => DAY_NUM_TO_NAME[Number(n)])
          .filter(Boolean);
      }
    }

    // Handle Weekly selection (Plan 3)
    if (sub === "weekly") {
      const specDates = scheduleObj.specificDates || [];
      if (specDates.length > 0) {
        selectedWeekDays = ALL_WEEKDAY_NAMES.filter((name) => {
          const wNum = DAY_NAME_TO_NUM[name];
          return specDates.some((dStr) => {
            const d = dayjs(normalizeDateStr(dStr));
            return d.isValid() && isoWeekday(d) === wNum;
          });
        });
      } else if (scheduleObj.selectedDays && scheduleObj.selectedDays.length > 0) {
        selectedWeekDays = scheduleObj.selectedDays
          .map((n) => DAY_NUM_TO_NAME[Number(n)])
          .filter(Boolean);
      }
    }

    // Handle Monthly selection (Plan 4)
    if (sub === "monthly") {
      const specDates = scheduleObj.specificDates || [];
      if (specDates.length > 0) {
        selectedMonthlyWeekDays = ALL_WEEKDAY_NAMES.filter((name) => {
          const wNum = DAY_NAME_TO_NUM[name];
          return specDates.some((dStr) => {
            const d = dayjs(normalizeDateStr(dStr));
            return d.isValid() && isoWeekday(d) === wNum;
          });
        });
      } else if (scheduleObj.selectedDays && scheduleObj.selectedDays.length > 0) {
        const storedNums = scheduleObj.selectedDays.map(Number);
        const isWeekdayNums = storedNums.every(n => n >= 1 && n <= 7);
        if (isWeekdayNums) {
          selectedMonthlyWeekDays = storedNums
            .map((n) => DAY_NUM_TO_NAME[n])
            .filter(Boolean);
        } else if (start && end) {
          const stored = new Set(storedNums);
          selectedMonthlyWeekDays = ALL_WEEKDAY_NAMES.filter((name) => {
            const wNum = DAY_NAME_TO_NUM[name];
            const occurrences: number[] = [];
            let cur = start;
            while (cur.isSameOrBefore(end, "day")) {
              if (isoWeekday(cur) === wNum) {
                occurrences.push(cur.date());
              }
              cur = cur.add(1, "day");
            }
            if (occurrences.length === 0) return false;
            return occurrences.every((dNum) => stored.has(dNum));
          });
        }
      }
    }

    // Handle Specific Dates selection (Plan 5)
    if (sub === "specific") {
      specificDates = (scheduleObj.specificDates || [])
        .map(s => {
          let str = String(s).trim();
          if (str.includes('T')) str = str.split('T')[0];
          if (str.includes(' ')) str = str.split(' ')[0];
          // Convert from DD-MM-YYYY to YYYY-MM-DD if needed
          if (str.includes('-') && str.split('-')[2]?.length === 4) {
            const parts = str.split('-');
            if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
          return str;
        })
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{2}-\d{2}-\d{4}$/.test(s))
        .sort();
    }

    let sStart = start;
    let sEnd   = end;

    // For specific dates, derive range from the dates themselves
    if (sub === "specific" && specificDates.length > 0) {
      const { start: derivedStart, end: derivedEnd } = deriveRangeFromSpecific(specificDates);
      if (!sStart && derivedStart) sStart = derivedStart;
      if (!sEnd && derivedEnd) sEnd = derivedEnd;
    }

    const resolvedStartTime = convertTo24H(scheduleObj.Sch_Est_Start_Time || "");
    const resolvedEndTime   = convertTo24H(scheduleObj.Sch_Est_End_Time   || "");
    const isTimerBased      = scheduleObj.Task_Sch_Timer_Based || false;

    // Read schType from scheduleObj to set durationType
    const existingSchType = scheduleObj.Sch_Type;
    let derivedDurationType: LocalUIState["durationType"] = "";
    
    if (existingSchType === 1) {
      derivedDurationType = "oneTime";
    } else if (existingSchType === 2) {
      derivedDurationType = "repetitive";
    } else if (planId === 5) {
      // For specific dates, default to oneTime if not set
      derivedDurationType = "oneTime";
    } else if (planId > 0 && planId !== 5) {
      // For other plan types, default to repetitive if not set
      derivedDurationType = "repetitive";
    }

    setLocalUI((prev) => ({
      ...prev,
      durationType:           derivedDurationType,
      scheduleSubType:        sub,
      startTime:              resolvedStartTime,
      endTime:                resolvedEndTime,
      isTimerBased,
      sectionStartDate:       sStart,
      sectionEndDate:         sEnd,
      selectedDays,
      selectedWeekDays,
      selectedMonthlyWeekDays,
      specificDates,
    }));

    if (isTimerBased && setScheduleObj) {
      const computed = calcDurationHours(resolvedStartTime, resolvedEndTime);
      setScheduleObj((prev) => ({ ...prev, Task_Sch_Duaration: computed }));
    }

    if (sub === "monthly" && sStart && sEnd && selectedMonthlyWeekDays.length > 0 && setScheduleObj) {
      const cleanDayNums = weekdayNamesToMonthDayNumbers(sStart, sEnd, selectedMonthlyWeekDays);
      const cleanSpecDates = weekdayNamesToDateStrings(sStart, sEnd, selectedMonthlyWeekDays);
      
      const currentDaysStr = (scheduleObj.selectedDays || []).map(Number).sort().join(",");
      const cleanDaysStr = cleanDayNums.sort().join(",");
      
      const currentSpecStr = (scheduleObj.specificDates || []).map(s => String(s).trim()).sort().join(",");
      const cleanSpecStr = cleanSpecDates.sort().join(",");

      if (currentDaysStr !== cleanDaysStr || currentSpecStr !== cleanSpecStr) {
        setScheduleObj((prev) => ({
          ...prev,
          selectedDays: cleanDayNums,
          specificDates: cleanSpecDates,
        }));
      }
    }

    if (start && end) validateDates(start, end);

    // Force calendar refresh for specific dates
    if (sub === "specific" && specificDates.length > 0) {
      setCalendarKey(prev => prev + 1);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedId, type]);

  // ── Auto-sync computed specificDates to scheduleObj ────────────────────────
  useEffect(() => {
    if (!setScheduleObj || !scheduleObj) return;

    let computedSpecific: string[] = [];
    const sub = localUI.scheduleSubType;
    const start = localUI.sectionStartDate;
    const end = localUI.sectionEndDate;

    if (sub === "specific") {
      computedSpecific = localUI.specificDates;
    } else if (sub === "monthly" && start && end) {
      computedSpecific = weekdayNamesToDateStrings(start, end, localUI.selectedMonthlyWeekDays);
    } else if (sub === "weekly" && start && end) {
      computedSpecific = weekdayNamesToDateStrings(start, end, localUI.selectedWeekDays);
    } else if ((sub === "days" || sub === "time") && start && end) {
      computedSpecific = weekdayNamesToDateStrings(start, end, localUI.selectedDays);
    }

    const currentSpecStr = (scheduleObj.specificDates || [])
      .map(s => normalizeDateStr(s))
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
      .sort()
      .join(",");

    const computedSpecStr = computedSpecific
      .map(s => normalizeDateStr(s))
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
      .sort()
      .join(",");

    if (currentSpecStr !== computedSpecStr) {
      setScheduleObj((prev) => ({
        ...prev,
        specificDates: computedSpecific,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    localUI.scheduleSubType,
    localUI.sectionStartDate,
    localUI.sectionEndDate,
    localUI.selectedDays,
    localUI.selectedWeekDays,
    localUI.selectedMonthlyWeekDays,
    localUI.specificDates,
    setScheduleObj,
    scheduleObj?.specificDates
  ]);

  // ── Reset/Clear dates when dialog opens in create mode ────────────────────
  useEffect(() => {
    if (open && isCreateMode) {
      const today = dayjs();
      setLocalUI((prev) => ({
        ...prev,
        sectionStartDate: today,
        sectionEndDate: today,
        durationType: "",
        scheduleSubType: "",
        selectedDays: [],
        selectedWeekDays: [],
        selectedMonthlyWeekDays: [],
        specificDates: [],
      }));
      setDateError("");
      setCalendarKey(prev => prev + 1);
    }
  }, [open, isCreateMode]);



  // ── Generic field select ──────────────────────────────────────────────────
  const handleSelectChange = async (e: SelectChangeEvent<number>) => {
    if (!setScheduleObj || !scheduleObj || isFormDisabled) return;
    const value = e.target.value as number;
    const fieldName = e.target.name;

    if (fieldName === "Project_Id") {
      setScheduleObj((prev) => ({
        ...prev,
        Project_Id: Number(value),
        Task_Type_Id: 0,
        Task_Id: 0,
      }));
      if (onProjectChange && value > 0) {
        setLoadingCascade(true);
        try {
          await onProjectChange(Number(value));
        } catch (err) {
          console.error("onProjectChange error:", err);
        } finally {
          setLoadingCascade(false);
        }
      }
      return;
    }

    if (fieldName === "Task_Type_Id") {
      setScheduleObj((prev) => ({
        ...prev,
        Task_Type_Id: Number(value),
        Task_Id: 0,
      }));
      if (onTaskTypeChange && value > 0) {
        setLoadingCascade(true);
        try {
          await onTaskTypeChange(Number(value));
        } catch (err) {
          console.error("onTaskTypeChange error:", err);
        } finally {
          setLoadingCascade(false);
        }
      }
      return;
    }

    setScheduleObj({ ...scheduleObj, [fieldName]: Number(value) });
  };

  
  const handleUIChange = (field: keyof LocalUIState, value: any) => {
    if (isFormDisabled) return;
    setLocalUI((prev) => ({ ...prev, [field]: value }));
  };

  // ── Duration Type Change - User manually selects One-Time or Repetitive ───
  const handleDurationTypeChange = (t: "oneTime" | "repetitive") => {
    if (isFormDisabled || !setScheduleObj || !scheduleObj) return;
    
    const schTypeValue = t === "oneTime" ? 1 : 2;
    
    setLocalUI((prev) => ({
      ...prev,
      durationType: t,
    }));
    
    setScheduleObj((prev) => ({
      ...prev,
      Sch_Type: schTypeValue,
    }));
  };

  // ── Schedule Sub Type Change - User selects the schedule pattern ──────────
  const handleScheduleSubTypeChange = (sub: LocalUIState["scheduleSubType"]) => {
    if (isFormDisabled || !setScheduleObj || !scheduleObj) return;
    const planMap: Record<string, number> = {
      time: 1, days: 2, weekly: 3, monthly: 4, specific: 5,
    };
    
    let newStartDate = localUI.sectionStartDate;
    let newEndDate = localUI.sectionEndDate;
    let newStartTime = localUI.startTime;
    let newEndTime = localUI.endTime;
    
    const today = dayjs();

    if (sub === "specific") {
      newStartDate = null;
      newEndDate = null;
    } else if (sub === "weekly") {
      newStartDate = today;
      newEndDate = today.add(6, "day");
      newStartTime = "09:30";
      newEndTime = "18:30";
    } else if (sub === "monthly") {
      newStartDate = today;
      newEndDate = today.add(30, "day");
      newStartTime = "09:30";
      newEndTime = "18:30";
    } else if (sub === "time" || sub === "days") {
      newStartDate = today;
      newEndDate = today;
      newStartTime = "09:30";
      newEndTime = "18:30";
    }

    const currentWeekdays = 
      localUI.selectedDays.length > 0 ? localUI.selectedDays :
      localUI.selectedWeekDays.length > 0 ? localUI.selectedWeekDays :
      localUI.selectedMonthlyWeekDays;

    let computedDays: number[] = [];
    let computedSpecific: string[] = [];

    if (sub === "weekly" || sub === "days" || sub === "time") {
      computedDays = currentWeekdays.map((d) => DAY_NAME_TO_NUM[d]).filter(Boolean);
      if ((sub === "days" || sub === "time") && newStartDate && newEndDate && currentWeekdays.length > 0) {
        computedSpecific = weekdayNamesToDateStrings(newStartDate, newEndDate, currentWeekdays);
      }
    } else if (sub === "monthly") {
      if (newStartDate && newEndDate && currentWeekdays.length > 0) {
        computedDays = weekdayNamesToMonthDayNumbers(newStartDate, newEndDate, currentWeekdays);
        computedSpecific = weekdayNamesToDateStrings(newStartDate, newEndDate, currentWeekdays);
      }
    }

    setLocalUI((prev) => ({
      ...prev,
      scheduleSubType:         sub,
      selectedDays:            currentWeekdays,
      selectedWeekDays:        currentWeekdays,
      selectedMonthlyWeekDays: currentWeekdays,
      specificDates:           [],
      sectionStartDate:        newStartDate,
      sectionEndDate:          newEndDate,
      startTime:               newStartTime,
      endTime:                 newEndTime,
    }));
    
    const computedDuration = localUI.isTimerBased ? calcDurationHours(newStartTime, newEndTime) : scheduleObj.Task_Sch_Duaration;

    setScheduleObj((prev) => ({
      ...prev,
      Sch_Plan_Id:   planMap[sub as string] ?? 1,
      selectedDays:  computedDays,
      specificDates: computedSpecific,
      planDetails:   { Plan_Month: null, Plan_Day: null },
      Sch_Start_Date: newStartDate ? newStartDate.toDate() : null,
      Sch_End_Date:   newEndDate ? newEndDate.toDate() : null,
      Sch_Est_Start_Time: newStartTime,
      Sch_Est_End_Time: newEndTime,
      Task_Sch_Duaration: computedDuration,
    }));
    
    if (sub === "specific") {
      setCalendarKey(prev => prev + 1);
    }
  };

  // ── Date range ────────────────────────────────────────────────────────────
  const toDayjsValue = (value: unknown): Dayjs | null => {
    if (!value) return null;
    if (dayjs.isDayjs(value)) return value;
    if (value instanceof Date) return dayjs(value);
    return null;
  };

  const handleStartDateChange = (value: unknown) => {
    const date = toDayjsValue(value);
    const end = localUI.sectionEndDate;
    if (date && end) validateDates(date, end);

    const nextMonthlyWeekDays = localUI.scheduleSubType === "monthly" ? localUI.selectedMonthlyWeekDays : [];
    const nextDays = (localUI.scheduleSubType === "days" || localUI.scheduleSubType === "time") ? localUI.selectedDays : [];
    
    let computedDays = (localUI.scheduleSubType === "weekly" || localUI.scheduleSubType === "days" || localUI.scheduleSubType === "time")
      ? (scheduleObj?.selectedDays || [])
      : [];
    let nextSpecificDates = scheduleObj?.specificDates || [];

    if (localUI.scheduleSubType === "monthly" && date && end && nextMonthlyWeekDays.length > 0) {
      computedDays = weekdayNamesToMonthDayNumbers(date, end, nextMonthlyWeekDays);
      nextSpecificDates = weekdayNamesToDateStrings(date, end, nextMonthlyWeekDays);
    } else if ((localUI.scheduleSubType === "days" || localUI.scheduleSubType === "time") && date && end && nextDays.length > 0) {
      nextSpecificDates = weekdayNamesToDateStrings(date, end, nextDays);
    }

    setLocalUI((prev) => ({
      ...prev,
      sectionStartDate:        date,
      selectedDays:            nextDays,
      selectedWeekDays:        localUI.scheduleSubType === "weekly" ? prev.selectedWeekDays : [],
      selectedMonthlyWeekDays: nextMonthlyWeekDays,
      specificDates:           [],
    }));
    setScheduleObj?.({
      ...scheduleObj!,
      Sch_Start_Date: date ? date.toDate() : null,
      selectedDays:   computedDays,
      specificDates:  nextSpecificDates,
    });
  };

  const handleEndDateChange = (value: unknown) => {
    const date = toDayjsValue(value);
    const start = localUI.sectionStartDate;
    if (date && start) validateDates(start, date);

    const nextMonthlyWeekDays = localUI.scheduleSubType === "monthly" ? localUI.selectedMonthlyWeekDays : [];
    const nextDays = (localUI.scheduleSubType === "days" || localUI.scheduleSubType === "time") ? localUI.selectedDays : [];

    let computedDays = (localUI.scheduleSubType === "weekly" || localUI.scheduleSubType === "days" || localUI.scheduleSubType === "time")
      ? (scheduleObj?.selectedDays || [])
      : [];
    let nextSpecificDates = scheduleObj?.specificDates || [];

    if (localUI.scheduleSubType === "monthly" && start && date && nextMonthlyWeekDays.length > 0) {
      computedDays = weekdayNamesToMonthDayNumbers(start, date, nextMonthlyWeekDays);
      nextSpecificDates = weekdayNamesToDateStrings(start, date, nextMonthlyWeekDays);
    } else if ((localUI.scheduleSubType === "days" || localUI.scheduleSubType === "time") && start && date && nextDays.length > 0) {
      nextSpecificDates = weekdayNamesToDateStrings(start, date, nextDays);
    }

    setLocalUI((prev) => ({
      ...prev,
      sectionEndDate:          date,
      selectedDays:            nextDays,
      selectedWeekDays:        localUI.scheduleSubType === "weekly" ? prev.selectedWeekDays : [],
      selectedMonthlyWeekDays: nextMonthlyWeekDays,
      specificDates:           [],
    }));
    setScheduleObj?.({
      ...scheduleObj!,
      Sch_End_Date:  date ? date.toDate() : null,
      selectedDays:  computedDays,
      specificDates: nextSpecificDates,
    });
  };

  // ── Time change handlers ──────────────────────────────────────────────────
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    handleUIChange("startTime", newTime);
    if (localUI.isTimerBased) {
      const computed = calcDurationHours(newTime, localUI.endTime);
      setScheduleObj?.({ ...scheduleObj!, Sch_Est_Start_Time: newTime, Task_Sch_Duaration: computed });
    } else {
      setScheduleObj?.({ ...scheduleObj!, Sch_Est_Start_Time: newTime });
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    handleUIChange("endTime", newTime);
    if (localUI.isTimerBased) {
      const computed = calcDurationHours(localUI.startTime, newTime);
      setScheduleObj?.({ ...scheduleObj!, Sch_Est_End_Time: newTime, Task_Sch_Duaration: computed });
    } else {
      setScheduleObj?.({ ...scheduleObj!, Sch_Est_End_Time: newTime });
    }
  };

  // ── Timer Based toggle ────────────────────────────────────────────────────
  const handleTimerBasedChange = (checked: boolean) => {
    handleUIChange("isTimerBased", checked);
    if (checked) {
      const computed = calcDurationHours(localUI.startTime, localUI.endTime);
      setScheduleObj?.({ ...scheduleObj!, Task_Sch_Timer_Based: true, Task_Sch_Duaration: computed });
    } else {
      setScheduleObj?.({ ...scheduleObj!, Task_Sch_Timer_Based: false, Task_Sch_Duaration: 0 });
    }
  };

  // ── Plan 2 · Days & Plan 1 · Time ─────────────────────────────────────────
  const handleDayToggle = (day: string) => {
    if (isFormDisabled) return;
    const next = localUI.selectedDays.includes(day)
      ? localUI.selectedDays.filter((d) => d !== day)
      : [...localUI.selectedDays, day];
    
    setLocalUI((prev) => ({ ...prev, selectedDays: next }));

    setScheduleObj?.({
      ...scheduleObj!,
      selectedDays:  next.map((d) => DAY_NAME_TO_NUM[d]).filter(Boolean),
      specificDates: [],
      Sch_Plan_Id:   localUI.scheduleSubType === "time" ? 1 : 2,
    });
  };

  const handleToggleAllDays = (avail: string[]) => {
    if (isFormDisabled) return;
    const all  = avail.every((d) => localUI.selectedDays.includes(d));
    const next = all ? [] : avail;
    
    setLocalUI((prev) => ({ ...prev, selectedDays: next }));

    setScheduleObj?.({
      ...scheduleObj!,
      selectedDays:  next.map((d) => DAY_NAME_TO_NUM[d]).filter(Boolean),
      specificDates: [],
      Sch_Plan_Id:   localUI.scheduleSubType === "time" ? 1 : 2,
    });
  };

  // ── Plan 3 · Weekly ───────────────────────────────────────────────────────
  const handleWeekDayToggle = (day: string) => {
    if (isFormDisabled) return;
    const next = localUI.selectedWeekDays.includes(day)
      ? localUI.selectedWeekDays.filter((d) => d !== day)
      : [...localUI.selectedWeekDays, day];
    setLocalUI((prev) => ({ ...prev, selectedWeekDays: next }));
    setScheduleObj?.({
      ...scheduleObj!,
      selectedDays: next.map((d) => DAY_NAME_TO_NUM[d]).filter(Boolean),
      Sch_Plan_Id: 3,
    });
  };

  const handleToggleAllWeekDays = (avail: string[]) => {
    if (isFormDisabled) return;
    const all  = avail.every((d) => localUI.selectedWeekDays.includes(d));
    const next = all ? [] : avail;
    setLocalUI((prev) => ({ ...prev, selectedWeekDays: next }));
    setScheduleObj?.({
      ...scheduleObj!,
      selectedDays: next.map((d) => DAY_NAME_TO_NUM[d]).filter(Boolean),
      Sch_Plan_Id: 3,
    });
  };

  // ── Plan 4 · Monthly ─────────────────────────────────────────────────────
  const handleMonthlyWeekDayToggle = (day: string) => {
    if (isFormDisabled || !localUI.sectionStartDate || !localUI.sectionEndDate) return;
    const next = localUI.selectedMonthlyWeekDays.includes(day)
      ? localUI.selectedMonthlyWeekDays.filter((d) => d !== day)
      : [...localUI.selectedMonthlyWeekDays, day];
    
    setLocalUI((prev) => ({ ...prev, selectedMonthlyWeekDays: next }));

    const dayNums = weekdayNamesToMonthDayNumbers(
      localUI.sectionStartDate,
      localUI.sectionEndDate,
      next
    );

    const specDates = weekdayNamesToDateStrings(
      localUI.sectionStartDate,
      localUI.sectionEndDate,
      next
    );

    setScheduleObj?.({
      ...scheduleObj!,
      selectedDays:  dayNums,
      specificDates: specDates,
      Sch_Plan_Id:   4,
      planDetails:   { Plan_Month: null, Plan_Day: null },
    });
  };

  const handleToggleAllMonthlyWeekDays = (avail: string[]) => {
    if (isFormDisabled || !localUI.sectionStartDate || !localUI.sectionEndDate) return;
    const all  = avail.every((d) => localUI.selectedMonthlyWeekDays.includes(d));
    const next = all ? [] : avail;
    
    setLocalUI((prev) => ({ ...prev, selectedMonthlyWeekDays: next }));

    const dayNums = weekdayNamesToMonthDayNumbers(
      localUI.sectionStartDate,
      localUI.sectionEndDate,
      next
    );

    const specDates = weekdayNamesToDateStrings(
      localUI.sectionStartDate,
      localUI.sectionEndDate,
      next
    );

    setScheduleObj?.({
      ...scheduleObj!,
      selectedDays:  dayNums,
      specificDates: specDates,
      Sch_Plan_Id:   4,
      planDetails:   { Plan_Month: null, Plan_Day: null },
    });
  };

  // ── Plan 5 · Specific dates ───────────────────────────────────────────────
  const handleSpecificDateToggle = (value: unknown) => {
    if (isFormDisabled) return;
    const date = toDayjsValue(value);
    if (!date) return;

    const ds = date.format("YYYY-MM-DD");

    const nextDates = localUI.specificDates.includes(ds)
      ? localUI.specificDates.filter((d) => d !== ds)
      : [...localUI.specificDates, ds].sort();

    const { start, end } = deriveRangeFromSpecific(nextDates);

    setLocalUI((prev) => ({
      ...prev,
      specificDates:    nextDates,
      sectionStartDate: start,
      sectionEndDate:   end,
    }));

    setScheduleObj?.({
      ...scheduleObj!,
      specificDates:  nextDates,
      selectedDays:   [],
      Sch_Plan_Id:    5,
      Sch_Start_Date: start ? start.toDate() : null,
      Sch_End_Date:   end   ? end.toDate()   : null,
    });

    setCalendarKey((p) => p + 1);
  };

  const handleClearAllDates = () => {
    if (isFormDisabled) return;
    setLocalUI((prev) => ({
      ...prev,
      specificDates:    [],
      sectionStartDate: null,
      sectionEndDate:   null,
    }));
    setScheduleObj?.({
      ...scheduleObj!,
      specificDates:  [],
      selectedDays:   [],
      Sch_Plan_Id:    5,
      Sch_Start_Date: null,
      Sch_End_Date:   null,
    });
    setCalendarKey((p) => p + 1);
  };

  const handleRemoveDate = (dr: string) => {
    if (isFormDisabled) return;
    const nextDates = localUI.specificDates.filter((d) => d !== dr);
    const { start, end } = deriveRangeFromSpecific(nextDates);
    setLocalUI((prev) => ({
      ...prev,
      specificDates:    nextDates,
      sectionStartDate: start,
      sectionEndDate:   end,
    }));
    setScheduleObj?.({
      ...scheduleObj!,
      specificDates:  nextDates,
      selectedDays:   [],
      Sch_Start_Date: start ? start.toDate() : null,
      Sch_End_Date:   end   ? end.toDate()   : null,
    });
    setCalendarKey((p) => p + 1);
  };

  // ── Dialog actions ────────────────────────────────────────────────────────
  const handleClose = () => { onClose(); setDateError(""); };
  const handleSubmit = (isExtensionFlag?: boolean | any) => {
    const isExt = isExtensionFlag === true;
    // Validate that user has selected One-Time or Repetitive
    if (!localUI.durationType) {
      toast.error("Please select One-Time or Repetitive");
      return;
    }
    
    if (
      localUI.sectionStartDate && localUI.sectionEndDate &&
      !validateDates(localUI.sectionStartDate, localUI.sectionEndDate)
    ) {
      alert("Please fix date validation errors before submitting");
      return;
    }
    if (
      localUI.scheduleSubType === "specific" &&
      localUI.specificDates.length === 0
    ) {
      alert("Please select at least one specific date");
      return;
    }
    if (isViewMode) handleClose(); else onSubmit(isExt);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const availWeekdays = getAvailWeekdaysInRange(
    localUI.sectionStartDate, localUI.sectionEndDate
  );

  const monthlyPreviewNums =
    localUI.scheduleSubType === "monthly" &&
    localUI.sectionStartDate &&
    localUI.sectionEndDate &&
    localUI.selectedMonthlyWeekDays.length > 0
      ? weekdayNamesToDateStrings(
          localUI.sectionStartDate,
          localUI.sectionEndDate,
          localUI.selectedMonthlyWeekDays
        ).map((d) => dayjs(d).format("DD-MM-YYYY"))
      : [];

  const hasDateRange = !!(localUI.sectionStartDate && localUI.sectionEndDate);
  const noRangeMsg   = "Select start and end dates to see available options";

  const computedDurationHours = calcDurationHours(localUI.startTime, localUI.endTime);

  // ── Shared card style ─────────────────────────────────────────────────────
  const itemBoxSx = (isSelected: boolean) => ({
    cursor: isFormDisabled ? "default" : "pointer",
    textAlign: "center" as const,
    p: 1.5,
    borderRadius: 2,
    border: "2px solid",
    borderColor:     isSelected ? "#d2a56d" : "#e0e0e0",
    backgroundColor: isSelected ? "#d2a56d" : "white",
    color:           isSelected ? "white"   : "text.primary",
    transition: "all 0.2s",
    userSelect: "none" as const,
    minWidth: 52,
    "&:hover": {
      transform: isFormDisabled ? "none" : "scale(1.05)",
      boxShadow: isFormDisabled ? "none" : 2,
    },
  });

  const SectionHeader = ({
    title, showToggle, allSelected, onToggle,
  }: {
    title: string;
    showToggle: boolean;
    allSelected: boolean;
    onToggle: () => void;
  }) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
      {showToggle && !isFormDisabled && (
        <Button size="small" variant="text" onClick={onToggle}>
          {allSelected ? "Deselect All" : "Select All"}
        </Button>
      )}
    </Box>
  );

  const WeekdayCardGrid = ({
    items, isItemSelected, onItemClick, emptyMsg,
  }: {
    items: string[];
    isItemSelected: (item: string) => boolean;
    onItemClick: (item: string) => void;
    emptyMsg?: string;
  }) => {
    if (items.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mt: 1 }}>
          {emptyMsg ?? noRangeMsg}
        </Typography>
      );
    }
    return (
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: "repeat(auto-fit, minmax(52px, 1fr))",
        }}
      >
        {items.map((item) => (
          <Box key={item} onClick={() => {
            if (isFormDisabled) return;
            onItemClick(item);
          }} sx={itemBoxSx(isItemSelected(item))}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
              {item.slice(0, 3)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // ── Time pickers ──────────────────────────────────────────────────────────
  const TimePickers = () =>
    isViewMode ? (
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Start Time</Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {formatTimeDisplay(localUI.startTime)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">End Time</Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {formatTimeDisplay(localUI.endTime)}
          </Typography>
        </Box>
        {localUI.isTimerBased && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">Duration</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatDurationString(computedDurationHours)}
            </Typography>
          </Box>
        )}
      </Box>
    ) : (
      <Box sx={{ display: "flex", gap: 2, mt: 2, alignItems: "flex-start" }}>
        <TextField
          type="time" label="Start Time" size="small" fullWidth
          value={localUI.startTime} onChange={handleStartTimeChange}
          InputLabelProps={{ shrink: true }} disabled={isFormDisabled}
          inputProps={{ step: 300 }}
          sx={{ flex: 1 }}
        />
        <TextField
          type="time" label="End Time" size="small" fullWidth
          value={localUI.endTime} onChange={handleEndTimeChange}
          InputLabelProps={{ shrink: true }} disabled={isFormDisabled}
          inputProps={{ step: 300 }}
          sx={{ flex: 1 }}
        />
        <Box
          sx={{
            minWidth: 90,
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            backgroundColor: localUI.isTimerBased ? "#fdf6ec" : "#f5f5f5",
            border: "1px solid",
            borderColor: localUI.isTimerBased ? "#f0c87a" : "#e0e0e0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, lineHeight: 1.2 }}>
            Duration
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: localUI.isTimerBased ? "#7a5c1e" : "text.secondary",
              fontSize: 14,
            }}
          >
            {formatDurationString(computedDurationHours)}
          </Typography>
        </Box>
      </Box>
    );

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE DIALOG
  // ─────────────────────────────────────────────────────────────────────────
  if (isDeleteMode) {
    return (
      <AppDialog
        open={open} onClose={handleClose}
        title="Delete Project Schedule"
        onSubmit={onSubmit} submitText="Delete" closeText="Cancel"
      >
        <Typography>
          Are you sure you want to delete this schedule?
          {selectedId && (
            <Typography variant="caption" display="block">ID: {selectedId}</Typography>
          )}
        </Typography>
      </AppDialog>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN DIALOG
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AppDialog
      open={open}
      onClose={handleClose}
      title={
        isCreateMode ? "Create Project Schedule"
        : isEditMode  ? "Edit Project Schedule"
        : "View Project Schedule"
      }
      onSubmit={handleSubmit}
      submitText={isViewMode ? "Close" : "Save"}
      closeText="Cancel"
      maxWidth="md"
      fullWidth
      disableEnforceFocus={true}
      PaperPropsSx={{ 
        maxHeight: "90vh",
        minHeight: "780px"
      }}
      extraActions={
        isEditMode ? (
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleSubmit(true)}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Extension
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, p: 0.5 }}>

          {/* Schedule No */}
          <TextField
            label="Schedule No" value={scheduleObj?.Sch_No || ""}
            onChange={(e) =>
              setScheduleObj?.({ ...scheduleObj!, Sch_No: e.target.value })
            }
            disabled={isFormDisabled} size="small" fullWidth required
          />

          {/* ── 1. Project ── */}
          <FormControl fullWidth size="small" required>
            <InputLabel>Project</InputLabel>
            <SearchableSelect
              name="Project_Id" 
              value={scheduleObj?.Project_Id || 0}
              onChange={handleSelectChange as any} 
              label="Project"
              disabled={isFormDisabled || disableTaskSelection}
              searchPlaceholder="Search project..."
              allOptionLabel="Select Project"
              allOptionValue={0}
              options={projectOptions.map((p) => ({
                value: p.value,
                label: p.label
              }))}
            />
          </FormControl>

          {/* ── 2. Task Type (depends on Project) ── */}
          <FormControl fullWidth size="small" required>
            <InputLabel>Task Type</InputLabel>
            <SearchableSelect
              name="Task_Type_Id" 
              value={scheduleObj?.Task_Type_Id || 0}
              onChange={handleSelectChange as any} 
              label="Task Type"
              disabled={isFormDisabled || !scheduleObj?.Project_Id || disableTaskSelection}
              searchPlaceholder="Search task type..."
              allOptionLabel={
                !scheduleObj?.Project_Id
                  ? "Select a project first"
                  : taskTypeOptions.filter((tt) => tt.Project_Id === scheduleObj?.Project_Id || tt.Task_Type_Id === scheduleObj?.Task_Type_Id).length === 0 && scheduleObj?.Project_Id
                  ? "No task types available"
                  : "Select Task Type"
              }
              allOptionValue={0}
              options={taskTypeOptions
                .filter((tt) => tt.Project_Id === scheduleObj?.Project_Id || tt.Task_Type_Id === scheduleObj?.Task_Type_Id)
                .map((tt) => ({
                  value: tt.Task_Type_Id,
                  label: tt.Task_Type
              }))}
            />
          </FormControl>

          {/* ── 3. Task (depends on Task Type) ── */}
          <FormControl fullWidth size="small" required>
            <InputLabel>Task</InputLabel>
            <SearchableSelect
              name="Task_Id" 
              value={scheduleObj?.Task_Id || 0}
              onChange={handleSelectChange as any} 
              label="Task"
              disabled={isFormDisabled || !scheduleObj?.Task_Type_Id || disableTaskSelection}
              searchPlaceholder="Search task..."
              allOptionLabel={
                !scheduleObj?.Task_Type_Id
                  ? "Select a task type first"
                  : taskOptions.length === 0 && scheduleObj?.Task_Type_Id
                  ? "No tasks available"
                  : "Select Task"
              }
              allOptionValue={0}
              options={taskOptions
                .filter(t => !t.Task_Type_Id || !scheduleObj?.Task_Type_Id || t.Task_Type_Id === scheduleObj?.Task_Type_Id)
                .map((t) => ({
                  value: t.value,
                  label: t.label
              }))}
            />
          </FormControl>

          {/* ── 4. Status ── */}
          <FormControl fullWidth size="small" required>
            <InputLabel>Status</InputLabel>
            <SearchableSelect
              name="Sch_Status"
              value={scheduleObj?.Sch_Status || 1}
              onChange={handleSelectChange as any}
              label="Status"
              disabled={isFormDisabled}
              searchPlaceholder="Search status..."
              options={[
                { value: 1, label: "Inprocess" },
                { value: 2, label: "Pending" },
                { value: 3, label: "Completed" }
              ]}
            />
          </FormControl>

          {/* ═══ FIRST DATES (Visible only in Edit Mode / View Mode) ═══ */}
          {(isEditMode || isViewMode) && (
            <Box sx={{ border: "1px solid #e0e0e0", p: 2, borderRadius: 1, mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                First Dates
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <MobileDatePicker
                    label="Sch First Start Date"
                    value={scheduleObj?.Sch_First_Start_Date ? dayjs(scheduleObj.Sch_First_Start_Date) : null}
                    onChange={(date) => {
                      if (!isFormDisabled && setScheduleObj && scheduleObj) {
                        setScheduleObj({ ...scheduleObj, Sch_First_Start_Date: date ? (date as any).toDate() : null });
                      }
                    }}
                    disabled={isFormDisabled}
                    format="DD-MM-YYYY"
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                  <MobileDatePicker
                    label="Sch First End Date"
                    value={scheduleObj?.Sch_First_End_Date ? dayjs(scheduleObj.Sch_First_End_Date) : null}
                    onChange={(date) => {
                      if (!isFormDisabled && setScheduleObj && scheduleObj) {
                        setScheduleObj({ ...scheduleObj, Sch_First_End_Date: date ? (date as any).toDate() : null });
                      }
                    }}
                    disabled={isFormDisabled}
                    format="DD-MM-YYYY"
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                </Box>
              </LocalizationProvider>
            </Box>
          )}

          {/* Duration header - User manually selects One-Time or Repetitive */}
          <Box
            sx={{
              backgroundColor: "#d2a56d", px: 2, py: 1, borderRadius: 1,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <Typography color="#fff">Schedule Type</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              {(["oneTime", "repetitive"] as const).map((dt) => (
                <FormControlLabel
                  key={dt}
                  control={
                    <Checkbox
                      checked={localUI.durationType === dt}
                      onChange={() => handleDurationTypeChange(dt)}
                      disabled={isFormDisabled}
                      size="small"
                      sx={{ color: "#fff", "&.Mui-checked": { color: "#fff" } }}
                    />
                  }
                  label={
                    <Typography color="#fff">
                      {dt === "oneTime" ? "One-Time" : "Repetitive"}
                    </Typography>
                  }
                />
              ))}
            </Box>
          </Box>

          {/* Schedule sub-type radios */}
          <Box sx={{ border: "1px solid #e0e0e0", p: 2, borderRadius: 1 }}>
            <RadioGroup
              row
              value={localUI.scheduleSubType}
              onChange={(e) =>
                handleScheduleSubTypeChange(
                  e.target.value as LocalUIState["scheduleSubType"]
                )
              }
            >
              <FormControlLabel value="time"     control={<Radio disabled={isFormDisabled} />} label="Time" />
              <FormControlLabel value="days"     control={<Radio disabled={isFormDisabled} />} label="Days" />
              <FormControlLabel value="weekly"   control={<Radio disabled={isFormDisabled} />} label="Weekly" />
              <FormControlLabel value="monthly"  control={<Radio disabled={isFormDisabled} />} label="Monthly" />
              <FormControlLabel value="specific" control={<Radio disabled={isFormDisabled} />} label="Specific Days" />
            </RadioGroup>

              {/* ═══ DATE RANGE & TIME PICKERS (Always Visible) ═══ */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  <MobileDatePicker
                    label="Start Date"
                    value={localUI.sectionStartDate}
                    onChange={handleStartDateChange}
                    disabled={isFormDisabled}
                    format="DD-MM-YYYY"
                    slotProps={{
                      textField: { size: "small", fullWidth: true, error: !!dateError },
                    }}
                  />
                  <MobileDatePicker
                    label="End Date"
                    value={localUI.sectionEndDate}
                    onChange={handleEndDateChange}
                    disabled={isFormDisabled}
                    format="DD-MM-YYYY"
                    slotProps={{
                      textField: {
                        size: "small", fullWidth: true,
                        error: !!dateError, helperText: dateError,
                      },
                    }}
                  />
                </Box>
              </LocalizationProvider>

              <TimePickers />

              {/* Conditional Content Based on Selection */}
              {localUI.scheduleSubType === "specific" ? (
                /* ═══ SPECIFIC DATES (Plan 5) ═══ */
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Select Specific Dates
                    </Typography>
                    {!isFormDisabled && localUI.specificDates.length > 0 && (
                      <Button size="small" onClick={handleClearAllDates} variant="outlined" color="error">
                        Clear All
                      </Button>
                    )}
                  </Box>

                  {localUI.specificDates.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                      {localUI.specificDates.length} date{localUI.specificDates.length !== 1 ? "s" : ""} selected
                      {localUI.sectionStartDate && localUI.sectionEndDate && (
                        <>
                          &nbsp;·&nbsp;Range: {localUI.sectionStartDate.format("DD-MM-YYYY")}
                          &nbsp;→&nbsp;{localUI.sectionEndDate.format("DD-MM-YYYY")}
                        </>
                      )}
                    </Typography>
                  )}

                  {localUI.specificDates.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5, fontStyle: "italic" }}>
                      Click on calendar dates to select them. Each selected date will be saved as a task work date.
                    </Typography>
                  )}

                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <StaticDatePicker
                      key={calendarKey}
                      displayStaticWrapperAs="desktop"
                      openTo="day"
                      value={null}
                      onChange={handleSpecificDateToggle}
                      slots={{ day: CustomPickersDay }}
                      slotProps={{
                        day: {
                          selectedDates: localUI.specificDates.map((d) => dayjs(d)),
                         
                        } as any,
                      }}
                      disabled={isFormDisabled}
                      shouldDisableDate={(date) => {
                        if (type === "edit" || type === "view") {
                          const formatted = date.format("YYYY-MM-DD");
                          return !initialSavedDates.includes(formatted);
                        }
                        return false;
                      }}
                      sx={{ width: "100%", bgcolor: "white", borderRadius: 2 }}
                    />
                  </LocalizationProvider>

                  {localUI.specificDates.length > 0 && (
                    <Paper variant="outlined" sx={{ mt: 2, maxHeight: 200, overflow: "auto" }}>
                      <List dense>
                        {localUI.specificDates
                          .slice()
                          .sort()
                          .map((date) => (
                          <ListItem key={date}>
                            <ListItemText
                              primary={dayjs(date).format("DD-MM-YYYY (dddd)")}
                            />
                            {!isFormDisabled && (
                              <IconButton edge="end" size="small" onClick={() => handleRemoveDate(date)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}

                  {localUI.specificDates.length > 0 && (
                    <Box
                      sx={{
                        mt: 2, p: 1.5,
                        backgroundColor: "#f0f7ed",
                        borderRadius: 1,
                        border: "1px solid #a5d6a7",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#2e7d32", fontWeight: 600 }}>
                        {localUI.specificDates.length} task work date
                        {localUI.specificDates.length !== 1 ? "s" : ""} will be saved to the database
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#388e3c", display: "block", mt: 0.5 }}>
                        Each selected date creates one row in tbl_Project_Sch_Task_DT
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : localUI.scheduleSubType !== "" ? (
                /* ═══ TIME / DAYS / WEEKLY / MONTHLY ═══ */
                <>
                  {/* ── DAYS (Plan 2) & TIME (Plan 1) ── */}
                  {(localUI.scheduleSubType === "days" || localUI.scheduleSubType === "time") && (
                    <Box sx={{ mt: 2 }}>
                      <SectionHeader
                        title="Select Days"
                        showToggle={hasDateRange && availWeekdays.length > 0}
                        allSelected={
                          availWeekdays.length > 0 &&
                          availWeekdays.every((d) => localUI.selectedDays.includes(d))
                        }
                        onToggle={() => handleToggleAllDays(availWeekdays)}
                      />
                      <WeekdayCardGrid
                        items={availWeekdays}
                        isItemSelected={(d) => localUI.selectedDays.includes(d)}
                        onItemClick={handleDayToggle}
                        emptyMsg={hasDateRange ? "No days in the selected range" : noRangeMsg}
                      />

                    </Box>
                  )}

                  {/* ── WEEKLY (Plan 3) ── */}
                  {localUI.scheduleSubType === "weekly" && (
                    <Box sx={{ mt: 2 }}>
                      <SectionHeader
                        title="Select Days of the Week"
                        showToggle={hasDateRange && availWeekdays.length > 0}
                        allSelected={
                          availWeekdays.length > 0 &&
                          availWeekdays.every((d) => localUI.selectedWeekDays.includes(d))
                        }
                        onToggle={() => handleToggleAllWeekDays(availWeekdays)}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                        Select which days of the week this schedule should repeat
                      </Typography>
                      <WeekdayCardGrid
                        items={availWeekdays}
                        isItemSelected={(d) => localUI.selectedWeekDays.includes(d)}
                        onItemClick={handleWeekDayToggle}
                        emptyMsg={hasDateRange ? "No days in the selected range" : noRangeMsg}
                      />
                    </Box>
                  )}

                  {/* ── MONTHLY (Plan 4) ── */}
                  {localUI.scheduleSubType === "monthly" && (
                    <Box sx={{ mt: 2 }}>
                      <SectionHeader
                        title="Select Days of the Week"
                        showToggle={hasDateRange && availWeekdays.length > 0}
                        allSelected={
                          availWeekdays.length > 0 &&
                          availWeekdays.every((d) =>
                            localUI.selectedMonthlyWeekDays.includes(d)
                          )
                        }
                        onToggle={() => handleToggleAllMonthlyWeekDays(availWeekdays)}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                        Pick weekdays — every occurrence of those days within
                        the date range will be created as a task work date.
                      </Typography>
                      <WeekdayCardGrid
                        items={availWeekdays}
                        isItemSelected={(d) =>
                          localUI.selectedMonthlyWeekDays.includes(d)
                        }
                        onItemClick={handleMonthlyWeekDayToggle}
                        emptyMsg={hasDateRange ? "No days in the selected range" : noRangeMsg}
                      />
                      {monthlyPreviewNums.length > 0 && (
                        <Box
                          sx={{
                            mt: 2, p: 1.5,
                            backgroundColor: "#fdf6ec",
                            borderRadius: 1,
                            border: "1px solid #f0c87a",
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "#7a5c1e", fontWeight: 600 }}>
                            {monthlyPreviewNums.length} task work date
                            {monthlyPreviewNums.length !== 1 ? "s" : ""} will be created
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#7a5c1e", display: "block", mt: 0.5 }}>
                            Dates in range: {monthlyPreviewNums.join(", ")}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </>
              ) : null}
          </Box>

          {/* Timer Based */}
          <FormControlLabel
            control={
              <Checkbox
                checked={localUI.isTimerBased}
                onChange={(e) => handleTimerBasedChange(e.target.checked)}
                disabled={isFormDisabled}
              />
            }
            label="Timer Based"
          />

          {localUI.isTimerBased && (
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor: "#fdf6ec",
                border: "1px solid #f0c87a",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Timer Duration (auto-calculated from Start → End Time)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#7a5c1e" }}>
                  {formatDurationString(computedDurationHours)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#a07840" }}>
                  {formatTimeDisplay(localUI.startTime)} → {formatTimeDisplay(localUI.endTime)}
                  {computedDurationHours === 0 && (
                    <span style={{ color: "#c62828", marginLeft: 8 }}>
                      ⚠ Start and End times are the same
                    </span>
                  )}
                </Typography>
              </Box>
              <TextField
                label="Duration"
                value={formatDurationString(computedDurationHours)}
                size="small"
                InputProps={{ readOnly: true }}
                inputProps={{ style: { textAlign: "center", fontWeight: 700, color: "#7a5c1e" } }}
                sx={{ width: 130, "& .MuiOutlinedInput-root": { backgroundColor: "white" } }}
                helperText="Auto-calculated"
              />
            </Box>
          )}
        </Box>
      )}
    </AppDialog>
  );
};