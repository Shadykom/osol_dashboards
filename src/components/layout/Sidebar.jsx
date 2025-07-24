import { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Dashboards',
    icon: LayoutDashboard,
    children: [
      { title: 'Executive Dashboard', href: '/executive-dashboard' },
      { title: 'Operations Dashboard', href: '/operations-dashboard' },
      { title: 'Custom Dashboard', href: '/custom-dashboard' },
    ],
  },
  {
    title: 'Customers',
    icon: Users,
    children: [
      { title: 'All Customers', href: '/customers' },
      { title: 'Add Customer', href: '/customers/new' },
      { title: 'KYC Pending', href: '/customers/kyc-pending' },
      { title: 'Risk Assessment', href: '/customers/risk' },
    ],
  },
  {
    title: 'Accounts',
    icon: CreditCard,
    children: [
      { title: 'All Accounts', href: '/accounts' },
      { title: 'Open Account', href: '/accounts/new' },
      { title: 'Blocked Accounts', href: '/accounts/blocked' },
      { title: 'Dormant Accounts', href: '/accounts/dormant' },
    ],
  },
  {
    title: 'Transactions',
    icon: ArrowUpDown,
    children: [
      { title: 'All Transactions', href: '/transactions' },
      { title: 'Pending Approval', href: '/transactions/pending' },
      { title: 'Failed Transactions', href: '/transactions/failed' },
      { title: 'Bulk Upload', href: '/transactions/bulk' },
    ],
  },
  {
    title: 'Loans',
    icon: PiggyBank,
    children: [
      { title: 'Loan Portfolio', href: '/loans' },
      { title: 'Applications', href: '/loans/applications' },
      { title: 'Disbursements', href: '/loans/disbursements' },
      { title: 'Collections', href: '/loans/collections' },
    ],
  },
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
];

function NavItem({ item, level = 0 }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href === location.pathname || 
    (hasChildren && item.children.some(child => child.href === location.pathname));

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 font-normal",
              level > 0 && "pl-8",
              isActive && "bg-accent text-accent-foreground"
            )}
          >
            {item.icon && <item.icon className="h-4 w-4" />}
            <span className="flex-1 text-left">{item.title}</span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1">
          {item.children.map((child, index) => (
            <NavItem key={index} item={child} level={level + 1} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 font-normal",
        level > 0 && "pl-8",
        isActive && "bg-accent text-accent-foreground"
      )}
      asChild
    >
      <Link to={item.href}>
        {item.icon && <item.icon className="h-4 w-4" />}
        <span>{item.title}</span>
      </Link>
    </Button>
  );
}

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {navigationItems.map((item, index) => (
            <NavItem key={index} item={item} />
          ))}
        </nav>
      </div>
      
      {/* Footer */}
      <div className="border-t p-4">
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-2 font-normal" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 font-normal" asChild>
            <Link to="/help">
              <HelpCircle className="h-4 w-4" />
              <span>Help & Support</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

