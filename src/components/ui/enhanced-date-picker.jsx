import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear, 
  subMonths, 
  subQuarters, 
  subYears,
  addDays,
  addMonths,
  isAfter,
  isBefore,
  isEqual,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { 
  CalendarIcon, 
  Clock, 
  TrendingUp, 
  Calendar as CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  CalendarRange,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function EnhancedDateRangePicker({ 
  range1, 
  range2, 
  onRange1Change, 
  onRange2Change,
  showComparison = true,
  className 
}) {
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  
  const today = new Date();
  
  const presets = {
    quick: [
      { 
        id: 'today',
        label: 'Today', 
        icon: Clock,
        range: { from: today, to: today },
        comparison: { from: subDays(today, 1), to: subDays(today, 1) }
      },
      { 
        id: 'yesterday',
        label: 'Yesterday', 
        icon: Clock,
        range: { from: subDays(today, 1), to: subDays(today, 1) },
        comparison: { from: subDays(today, 2), to: subDays(today, 2) }
      },
      { 
        id: 'last7days',
        label: 'Last 7 Days', 
        icon: CalendarDays,
        range: { from: subDays(today, 6), to: today },
        comparison: { from: subDays(today, 13), to: subDays(today, 7) }
      },
      { 
        id: 'last30days',
        label: 'Last 30 Days', 
        icon: CalendarDays,
        range: { from: subDays(today, 29), to: today },
        comparison: { from: subDays(today, 59), to: subDays(today, 30) }
      }
    ],
    weekly: [
      { 
        id: 'thisweek',
        label: 'This Week', 
        range: { from: startOfWeek(today), to: endOfWeek(today) },
        comparison: { from: startOfWeek(subDays(today, 7)), to: endOfWeek(subDays(today, 7)) }
      },
      { 
        id: 'lastweek',
        label: 'Last Week', 
        range: { from: startOfWeek(subDays(today, 7)), to: endOfWeek(subDays(today, 7)) },
        comparison: { from: startOfWeek(subDays(today, 14)), to: endOfWeek(subDays(today, 14)) }
      }
    ],
    monthly: [
      { 
        id: 'thismonth',
        label: 'This Month', 
        range: { from: startOfMonth(today), to: endOfMonth(today) },
        comparison: { from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) }
      },
      { 
        id: 'lastmonth',
        label: 'Last Month', 
        range: { from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) },
        comparison: { from: startOfMonth(subMonths(today, 2)), to: endOfMonth(subMonths(today, 2)) }
      },
      { 
        id: 'last3months',
        label: 'Last 3 Months', 
        range: { from: startOfMonth(subMonths(today, 2)), to: endOfMonth(today) },
        comparison: { from: startOfMonth(subMonths(today, 5)), to: endOfMonth(subMonths(today, 3)) }
      },
      { 
        id: 'last6months',
        label: 'Last 6 Months', 
        range: { from: startOfMonth(subMonths(today, 5)), to: endOfMonth(today) },
        comparison: { from: startOfMonth(subMonths(today, 11)), to: endOfMonth(subMonths(today, 6)) }
      }
    ],
    quarterly: [
      { 
        id: 'thisquarter',
        label: 'This Quarter', 
        range: { from: startOfQuarter(today), to: endOfQuarter(today) },
        comparison: { from: startOfQuarter(subQuarters(today, 1)), to: endOfQuarter(subQuarters(today, 1)) }
      },
      { 
        id: 'lastquarter',
        label: 'Last Quarter', 
        range: { from: startOfQuarter(subQuarters(today, 1)), to: endOfQuarter(subQuarters(today, 1)) },
        comparison: { from: startOfQuarter(subQuarters(today, 2)), to: endOfQuarter(subQuarters(today, 2)) }
      }
    ],
    yearly: [
      { 
        id: 'thisyear',
        label: 'This Year', 
        range: { from: startOfYear(today), to: endOfYear(today) },
        comparison: { from: startOfYear(subYears(today, 1)), to: endOfYear(subYears(today, 1)) }
      },
      { 
        id: 'lastyear',
        label: 'Last Year', 
        range: { from: startOfYear(subYears(today, 1)), to: endOfYear(subYears(today, 1)) },
        comparison: { from: startOfYear(subYears(today, 2)), to: endOfYear(subYears(today, 2)) }
      }
    ]
  };

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    onRange1Change(preset.range);
    if (showComparison && preset.comparison) {
      onRange2Change(preset.comparison);
    }
    setOpen1(false);
    setOpen2(false);
  };

  const formatDateRange = (range) => {
    if (!range?.from) return 'Select dates';
    if (!range.to) return format(range.from, 'MMM d, yyyy');
    if (isEqual(range.from, range.to)) return format(range.from, 'MMM d, yyyy');
    
    const sameMonth = format(range.from, 'MMM yyyy') === format(range.to, 'MMM yyyy');
    const sameYear = format(range.from, 'yyyy') === format(range.to, 'yyyy');
    
    if (sameMonth) {
      return `${format(range.from, 'MMM d')} - ${format(range.to, 'd, yyyy')}`;
    } else if (sameYear) {
      return `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`;
    }
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  const getDaysDifference = (range) => {
    if (!range?.from || !range?.to) return 0;
    return Math.round((range.to - range.from) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Primary Date Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Primary Period
            </label>
            {range1?.from && (
              <Badge variant="outline" className="text-xs">
                {getDaysDifference(range1)} days
              </Badge>
            )}
          </div>
          
          <Popover open={open1} onOpenChange={setOpen1}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !range1?.from && "text-muted-foreground",
                  range1?.from && "border-primary/50"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange(range1)}
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                {/* Presets Panel */}
                <div className="w-48 border-r bg-muted/10">
                  <div className="p-3">
                    <h4 className="text-sm font-semibold mb-2">Quick Select</h4>
                    <Tabs defaultValue="quick" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="quick" className="text-xs">Quick</TabsTrigger>
                        <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="quick" className="mt-2 space-y-1">
                        {presets.quick.map((preset) => {
                          const Icon = preset.icon;
                          return (
                            <Button
                              key={preset.id}
                              variant={activePreset === preset.id ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-xs"
                              onClick={() => applyPreset(preset)}
                            >
                              <Icon className="h-3 w-3 mr-2" />
                              {preset.label}
                            </Button>
                          );
                        })}
                      </TabsContent>
                      
                      <TabsContent value="month" className="mt-2 space-y-1">
                        {presets.monthly.map((preset) => (
                          <Button
                            key={preset.id}
                            variant={activePreset === preset.id ? "secondary" : "ghost"}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => applyPreset(preset)}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </TabsContent>
                    </Tabs>
                    
                    <div className="mt-3 pt-3 border-t space-y-1">
                      {presets.quarterly.map((preset) => (
                        <Button
                          key={preset.id}
                          variant={activePreset === preset.id ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => applyPreset(preset)}
                        >
                          <CalendarRange className="h-3 w-3 mr-2" />
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t space-y-1">
                      {presets.yearly.map((preset) => (
                        <Button
                          key={preset.id}
                          variant={activePreset === preset.id ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => applyPreset(preset)}
                        >
                          <TrendingUp className="h-3 w-3 mr-2" />
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Calendar */}
                <div className="p-3">
                  <Calendar
                    mode="range"
                    selected={range1}
                    onSelect={onRange1Change}
                    numberOfMonths={2}
                    className="rounded-md"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Comparison Date Range */}
        {showComparison && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                Comparison Period
              </label>
              {range2?.from && (
                <Badge variant="outline" className="text-xs">
                  {getDaysDifference(range2)} days
                </Badge>
              )}
            </div>
            
            <Popover open={open2} onOpenChange={setOpen2}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !range2?.from && "text-muted-foreground",
                    range2?.from && "border-muted-foreground/50"
                )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange(range2)}
                </Button>
              </PopoverTrigger>
              
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                  <div className="mb-3 space-y-2">
                    <h4 className="text-sm font-semibold">Suggested Comparisons</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          if (range1?.from && range1?.to) {
                            const days = getDaysDifference(range1);
                            onRange2Change({
                              from: subDays(range1.from, days),
                              to: subDays(range1.to, days)
                            });
                            setOpen2(false);
                          }
                        }}
                      >
                        <ChevronLeft className="h-3 w-3 mr-1" />
                        Previous Period
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          if (range1?.from && range1?.to) {
                            onRange2Change({
                              from: subYears(range1.from, 1),
                              to: subYears(range1.to, 1)
                            });
                            setOpen2(false);
                          }
                        }}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Year Ago
                      </Button>
                    </div>
                  </div>
                  
                  <Calendar
                    mode="range"
                    selected={range2}
                    onSelect={onRange2Change}
                    numberOfMonths={2}
                    className="rounded-md"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Period Summary */}
      {(range1?.from || range2?.from) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
        >
          <div className="flex items-center gap-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="text-sm">
              {range1?.from && (
                <span className="font-medium">
                  {formatDateRange(range1)}
                </span>
              )}
              {range1?.from && range2?.from && (
                <span className="mx-2 text-muted-foreground">vs</span>
              )}
              {range2?.from && (
                <span className="text-muted-foreground">
                  {formatDateRange(range2)}
                </span>
              )}
            </div>
          </div>
          
          {range1?.from && range2?.from && (
            <Badge variant="secondary" className="text-xs">
              {Math.abs(getDaysDifference(range1) - getDaysDifference(range2)) === 0
                ? 'Same duration'
                : `${Math.abs(getDaysDifference(range1) - getDaysDifference(range2))} days difference`}
            </Badge>
          )}
        </motion.div>
      )}
    </div>
  );
}