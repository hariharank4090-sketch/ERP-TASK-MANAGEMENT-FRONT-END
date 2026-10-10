import React, { useState } from 'react';
import {
  Select,
  MenuItem,
  ListSubheader,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Checkbox,
  ListItemText
} from '@mui/material';
import type { SelectProps, SelectChangeEvent } from '@mui/material';
import { Search } from '@mui/icons-material';

export interface SearchableSelectOption {
  label: React.ReactNode;
  value: string | number;
  searchText?: string; // Optional text to search against if label is a complex ReactNode
  disabled?: boolean;
}

export interface SearchableSelectProps<T extends string | number = string | number>
  extends Omit<SelectProps, 'onChange' | 'value'> {
  options: SearchableSelectOption[];
  value: T | T[] | unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (event: SelectChangeEvent<any>, child?: React.ReactNode) => void;
  searchPlaceholder?: string;
  allOptionLabel?: React.ReactNode;
  allOptionValue?: string | number;
  multiple?: boolean;
  selectAllByDefault?: boolean;
}

const SearchableSelect = <T extends string | number = string | number>({
  options,
  value,
  onChange,
  searchPlaceholder = "Search...",
  allOptionLabel,
  allOptionValue = "",
  MenuProps,
  onClose,
  renderValue: parentRenderValue,
  disabled,
  selectAllByDefault = true,
  ...rest
}: SearchableSelectProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMultiple = Boolean(rest.multiple);

  const filteredOptions = options.filter(opt => {
    const textToSearch = opt.searchText || (typeof opt.label === 'string' ? opt.label : '');
    return textToSearch.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleClose = (e: React.SyntheticEvent) => {
    setSearchTerm('');
    if (onClose) {
      onClose(e);
    }
  };

  const hasPlaceholder = Boolean(allOptionLabel);
  const EMPTY_VALUE = "___empty___";
  const NONE_MARKER = "__NONE__";

  const allOptionValues = React.useMemo(() => options.map(o => o.value), [options]);

  const isExplicitlyNone = isMultiple && Array.isArray(value) && value.includes(NONE_MARKER);

  const isAllSelected = isMultiple && selectAllByDefault && !isExplicitlyNone && (
    !Array.isArray(value) || 
    value.length === 0 || 
    (allOptionValues.length > 0 && Array.isArray(value) && value.length === allOptionValues.length)
  );

  let internalValue: unknown;
  if (isMultiple) {
    if (isAllSelected) {
      internalValue = allOptionValues;
    } else {
      internalValue = Array.isArray(value) ? value.filter((v: unknown) => v !== NONE_MARKER) : [];
    }
  } else {
    const isCurrentlyEmpty = value === allOptionValue || value === "" || value == null;
    internalValue = (hasPlaceholder && isCurrentlyEmpty) ? EMPTY_VALUE : (value ?? "");
  }

  const handleChange = (e: SelectChangeEvent<unknown>, child: React.ReactNode) => {
    if (onChange) {
      if (isMultiple) {
        const valArr = Array.isArray(e.target.value) ? e.target.value : [e.target.value];
        const childVal = (child as React.ReactElement<{ value?: unknown }>)?.props?.value;

        if (childVal === EMPTY_VALUE) {
          const newValues = isAllSelected ? [NONE_MARKER] : [];
          onChange(
            {
              ...e,
              target: {
                ...e.target,
                value: newValues
              }
            } as SelectChangeEvent<unknown>,
            child
          );
        } else {
          let cleanVal = valArr.filter((v: unknown) => v !== EMPTY_VALUE && v !== NONE_MARKER);
          if (cleanVal.length === 0) {
            cleanVal = selectAllByDefault ? [NONE_MARKER] : [];
          } else if (selectAllByDefault && allOptionValues.length > 0 && cleanVal.length === allOptionValues.length) {
            cleanVal = [];
          }
          onChange(
            {
              ...e,
              target: {
                ...e.target,
                value: cleanVal
              }
            } as SelectChangeEvent<unknown>,
            child
          );
        }
      } else {
        if (e.target.value === EMPTY_VALUE) {
          onChange(
            {
              ...e,
              target: {
                ...e.target,
                value: allOptionValue
              }
            } as SelectChangeEvent<unknown>,
            child
          );
        } else {
          onChange(e, child);
        }
      }
    }
  };

  return (
    <Select
      value={internalValue}
      onChange={handleChange}
      onClose={handleClose}
      displayEmpty
      size={rest.size || "small"}
      renderValue={(selected: unknown) => {
        const actualSelected = selected === EMPTY_VALUE ? allOptionValue : selected;

        if (parentRenderValue) {
          return parentRenderValue(actualSelected);
        }

        if (isMultiple) {
          const arr = Array.isArray(selected) ? selected.filter((v: unknown) => v !== EMPTY_VALUE && v !== NONE_MARKER && v !== "") : [];
          if (selectAllByDefault && (arr.length === 0 || (options.length > 0 && arr.length === options.length))) {
            return <span style={{ color: '#9ca3af' }}>{allOptionLabel || 'All'}</span>;
          }
          if (arr.length === 0) {
            return <span style={{ color: '#9ca3af' }}>{allOptionLabel || 'Select...'}</span>;
          }
          const labels = arr.map(val => {
            const opt = options.find(o => String(o.value).trim() === String(val).trim());
            return opt ? (typeof opt.label === 'string' ? opt.label : String(val)) : String(val);
          });
          return <span>{labels.join(', ')}</span>;
        }

        if (actualSelected === allOptionValue || actualSelected === "" || actualSelected == null) {
          return <span style={{ color: '#9ca3af' }}>{allOptionLabel}</span>;
        }
        const selectedOpt = options.find(opt => String(opt.value).trim() === String(actualSelected).trim());
        return selectedOpt ? selectedOpt.label : (actualSelected as React.ReactNode);
      }}
      MenuProps={{
        ...MenuProps,
        autoFocus: false,
      }}
      disabled={disabled}
      sx={{
        borderRadius: '8px',
        height: '38px',
        width: '100%',
        backgroundColor: disabled ? '#f3f4f6' : '#fff',
        color: disabled ? '#9ca3af' : 'inherit',
        pointerEvents: disabled ? 'none' : 'auto',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: disabled ? '#e5e7eb' : '#d1d5db',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: disabled ? '#e5e7eb' : '#c99f65',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: disabled ? '#e5e7eb' : '#c99f65',
        },
        ...rest.sx
      }}
      {...rest}
    >
      <ListSubheader sx={{ pt: 1, pb: 1, zIndex: 2, bgcolor: 'background.paper', lineHeight: 'normal' }}>
        <TextField
          size="small"
          autoFocus={!isMobile}
          placeholder={searchPlaceholder}
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') {
              e.stopPropagation();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            )
          }}
        />
      </ListSubheader>
      {allOptionLabel && (
        <MenuItem value={EMPTY_VALUE}>
          {isMultiple && (
            <Checkbox
              checked={isAllSelected}
              size="small"
              sx={{ mr: 1, p: 0 }}
            />
          )}
          <ListItemText primary={allOptionLabel} />
        </MenuItem>
      )}
      {filteredOptions.map((opt) => {
        const isSelected = isMultiple
          ? (isAllSelected || (Array.isArray(value) && value.some((v: unknown) => String(v).trim() === String(opt.value).trim())))
          : String(value).trim() === String(opt.value).trim();
        return (
          <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
            {isMultiple && (
              <Checkbox checked={isSelected} size="small" sx={{ mr: 1, p: 0 }} />
            )}
            <ListItemText primary={opt.label} />
          </MenuItem>
        );
      })}
    </Select>
  );
};

export default SearchableSelect;
