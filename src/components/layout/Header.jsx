import { Bell, Search, Sun, Moon, Settings, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/language-selector';
import { cn } from '@/lib/utils';
import osoulLogo from '@/assets/osol-logo.png';

export function Header({ onMenuClick }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { t, i18n } = useTranslation();


  return (
    <header className="flex h-20 items-center justify-between border-b bg-white dark:bg-gray-900 px-4 md:px-6 shadow-sm">
      {/* Left side - Logo, Menu and Search */}
              <div className="flex items-center gap-4 flex-1">
        {/* Logo for mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
              <img 
                src={osoulLogo} 
                alt="Konan" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <span className="text-base font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:inline">
              Konan Pro
            </span>
          </div>
        </div>

        {/* Menu button for desktop */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xl hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('common.searchPlaceholder')}
            className="h-10 w-full rounded-lg border-0 bg-gray-50 dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-primary transition-all pl-10 pr-10"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Search icon for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Language Selector */}
        <LanguageSelector />
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
              className="h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative"
            >
              <Bell className="h-5 w-5" />
              <div className="absolute -top-1 -right-1">
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[10px] items-center justify-center font-semibold">
                    3
                  </span>
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
              <h3 className="font-semibold text-base">{t('common.notifications')}</h3>
              <p className="text-sm text-muted-foreground">You have 3 unread messages</p>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-2 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-medium text-sm flex-1">{t('notifications.newLoanApplication')}</span>
                  <span className="text-xs text-muted-foreground">2m</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Ahmed Al-Rashid applied for {t('common.currency')} 250,000
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-0" />
              <DropdownMenuItem className="flex flex-col items-start gap-2 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="font-medium text-sm flex-1">{t('notifications.highRiskAlert')}</span>
                  <span className="text-xs text-muted-foreground">15m</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  15 {t('notifications.accountsShowingWarning')}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-0" />
              <DropdownMenuItem className="flex flex-col items-start gap-2 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="font-medium text-sm flex-1">{t('notifications.targetAchieved')}</span>
                  <span className="text-xs text-muted-foreground">1h</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {t('notifications.dailyCollectionTarget')}: {t('common.currency')} 3.2M
                </span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-2">
              <Button variant="ghost" className="w-full justify-center text-sm">
                {t('notifications.viewAllNotifications')}
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-10 gap-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold">John Doe</span>
                <span className="text-xs text-muted-foreground">Administrator</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-800">
                  <AvatarImage src="/api/placeholder/48/48" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-base font-semibold">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">John Doe</p>
                  <p className="text-sm text-muted-foreground">john@konan.com</p>
                  <p className="text-xs text-muted-foreground mt-1">Administrator</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <DropdownMenuItem className="rounded-lg">
                <User className="mr-2 h-4 w-4" />
                {t('common.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                <Settings className="mr-2 h-4 w-4" />
                {t('common.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              {/* Logout removed - authentication not required */}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}