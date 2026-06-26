/* eslint-disable no-extra-boolean-cast */
// utils/index.ts
import CryptoJS from "crypto-js";

// Types
export interface NumberRange {
  min: number;
  max: number;
}

export interface SessionUser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface JSONParseResult<T = any> {
  isJSON: boolean;
  data?: T;
}

export interface DateRange {
  Fromdate: string;
  Todate: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GroupedData<T = any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  groupedData: T[];
}

// Type guards
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
};

export const getSessionUser = (): { storage: string | null; user: SessionUser } => {
  const storage = localStorage.getItem('user');
  let user: SessionUser = {};
  
  if (storage && isValidJSON(storage)) {
    try {
      user = JSON.parse(storage);
    } catch {
      user = {};
    }
  }
  
  return { storage, user };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isValidObject = (obj: any): boolean => {
  return obj !== null && 
         typeof obj === 'object' && 
         !Array.isArray(obj) && 
         Object.keys(obj).length > 0;
};

export const storageValue = isValidObject(getSessionUser().user) ? getSessionUser().user : {};

export const toArray = <T>(array: T[] | undefined | null): T[] => {
  return Array.isArray(array) ? array : [];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isArray = (array: any): array is any[] => {
  return Array.isArray(array);
};

// Encryption/Decryption
export const encryptPasswordFun = (str: string, secretKey: string): string => {
  return CryptoJS.AES.encrypt(str, secretKey).toString();
};

export const decryptPasswordFun = (str: string, secretKey: string): string => {
  const decrypt = CryptoJS.AES.decrypt(str, secretKey);
  const decryptedText = decrypt.toString(CryptoJS.enc.Utf8);
  return decryptedText;
};

// Date and Time Functions
export const getDaysInMonth = (year: number, month: number): number => {
  // Month is 0-indexed in JavaScript Date (0 = January, 11 = December)
  return new Date(year, month + 1, 0).getDate();
};

export const LocalDate = (dateObj?: string | Date): string => {
  const receivedDate = dateObj ? new Date(dateObj) : new Date();
  
  // Check if date is valid
  if (isNaN(receivedDate.getTime())) {
    return 'Invalid Date';
  }
  
  return receivedDate.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

export const LocalDateWithTime = (dateObj?: string | Date): string => {
  const receivedDate = dateObj ? new Date(dateObj) : new Date();
  
  if (isNaN(receivedDate.getTime())) {
    return 'Invalid Date';
  }
  
  return receivedDate.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

export const getDaysBetween = (invoiceDateStr: string, currentDateStr: string = new Date().toISOString()): number => {
  const invoiceDate = new Date(invoiceDateStr);
  const currentDate = new Date(currentDateStr);

  if (isNaN(invoiceDate.getTime()) || isNaN(currentDate.getTime())) {
    return 0;
  }

  invoiceDate.setUTCHours(0, 0, 0, 0);
  currentDate.setUTCHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffInMs = currentDate.getTime() - invoiceDate.getTime();
  const diffInDays = Math.floor(diffInMs / msPerDay);

  return diffInDays;
};

export const DaysBetween = (StartDate: Date, EndDate: Date): number => {
  if (isNaN(StartDate.getTime()) || isNaN(EndDate.getTime())) {
    return 0;
  }

  const oneDay = 1000 * 60 * 60 * 24;
  const start = Date.UTC(StartDate.getFullYear(), StartDate.getMonth(), StartDate.getDate());
  const end = Date.UTC(EndDate.getFullYear(), EndDate.getMonth(), EndDate.getDate());
  
  return Math.round((end - start) / oneDay) + 1;
};

export const LocalTime = (dateObj?: string | Date): string => {
  const receivedDate = dateObj ? new Date(dateObj) : new Date();
  
  if (isNaN(receivedDate.getTime())) {
    return 'Invalid Time';
  }
  
  return receivedDate.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

export const getMonth = (date?: Date): string => {
  const targetDate = date || new Date();
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const TimeDisplay = (dateObj: string | Date): string => {
  const reqTime = new Date(dateObj);
  
  if (isNaN(reqTime.getTime())) {
    return 'Invalid Time';
  }
  
  let hours = reqTime.getHours();
  const minutes = reqTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
};

export const formatTime24 = (time24: string): string => {
  if (!time24 || !time24.includes(':')) {
    return '00:00 AM';
  }
  
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return '00:00 AM';
  }

  let hours12 = hours % 12;
  hours12 = hours12 || 12;
  const period = hours < 12 ? 'AM' : 'PM';
  const formattedHours = hours12 < 10 ? '0' + hours12 : hours12.toString();
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
  
  return `${formattedHours}:${formattedMinutes} ${period}`;
};

export const getCurrentTime = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const timeToDate = (time: string): Date => {
  if (!time || !time.includes(':')) {
    return new Date(Date.UTC(1970, 0, 1, 12, 0, 0));
  }

  const [hoursStr, minutesStr] = time.split(':').map(Number);
  const hours = isNaN(hoursStr) ? 12 : hoursStr;
  const minutes = isNaN(minutesStr) ? 0 : minutesStr;
  
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
};

export const combineDateTime = (date: string = ISOString(), time: string): string => {
  const isoDate = ISOString(date);
  const [yearStr, monthStr, dayStr] = isoDate.split('-').map(Number);
  const [hoursStr, minutesStr] = time.split(':').map(Number);

  const year = isNaN(yearStr) ? 1970 : yearStr;
  const month = isNaN(monthStr) ? 0 : monthStr - 1;
  const day = isNaN(dayStr) ? 1 : dayStr;
  const hours = isNaN(hoursStr) ? 0 : hoursStr;
  const minutes = isNaN(minutesStr) ? 0 : minutesStr;

  const combinedDate = new Date(year, month, day, hours, minutes, 0);
  return combinedDate.toISOString();
};

export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
};

export const getPreviousDate = (days?: string | number): string => {
  const num = days ? Number(days) : 1;
  if (isNaN(num)) return ISOString();
  
  const date = new Date();
  date.setDate(date.getDate() - num);
  return date.toISOString().split('T')[0];
};

export const firstDayOfMonth = (monthAndYear: string = ''): string => {
  const date = monthAndYear ? new Date(monthAndYear) : new Date();
  if (isNaN(date.getTime())) return ISOString();
  
  return new Date(date.getFullYear(), date.getMonth(), 2).toISOString().split('T')[0];
};

export const ISOString = (dateObj?: string | Date): string => {
  const receivedDate = dateObj ? new Date(dateObj) : new Date();
  
  if (isNaN(receivedDate.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  
  return receivedDate.toISOString().split('T')[0];
};

export const timeDuration = (startDate: string | Date, endDate: string | Date): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return '00:00:00';
  }

  const diff = end.getTime() - start.getTime();
  
  if (diff < 0) return '00:00:00';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (num: number): string => String(num).padStart(2, '0');
  
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const formatDateToCustom = (dateString: string | Date): string => {
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
};

export const customTimeDifference = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '00:00';
  
  const [startHoursStr, startMinutesStr] = startTime.split(':').map(Number);
  const [endHoursStr, endMinutesStr] = endTime.split(':').map(Number);
  
  const startHours = isNaN(startHoursStr) ? 0 : startHoursStr;
  const startMinutes = isNaN(startMinutesStr) ? 0 : startMinutesStr;
  const endHours = isNaN(endHoursStr) ? 0 : endHoursStr;
  const endMinutes = isNaN(endMinutesStr) ? 0 : endMinutesStr;

  const start = new Date(1970, 0, 1, startHours, startMinutes);
  const end = new Date(1970, 0, 1, endHours, endMinutes);
  
  const diff = end.getTime() - start.getTime();
  
  if (diff < 0) return '00:00';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  const pad = (num: number): string => String(num).padStart(2, '0');
  
  return `${pad(hours)}:${pad(minutes)}`;
};

export const timeDifferenceHHMM = (startDate: string | Date, endDate: string | Date): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return '00:00';
  }

  const diff = end.getTime() - start.getTime();
  
  if (diff < 0) return '00:00';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  const pad = (num: number): string => String(num).padStart(2, '0');
  
  return `${pad(hours)}:${pad(minutes)}`;
};

export const formatDateForTimeLocal = (dateInput?: string | Date): string => {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput || new Date());
    
    if (isNaN(date.getTime())) {
      return '00:00';
    }

    const pad = (num: number): string => num.toString().padStart(2, '0');
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${hours}:${minutes}`;
  } catch (e) {
    console.error('Error in formatDateForTimeLocal function:', e);
    return '00:00';
  }
};

export const formatDateForDatetimeLocal = (date?: Date): string => {
  try {
    const targetDate = date || new Date();
    
    if (isNaN(targetDate.getTime())) {
      const now = new Date();
      return formatDateForDatetimeLocal(now);
    }

    const pad = (num: number): string => num?.toString().padStart(2, '0') || '00';

    const year = targetDate.getFullYear();
    const month = pad(targetDate.getMonth() + 1);
    const day = pad(targetDate.getDate());
    const hours = pad(targetDate.getHours());
    const minutes = pad(targetDate.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    console.error('Error in formatDateForDatetimeLocal function:', e);
    const now = new Date();
    return formatDateForDatetimeLocal(now);
  }
};

// Number comparison functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEqualNumber = (a: any, b: any): boolean => {
  return Number(a) === Number(b);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toNumber = (value: any): number => {
  if (!value && value !== 0) return 0;
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return typeof value === 'number' ? value : 0;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEqualObject = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 == null || typeof obj1 !== 'object' ||
      obj2 == null || typeof obj2 !== 'object') {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key) || !isEqualObject(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
};

// Number formatting functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const NumberFormat = (num: any): string => {
  return toNumber(num).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const limitFractionDigits = (num: number = 0, maxFractionDigits: number = 2): number => {
  const factor = Math.pow(10, maxFractionDigits);
  return Math.round(num * factor) / factor;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RoundNumber = (num: any): string => {
  return checkIsNumber(num) ? Number(num).toFixed(2) : '0.00';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const indianCurrency = (number: any): string => {
  const num = toNumber(number);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num);
};

// Math operations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Addition = (a: any, b: any): number => limitFractionDigits(toNumber(a) + toNumber(b));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Subtraction = (a: any, b: any): number => limitFractionDigits(toNumber(a) - toNumber(b));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Multiplication = (a: any, b: any): number => limitFractionDigits(toNumber(a || 0) * toNumber(b || 0));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Division = (a: any, b: any): number => limitFractionDigits(toNumber(b) != 0 ? toNumber(a || 0) / toNumber(b || 1) : 0);

// String utilities
export const trimText = (text: string = '', replaceWith: string = '_'): string => {
  return String(text).trim().replace(/\s+/g, replaceWith ?? '_');
};

export const filterableText = (text: string): string => {
  try {
    return String(trimText(text, ' ')).toLowerCase();
  } catch (e) {
    console.error('Error while converting to filterable text:', e);
    return '';
  }
};

export const stringCompare = (str1: string, str2: string): boolean => {
  return filterableText(str1) === filterableText(str2);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validValue = (val: any): string => {
  return Boolean(val) ? String(val) : '';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkIsNumber = (num: any): boolean => {
  if (num === '' || num === null || num === undefined) return false;
  return !isNaN(Number(num));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseJSON = <T = any>(str: string): JSONParseResult<T> => {
  try {
    const value = JSON.parse(str);
    return { isJSON: true, data: value };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return { isJSON: false };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isObject = (val: any): boolean => {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
};

// Array operations
export const groupData = <T>(arr: T[], key: keyof T): GroupedData<T>[] => {
  if (!Array.isArray(arr) || !key) {
    return [];
  }

  return arr.reduce((acc: GroupedData<T>[], item: T) => {
    const groupKey = item[key];
    
    if (groupKey === undefined || groupKey === null) {
      return acc;
    }

    const groupIndex = acc.findIndex(
  group => group.groupKey === groupKey
);


    if (groupIndex === -1) {
      acc.push({
        [key as string]: groupKey,
        groupedData: [{ ...item }]
      } as GroupedData<T>);
    } else {
      acc[groupIndex].groupedData.push(item);
    }

    return acc;
  }, []);
};

export const calcTotal = <T>(arr: T[], column: keyof T): number => {
  if (!Array.isArray(arr)) return 0;
  
  return arr.reduce((total, obj) => {
    const value = obj[column];
    const numValue = typeof value === 'number' ? value : Number(value) || 0;
    return total + numValue;
  }, 0);
};

export const calcAvg = <T>(arr: T[], column: keyof T): number => {
  if (!Array.isArray(arr) || arr.length === 0 || !column) {
    return 0;
  }
  
  const total = calcTotal(arr, column);
  return total / arr.length;
};

export const getUniqueData = <T extends Record<string, unknown>>(
  arr: T[] = [],
  key: keyof T,
  returnObjectKeys: (keyof T)[] = []
): Array<Partial<T>> => {

  const uniqueArray: Array<Partial<T>> = [];
  const uniqueSet = new Set<T[keyof T]>();

  arr.forEach((obj) => {
    const keyValue = obj[key];

    if (!uniqueSet.has(keyValue)) {

      const uniqueObject: Partial<T> = {
        [key]: keyValue,
      } as Partial<T>;

      returnObjectKeys.forEach((returnKey) => {
        uniqueObject[returnKey] = obj[returnKey];
      });

      uniqueArray.push(uniqueObject);
      uniqueSet.add(keyValue);
    }
  });

 


  return uniqueArray.sort((a, b) => {
    const aVal = String(a[key]);
    const bVal = String(b[key]);
    return aVal.localeCompare(bVal);
  });
};

// Export all utility functions
export default {
  isValidJSON,
  getSessionUser,
  isValidObject,
  storageValue,
  toArray,
  isArray,
  encryptPasswordFun,
  decryptPasswordFun,
  getDaysInMonth, // Added this function to default export
  LocalDate,
  LocalDateWithTime,
  getDaysBetween,
  DaysBetween,
  LocalTime,
  getMonth,
  TimeDisplay,
  formatTime24,
  getCurrentTime,
  timeToDate,
  combineDateTime,
  isValidDate,
  getPreviousDate,
  firstDayOfMonth,
  ISOString,
  timeDuration,
  formatDateToCustom,
  customTimeDifference,
  timeDifferenceHHMM,
  formatDateForTimeLocal,
  formatDateForDatetimeLocal,
  isEqualNumber,
  toNumber,
  isEqualObject,
  NumberFormat,
  limitFractionDigits,
  RoundNumber,
  indianCurrency,
  Addition,
  Subtraction,
  Multiplication,
  Division,
  trimText,
  filterableText,
  stringCompare,
  validValue,
  checkIsNumber,
  parseJSON,
  isObject,
  groupData,
  calcTotal,
  calcAvg,
  getUniqueData
};