/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Select,
  MenuItem,
  ListSubheader,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme
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
  ...rest
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
  const isCurrentlyEmpty = value === allOptionValue || value === "" || value == null;
  const EMPTY_VALUE = "___empty___";
  const internalValue = (hasPlaceholder && isCurrentlyEmpty) ? EMPTY_VALUE : (value ?? "");

  const handleChange = (e: SelectChangeEvent<any>, child: React.ReactNode) => {
    if (onChange) {
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

        if (actualSelected === allOptionValue || actualSelected === "" || actualSelected == null) {
          return <span>{allOptionLabel}</span>;
        }
        const selectedOpt = options.find(opt => String(opt.value) === String(actualSelected));
        return selectedOpt ? selectedOpt.label : actualSelected;
      }}
      MenuProps={{
        ...MenuProps,
        autoFocus: false,
      }}
      sx={{
        borderRadius: '8px',
        height: '38px',
        width: '100%',
        backgroundColor: '#fff',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#d1d5db',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#c99f65',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#c99f65',
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
          {allOptionLabel}
        </MenuItem>
      )}
      {filteredOptions.map((opt) => (
        <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export default SearchableSelect;
