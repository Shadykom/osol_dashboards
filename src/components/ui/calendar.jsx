// src/components/ui/calendar.jsx
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { SimpleCalendar } from "./calendar-simple"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Feature flag to use simple calendar implementation
const USE_SIMPLE_CALENDAR = true;

// Fallback calendar component for when DayPicker fails
function FallbackCalendar({ onSelect, selected, mode = "single", ...props }) {
  const handleDateChange = (e) => {
    const date = new Date(e.target.value);
    if (!isNaN(date) && onSelect) {
      if (mode === "single") {
        onSelect(date);
      } else if (mode === "range") {
        // For range mode, we'll use a simple approach
        onSelect({ from: date, to: date });
      }
    }
  };

  const value = React.useMemo(() => {
    if (!selected) return '';
    if (mode === "single" && selected instanceof Date) {
      return selected.toISOString().split('T')[0];
    }
    if (mode === "range" && selected?.from) {
      return selected.from.toISOString().split('T')[0];
    }
    return '';
  }, [selected, mode]);

  return (
    <div className="p-4 border rounded-md">
      <input
        type="date"
        className="w-full p-2 border rounded"
        value={value}
        onChange={handleDateChange}
        {...props}
      />
      {mode === "range" && (
        <p className="mt-2 text-sm text-muted-foreground">
          Note: Calendar range selection is temporarily unavailable. Please use the date input above.
        </p>
      )}
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale,
  ...props
}) {
  // Use SimpleCalendar if the feature flag is enabled
  if (USE_SIMPLE_CALENDAR) {
    return <SimpleCalendar className={className} locale={locale} {...props} />;
  }

  // Add error boundary to catch any runtime errors
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return <FallbackCalendar {...props} />;
  }

  try {
    // Ensure buttonVariants is a function before calling it
    const getButtonClass = (variant) => {
      try {
        if (typeof buttonVariants === 'function') {
          return buttonVariants({ variant });
        }
      } catch (e) {
        console.warn('buttonVariants error:', e);
      }
      // Fallback classes
      return variant === 'outline' 
        ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
        : 'hover:bg-accent hover:text-accent-foreground';
    };

    // Filter out locale prop if it's causing issues
    const dayPickerProps = { ...props };
    if (locale) {
      // Try to set locale, but don't fail if it doesn't work
      try {
        dayPickerProps.locale = locale;
      } catch (e) {
        console.warn('Failed to set locale:', e);
        delete dayPickerProps.locale;
      }
    }

    return (
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            getButtonClass("outline"),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            getButtonClass("ghost"),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: () => <ChevronLeft className="h-4 w-4" />,
          IconRight: () => <ChevronRight className="h-4 w-4" />,
        }}
        {...dayPickerProps}
      />
    )
  } catch (error) {
    console.error("Calendar component error:", error);
    setHasError(true);
    return <FallbackCalendar {...props} />;
  }
}
Calendar.displayName = "Calendar"

export { Calendar }