import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Coins
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

const navigationItems = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Main Dashboard',
        href: '/dashboard',
        icon: Home,
        badge: null,
      },
      {
        title: 'Dashboards',
        icon: LayoutDashboard,
        badge: '3',
        children: [
          { title: 'Executive Dashboard', href: '/executive-dashboard', icon: Building2 },
          { title: 'Operations Dashboard', href: '/operations-dashboard', icon: Activity },
          { title: 'Custom Dashboard', href: '/custom-dashboard', icon: Target },
        ],
      },
    ]
  },
  {
    title: 'Banking Operations',
    items: [
      {
        title: 'Customers',
        icon: Users,
        children: [
          { title: 'All Customers', href: '/customers', badge: '12.5k' },
          { title: 'Add Customer', href: '/customers/new' },
          { title: 'KYC Pending', href: '/customers/kyc-pending', badge: '23' },
          { title: 'Risk Assessment', href: '/customers/risk' },
        ],
      },
      {
        title: 'Accounts',
        icon: CreditCard,
        children: [
          { title: 'All Accounts', href: '/accounts' },
          { title: 'Open Account', href: '/accounts/new' },
          { title: 'Blocked Accounts', href: '/accounts/blocked', badge: '5' },
          { title: 'Dormant Accounts', href: '/accounts/dormant' },
        ],
      },
      {
        title: 'Transactions',
        icon: ArrowUpDown,
        children: [
          { title: 'All Transactions', href: '/transactions' },
          { title: 'Pending Approval', href: '/transactions/pending', badge: '156' },
          { title: 'Failed Transactions', href: '/transactions/failed', badge: '23' },
          { title: 'Bulk Upload', href: '/transactions/bulk' },
        ],
      },
      {
        title: 'Loans',
        icon: PiggyBank,
        children: [
          { title: 'Loan Portfolio', href: '/loans' },
          { title: 'Applications', href: '/loans/applications', badge: '45' },
          { title: 'Disbursements', href: '/loans/disbursements' },
          { title: 'Collections', href: '/loans/collections' },
        ],
      },
    ]
  },
  {
    title: 'Collections',
    items: [
      {
        title: 'Collections Hub',
        icon: Coins,
        badge: 'New',
        badgeVariant: 'default',
        children: [
          { title: 'Overview', href: '/collection-overview', icon: Eye },
          { title: 'Daily Collection', href: '/collection-daily', icon: Calendar, badge: 'Live' },
          { title: 'Digital Collection', href: '/collection-digital', icon: Smartphone },
          { title: 'Early Warning', href: '/collection-early-warning', icon: AlertTriangle, badge: '45' },
          { title: 'Executive View', href: '/collection-executive', icon: Building2 },
          { title: 'Field Collection', href: '/collection-field', icon: MapPin },
          { title: 'Officer Performance', href: '/collection-officer-performance', icon: Trophy },
          { title: 'Sharia Compliance', href: '/collection-sharia-compliance', icon: BookOpen },
          { title: 'Vintage Analysis', href: '/collection-vintage-analysis', icon: Layers },
          { title: 'Collection Cases', href: '/collection-cases', icon: FileText, badge: '234' },
          { title: 'Collection Reports', href: '/collection-reports', icon: BarChart3 },
        ],
      },
    ]
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Reports',
        icon: FileText,
        children: [
          { title: 'Financial Reports', href: '/reports/financial' },
          { title: 'Regulatory Reports', href: '/reports/regulatory' },
          { title: 'Customer Reports', href: '/reports/customers' },
          { title: 'Risk Reports', href: '/reports/risk' },
        ],
      },
      {
        title: 'Operations',
        icon: Building2,
        children: [
          { title: 'Branch Management', href: '/operations/branches' },
          { title: 'User Management', href: '/operations/users' },
          { title: 'Audit Trail', href: '/operations/audit' },
          { title: 'System Health', href: '/operations/health' },
        ],
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: TrendingUp,
      },
      {
        title: 'Compliance',
        href: '/compliance',
        icon: Shield,
      },
    ]
  }
];

function NavItem({ item, level = 0, isCollapsed }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href === location.pathname || 
    (hasChildren && item.children.some(child => child.href === location.pathname));

  // Auto-expand if child is active
  useEffect(() => {
    if (hasChildren && item.children.some(child => child.href === location.pathname)) {
      setIsOpen(true);
    }
  }, [location.pathname, hasChildren, item.children]);

  const ItemIcon = item.icon;

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 font-normal group hover:bg-accent/50 transition-colors",
              level > 0 && "ml-4 w-[calc(100%-1rem)]",
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
                <span className="flex-1 text-left">{item.title}</span>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge 
                      variant={item.badgeVariant || "secondary"} 
                      className="h-5 px-1.5 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )} />
                </div>
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        {!isCollapsed && (
          <CollapsibleContent className="space-y-1 mt-1">
            {item.children.map((child, index) => (
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
        "w-full justify-start gap-3 font-normal group hover:bg-accent/50 transition-colors",
        level > 0 && "ml-4 w-[calc(100%-1rem)]",
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
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <Badge 
                variant={item.badgeVariant || "secondary"} 
                className="h-5 px-1.5 text-xs"
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
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export function Sidebar({ isCollapsed, setIsCollapsed }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={cn(
      "flex h-full flex-col border-r bg-background transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">BankOS Pro</span>
              <span className="text-xs text-muted-foreground">v2.0.0</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-lg border bg-background px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-4">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!isCollapsed && (
                <h4 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                  {section.title}
                </h4>
              )}
              <div className="space-y-1">
                {section.items.map((item, index) => (
                  <NavItem key={index} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="border-t p-3">
        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer mb-2",
          isCollapsed && "justify-center"
        )}>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/api/placeholder/32/32" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">john@bankos.com</p>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Footer Actions */}
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3 font-normal h-9",
              isCollapsed && "justify-center px-2"
            )} 
            asChild
          >
            <Link to="/settings">
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span>Settings</span>}
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3 font-normal h-9",
              isCollapsed && "justify-center px-2"
            )} 
            asChild
          >
            <Link to="/help">
              <HelpCircle className="h-4 w-4" />
              {!isCollapsed && <span>Help & Support</span>}
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3 font-normal h-9 text-red-600 hover:text-red-600 hover:bg-red-50",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}