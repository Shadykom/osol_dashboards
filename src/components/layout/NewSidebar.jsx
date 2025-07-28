import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n/i18n';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  ArrowUpDown, 
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  TrendingUp,
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
  Activity,
  Target,
  Home,
  Search,
  Bell,
  Menu,
  X,
  Coins,
  Grid3x3,
  Wallet,
  UserCheck,
  FileWarning,
  UserSearch,
  Package,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  MessageSquare,
  HeadphonesIcon,
  Languages,
  Moon,
  Sun,
  User,
  LogOut,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/useTheme';
import osoulLogo from '@/assets/osol-logo.png';

// Navigation configuration
const getNavigationConfig = (t) => [
  {
    section: 'OVERVIEW',
    items: [
      {
        id: 'dashboard',
        title: 'Main Dashboard',
        href: '/dashboard',
        icon: Home,
        badge: 'LIVE',
        badgeClass: 'bg-green-500'
      }
    ]
  },
  {
    section: 'DASHBOARDS',
    items: [
      {
        id: 'executive',
        title: 'Executive Dashboard',
        href: '/dashboards/executive',
        icon: Building2
      },
      {
        id: 'operations',
        title: 'Operations Dashboard',
        href: '/dashboards/operations',
        icon: Activity
      },
      {
        id: 'custom',
        title: 'Custom Dashboard',
        href: '/dashboards/custom',
        icon: Target
      }
    ]
  },
  {
    section: 'COLLECTIONS',
    expanded: true,
    items: [
      {
        id: 'collection-overview',
        title: 'Collection Overview',
        href: '/collection/overview',
        icon: Eye
      },
      {
        id: 'daily-collection',
        title: 'Daily Collection',
        href: '/collection/daily',
        icon: Calendar,
        badge: 'LIVE',
        badgeClass: 'bg-blue-500'
      },
      {
        id: 'digital-collection',
        title: 'Digital Collection',
        href: '/collection/digital',
        icon: Smartphone
      },
      {
        id: 'early-warning',
        title: 'Early Warning',
        href: '/collection/early-warning',
        icon: AlertTriangle,
        badge: '45',
        badgeClass: 'bg-red-500'
      },
      {
        id: 'executive-collection',
        title: 'Executive Collection',
        href: '/collection/executive',
        icon: Building2
      },
      {
        id: 'delinquency-executive',
        title: 'Delinquency Executive',
        href: '/collection/delinquency-executive',
        icon: TrendingUp,
        badge: 'NEW',
        badgeClass: 'bg-purple-500'
      },
      {
        id: 'field-collection',
        title: 'Field Collection',
        href: '/collection/field',
        icon: MapPin
      },
      {
        id: 'officer-performance',
        title: 'Officer Performance',
        href: '/collection/officer-performance',
        icon: Trophy
      },
      {
        id: 'sharia-compliance',
        title: 'Sharia Compliance',
        href: '/collection/sharia-compliance',
        icon: BookOpen
      },
      {
        id: 'vintage-analysis',
        title: 'Vintage Analysis',
        href: '/collection/vintage-analysis',
        icon: Layers
      },
      {
        id: 'specialist-report',
        title: 'Specialist Report',
        href: '/collection/specialist-report',
        icon: UserSearch,
        badge: 'NEW',
        badgeClass: 'bg-purple-500'
      },
      {
        id: 'collection-reports',
        title: 'Collection Reports',
        icon: FileText,
        children: [
          {
            id: 'branch-report',
            title: 'Branch Level Report',
            href: '/collection/branch-report',
            icon: Building2,
            badge: 'NEW',
            badgeClass: 'bg-purple-500'
          },
          {
            id: 'product-report',
            title: 'Product Level Report',
            href: '/collection/product-report',
            icon: Package,
            badge: 'NEW',
            badgeClass: 'bg-purple-500'
          }
        ]
      }
    ]
  },
  {
    section: 'BANKING OPERATIONS',
    items: [
      {
        id: 'customers',
        title: 'Customers',
        icon: Users,
        children: [
          {
            id: 'all-customers',
            title: 'All Customers',
            href: '/customers',
            icon: Users,
            badge: '12.5k',
            badgeClass: 'bg-gray-500'
          },
          {
            id: 'add-customer',
            title: 'Add Customer',
            href: '/customers/new',
            icon: UserCheck
          },
          {
            id: 'kyc-pending',
            title: 'KYC Pending',
            href: '/customers/kyc-pending',
            icon: FileWarning,
            badge: '23',
            badgeClass: 'bg-red-500'
          },
          {
            id: 'risk-assessment',
            title: 'Risk Assessment',
            href: '/customers/risk',
            icon: AlertTriangle
          }
        ]
      },
      {
        id: 'accounts',
        title: 'Accounts',
        icon: CreditCard,
        children: [
          {
            id: 'all-accounts',
            title: 'All Accounts',
            href: '/accounts',
            icon: CreditCard
          },
          {
            id: 'open-account',
            title: 'Open Account',
            href: '/accounts/new',
            icon: CreditCard
          },
          {
            id: 'blocked-accounts',
            title: 'Blocked Accounts',
            href: '/accounts/blocked',
            icon: AlertTriangle,
            badge: '5',
            badgeClass: 'bg-red-500'
          },
          {
            id: 'dormant-accounts',
            title: 'Dormant Accounts',
            href: '/accounts/dormant',
            icon: Moon,
            badge: '12',
            badgeClass: 'bg-gray-500'
          }
        ]
      },
      {
        id: 'transactions',
        title: 'Transactions',
        icon: ArrowUpDown,
        children: [
          {
            id: 'all-transactions',
            title: 'All Transactions',
            href: '/transactions',
            icon: ArrowUpDown
          },
          {
            id: 'pending-approval',
            title: 'Pending Approval',
            href: '/transactions/pending',
            icon: Clock,
            badge: '156',
            badgeClass: 'bg-yellow-500'
          },
          {
            id: 'failed-transactions',
            title: 'Failed Transactions',
            href: '/transactions/failed',
            icon: X,
            badge: '23',
            badgeClass: 'bg-red-500'
          },
          {
            id: 'bulk-upload',
            title: 'Bulk Upload',
            href: '/transactions/bulk',
            icon: FileText
          }
        ]
      },
      {
        id: 'loans',
        title: 'Loans',
        icon: Wallet,
        children: [
          {
            id: 'all-loans',
            title: 'All Loans',
            href: '/loans',
            icon: Wallet
          },
          {
            id: 'loan-applications',
            title: 'Loan Applications',
            href: '/loans/applications',
            icon: FileText,
            badge: '45',
            badgeClass: 'bg-blue-500'
          },
          {
            id: 'disbursements',
            title: 'Disbursements',
            href: '/loans/disbursements',
            icon: DollarSign
          },
          {
            id: 'collections',
            title: 'Collections',
            href: '/loans/collections',
            icon: Coins
          },
          {
            id: 'overdue-loans',
            title: 'Overdue Loans',
            href: '/loans/overdue',
            icon: AlertTriangle,
            badge: '89',
            badgeClass: 'bg-red-500'
          }
        ]
      }
    ]
  }
];



// Navigation Item Component
function NavigationItem({ item, isCollapsed, onItemClick, level = 0 }) {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { i18n } = useTranslation();
  
  const isRTL = i18n.language === 'ar';
  const hasChildren = item.children && item.children.length > 0;
  
  const isActive = item.href === location.pathname || 
    (hasChildren && item.children.some(child => child.href === location.pathname));

  // Auto-expand if child is active or item is configured to be expanded
  useEffect(() => {
    if (hasChildren && item.children.some(child => child.href === location.pathname)) {
      setIsExpanded(true);
    }
  }, [location.pathname, hasChildren, item.children]);

  const Icon = item.icon;
  const paddingLeft = level * 16;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else if (item.href) {
      onItemClick?.();
    }
  };

  const itemContent = (
    <div
      className={cn(
        "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer group",
        isActive 
          ? "bg-primary/10 text-primary border-r-2 border-primary" 
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
        isCollapsed ? "justify-center" : "justify-between"
      )}
      style={{ paddingLeft: isCollapsed ? undefined : `${12 + paddingLeft}px` }}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {Icon && (
          <Icon className={cn(
            "h-5 w-5 flex-shrink-0 transition-colors",
            isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"
          )} />
        )}
        {!isCollapsed && (
          <span className="truncate" dir={isRTL ? "rtl" : "ltr"}>
            {item.title}
          </span>
        )}
      </div>
      
      {!isCollapsed && (
        <div className="flex items-center gap-2">
          {item.badge && (
            <Badge 
              className={cn(
                "h-5 px-2 text-xs font-medium text-white border-0",
                item.badgeClass || "bg-gray-500"
              )}
            >
              {item.badge}
            </Badge>
          )}
          {hasChildren && (
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform text-gray-400",
              isExpanded && "rotate-90"
            )} />
          )}
        </div>
      )}
    </div>
  );

  const wrappedContent = item.href ? (
    <Link to={item.href} className="block" onClick={onItemClick}>
      {itemContent}
    </Link>
  ) : (
    itemContent
  );

  return (
    <div>
      {wrappedContent}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              isCollapsed={isCollapsed}
              onItemClick={onItemClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Search Component
function SearchBar({ searchQuery, setSearchQuery, isCollapsed }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (isCollapsed) return null;

  return (
    <div className="px-3 py-4">
      <div className="relative">
        <Search className={cn(
          "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
          isRTL ? "right-3" : "left-3"
        )} />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors",
            isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
          )}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center",
              isRTL ? "left-1" : "right-1"
            )}
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}

// Footer Actions Component
function FooterActions({ isCollapsed }) {
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  const actions = [
    {
      icon: Languages,
      label: 'Switch Language',
      onClick: toggleLanguage
    },
    {
      icon: theme === 'dark' ? Sun : Moon,
      label: 'Toggle Theme',
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark')
    },
    {
      icon: HeadphonesIcon,
      label: 'Help & Support',
      onClick: () => window.location.href = '/help'
    },
    {
      icon: MessageSquare,
      label: 'Send Feedback',
      onClick: () => window.location.href = '/feedback'
    }
  ];

  return (
    <div className={cn(
      "p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50",
      isCollapsed ? "space-y-2" : "space-y-3"
    )}>
      {/* User Profile */}
      <div className={cn(
        "flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer",
        isCollapsed && "justify-center"
      )}>
        <Avatar className="h-8 w-8">
          <AvatarImage src="/api/placeholder/32/32" />
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
            JD
          </AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              John Doe
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Administrator
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={cn(
        "grid gap-1",
        isCollapsed ? "grid-cols-1" : "grid-cols-4"
      )}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="h-8 w-full rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={action.onClick}
          >
            <action.icon className="h-4 w-4" />
            {!isCollapsed && <span className="sr-only">{action.label}</span>}
          </Button>
        ))}
      </div>

      {/* System Status */}
      {!isCollapsed && (
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            System Operational
          </span>
        </div>
      )}
    </div>
  );
}

// Main New Sidebar Component
export function NewSidebar({ 
  isCollapsed = false, 
  setIsCollapsed, 
  onItemClick,
  className 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const { t, i18n } = useTranslation();
  const location = useLocation();
  
  const isRTL = i18n.language === 'ar';
  const navigationConfig = getNavigationConfig(t);

  // Filter navigation based on search
  const filteredNavigation = searchQuery
    ? navigationConfig.map(section => ({
        ...section,
        items: section.items.filter(item => {
          const matchTitle = item.title.toLowerCase().includes(searchQuery.toLowerCase());
          const matchChildren = item.children?.some(child => 
            child.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
          return matchTitle || matchChildren;
        })
      })).filter(section => section.items.length > 0)
    : navigationConfig;

  return (
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
      isCollapsed ? "w-16" : "w-72",
      isRTL && "border-r-0 border-l",
      className
    )} dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={osoulLogo} 
                alt="Konan" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Konan Pro
              </h1>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-xs text-gray-500 dark:text-gray-400">v2.0.0</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <img 
              src={osoulLogo} 
              alt="Konan" 
              className="h-8 w-8 object-contain"
            />
          </div>
        )}
        
        {!isCollapsed && setIsCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isRTL ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Search */}
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isCollapsed={isCollapsed}
      />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {searchQuery && filteredNavigation.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredNavigation.map((section, index) => (
              <div key={index}>
                {!isCollapsed && section.section && (
                  <h2 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {section.section}
                  </h2>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavigationItem
                      key={item.id}
                      item={item}
                      isCollapsed={isCollapsed}
                      onItemClick={onItemClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <FooterActions isCollapsed={isCollapsed} />
    </div>
  );
}