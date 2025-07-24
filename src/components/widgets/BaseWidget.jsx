import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Settings, 
  Maximize2, 
  Minimize2, 
  X, 
  RefreshCw,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function BaseWidget({
  id,
  title,
  description,
  children,
  className,
  isLoading = false,
  error = null,
  onRefresh,
  onConfigure,
  onRemove,
  onExpand,
  isExpanded = false,
  showActions = true,
  ...props
}) {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh(id);
    }
  };

  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure(id);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(id);
    }
  };

  const handleExpand = () => {
    if (onExpand) {
      onExpand(id, !isExpanded);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export widget:', id);
  };

  return (
    <Card 
      className={cn(
        "relative transition-all duration-200 hover:shadow-md",
        isExpanded && "fixed inset-4 z-50 shadow-2xl",
        className
      )}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm">{description}</CardDescription>
          )}
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onExpand && (
                  <DropdownMenuItem onClick={handleExpand}>
                    {isExpanded ? (
                      <>
                        <Minimize2 className="mr-2 h-4 w-4" />
                        Minimize
                      </>
                    ) : (
                      <>
                        <Maximize2 className="mr-2 h-4 w-4" />
                        Expand
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
                
                {onConfigure && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleConfigure}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </DropdownMenuItem>
                  </>
                )}
                
                {onRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleRemove}
                      className="text-destructive focus:text-destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>
      
      <CardContent className={cn("pt-0", isExpanded && "h-full overflow-auto")}>
        {error ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div className="space-y-2">
              <p className="text-sm text-destructive">⚠️ Error loading widget</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="space-y-2 text-center">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

