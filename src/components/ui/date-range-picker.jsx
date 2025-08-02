// src/components/ui/date-range-picker.jsx
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subMonths, subQuarters, subYears } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
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
  className,
  align = 'start',
  placeholder = 'اختر التاريخ',
  presets = true,
  ...props
}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const locale = i18n.language === 'ar' ? ar : enUS;

  const handlePresetClick = (preset) => {
    const range = preset.getValue();
    onChange(range);
    setSelectedPreset(preset.value);
    setOpen(false);
  };

  const handleDateSelect = (range) => {
    onChange(range);
    setSelectedPreset(null);
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!value?.from) return placeholder;
    
    if (value.to) {
      if (value.from.toDateString() === value.to.toDateString()) {
        return format(value.from, 'dd/MM/yyyy', { locale });
      }
      return `${format(value.from, 'dd/MM/yyyy', { locale })} - ${format(value.to, 'dd/MM/yyyy', { locale })}`;
    }
    
    return format(value.from, 'dd/MM/yyyy', { locale });
  };

  const getSelectedPresetLabel = () => {
    if (selectedPreset) {
      const preset = presetRanges.find(p => p.value === selectedPreset);
      return preset?.label;
    }
    return null;
  };

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
          <span className="flex-1 truncate">
            {getSelectedPresetLabel() || formatDateRange()}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          {presets && (
            <div className="flex flex-col gap-1 p-3 border-r">
              <div className="text-sm font-medium mb-2 text-muted-foreground">
                الفترات المحددة مسبقاً
              </div>
              {presetRanges.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedPreset === preset.value ? 'secondary' : 'ghost'}
                  size="sm"
                  className="justify-start text-right"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}
          <div className="p-3">
            <div className="text-sm font-medium mb-2 text-muted-foreground">
              اختر فترة مخصصة
            </div>
            <Calendar
              mode="range"
              selected={value}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              locale={locale}
              dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
              disabled={(date) => date > new Date()}
              className="rounded-md"
            />
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  onChange({ from: null, to: null });
                  setSelectedPreset(null);
                  setOpen(false);
                }}
              >
                مسح
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={!value?.from}
              >
                تطبيق
              </Button>
            </div>
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