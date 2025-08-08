"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"
import { useRTLClasses } from "@/components/ui/rtl-wrapper"

function Tabs({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props} />
  );
}

function TabsList({
  className,
  ...props
}) {
  const { isRTL } = useRTLClasses();
  
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-sm",
        // remove forced display/width so parent layout (grid/flex) can control alignment
        // keep consistent sizing and visuals
        "h-12 rounded-xl p-1",
        "shadow-sm border border-gray-200 dark:border-gray-700",
        isRTL && "rtl",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
      {...props} />
  );
}

function TabsTrigger({
  className,
  ...props
}) {
  const { isRTL, textAlign } = useRTLClasses();
  
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles
        "inline-flex h-10 flex-1 items-center justify-center gap-2",
        "rounded-lg px-4 py-2 text-sm font-medium",
        "whitespace-nowrap transition-all duration-200",
        "border border-transparent",
        
        // Inactive state
        "text-gray-600 dark:text-gray-400",
        "hover:text-gray-900 dark:hover:text-gray-100",
        "hover:bg-white/50 dark:hover:bg-gray-700/50",
        
        // Active state with Osoul golden accent
        "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800",
        "data-[state=active]:text-[#E6B800] dark:data-[state=active]:text-[#E6B800]",
        "data-[state=active]:shadow-sm",
        "data-[state=active]:border-[#E6B800]/20",
        
        // Focus states
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#E6B800] focus-visible:ring-offset-2",
        
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        
        // Icon handling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        
        // RTL support
        textAlign,
        isRTL && "flex-row-reverse",
        
        className
      )}
      {...props} />
  );
}

function TabsContent({
  className,
  ...props
}) {
  const { isRTL } = useRTLClasses();
  
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none",
        "animate-in fade-in-50 duration-200",
        isRTL && "rtl",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
      {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
