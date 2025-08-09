import * as React from "react"

import { cn } from "@/lib/utils"
import { useRTLClasses } from "@/components/ui/rtl-wrapper"

function Card({
  className,
  ...props
}) {
  const { isRTL } = useRTLClasses();
  
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        isRTL && "rtl",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
      {...props} />
  );
}

function CardHeader({
  className,
  ...props
}) {
  const { isRTL, textAlign } = useRTLClasses();
  
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        textAlign,
        className
      )}
      {...props} />
  );
}

function CardTitle({
  className,
  ...props
}) {
  const { textAlign } = useRTLClasses();
  
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", textAlign, className)}
      {...props} />
  );
}

function CardDescription({
  className,
  ...props
}) {
  const { textAlign } = useRTLClasses();
  
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", textAlign, className)}
      {...props} />
  );
}

function CardAction({
  className,
  ...props
}) {
  const { isRTL } = useRTLClasses();
  
  return (
    <div
      data-slot="card-action"
      className={cn(
        isRTL ? "col-start-1 row-span-2 row-start-1 self-start justify-self-start" : "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props} />
  );
}

function CardContent({
  className,
  ...props
}) {
  const { textAlign } = useRTLClasses();
  
  return (<div data-slot="card-content" className={cn("px-6", textAlign, className)} {...props} />);
}

function CardFooter({
  className,
  ...props
}) {
  const { isRTL } = useRTLClasses();
  
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-6 [.border-t]:pt-6",
        className
      )}
      {...props} />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
