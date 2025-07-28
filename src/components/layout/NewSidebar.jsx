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
  Languages,
  User,
  Package,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import osoulLogo from '@/assets/osol-logo.png';

// Navigation configuration
const navigationConfig = [
  {
    title: 'OVERVIEW',
    items: [
      {
        title: 'Main Dashboard',
        href: '/dashboard',
        icon: Home,
        badge: 'LIVE',
        badgeVariant: 'default'
      },
    ],
  },
  {
    title: 'DASHBOARDS',
    icon: Grid3x3,
    items: [
      { 
        title: 'Executive Dashboard', 
        href: '/dashboards/executive', 
        icon: Building2,
      },
      { 
        title: 'Operations Dashboard', 
        href: '/dashboards/operations', 
        icon: Activity,
      },
      { 
        title: 'Custom Dashboard', 
        href: '/dashboards/custom', 
        icon: Target,
      },
    ],
  },
  {
    title: 'COLLECTIONS',
    items: [
      {
        title: 'Collection Dashboards',
        icon: LayoutDashboard,
        badge: '13',
        badgeVariant: 'secondary',
        children: [
          { title: 'Collection Overview', href: '/collection/overview', icon: Eye },
          { title: 'Daily Collection', href: '/collection/daily', icon: Calendar, badge: 'LIVE', badgeVariant: 'default' },
          { title: 'Digital Collection', href: '/collection/digital', icon: Smartphone },
          { title: 'Early Warning', href: '/collection/early-warning', icon: AlertTriangle, badge: '45', badgeVariant: 'destructive' },
          { title: 'Executive Collection', href: '/collection/executive', icon: Building2 },
          { title: 'Delinquency Executive', href: '/collection/delinquency-executive', icon: TrendingUp, badge: 'NEW', badgeVariant: 'default' },
          { title: 'Field Collection', href: '/collection/field', icon: MapPin },
          { title: 'Officer Performance', href: '/collection/officer-performance', icon: Trophy },
          { title: 'Sharia Compliance', href: '/collection/sharia-compliance', icon: BookOpen },
          { title: 'Vintage Analysis', href: '/collection/vintage-analysis', icon: Layers },
          { title: 'Specialist Report', href: '/collection/specialist-report', icon: UserSearch, badge: 'NEW', badgeVariant: 'default' },
        ]
      },
      {
        title: 'Collection Reports',
        icon: FileText,
        children: [
          { title: 'Branch Level Report', href: '/collection/branch-report', icon: Building2, badge: 'NEW', badgeVariant: 'default' },
          { title: 'Product Level Report', href: '/collection/product-report', icon: Package, badge: 'NEW', badgeVariant: 'default' }
        ]
      },
    ],
  },
  {
    title: 'BANKING OPERATIONS',
    items: [
      {
        title: 'Customers',
        icon: Users,
        children: [
          { title: 'All Customers', href: '/customers', badge: '12.5k', icon: Users },
          { title: 'Add Customer', href: '/customers/new', icon: UserCheck },
          { title: 'KYC Pending', href: '/customers/kyc-pending', badge: '23', badgeVariant: 'destructive', icon: FileWarning },
          { title: 'Risk Assessment', href: '/customers/risk', icon: AlertTriangle },
        ],
      },
      {
        title: 'Accounts',
        icon: CreditCard,
        children: [
          { title: 'All Accounts', href: '/accounts', icon: CreditCard },
          { title: 'Open Account', href: '/accounts/new', icon: CreditCard },
          { title: 'Blocked Accounts', href: '/accounts/blocked', badge: '5', badgeVariant: 'destructive', icon: Shield },
          { title: 'Dormant Accounts', href: '/accounts/dormant', badge: '12', icon: Moon },
        ],
      },
      {
        title: 'Transactions',
        icon: ArrowUpDown,
        children: [
          { title: 'All Transactions', href: '/transactions', icon: ArrowUpDown },
          { title: 'Pending Approval', href: '/transactions/pending', badge: '156', badgeVariant: 'default', icon: Clock },
          { title: 'Failed Transactions', href: '/transactions/failed', badge: '23', badgeVariant: 'destructive', icon: X },
          { title: 'Bulk Upload', href: '/transactions/bulk', icon: FileText },
        ],
      },
      {
        title: 'Loans',
        icon: Wallet,
        children: [
          { title: 'All Loans', href: '/loans', icon: Wallet },
          { title: 'Loan Applications', href: '/loans/applications', badge: '45', badgeVariant: 'default', icon: FileText },
          { title: 'Disbursements', href: '/loans/disbursements', icon: DollarSign },
          { title: 'Collections', href: '/loans/collections', icon: Coins },
          { title: 'Overdue Loans', href: '/loans/overdue', badge: '89', badgeVariant: 'destructive', icon: AlertTriangle },
        ],
      },
    ],
  },
];

// Clock icon component
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

// Single navigation item component
const NavLink = ({ item, onNavigate, isActive }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const Icon = item.icon;
  
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800",
        isActive && "bg-primary/10 text-primary font-medium",
        isRTL && "flex-row-reverse"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <Badge variant={item.badgeVariant || "secondary"} className="h-5 px-1.5 text-xs">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
};

// Navigation group with children
const NavGroup = ({ item, onNavigate, pathname, defaultOpen = false }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const Icon = item.icon;
  
  // Check if any child is active
  const hasActiveChild = item.children?.some(child => 
    child.href === pathname || 
    child.children?.some(subChild => subChild.href === pathname)
  );
  
  return (
    <AccordionItem value={item.title} className="border-0">
      <AccordionTrigger 
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:no-underline",
          hasActiveChild && "bg-primary/10 text-primary font-medium",
          isRTL && "flex-row-reverse"
        )}
      >
        <div className={cn("flex items-center gap-3 flex-1", isRTL && "flex-row-reverse")}>
          {Icon && <Icon className="h-4 w-4" />}
          <span>{item.title}</span>
          {item.badge && (
            <Badge variant={item.badgeVariant || "secondary"} className="h-5 px-1.5 text-xs">
              {item.badge}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-1 pt-1">
        <div className={cn("space-y-1", isRTL ? "pr-7" : "pl-7")}>
          {item.children?.map((child, idx) => (
            child.children ? (
              <NavGroup
                key={idx}
                item={child}
                onNavigate={onNavigate}
                pathname={pathname}
              />
            ) : (
              <NavLink
                key={idx}
                item={child}
                onNavigate={onNavigate}
                isActive={child.href === pathname}
              />
            )
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

// Main Sidebar Component
export function NewSidebar({ isOpen, onClose, isMobile = false }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const isRTL = i18n.language === 'ar';
  
  // Get active accordion values
  const getDefaultOpenItems = () => {
    const openItems = [];
    navigationConfig.forEach(section => {
      section.items?.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => 
            child.href === location.pathname ||
            child.children?.some(subChild => subChild.href === location.pathname)
          );
          if (hasActiveChild) {
            openItems.push(item.title);
          }
        }
      });
    });
    return openItems;
  };
  
  const handleNavigate = () => {
    if (isMobile) {
      onClose?.();
    }
  };
  
  // Filter navigation based on search
  const filterNavigation = (config, query) => {
    if (!query) return config;
    
    return config.map(section => ({
      ...section,
      items: section.items?.filter(item => {
        const matchesItem = item.title.toLowerCase().includes(query.toLowerCase());
        const matchesChildren = item.children?.some(child =>
          child.title.toLowerCase().includes(query.toLowerCase())
        );
        return matchesItem || matchesChildren;
      })
    })).filter(section => section.items?.length > 0);
  };
  
  const filteredNavigation = filterNavigation(navigationConfig, searchQuery);
  
  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-white dark:bg-gray-900",
      isRTL && "rtl"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <img src={osoulLogo} alt="Konan" className="h-8 w-8" />
          <div>
            <h2 className="text-lg font-semibold">Konan Pro</h2>
            <p className="text-xs text-muted-foreground">v2.0.0</p>
          </div>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Search */}
      <div className="border-b p-4">
        <div className="relative">
          <Search className={cn(
            "absolute top-2.5 h-4 w-4 text-muted-foreground",
            isRTL ? "right-3" : "left-3"
          )} />
          <input
            type="text"
            placeholder={t('common.search', 'Search...')}
            className={cn(
              "w-full rounded-lg border bg-gray-50 dark:bg-gray-800 px-9 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary",
              isRTL && "text-right"
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            dir={isRTL ? "rtl" : "ltr"}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute top-1 h-6 w-6",
                isRTL ? "left-1" : "right-1"
              )}
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-6">
          {searchQuery && filteredNavigation.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {t('common.noResultsFound', 'No results found')}
            </p>
          ) : (
            filteredNavigation.map((section, idx) => (
              <div key={idx}>
                <h3 className={cn(
                  "mb-2 text-xs font-semibold uppercase text-muted-foreground",
                  isRTL && "text-right"
                )}>
                  {section.title}
                </h3>
                <Accordion
                  type="multiple"
                  defaultValue={getDefaultOpenItems()}
                  className="space-y-1"
                >
                  {section.items?.map((item, itemIdx) => (
                    item.children ? (
                      <NavGroup
                        key={itemIdx}
                        item={item}
                        onNavigate={handleNavigate}
                        pathname={location.pathname}
                      />
                    ) : (
                      <NavLink
                        key={itemIdx}
                        item={item}
                        onNavigate={handleNavigate}
                        isActive={item.href === location.pathname}
                      />
                    )
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="border-t p-4 space-y-3">
        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-3",
          isRTL && "flex-row-reverse"
        )}>
          <Avatar className="h-10 w-10">
            <AvatarImage src="/api/placeholder/40/40" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className={cn("flex-1", isRTL && "text-right")}>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
          >
            <Globe className="h-4 w-4" />
            <span className="ml-1 text-xs">{i18n.language === 'ar' ? 'EN' : 'AR'}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Sun className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}