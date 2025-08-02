// src/components/ui/date-range-picker.jsx
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subMonths, subQuarters, subYears } from 'date-fns';
import { ar } from 'date-fns/locale/ar';
import { enUS } from 'date-fns/locale/en-US';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const presetRanges = [
  {
    label: 'اليوم',
    value: 'today',
    getValue: () => ({
      from: new Date(),
      to: new Date()
    })
  },
  {
    label: 'أمس',
    value: 'yesterday',
    getValue: () => ({
      from: subDays(new Date(), 1),
      to: subDays(new Date(), 1)
    })
  },
  {
    label: 'آخر 7 أيام',
    value: 'last7days',
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date()
    })
  },
  {
    label: 'آخر 30 يوم',
    value: 'last30days',
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date()
    })
  },
  {
    label: 'هذا الشهر',
    value: 'thisMonth',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    })
  },
  {
    label: 'الشهر الماضي',
    value: 'lastMonth',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth)
      };
    }
  },
  {
    label: 'آخر 3 أشهر',
    value: 'last3months',
    getValue: () => ({
      from: subMonths(new Date(), 3),
      to: new Date()
    })
  },
  {
    label: 'هذا الربع',
    value: 'thisQuarter',
    getValue: () => ({
      from: startOfQuarter(new Date()),
      to: endOfQuarter(new Date())
    })
  },
  {
    label: 'الربع الماضي',
    value: 'lastQuarter',
    getValue: () => {
      const lastQuarter = subQuarters(new Date(), 1);
      return {
        from: startOfQuarter(lastQuarter),
        to: endOfQuarter(lastQuarter)
      };
    }
  },
  {
    label: 'هذه السنة',
    value: 'thisYear',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date())
    })
  },
  {
    label: 'السنة الماضية',
    value: 'lastYear',
    getValue: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear)
      };
    }
  }
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className,
  disabled = false,
  showPresets = true,
  align = 'start',
  ...props
}) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value || {});
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? ar : enUS;

  const handleSelect = (range) => {
    try {
      const newValue = range || {};
      setInternalValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
      if (newValue.from && newValue.to) {
        setOpen(false);
      }
    } catch (error) {
      console.error('DateRangePicker handleSelect error:', error);
    }
  };

  const handlePresetClick = (preset) => {
    try {
      const range = preset.getValue();
      handleSelect(range);
    } catch (error) {
      console.error('DateRangePicker preset error:', error);
    }
  };

  const formatDateRange = () => {
    try {
      const currentValue = value || internalValue;
      if (!currentValue?.from) {
        return placeholder;
      }
      if (!currentValue.to) {
        return format(currentValue.from, 'PP', { locale });
      }
      return `${format(currentValue.from, 'PP', { locale })} - ${format(currentValue.to, 'PP', { locale })}`;
    } catch (error) {
      console.error('DateRangePicker format error:', error);
      return placeholder;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-between text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <span className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          {showPresets && (
            <div className="flex flex-col gap-2 p-3 border-r">
              <div className="text-sm font-medium px-3">
                {isRTL ? 'النطاقات المحددة مسبقاً' : 'Preset Ranges'}
              </div>
              {presetRanges.map((preset) => (
                <Button
                  key={preset.value}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={value || internalValue}
              onSelect={handleSelect}
              numberOfMonths={2}
              locale={locale}
              dir={isRTL ? 'rtl' : 'ltr'}
              {...props}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Simplified date picker for single date selection
export function DatePicker({
  value,
  onChange,
  className,
  align = 'start',
  placeholder = 'اختر التاريخ',
  ...props
}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const locale = i18n.language === 'ar' ? ar : enUS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'dd/MM/yyyy', { locale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          locale={locale}
          dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
          disabled={(date) => date > new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Alias for backward compatibility with existing imports
export const DatePickerWithRange = DateRangePicker;