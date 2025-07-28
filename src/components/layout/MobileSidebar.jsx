import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home,
  Building2,
  Activity,
  Target,
  Eye,
  Calendar,
  Smartphone,
  AlertTriangle,
  MapPin,
  Trophy,
  BookOpen,
  Layers,
  UserSearch,
  FileText,
  Package,
  Users,
  CreditCard,
  ArrowUpDown,
  Wallet,
  DollarSign,
  Coins,
  UserCheck,
  FileWarning,
  Moon,
  X,
  Clock,
  Search,
  Settings,
  Languages,
  Sun,
  HeadphonesIcon,
  MessageSquare,
  User,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { changeLanguage } from '@/i18n/i18n';
import osoulLogo from '@/assets/osol-logo.png';

// Simple navigation data
const navigationData = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'dashboard', title: 'Main Dashboard', href: '/dashboard', icon: Home, badge: 'LIVE' }
    ]
  },
  {
    title: 'DASHBOARDS',
    items: [
      { id: 'executive', title: 'Executive Dashboard', href: '/dashboards/executive', icon: Building2 },
      { id: 'operations', title: 'Operations Dashboard', href: '/dashboards/operations', icon: Activity },
      { id: 'custom', title: 'Custom Dashboard', href: '/dashboards/custom', icon: Target }
    ]
  },
  {
    title: 'COLLECTIONS',
    items: [
      { id: 'collection-overview', title: 'Collection Overview', href: '/collection/overview', icon: Eye },
      { id: 'daily-collection', title: 'Daily Collection', href: '/collection/daily', icon: Calendar, badge: 'LIVE' },
      { id: 'digital-collection', title: 'Digital Collection', href: '/collection/digital', icon: Smartphone },
      { id: 'early-warning', title: 'Early Warning', href: '/collection/early-warning', icon: AlertTriangle, badge: '45' },
      { id: 'executive-collection', title: 'Executive Collection', href: '/collection/executive', icon: Building2 },
      { id: 'delinquency-executive', title: 'Delinquency Executive', href: '/collection/delinquency-executive', icon: Trophy, badge: 'NEW' },
      { id: 'field-collection', title: 'Field Collection', href: '/collection/field', icon: MapPin },
      { id: 'officer-performance', title: 'Officer Performance', href: '/collection/officer-performance', icon: Trophy },
      { id: 'sharia-compliance', title: 'Sharia Compliance', href: '/collection/sharia-compliance', icon: BookOpen },
      { id: 'vintage-analysis', title: 'Vintage Analysis', href: '/collection/vintage-analysis', icon: Layers },
      { id: 'specialist-report', title: 'Specialist Report', href: '/collection/specialist-report', icon: UserSearch, badge: 'NEW' },
      { id: 'branch-report', title: 'Branch Level Report', href: '/collection/branch-report', icon: Building2, badge: 'NEW' },
      { id: 'product-report', title: 'Product Level Report', href: '/collection/product-report', icon: Package, badge: 'NEW' }
    ]
  },
  {
    title: 'BANKING OPERATIONS',
    items: [
      { id: 'customers', title: 'All Customers', href: '/customers', icon: Users, badge: '12.5k' },
      { id: 'add-customer', title: 'Add Customer', href: '/customers/new', icon: UserCheck },
      { id: 'kyc-pending', title: 'KYC Pending', href: '/customers/kyc-pending', icon: FileWarning, badge: '23' },
      { id: 'accounts', title: 'All Accounts', href: '/accounts', icon: CreditCard },
      { id: 'open-account', title: 'Open Account', href: '/accounts/new', icon: CreditCard },
      { id: 'blocked-accounts', title: 'Blocked Accounts', href: '/accounts/blocked', icon: AlertTriangle, badge: '5' },
      { id: 'transactions', title: 'All Transactions', href: '/transactions', icon: ArrowUpDown },
      { id: 'pending-approval', title: 'Pending Approval', href: '/transactions/pending', icon: Clock, badge: '156' },
      { id: 'failed-transactions', title: 'Failed Transactions', href: '/transactions/failed', icon: X, badge: '23' },
      { id: 'loans', title: 'All Loans', href: '/loans', icon: Wallet },
      { id: 'loan-applications', title: 'Loan Applications', href: '/loans/applications', icon: FileText, badge: '45' },
      { id: 'disbursements', title: 'Disbursements', href: '/loans/disbursements', icon: DollarSign },
      { id: 'collections-loans', title: 'Collections', href: '/loans/collections', icon: Coins },
      { id: 'overdue-loans', title: 'Overdue Loans', href: '/loans/overdue', icon: AlertTriangle, badge: '89' }
    ]
  }
];

// Clock component
function Clock({ className }) {
  return (
    <svg className={className} fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Simple navigation item
function NavItem({ item, onClick }) {
  const location = useLocation();
  const isActive = item.href === location.pathname;
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg mx-2 mb-1",
        isActive 
          ? "bg-blue-500 text-white" 
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <span className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          isActive ? "bg-white text-blue-500" : "bg-blue-500 text-white"
        )}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// Main Mobile Sidebar
export function MobileSidebar({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const sidebarRef = useRef(null);
  const location = useLocation();

  // Close sidebar when route changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Filter navigation based on search
  const filteredNavigation = searchQuery
    ? navigationData.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : navigationData;

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="mobile-sidebar-backdrop fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "mobile-sidebar-container mobile-sidebar-slide fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col",
          "shadow-2xl"
        )}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <img src={osoulLogo} alt="Konan" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Konan Pro</h1>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-gray-500">v2.0.0</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mobile-sidebar-nav flex-1 overflow-y-auto bg-white">
          {searchQuery && filteredNavigation.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No results found</p>
            </div>
          ) : (
            <div className="py-4">
              {filteredNavigation.map((section, index) => (
                <div key={index} className="mb-6">
                  <h2 className="px-4 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h2>
                  <div>
                    {section.items.map((item) => (
                      <NavItem key={item.id} item={item} onClick={onClose} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-white p-4 space-y-4">
          {/* User Profile */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              JD
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
              title="Switch Language"
            >
              <Languages className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-gray-600" /> : <Moon className="h-5 w-5 text-gray-600" />}
            </button>
            <button
              onClick={() => window.location.href = '/help'}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
              title="Help"
            >
              <HeadphonesIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => window.location.href = '/settings'}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-700">System Operational</span>
          </div>
        </div>
      </div>
    </>
  );
}