import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n/i18n';
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
  Languages,
  User,
  Package,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  MessageSquare,
  HeadphonesIcon
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
import osoulLogo from '@/assets/osol-logo.png';

// Navigation items configuration with direct titles and optional translation keys
const getNavigationItems = (t, useTranslation = false) => {
  // Helper function to get text - uses translation if available and enabled, otherwise returns direct text
  const getText = (key, directText) => {
    if (useTranslation) {
      try {
        const translated = t(key);
        // If translation key exists and is different from the key itself, use it
        return translated !== key ? translated : directText;
      } catch {
        return directText;
      }
    }
    return directText;
  };

  return [
    // Overview Section
    {
      title: getText('navigation.overview', 'OVERVIEW'),
      items: [
        {
          title: getText('navigation.mainDashboard', 'Main Dashboard'),
          href: '/dashboard',
          icon: Home,
          badge: getText('common.live', 'LIVE'),
          badgeVariant: 'default'
        },
      ],
    },
    
    // Dashboards Section
    {
      title: getText('navigation.dashboards', 'DASHBOARDS'),
      icon: Grid3x3,
      items: [
        { 
          title: getText('navigation.executiveDashboard', 'Executive Dashboard'), 
          href: '/dashboards/executive', 
          icon: Building2,
          description: getText('navigation.executiveDashboardDesc', 'High-level overview for executives')
        },
        { 
          title: getText('navigation.operationsDashboard', 'Operations Dashboard'), 
          href: '/dashboards/operations', 
          icon: Activity,
          description: getText('navigation.operationsDashboardDesc', 'Daily operations monitoring')
        },
        { 
          title: getText('navigation.customDashboard', 'Custom Dashboard'), 
          href: '/dashboards/custom', 
          icon: Target,
          description: getText('navigation.customDashboardDesc', 'Build your own dashboard')
        },
      ],
    },
    
    // Collections Section - Now before Banking Operations
    {
      title: getText('navigation.collections', 'COLLECTIONS'),
      items: [
        {
          title: getText('navigation.collectionDashboards', 'Collection Dashboards'),
          icon: LayoutDashboard,
          badge: '13',
          badgeVariant: 'secondary',
          isExpanded: true,
          items: [
            { 
              title: getText('navigation.collectionOverview', 'Collection Overview'), 
              href: '/collection/overview', 
              icon: Eye,
              description: getText('navigation.collectionOverviewDesc', 'Overall collection performance')
            },
            { 
              title: getText('navigation.dailyCollection', 'Daily Collection'), 
              href: '/collection/daily', 
              icon: Calendar, 
              badge: getText('common.live', 'LIVE'),
              badgeVariant: 'default',
              description: getText('navigation.dailyCollectionDesc', 'Today\'s collection activities')
            },
            { 
              title: getText('navigation.digitalCollection', 'Digital Collection'), 
              href: '/collection/digital', 
              icon: Smartphone,
              description: getText('navigation.digitalCollectionDesc', 'Online and mobile collections')
            },
            { 
              title: getText('navigation.earlyWarning', 'Early Warning'), 
              href: '/collection/early-warning', 
              icon: AlertTriangle, 
              badge: '45',
              badgeVariant: 'destructive',
              description: getText('navigation.earlyWarningDesc', 'Risk indicators and alerts')
            },
            { 
              title: getText('navigation.executiveCollection', 'Executive Collection'), 
              href: '/collection/executive', 
              icon: Building2,
              description: getText('navigation.executiveCollectionDesc', 'Executive collection summary')
            },
            { 
              title: getText('navigation.delinquencyExecutive', 'Delinquency Executive'), 
              href: '/collection/delinquency-executive', 
              icon: TrendingUp, 
              badge: getText('common.new', 'NEW'),
              badgeVariant: 'default',
              description: getText('navigation.delinquencyExecutiveDesc', 'Delinquency analysis')
            },
            { 
              title: getText('navigation.fieldCollection', 'Field Collection'), 
              href: '/collection/field', 
              icon: MapPin,
              description: getText('navigation.fieldCollectionDesc', 'Field agent performance')
            },
            { 
              title: getText('navigation.officerPerformance', 'Officer Performance'), 
              href: '/collection/officer-performance', 
              icon: Trophy,
              description: getText('navigation.officerPerformanceDesc', 'Collection officer metrics')
            },
            { 
              title: getText('navigation.shariaCompliance', 'Sharia Compliance'), 
              href: '/collection/sharia-compliance', 
              icon: BookOpen,
              description: getText('navigation.shariaComplianceDesc', 'Islamic banking compliance')
            },
            { 
              title: getText('navigation.vintageAnalysis', 'Vintage Analysis'), 
              href: '/collection/vintage-analysis', 
              icon: Layers,
              description: getText('navigation.vintageAnalysisDesc', 'Portfolio aging analysis')
            },
            { 
              title: getText('navigation.specialistReport', 'Specialist Report'), 
              href: '/collection/specialist-report', 
              icon: UserSearch, 
              badge: getText('common.new', 'NEW'),
              badgeVariant: 'default',
              description: getText('navigation.specialistReportDesc', 'Detailed specialist reports')
            },
            {
              title: getText('navigation.collectionReports', 'Collection Reports'),
              icon: FileText,
              items: [
                {
                  title: getText('navigation.branchLevelReport', 'Branch Level Report'),
                  href: '/collection/branch-report',
                  icon: Building2,
                  badge: getText('common.new', 'NEW'),
                  badgeVariant: 'default'
                },
                {
                  title: getText('navigation.productLevelReport', 'Product Level Report'),
                  href: '/collection/product-report',
                  icon: Package,
                  badge: getText('common.new', 'NEW'),
                  badgeVariant: 'default'
                }
              ]
            },
          ],
        },
      ],
    },

    // Banking Operations Section
    {
      title: getText('navigation.bankingOperations', 'BANKING OPERATIONS'),
      items: [
        {
          title: getText('navigation.customers', 'Customers'),
          icon: Users,
          items: [
            { 
              title: getText('navigation.allCustomers', 'All Customers'), 
              href: '/customers', 
              badge: '12.5k',
              icon: Users 
            },
            { 
              title: getText('navigation.addCustomer', 'Add Customer'), 
              href: '/customers/new',
              icon: UserCheck
            },
            { 
              title: getText('navigation.kycPending', 'KYC Pending'), 
              href: '/customers/kyc-pending', 
              badge: '23',
              badgeVariant: 'destructive',
              icon: FileWarning
            },
            { 
              title: getText('navigation.riskAssessment', 'Risk Assessment'), 
              href: '/customers/risk',
              icon: AlertTriangle
            },
          ],
        },
        {
          title: getText('navigation.accounts', 'Accounts'),
          icon: CreditCard,
          items: [
            { 
              title: getText('navigation.allAccounts', 'All Accounts'), 
              href: '/accounts',
              icon: CreditCard
            },
            { 
              title: getText('navigation.openAccount', 'Open Account'), 
              href: '/accounts/new',
              icon: CreditCard
            },
            { 
              title: getText('navigation.blockedAccounts', 'Blocked Accounts'), 
              href: '/accounts/blocked', 
              badge: '5',
              badgeVariant: 'destructive',
              icon: Shield
            },
            { 
              title: getText('navigation.dormantAccounts', 'Dormant Accounts'), 
              href: '/accounts/dormant',
              badge: '12',
              icon: Moon
            },
          ],
        },
        {
          title: getText('navigation.transactions', 'Transactions'),
          icon: ArrowUpDown,
          items: [
            { 
              title: getText('navigation.allTransactions', 'All Transactions'), 
              href: '/transactions',
              icon: ArrowUpDown
            },
            { 
              title: getText('navigation.pendingApproval', 'Pending Approval'), 
              href: '/transactions/pending', 
              badge: '156',
              badgeVariant: 'default',
              icon: Clock
            },
            { 
              title: getText('navigation.failedTransactions', 'Failed Transactions'), 
              href: '/transactions/failed', 
              badge: '23',
              badgeVariant: 'destructive',
              icon: X
            },
            { 
              title: getText('navigation.bulkUpload', 'Bulk Upload'), 
              href: '/transactions/bulk',
              icon: FileText
            },
          ],
        },
        {
          title: getText('navigation.loans', 'Loans'),
          icon: Wallet,
          items: [
            { 
              title: getText('navigation.allLoans', 'All Loans'), 
              href: '/loans',
              icon: Wallet
            },
            { 
              title: getText('navigation.loanApplications', 'Loan Applications'), 
              href: '/loans/applications', 
              badge: '45',
              badgeVariant: 'default',
              icon: FileText
            },
            { 
              title: getText('navigation.disbursements', 'Disbursements'), 
              href: '/loans/disbursements',
              icon: DollarSign
            },
            { 
              title: getText('navigation.collections', 'Collections'), 
              href: '/loans/collections',
              icon: Coins
            },
            { 
              title: getText('navigation.overdueLoans', 'Overdue Loans'), 
              href: '/loans/overdue',
              badge: '89',
              badgeVariant: 'destructive',
              icon: AlertTriangle
            },
          ],
        },
      ],
    },
  ];
};

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
function NavItem({ item, level = 0, isCollapsed, onNavigate }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = i18n.language === 'ar';
  
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
              "w-full justify-start gap-3 font-normal group hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 h-11 px-3 rounded-xl",
              level > 0 && (isRTL ? "mr-6 w-[calc(100%-1.5rem)]" : "ml-6 w-[calc(100%-1.5rem)]"),
              isActive && "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-medium border-l-4 border-primary"
            )}
          >
            {ItemIcon && (
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isActive ? "bg-primary/10" : "bg-gray-100 dark:bg-gray-800 group-hover:bg-primary/10"
              )}>
                <ItemIcon className={cn(
                  "h-4 w-4 transition-colors",
                  isActive && "text-primary"
                )} />
              </div>
            )}
            {!isCollapsed && (
              <>
                <span className={cn("flex-1 text-sm", isRTL ? "text-right" : "text-left")}>{item.title}</span>
                <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  {item.badge && (
                    <Badge 
                      variant={item.badgeVariant || "secondary"} 
                      className="h-5 px-1.5 text-xs font-medium"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground",
                    isOpen && "rotate-90",
                    isRTL && "rotate-180"
                  )} />
                </div>
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        {!isCollapsed && (
          <CollapsibleContent className="mt-1">
            {item.items.map((child, index) => (
              <NavItem key={index} item={child} level={level + 1} isCollapsed={isCollapsed} onNavigate={onNavigate} />
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
        "w-full justify-start gap-3 font-normal group hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 h-11 px-3 rounded-xl",
        level > 0 && (isRTL ? "mr-6 w-[calc(100%-1.5rem)]" : "ml-6 w-[calc(100%-1.5rem)]"),
        isActive && "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-medium border-l-4 border-primary"
      )}
      asChild
    >
      <Link to={item.href} onClick={onNavigate}>
        {ItemIcon && (
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            isActive ? "bg-primary/10" : "bg-gray-100 dark:bg-gray-800 group-hover:bg-primary/10"
          )}>
            <ItemIcon className={cn(
              "h-4 w-4 transition-colors",
              isActive && "text-primary"
            )} />
          </div>
        )}
        {!isCollapsed && (
          <>
            <span className={cn("flex-1 text-sm", isRTL ? "text-right" : "text-left")}>{item.title}</span>
            {item.badge && (
              <Badge 
                variant={item.badgeVariant || "secondary"} 
                className="h-5 px-1.5 text-xs font-medium"
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
              <Badge variant={item.badgeVariant || "secondary"} className="h-5 px-1.5 text-xs">
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
export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileSheet = false, mobileOpen = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  
  // Check if translations are available
  const hasTranslations = i18n.exists('navigation.overview');
  const [navigationItems, setNavigationItems] = useState([]);
  
  const [isMobile, setIsMobile] = useState(false);
  const isRTL = i18n.language === 'ar';

  // Helper function for safe translation with fallback
  const safeTranslate = (key, fallback) => {
    if (hasTranslations && i18n.exists(key)) {
      return t(key);
    }
    return fallback;
  };

  // Initialize navigation items
  useEffect(() => {
    const items = getNavigationItems(t, hasTranslations);
    setNavigationItems(items);
    console.log('Navigation items loaded:', items.length, 'sections');
  }, [t, hasTranslations]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Force re-render on mobile to ensure items are visible
      if (mobile) {
        setSearchQuery(''); // Reset search on mobile
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset search and ensure nav items when mobile sheet opens
  useEffect(() => {
    if (isMobileSheet && mobileOpen) {
      setSearchQuery('');
      const items = getNavigationItems(t, hasTranslations);
      setNavigationItems(items);
    }
  }, [mobileOpen, isMobileSheet, t, hasTranslations]);

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

  // Use filtered items if search is active, otherwise use all items
  const displayItems = searchQuery ? filteredNavItems : navigationItems;

  return (
    <div className={cn(
      "sidebar flex h-full flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-all duration-300 shadow-2xl",
      isCollapsed ? "w-20" : "w-80",
      isRTL ? "border-l border-gray-200 dark:border-gray-800 font-arabic rtl" : "border-r border-gray-200 dark:border-gray-800 ltr",
      isMobileSheet && "h-screen w-full max-h-screen bg-white dark:bg-gray-950" // Ensure proper background on mobile
    )} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex h-24 items-center justify-between px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        {!isCollapsed ? (
          <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl blur-xl" />
              <div className="relative p-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg">
                <img 
                  src={osoulLogo} 
                  alt="Konan" 
                  className="h-14 w-14 object-contain"
                />
              </div>
            </div>
            <div className={cn("flex flex-col", isRTL && "text-right")}>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Konan Pro
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                v2.0.0
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl blur-lg" />
            <div className="relative p-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg">
              <img 
                src={osoulLogo} 
                alt="Konan" 
                className="h-10 w-10 object-contain"
              />
            </div>
          </div>
        )}
        {!isCollapsed && !isMobileSheet && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-all duration-200"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isRTL ? (
              <ChevronsRight className="h-5 w-5" />
            ) : (
              <ChevronsLeft className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4 bg-gradient-to-b from-white/50 to-transparent dark:from-gray-900/50 flex-shrink-0">
          <div className="relative group">
            <Search className={cn(
              "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary",
              isRTL ? "right-3" : "left-3"
            )} />
            <input
              type="text"
              placeholder={safeTranslate('common.search', 'Search...')}
              className={cn(
                "w-full rounded-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-2.5 text-sm outline-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-primary/50 shadow-sm transition-all duration-200",
                isRTL ? "pr-10 pl-10" : "pl-10 pr-10"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800",
                  isRTL ? "left-1.5" : "right-1.5"
                )}
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className={cn(
        "flex-1 px-3 overflow-y-auto",
        isMobileSheet ? "h-[calc(100vh-240px)]" : "h-full" // Fixed height calculation for mobile
      )}>
        <div className="space-y-6 py-4 pb-20">
          {/* No results message */}
          {searchQuery && displayItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {safeTranslate('common.noResultsFound', 'No results found')}
            </div>
          )}
          
          {/* Always show navigation items */}
          {displayItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!isCollapsed && section.title && (
                <h4 className={cn(
                  "mb-3 px-3 text-xs font-semibold uppercase text-muted-foreground/60 tracking-wider",
                  isRTL && "text-right"
                )}>
                  {section.title}
                </h4>
              )}
              <div className="space-y-1">
                {section.items.map((item, index) => (
                  <NavItem 
                    key={index} 
                    item={item} 
                    isCollapsed={isCollapsed}
                    onNavigate={() => {
                      // Close mobile sidebar on navigation
                      if (isMobileSheet && typeof setIsCollapsed === 'function') {
                        setIsCollapsed();
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="border-t bg-gradient-to-t from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 p-3 space-y-3 flex-shrink-0">
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={cn(
              "flex items-center gap-3 rounded-xl p-3 hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 cursor-pointer",
              isCollapsed && "justify-center",
              isRTL && "flex-row-reverse"
            )}>
              <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2">
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 font-semibold">
                  JD
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className={cn("flex-1", isRTL && "text-right")}>
                  <p className="text-sm font-semibold">John Doe</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-64 p-2">
            <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg mb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-800">
                  <AvatarImage src="/api/placeholder/48/48" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-base font-semibold">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">John Doe</p>
                  <p className="text-sm text-muted-foreground">john@konan.com</p>
                </div>
              </div>
            </div>
            <DropdownMenuLabel>{safeTranslate('common.myAccount', 'My Account')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg p-2.5" onClick={() => window.location.href = '/profile'}>
              <User className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {safeTranslate('common.profile', 'Profile')}
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg p-2.5" onClick={() => window.location.href = '/settings'}>
              <Settings className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {safeTranslate('common.settings', 'Settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            {/* Logout removed - authentication not required */}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* System Status */}
        {!isCollapsed && (
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                {safeTranslate('common.systemOperational', 'System Operational')}
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={cn(
          "grid gap-1",
          isCollapsed ? "grid-cols-1" : "grid-cols-4"
        )}>
          {/* Language */}
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full rounded-lg hover:bg-primary/10"
                  onClick={() => changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
                >
                  <Languages className="h-4 w-4" />
                  {!isCollapsed && <span className="sr-only">Language</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch Language</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Theme */}
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full rounded-lg hover:bg-primary/10"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  {!isCollapsed && <span className="sr-only">Theme</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Help */}
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full rounded-lg hover:bg-primary/10"
                  onClick={() => window.location.href = '/help'}
                >
                  <HeadphonesIcon className="h-4 w-4" />
                  {!isCollapsed && <span className="sr-only">Help</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Help & Support</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Collapse/Expand or Feedback */}
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-full rounded-lg hover:bg-primary/10"
                    onClick={() => setIsCollapsed(false)}
                  >
                    {isRTL ? (
                      <ChevronsLeft className="h-4 w-4" />
                    ) : (
                      <ChevronsRight className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Expand Sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-full rounded-lg hover:bg-primary/10"
                    onClick={() => window.location.href = '/feedback'}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send Feedback</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
};