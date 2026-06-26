export const ddmmyyyy = (dateObj: Date | string): string => {
    const receivedDate = dateObj ? new Date(dateObj) : new Date();
    return receivedDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const ddmmyyyyhhmm = (dateObj: Date | string): string => {
    const receivedDate = dateObj ? new Date(dateObj) : new Date();
    return receivedDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const hhmm = (dateObj: Date | string): string => {
    const receivedDate = dateObj ? new Date(dateObj) : new Date();
    return receivedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export const yyyymmdd = (dateObj?: Date | string): string => {
    const receivedDate = dateObj ? new Date(dateObj) : new Date();
    return receivedDate.toISOString().split('T')[0]
}

export function isValidDate(value: unknown): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isValidObject = (obj: any) => {
    return isObject(obj) && Object.keys(obj).length !== 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isArray = (array: any) => Array.isArray(array);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toArray = (array: any) => isArray(array) ? array : [];

export const rid = (): string => {
    return (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `r${Math.random().toString(36).slice(2)}${Date.now()}`
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onlynum = (e: any) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.]/g, '');
    if ((value.match(/\./g) || []).length > 1) {
        value = value.slice(0, -1);
    }
    e.target.value = value;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onlynumAndNegative = (e: any) => {
    let value = e.target.value;

    value = value.replace(/[^0-9.-]/g, '');
    const minusCount = (value.match(/-/g) || []).length;
    if (minusCount > 1) {
        value = value.replace(/-/g, '');
        value = '-' + value;
    }

    if (value.includes('-') && !value.startsWith('-')) {
        value = value.replace(/-/g, '');
        value = '-' + value;
    }

    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts.shift() + '.' + parts.join('');
    }

    e.target.value = value;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNumber = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (value === '') return false; 
    
    return !isNaN(Number(value));
};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isObject = (val: any): boolean => {
    return Object.prototype.toString.call(val) === '[object Object]'
}

export const isValidJSON = (str: string): boolean => {
    try {
        JSON.parse(str);
        return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return false;
    }
}

export const randomNumber = (range: number = 10000000) => Math.floor(Math.random() * range) + 1;

export const toNumber = (value: number | string | null | undefined): number => {
    if (!value) return 0;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/,/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    }
    return typeof value === 'number' ? value : 0;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEqualNumber = (a: number | string | any, b: number | string | any): boolean => {
    return toNumber(a) === toNumber(b)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEqualObject = (obj1: any, obj2: any) => {
    if (obj1 === obj2) {
        return true;
    }

    if (!obj1 || typeof obj1 !== 'object' ||
        !obj2 || typeof obj2 !== 'object') {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    // eslint-disable-next-line prefer-const
    for (let key of keys1) {
        if (!keys2.includes(key) || !isEqualObject(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

export const NumberFormat = (num: number): string => {
    return toNumber(num).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export const limitFractionDigits = (num: number = 0, maxFractionDigits: number = 2): number => {
    const factor = Math.pow(10, maxFractionDigits);
    return Math.round(num * factor) / factor;
}

export const RoundNumber = (num: number): number => {
    return isNumber(num) ? limitFractionDigits(num, 2) : 0;
}

export const indianCurrency = (number: number | string): string => {
    const num = toNumber(number)
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(num)
};

export const Addition = (a: number | string, b: number | string): number => toNumber(a) + toNumber(b);

export const Subraction = (a: number | string, b: number | string): number => toNumber(a) - toNumber(b);

export const Multiplication = (a: number | string, b: number | string): number => toNumber(a) * toNumber(b);

export const Division = (a: number | string, b: number | string): number => b != 0 ? toNumber(a) / (toNumber(b) || 1) : 0;

export const trimText = (text: string = '', replaceWith: string | null = '_'): string => String(text).trim().replace(/\s+/g, replaceWith ?? '_');

export const filterableText = (text: string): string => {
    try {
        const txt = trimText(String(text), ' ').toLowerCase();
        return txt
    } catch (e) {
        console.log('Error while convert to filterable text:', e);
        return '';
    }
}

export const stringCompare = (str1: string, str2: string): boolean => filterableText(str1) === filterableText(str2);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseJSON = (str: string): { isJSON: boolean, data?: any } => {
    try {
        const value = JSON.parse(str);
        return { isJSON: true, data: value };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return { isJSON: false, };
    }
}

export const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPermutations = (arr: any[]): any[][] => {
    if (arr.length === 1) {
        return [arr];
    }

    const permutations = [];

    for (let i = 0; i < arr.length; i++) {
        const currentElement = arr[i];
        const remainingElements = arr.slice(0, i).concat(arr.slice(i + 1));
        const remainingPermutations = getPermutations(remainingElements);

        for (const perm of remainingPermutations) {
            permutations.push([currentElement, ...perm]);
        }
    }

    return permutations;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const groupData = (arr: any[], key: string): any[] => {
    if (isArray(arr) && key) {
        return arr.reduce((acc, item) => {
            const groupKey = item[key];

            if (groupKey === undefined || groupKey === null) {
                return acc;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const groupIndex = acc.findIndex((group: any) => group[key] === groupKey);

            if (groupIndex === -1) {
                acc.push({
                    [key]: groupKey,
                    groupedData: [{ ...item }]
                });
            } else {
                acc[groupIndex].groupedData.push(item);
            }

            return acc;
        }, []);
    } else {
        return [];
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const calcTotal = (arr: any[], column: string): number => arr.reduce((total, item) => Addition(total, item[column]), 0)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const calcAvg = (arr: any[], column: string): number => {
    const total = arr.reduce((total, item) => Addition(total, item[column]), 0);
    const count = arr.length;
    return count > 0 ? total / count : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUniqueData = (arr: any[] = [], key: string = '', returnObjectKeys: string[] = []): any[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueArray: any[] = [];
    const uniqueSet = new Set();

    arr.forEach(o => {
        if (!uniqueSet.has(o[key])) {
            const uniqueObject = { [key]: o[key] };
            returnObjectKeys.forEach(returnKey => {
                uniqueObject[returnKey] = o[returnKey];
            });

            uniqueArray.push(uniqueObject);
            uniqueSet.add(o[key]);
        }
    });

    return uniqueArray.sort((a, b) => String(a[key]).localeCompare(b[key]));
};

export const setSessionFilters = (obj: object = {}) => {
    if (!isObject(obj)) return;
    const newSessionValue = JSON.stringify(obj);
    sessionStorage.setItem('filterValues', newSessionValue);
}

export const getSessionFilters = (reqKey: string = '') => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionValue: any = sessionStorage.getItem('filterValues');
    const parsedValue = parseJSON(sessionValue).data;
    const isValidObject = isObject(parsedValue);

    if (isValidObject && Object.hasOwn(parsedValue, reqKey)) {
        return parsedValue.reqKey;
    } else if (isValidObject) {
        return parsedValue
    } else {
        return {}
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setSessionFilter = (key: string = '', value: any) => {
    if (key) {
        const sessinonValue = getSessionFilters();
        sessionStorage.setItem('filterValues', JSON.stringify({ ...sessinonValue, [key]: value }));
        return;
    }
}

export const getSessionDateFilter = (pageid: number): { Fromdate: Date | string, Todate: Date | string } => {
    const sessionFilter = getSessionFilters();
    const { Fromdate, Todate, pageID } = sessionFilter;

    const sessionDate: { Fromdate: Date | string, Todate: Date | string } = {
        Fromdate: (Fromdate && isValidDate(Fromdate)) ? Fromdate : yyyymmdd(),
        Todate: (Todate && isValidDate(Todate)) ? Todate : yyyymmdd(),
    };

    return (isNumber(pageid) && isEqualNumber(pageid, pageID)) ? sessionDate : {
        Fromdate: yyyymmdd(),
        Todate: yyyymmdd()
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSessionFiltersByPageId = (pageID: number): Record<string, any> => {

    const Fromdate = yyyymmdd(), Todate = yyyymmdd(), defaultValue = {
        Fromdate, Todate, pageID
    };

    if (!isNumber(pageID)) { return defaultValue };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionValue: any = sessionStorage.getItem('filterValues');
    const parsedValue = isValidJSON(sessionValue) ? JSON.parse(sessionValue) : {};
    const isValidObj = isValidObject(parsedValue);

    if (!isValidObj) { return defaultValue };

    const isEqualPage = isEqualNumber(parsedValue?.pageID, pageID);

    if (isEqualPage) {
        const getDefaultDateValue = getSessionDateFilter(pageID);
        return {
            ...parsedValue, ...getDefaultDateValue
        }
    } else {
        return defaultValue
    };
}

export const clearSessionStorage = () => sessionStorage.removeItem('filterValues');

export const removeSplChar = (str: string): string => String(str).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

// export const reactSelectFilterLogic = (option, inputValue) => {
//     const normalizedLabel = removeSplChar(option.label);
//     const normalizedInput = removeSplChar(inputValue);

//     return normalizedLabel.includes(normalizedInput);
// };