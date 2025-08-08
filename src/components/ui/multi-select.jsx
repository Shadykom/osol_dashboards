import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown } from 'lucide-react';

/**
 * MultiSelect component
 * props:
 * - options: Array<{ value: string | number, label: string }>
 * - value: Array<string | number>
 * - onChange: (newValues: Array<string | number>) => void
 * - placeholder?: string
 * - label?: string
 * - className?: string
 */
export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select...',
  label,
  className
}) {
  const toggleValue = (val) => {
    if (!onChange) return;
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const selectedLabels = React.useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]));
    return value.map((v) => map.get(v)).filter(Boolean);
  }, [options, value]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className || 'justify-between w-full'}>
          <span className="truncate">
            {selectedLabels.length === 0
              ? placeholder
              : selectedLabels.length <= 2
              ? selectedLabels.join(', ')
              : `${selectedLabels.length} selected`}
          </span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px] p-0" align="start">
        {label && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {label}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <ScrollArea className="max-h-64">
          <div className="py-1">
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No options</div>
            )}
            {options.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40 cursor-pointer" onClick={() => toggleValue(opt.value)}>
                <Checkbox
                  checked={value.includes(opt.value)}
                  onCheckedChange={() => toggleValue(opt.value)}
                  id={`ms-${String(opt.value)}`}
                />
                <Label htmlFor={`ms-${String(opt.value)}`} className="text-sm cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        {value.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
            <div className="text-xs text-muted-foreground">{value.length} selected</div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}