import { Bell, Search, Sun, Moon, Settings, User, Menu, Zap, Globe, Command, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import osoulLogo from '@/assets/osol-logo.png';

export function Header({ onMenuClick }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Command menu shortcut
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandMenu((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const notifications = [
    {
      id: 1,
      type: 'loan',
      title: 'New Loan Application',
      description: 'Ahmed Al-Rashid applied for SAR 250,000',
      time: '2 mins ago',
      unread: true,
      priority: 'high'
    },
    {
      id: 2,
      type: 'alert',
      title: 'High Risk Alert',
      description: '15 accounts showing warning signs',
      time: '15 mins ago',
      unread: true,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'success',
      title: 'Target Achieved',
      description: 'Daily collection target: SAR 3.2M',
      time: '1 hour ago',
      unread: false,
      priority: 'low'
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 md:px-6 shadow-sm">
        {/* Left side - Logo, Menu and Search */}
        <div className={cn("flex items-center gap-4 flex-1", isRTL && "flex-row-reverse")}>
          {/* Logo for mobile */}
          <div className="flex items-center gap-3 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl blur-lg" />
                <div className="relative p-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg">
                  <img 
                    src={osoulLogo} 
                    alt="Konan" 
                    className="h-10 w-10 object-contain"
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Konan Pro
                </span>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Premium</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu button for desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200 hidden md:flex"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search Bar - Desktop */}
          <div className="relative flex-1 max-w-xl hidden md:block">
            <div className="relative group">
              <Search className={cn(
                "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary",
                isRTL ? "right-3" : "left-3"
              )} />
              <Input
                type="search"
                placeholder="Search for anything..."
                className={cn(
                  "h-11 w-full rounded-xl border-0 bg-gray-50 dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-primary/50 transition-all duration-200",
                  isRTL ? "pr-10 pl-32" : "pl-10 pr-32"
                )}
                onFocus={() => setShowCommandMenu(true)}
              />
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground",
                isRTL ? "left-3" : "right-3"
              )}>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          {/* Quick Actions */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex h-9 px-3 rounded-lg border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>

          {/* Search icon for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200 md:hidden"
            onClick={() => setShowCommandMenu(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200"
          >
            <Globe className="h-5 w-5" />
          </Button>
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200 relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <span className="relative flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] items-center justify-center font-semibold shadow-lg">
                        {unreadCount}
                      </span>
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0 rounded-xl shadow-2xl">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base">{t('common.notifications')}</h3>
                    <p className="text-sm text-muted-foreground">
                      You have {unreadCount} unread notifications
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Mark all read
                  </Button>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <DropdownMenuItem className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer focus:bg-gray-50 dark:focus:bg-gray-800">
                      <div className={cn(
                        "mt-0.5 h-2 w-2 rounded-full shrink-0",
                        notification.unread && "bg-blue-500",
                        notification.priority === 'high' && "bg-red-500",
                        notification.priority === 'medium' && "bg-amber-500",
                        notification.priority === 'low' && "bg-green-500"
                      )} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.time}
                        </p>
                      </div>
                    </DropdownMenuItem>
                    {index < notifications.length - 1 && <DropdownMenuSeparator className="my-0" />}
                  </div>
                ))}
              </div>
              <div className="p-2 border-t bg-gray-50/50 dark:bg-gray-900/50">
                <Button variant="ghost" className="w-full justify-center text-sm rounded-lg">
                  View all notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-11 gap-3 px-3 rounded-xl hover:bg-primary/10 transition-all duration-200"
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarImage src="/api/placeholder/40/40" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className={cn("hidden md:flex flex-col items-start text-left", isRTL && "items-end text-right")}>
                  <span className="text-sm font-semibold">John Doe</span>
                  <span className="text-xs text-muted-foreground">Administrator</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2 rounded-xl shadow-2xl">
              <div className="p-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-white dark:ring-gray-800 shadow-lg">
                    <AvatarImage src="/api/placeholder/56/56" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-semibold">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-base">John Doe</p>
                    <p className="text-sm text-muted-foreground">john@konan.com</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Level 5
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <DropdownMenuItem className="rounded-lg p-2.5" onClick={() => window.location.href = '/profile'}>
                <User className="mr-2 h-4 w-4" />
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg p-2.5" onClick={() => window.location.href = '/settings'}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem className="text-red-600 dark:text-red-400 rounded-lg p-2.5 focus:bg-red-50 dark:focus:bg-red-900/20" onClick={() => console.log('Logout')}>
                Logout
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Menu */}
      <CommandDialog open={showCommandMenu} onOpenChange={setShowCommandMenu}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <Search className="mr-2 h-4 w-4" />
              <span>Search Customers</span>
            </CommandItem>
            <CommandItem>
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Account</span>
            </CommandItem>
            <CommandItem>
              <User className="mr-2 h-4 w-4" />
              <span>View Profile</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}