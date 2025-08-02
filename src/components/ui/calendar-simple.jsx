// src/components/ui/calendar-simple.jsx
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";

export function SimpleCalendar({
  mode = "single",
  selected,
  onSelect,
  className,
  locale,
  dir,
  numberOfMonths = 1,
  disabled,
  ...props
}) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDayClick = (day) => {
    if (disabled && disabled(day)) return;
    
    if (mode === "single") {
      onSelect?.(day);
    } else if (mode === "range") {
      if (!selected?.from || (selected.from && selected.to)) {
        onSelect?.({ from: day, to: null });
      } else {
        onSelect?.({ from: selected.from, to: day });
      }
    }
  };

  const renderMonth = (monthDate, index) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const isSelected = (day) => {
      if (mode === "single") {
        return selected && isSameDay(day, selected);
      } else if (mode === "range") {
        if (selected?.from && selected?.to) {
          return day >= selected.from && day <= selected.to;
        }
        return selected?.from && isSameDay(day, selected.from);
      }
      return false;
    };

    const isRangeStart = (day) => {
      return mode === "range" && selected?.from && isSameDay(day, selected.from);
    };

    const isRangeEnd = (day) => {
      return mode === "range" && selected?.to && isSameDay(day, selected.to);
    };

    const isDisabled = (day) => {
      return disabled && disabled(day);
    };

    return (
      <div key={index} className="space-y-4">
        <div className="flex justify-between items-center">
          {index === 0 && (
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-sm font-medium flex-1 text-center">
            {format(monthDate, 'MMMM yyyy', { locale: locale || enUS })}
          </h2>
          {index === numberOfMonths - 1 && (
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center"
            >
              {day}
            </div>
          ))}
          {days.map((day, dayIdx) => {
            const selected = isSelected(day);
            const rangeStart = isRangeStart(day);
            const rangeEnd = isRangeEnd(day);
            const disabled = isDisabled(day);
            const today = isToday(day);
            const outsideMonth = !isSameMonth(day, monthDate);

            return (
              <Button
                key={dayIdx}
                variant={selected ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "h-9 w-9 p-0 font-normal",
                  outsideMonth && "text-muted-foreground opacity-50",
                  selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  today && !selected && "bg-accent text-accent-foreground",
                  disabled && "opacity-50 cursor-not-allowed",
                  rangeStart && "rounded-r-none",
                  rangeEnd && "rounded-l-none",
                  selected && !rangeStart && !rangeEnd && mode === "range" && "rounded-none"
                )}
                onClick={() => !disabled && handleDayClick(day)}
                disabled={disabled}
              >
                {format(day, 'd')}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  const months = [];
  for (let i = 0; i < numberOfMonths; i++) {
    months.push(addMonths(currentMonth, i));
  }

  return (
    <div className={cn("p-3", className)} dir={dir} {...props}>
      <div className={cn(
        "flex",
        numberOfMonths > 1 ? "space-x-4" : ""
      )}>
        {months.map((month, index) => renderMonth(month, index))}
      </div>
    </div>
  );
}