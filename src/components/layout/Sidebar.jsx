import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  ArrowUpDown, 
  PiggyBank,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  TrendingUp,
  Shield,
  HelpCircle,
  DollarSign,
  Calendar,
  Smartphone,
  AlertTriangle,
  MapPin,
  Trophy,
  BookOpen,
  Layers,
  Eye,
  BarChart3,
  Activity,
  Target,
  Home,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Coins,
  Grid3x3,
  Wallet,
  UserCheck,
  FileWarning,
  UserSearch,
  Globe,
  Moon,
  Sun,
  Languages
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import osoulLogo from '@/assets/osoul-logo.png';

// Navigation items configuration
const getNavigationItems = (t) => [
  // Overview Section
  {
    title: t('navigation.overview'),
    items: [
      {
        title: t('navigation.mainDashboard'),
        href: '/dashboard',
        icon: Home,
        badge: t('common.live'),
        badgeVariant: 'default'
      },
    ],
  },
  
  // Dashboards Section
  {
    title: t('navigation.dashboards'),
    icon: Grid3x3,
    items: [
      { 
        title: t('navigation.executiveDashboard'), 
        href: '/dashboards/executive', 
        icon: Building2,
        description: t('navigation.executiveDashboardDesc')
      },
      { 
        title: t('navigation.operationsDashboard'), 
        href: '/dashboards/operations', 
        icon: Activity,
        description: t('navigation.operationsDashboardDesc')
      },
      { 
        title: t('navigation.customDashboard'), 
        href: '/dashboards/custom', 
        icon: Target,
        description: t('navigation.customDashboardDesc')
      },
    ],
  },
  
  // Banking Operations Section
  {
    title: t('navigation.bankingOperations'),
    items: [
      {
        title: t('navigation.customers'),
        icon: Users,
        items: [
          { 
            title: t('navigation.allCustomers'), 
            href: '/customers', 
            badge: '12.5k',
            icon: Users 
          },
          { 
            title: t('navigation.addCustomer'), 
            href: '/customers/new',
            icon: UserCheck
          },
          { 
            title: t('navigation.kycPending'), 
            href: '/customers/kyc-pending', 
            badge: '23',
            badgeVariant: 'destructive',
            icon: FileWarning
          },
          { 
            title: t('navigation.riskAssessment'), 
            href: '/customers/risk',
            icon: AlertTriangle
          },
        ],
      },
      {
        title: t('navigation.accounts'),
        icon: CreditCard,
        items: [
          { 
            title: t('navigation.allAccounts'), 
            href: '/accounts',
            icon: CreditCard
          },
          { 
            title: t('navigation.openAccount'), 
            href: '/accounts/new',
            icon: CreditCard
          },
          { 
            title: t('navigation.blockedAccounts'), 
            href: '/accounts/blocked', 
            badge: '5',
            badgeVariant: 'destructive',
            icon: Shield
          },
          { 
            title: t('navigation.dormantAccounts'), 
            href: '/accounts/dormant',
            badge: '12',
            icon: Moon
          },
        ],
      },
      {
        title: t('navigation.transactions'),
        icon: ArrowUpDown,
        items: [
          { 
            title: t('navigation.allTransactions'), 
            href: '/transactions',
            icon: ArrowUpDown
          },
          { 
            title: t('navigation.pendingApproval'), 
            href: '/transactions/pending', 
            badge: '156',
            badgeVariant: 'default',
            icon: Clock
          },
          { 
            title: t('navigation.failedTransactions'), 
            href: '/transactions/failed', 
            badge: '23',
            badgeVariant: 'destructive',
            icon: X
          },
          { 
            title: t('navigation.bulkUpload'), 
            href: '/transactions/bulk',
            icon: FileText
          },
        ],
      },
      {
        title: t('navigation.loans'),
        icon: Wallet,
        items: [
          { 
            title: t('navigation.allLoans'), 
            href: '/loans',
            icon: Wallet
          },
          { 
            title: t('navigation.loanApplications'), 
            href: '/loans/applications', 
            badge: '45',
            badgeVariant: 'default',
            icon: FileText
          },
          { 
            title: t('navigation.disbursements'), 
            href: '/loans/disbursements',
            icon: DollarSign
          },
          { 
            title: t('navigation.collections'), 
            href: '/loans/collections',
            icon: Coins
          },
          { 
            title: t('navigation.overdueLoans'), 
            href: '/loans/overdue',
            badge: '89',
            badgeVariant: 'destructive',
            icon: AlertTriangle
          },
        ],
      },
    ],
  },
  
  // Collections Section
  {
    title: t('navigation.collections'),
    items: [
      {
        title: t('navigation.collectionDashboards'),
        icon: LayoutDashboard,
        badge: '13',
        badgeVariant: 'secondary',
        isExpanded: true,
        items: [
          { 
            title: t('navigation.collectionOverview'), 
            href: '/collection/overview', 
            icon: Eye,
            description: t('navigation.collectionOverviewDesc')
          },
          { 
            title: t('navigation.dailyCollection'), 
            href: '/collection/daily', 
            icon: Calendar, 
            badge: t('common.live'),
            badgeVariant: 'default',
            description: t('navigation.dailyCollectionDesc')
          },
          { 
            title: t('navigation.digitalCollection'), 
            href: '/collection/digital', 
            icon: Smartphone,
            description: t('navigation.digitalCollectionDesc')
          },
          { 
            title: t('navigation.earlyWarning'), 
            href: '/collection/early-warning', 
            icon: AlertTriangle, 
            badge: '45',
            badgeVariant: 'destructive',
            description: t('navigation.earlyWarningDesc')
          },
          { 
            title: t('navigation.executiveCollection'), 
            href: '/collection/executive', 
            icon: Building2,
            description: t('navigation.executiveCollectionDesc')
          },
          { 
            title: t('navigation.delinquencyExecutive'), 
            href: '/collection/delinquency-executive', 
            icon: TrendingUp, 
            badge: t('common.new'),
            badgeVariant: 'default',
            description: t('navigation.delinquencyExecutiveDesc')
          },
          { 
            title: t('navigation.fieldCollection'), 
            href: '/collection/field', 
            icon: MapPin,
            description: t('navigation.fieldCollectionDesc')
          },
          { 
            title: t('navigation.officerPerformance'), 
            href: '/collection/officer-performance', 
            icon: Trophy,
            description: t('navigation.officerPerformanceDesc')
          },
          { 
            title: t('navigation.shariaCompliance'), 
            href: '/collection/sharia-compliance', 
            icon: BookOpen,
            description: t('navigation.shariaComplianceDesc')
          },
          { 
            title: t('navigation.vintageAnalysis'), 
            href: '/collection/vintage-analysis', 
            icon: Layers,
            description: t('navigation.vintageAnalysisDesc')
          },
          { 
            title: t('navigation.specialistReport'), 
            href: '/collection/specialist-report', 
            icon: UserSearch, 
            badge: t('common.new'),
            badgeVariant: 'default',
            description: t('navigation.specialistReportDesc')
          },
        ],
      },
      {
        title: t('navigation.collectionOperations'),
        icon: Activity,
        items: [
          { 
            title: t('navigation.collectionCases'), 
            href: '/collection/cases', 
            icon: FileText, 
            badge: '234',
            description: t('navigation.collectionCasesDesc')
          },
          { 
            title: t('navigation.collectionReports'), 
            href: '/collection/reports', 
            icon: BarChart3,
            description: t('navigation.collectionReportsDesc')
          },
        ],
      },
    ],
  },
  
  // Management Section
  {
    title: t('navigation.management'),
    items: [
      {
        title: t('navigation.reports'),
        icon: FileText,
        items: [
          { 
            title: t('navigation.financialReports'), 
            href: '/reports/financial',
            icon: DollarSign
          },
          { 
            title: t('navigation.regulatoryReports'), 
            href: '/reports/regulatory',
            icon: Shield
          },
          { 
            title: t('navigation.customerReports'), 
            href: '/reports/customers',
            icon: Users
          },
          { 
            title: t('navigation.riskReports'), 
            href: '/reports/risk',
            icon: AlertTriangle
          },
        ],
      },
      {
        title: t('navigation.operations'),
        icon: Settings,
        items: [
          { 
            title: t('navigation.branchManagement'), 
            href: '/operations/branches',
            icon: Building2
          },
          { 
            title: t('navigation.userManagement'), 
            href: '/operations/users',
            icon: Users
          },
          { 
            title: t('navigation.auditTrail'), 
            href: '/operations/audit',
            icon: FileText
          },
          { 
            title: t('navigation.systemHealth'), 
            href: '/operations/health',
            icon: Activity,
            badge: t('common.operational'),
            badgeVariant: 'success'
          },
        ],
      },
      {
        title: t('navigation.analytics'),
        href: '/analytics',
        icon: TrendingUp,
      },
      {
        title: t('navigation.compliance'),
        href: '/compliance',
        icon: Shield,
      },
    ],
  },
];

// Clock icon (since it's not in lucide-react)
const Clock = ({ className }) => (
  <svg
    className={className}
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// Navigation item component
function NavItem({ item, level = 0, isCollapsed }) {
  const location = useLocation();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const hasChildren = item.items && item.items.length > 0;
  const isActive = item.href === location.pathname || 
    (hasChildren && item.items.some(child => 
      child.href === location.pathname || 
      (child.items && child.items.some(subChild => subChild.href === location.pathname))
    ));

  // Auto-expand if child is active
  useEffect(() => {
    if (hasChildren && item.items.some(child => 
      child.href === location.pathname ||
      (child.items && child.items.some(subChild => subChild.href === location.pathname))
    )) {
      setIsOpen(true);
    }
    
    // Check if isExpanded is set in the item config
    if (item.isExpanded) {
      setIsOpen(true);
    }
  }, [location.pathname, hasChildren, item.items, item.isExpanded]);

  const ItemIcon = item.icon;

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 font-normal group hover:bg-accent/50 transition-colors h-9 px-3",
              level > 0 && "ml-6 w-[calc(100%-1.5rem)]",
              isActive && "bg-accent text-accent-foreground font-medium"
            )}
          >
            {ItemIcon && (
              <ItemIcon className={cn(
                "h-4 w-4 shrink-0",
                isActive && "text-primary"
              )} />
            )}
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left text-sm">{item.title}</span>
                <div className="flex items-center gap-1">
                  {item.badge && (
                    <Badge 
                      variant={item.badgeVariant || "secondary"} 
                      className="h-4 px-1 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )} />
                </div>
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        {!isCollapsed && (
          <CollapsibleContent className="mt-0.5">
            {item.items.map((child, index) => (
              <NavItem key={index} item={child} level={level + 1} isCollapsed={isCollapsed} />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  }

  const content = (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 font-normal group hover:bg-accent/50 transition-colors h-9 px-3",
        level > 0 && "ml-6 w-[calc(100%-1.5rem)]",
        isActive && "bg-accent text-accent-foreground font-medium"
      )}
      asChild
    >
      <Link to={item.href}>
        {ItemIcon && (
          <ItemIcon className={cn(
            "h-4 w-4 shrink-0",
            isActive && "text-primary"
          )} />
        )}
        {!isCollapsed && (
          <>
            <span className="flex-1 text-sm">{item.title}</span>
            {item.badge && (
              <Badge 
                variant={item.badgeVariant || "secondary"} 
                className="h-4 px-1 text-xs"
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    </Button>
  );

  if (isCollapsed && item.title) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-4">
            <span>{item.title}</span>
            {item.badge && (
              <Badge variant={item.badgeVariant || "secondary"} className="h-4 px-1 text-xs">
                {item.badge}
              </Badge>
            )}
            {item.description && (
              <span className="text-xs text-muted-foreground">{item.description}</span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// Main Sidebar Component
export function Sidebar({ isCollapsed, setIsCollapsed }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigationItems = getNavigationItems(t);

  // Filter navigation items based on search
  const filterNavItems = (items, query) => {
    if (!query) return items;
    
    return items.reduce((acc, section) => {
      const filteredItems = section.items.filter(item => {
        const matchesTitle = item.title.toLowerCase().includes(query.toLowerCase());
        const matchesDescription = item.description?.toLowerCase().includes(query.toLowerCase());
        const hasMatchingChildren = item.items?.some(child => 
          child.title.toLowerCase().includes(query.toLowerCase()) ||
          child.description?.toLowerCase().includes(query.toLowerCase())
        );
        
        return matchesTitle || matchesDescription || hasMatchingChildren;
      });
      
      if (filteredItems.length > 0) {
        acc.push({ ...section, items: filteredItems });
      }
      
      return acc;
    }, []);
  };

  const filteredNavItems = filterNavItems(navigationItems, searchQuery);

  // Notifications count
  const notificationCount = 5;

  return (
    <div className={cn(
      "flex h-screen flex-col border-r bg-background transition-all duration-300 overflow-hidden",
      isCollapsed ? "w-16" : "w-80 md:w-64"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-3 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <img 
              src={osoulLogo} 
              alt="Osoul" 
              className="h-10 w-10 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">BankOS Pro</span>
              <span className="text-xs text-muted-foreground">v2.0.0</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <img 
            src={osoulLogo} 
            alt="Osoul" 
            className="h-8 w-8 object-contain mx-auto"
          />
        )}
        {!isCollapsed && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.location.href = '/notifications'}
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                  {notificationCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('common.search')}
              className="w-full rounded-md border bg-background px-8 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="px-3 pb-2">
          <div className="flex gap-1">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => window.location.href = '/customers/new'}
            >
              <UserCheck className="h-3 w-3 mr-1" />
              {t('navigation.newCustomer')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => window.location.href = '/loans/applications/new'}
            >
              <Wallet className="h-3 w-3 mr-1" />
              {t('navigation.newLoan')}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 overflow-y-auto">
        <div className="space-y-4 py-2 pb-20">
          {searchQuery && filteredNavItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t('common.noResultsFound')}
            </div>
          )}
          
          {filteredNavItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!isCollapsed && section.title && (
                <h4 className="mb-1 px-3 text-xs font-semibold uppercase text-muted-foreground">
                  {section.title}
                </h4>
              )}
              <div className="space-y-0.5">
                {section.items.map((item, index) => (
                  <NavItem key={index} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="border-t p-2">
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 rounded-lg p-2 hover:bg-accent/50 transition-colors cursor-pointer mb-1",
              isCollapsed && "justify-center"
            )}>
              <Avatar className="h-7 w-7">
                <AvatarImage src="/api/placeholder/32/32" />
                <AvatarFallback className="text-xs">JD</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">john@bankos.com</p>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('common.myAccount')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              <User className="mr-2 h-4 w-4" />
              {t('common.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
              <Settings className="mr-2 h-4 w-4" />
              {t('common.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => console.log('Logout')}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator className="my-1" />

        {/* Footer Actions */}
        <div className="space-y-0.5">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-start gap-2 font-normal h-8 px-2",
                  isCollapsed && "justify-center"
                )}
              >
                <Languages className="h-3.5 w-3.5" />
                {!isCollapsed && (
                  <span className="text-sm">
                    {i18n.language === 'ar' ? 'العربية' : 'English'}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => i18n.changeLanguage('en')}>
                <Globe className="mr-2 h-4 w-4" />
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => i18n.changeLanguage('ar')}>
                <Globe className="mr-2 h-4 w-4" />
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-2 font-normal h-8 px-2",
              isCollapsed && "justify-center"
            )}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Moon className="h-3.5 w-3.5" />
            ) : (
              <Sun className="h-3.5 w-3.5" />
            )}
            {!isCollapsed && <span className="text-sm">{t('common.theme')}</span>}
          </Button>

          {/* Settings */}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-2 font-normal h-8 px-2",
              isCollapsed && "justify-center"
            )} 
            asChild
          >
            <Link to="/settings">
              <Settings className="h-3.5 w-3.5" />
              {!isCollapsed && <span className="text-sm">{t('navigation.settings')}</span>}
            </Link>
          </Button>

          {/* Help */}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-2 font-normal h-8 px-2",
              isCollapsed && "justify-center"
            )} 
            asChild
          >
            <Link to="/help">
              <HelpCircle className="h-3.5 w-3.5" />
              {!isCollapsed && <span className="text-sm">{t('navigation.helpSupport')}</span>}
            </Link>
          </Button>

          {/* Logout */}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-2 font-normal h-8 px-2 text-red-600 hover:text-red-600 hover:bg-red-50",
              isCollapsed && "justify-center"
            )}
            onClick={() => console.log('Logout')}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!isCollapsed && <span className="text-sm">{t('common.logout')}</span>}
          </Button>
        </div>

        {/* System Status */}
        {!isCollapsed && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-700 dark:text-green-400">
                {t('common.systemOperational')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}