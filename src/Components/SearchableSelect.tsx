/* eslint-disable @typescript-eslint/no-explicit-any */
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

interface SearchableSelectProps extends Omit<SelectProps, 'onChange' | 'value'> {
  options: SearchableSelectOption[];
  value: any;
  onChange?: (event: SelectChangeEvent<any>, child: React.ReactNode) => void;
  searchPlaceholder?: string;
  allOptionLabel?: React.ReactNode;
  allOptionValue?: string | number;
  multiple?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
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
  ...rest
}) => {
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

  let internalValue: any;
  if (isMultiple) {
    internalValue = Array.isArray(value) ? value : [];
  } else {
    const isCurrentlyEmpty = value === allOptionValue || value === "" || value == null;
    internalValue = (hasPlaceholder && isCurrentlyEmpty) ? EMPTY_VALUE : (value ?? "");
  }

  const handleChange = (e: SelectChangeEvent<any>, child: React.ReactNode) => {
    if (onChange) {
      if (isMultiple) {
        const valArr = Array.isArray(e.target.value) ? e.target.value : [e.target.value];
        const lastSelected = valArr[valArr.length - 1];
        if (lastSelected === EMPTY_VALUE) {
          onChange(
            {
              ...e,
              target: {
                ...e.target,
                value: []
              }
            } as any,
            child
          );
        } else {
          const cleanVal = valArr.filter((v: any) => v !== EMPTY_VALUE);
          onChange(
            {
              ...e,
              target: {
                ...e.target,
                value: cleanVal
              }
            } as any,
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
            } as any,
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
      renderValue={(selected: any) => {
        const actualSelected = selected === EMPTY_VALUE ? allOptionValue : selected;

        if (parentRenderValue) {
          return parentRenderValue(actualSelected);
        }

        if (isMultiple) {
          const arr = Array.isArray(selected) ? selected.filter((v: any) => v !== EMPTY_VALUE && v !== "") : [];
          if (arr.length === 0) {
            return <span style={{ color: '#9ca3af' }}>{allOptionLabel || 'All'}</span>;
          }
          if (arr.length === options.length && options.length > 0) {
            return <span>{allOptionLabel || 'All Selected'}</span>;
          }
          const labels = arr.map(val => {
            const opt = options.find(o => String(o.value) === String(val));
            return opt ? (typeof opt.label === 'string' ? opt.label : String(val)) : String(val);
          });
          return <span>{labels.join(', ')}</span>;
        }

        if (actualSelected === allOptionValue || actualSelected === "" || actualSelected == null) {
          return <span style={{ color: '#9ca3af' }}>{allOptionLabel}</span>;
        }
        const selectedOpt = options.find(opt => String(opt.value) === String(actualSelected));
        return selectedOpt ? selectedOpt.label : actualSelected;
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
              checked={!Array.isArray(value) || value.length === 0}
              size="small"
              sx={{ mr: 1, p: 0 }}
            />
          )}
          <ListItemText primary={allOptionLabel} />
        </MenuItem>
      )}
      {filteredOptions.map((opt) => {
        const isSelected = isMultiple
          ? (Array.isArray(value) && value.includes(opt.value))
          : String(value) === String(opt.value);
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
