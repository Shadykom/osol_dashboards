import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronDown, 
  Search, 
  X, 
  CheckCircle2, 
  Circle,
  Filter,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EnhancedMultiSelect component with search, grouping, and better UX
 * props:
 * - options: Array<{ value: string | number, label: string, group?: string, description?: string }>
 * - value: Array<string | number>
 * - onChange: (newValues: Array<string | number>) => void
 * - placeholder?: string
 * - label?: string
 * - className?: string
 * - searchable?: boolean
 * - groupBy?: boolean
 * - showSelectAll?: boolean
 * - maxHeight?: string
 * - showSelectedBadges?: boolean
 */
export function EnhancedMultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select items...',
  label,
  className,
  searchable = true,
  groupBy = false,
  showSelectAll = true,
  maxHeight = '320px',
  showSelectedBadges = true
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleValue = (val) => {
    if (!onChange) return;
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const selectAll = () => {
    const allValues = filteredOptions.map(o => o.value);
    onChange(allValues);
  };

  const clearAll = () => {
    onChange([]);
  };

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      opt => 
        opt.label.toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  const groupedOptions = React.useMemo(() => {
    if (!groupBy) return { '': filteredOptions };
    
    return filteredOptions.reduce((acc, opt) => {
      const group = opt.group || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    }, {});
  }, [filteredOptions, groupBy]);

  const selectedLabels = React.useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]));
    return value.map((v) => map.get(v)).filter(Boolean);
  }, [options, value]);

  const removeValue = (val, e) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              "justify-between w-full min-h-[40px] h-auto",
              value.length > 0 && "border-primary/50"
            )}
          >
            <div className="flex items-center gap-2 flex-1 text-left">
              <Filter className={cn(
                "h-4 w-4",
                value.length > 0 ? "text-primary" : "text-muted-foreground"
              )} />
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : showSelectedBadges && value.length <= 3 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedLabels.slice(0, 3).map((label, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs h-6 px-2"
                    >
                      {label}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                        onClick={(e) => {
                          const val = options.find(o => o.label === label)?.value;
                          if (val !== undefined) removeValue(val, e);
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {value.length} selected
                </Badge>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-[320px] p-0" 
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-3 space-y-3">
            {label && (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{label}</Label>
                {value.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {value.length} active
                  </Badge>
                )}
              </div>
            )}
            
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {showSelectAll && (
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={selectAll}
                  className="text-xs h-7"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Select All ({filteredOptions.length})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearAll}
                  disabled={value.length === 0}
                  className="text-xs h-7"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          <DropdownMenuSeparator />
          
          <ScrollArea style={{ maxHeight }} className="px-1">
            <div className="py-1">
              {filteredOptions.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <Circle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No options found</p>
                  {searchQuery && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Try a different search term
                    </p>
                  )}
                </div>
              )}
              
              {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group}>
                  {groupBy && group && (
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group}
                    </div>
                  )}
                  
                  <AnimatePresence mode="popLayout">
                    {groupOptions.map((opt) => {
                      const isSelected = value.includes(opt.value);
                      return (
                        <motion.div
                          key={opt.value}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            "flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors rounded-md mx-1",
                            isSelected 
                              ? "bg-primary/10 hover:bg-primary/15" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleValue(opt.value)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleValue(opt.value)}
                            className="mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <Label 
                              className={cn(
                                "text-sm cursor-pointer",
                                isSelected && "font-medium"
                              )}
                            >
                              {opt.label}
                            </Label>
                            {opt.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {opt.description}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </ScrollArea>

          {value.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {value.length} of {options.length} selected
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="text-xs h-7"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}