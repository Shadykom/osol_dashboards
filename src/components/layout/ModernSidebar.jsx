import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSidebar } from '../../contexts/SidebarContext';
import osoulLogo from '@/assets/osol-logo.png';
import { 
  LayoutDashboard, 
  Users, 
  User, 
  FileText, 
  TrendingUp, 
  Shield, 
  Calendar,
  UserCheck,
  AlertCircle,
  BarChart3,
  Briefcase,
  CreditCard,
  Building2,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Globe,
  Home,
  Settings,
  LogOut,
  Languages,
  Moon,
  Sun,
  Zap
} from 'lucide-react';

const ModernSidebar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { 
    isOpen, 
    isMobile, 
    expandedGroups, 
    closeSidebar, 
    toggleGroup,
    isGroupExpanded 
  } = useSidebar();
  const sidebarRef = useRef(null);
  const isRTL = i18n.language === 'ar';
  const [theme, setTheme] = React.useState(() => 
    localStorage.getItem('theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  );

  // Dashboard menu structure with categories
  const menuItems = [
    {
      id: 'home',
      label: t('sidebar.home'),
      icon: Home,
      path: '/dashboard',
      type: 'single'
    },
    {
      id: 'executive',
      label: t('sidebar.executive'),
      icon: Briefcase,
      type: 'group',
      items: [
        {
          id: 'executive-dashboard',
          label: t('sidebar.executiveDashboard'),
          path: '/dashboards/executive',
          icon: LayoutDashboard
        },
        {
          id: 'executive-collection',
          label: t('sidebar.executiveCollection'),
          path: '/collection/executive',
          icon: BarChart3
        }
      ]
    },
    {
      id: 'collection',
      label: t('sidebar.collection'),
      icon: CreditCard,
      type: 'group',
      items: [
        {
          id: 'collection-overview',
          label: t('sidebar.collectionOverview'),
          path: '/collection/overview',
          icon: LayoutDashboard
        },
        {
          id: 'daily-collection',
          label: t('sidebar.dailyCollection'),
          path: '/collection/daily',
          icon: Calendar
        },
        {
          id: 'field-collection',
          label: t('sidebar.fieldCollection'),
          path: '/collection/field',
          icon: Users
        },
        {
          id: 'digital-collection',
          label: t('sidebar.digitalCollection'),
          path: '/collection/digital',
          icon: Globe
        },
        {
          id: 'collection-cases',
          label: t('sidebar.collectionCases'),
          path: '/collection/cases',
          icon: FileText
        }
      ]
    },
    {
      id: 'delinquency',
      label: t('sidebar.delinquency'),
      icon: AlertCircle,
      type: 'group',
      items: [
        {
          id: 'delinquency-executive',
          label: t('sidebar.delinquencyExecutive'),
          path: '/collection/delinquency-executive',
          icon: TrendingUp
        },
        {
          id: 'early-warning',
          label: t('sidebar.earlyWarning'),
          path: '/collection/early-warning',
          icon: AlertCircle
        },
        {
          id: 'vintage-analysis',
          label: t('sidebar.vintageAnalysis'),
          path: '/collection/vintage-analysis',
          icon: BarChart3
        }
      ]
    },
    {
      id: 'performance',
      label: t('sidebar.performance'),
      icon: UserCheck,
      type: 'group',
      items: [
        {
          id: 'officer-performance',
          label: t('sidebar.officerPerformance'),
          path: '/collection/officer-performance',
          icon: UserCheck
        },
        {
          id: 'specialist-report',
          label: t('sidebar.specialistReport'),
          path: '/collection/specialist-report',
          icon: FileText
        },
        {
          id: 'specialist-level-report',
          label: t('sidebar.specialistLevelReport'),
          path: '/collection/specialist-report',
          icon: BarChart3
        }
      ]
    },
    {
      id: 'compliance',
      label: t('sidebar.compliance'),
      icon: Shield,
      type: 'group',
      items: [
        {
          id: 'compliance-dashboard',
          label: t('sidebar.complianceDashboard'),
          path: '/compliance',
          icon: Shield
        },
        {
          id: 'sharia-compliance',
          label: t('sidebar.shariaCompliance'),
          path: '/collection/sharia-compliance',
          icon: Building2
        }
      ]
    },
    {
      id: 'operations',
      label: t('sidebar.operations'),
      icon: Settings,
      type: 'group',
      items: [
        {
          id: 'operations-dashboard',
          label: t('sidebar.operationsDashboard'),
          path: '/dashboards/operations',
          icon: LayoutDashboard
        },
        {
          id: 'custom-dashboard',
          label: t('sidebar.customDashboard'),
          path: '/dashboards/custom',
          icon: Settings
        }
      ]
    },
    {
      id: 'data',
      label: t('sidebar.dataManagement'),
      icon: FileText,
      type: 'group',
      items: [
        {
          id: 'customers',
          label: t('sidebar.customers'),
          path: '/customers',
          icon: Users
        },
        {
          id: 'accounts',
          label: t('sidebar.accounts'),
          path: '/accounts',
          icon: CreditCard
        },
        {
          id: 'loans',
          label: t('sidebar.loans'),
          path: '/loans',
          icon: Building2
        },
        {
          id: 'transactions',
          label: t('sidebar.transactions'),
          path: '/transactions',
          icon: FileText
        },
        {
          id: 'customer-footprint',
          label: t('sidebar.customerFootprint'),
          path: '/dashboards/customer-footprint',
          icon: User
        },
        {
          id: 'reports',
          label: t('sidebar.reports'),
          path: '/reports',
          icon: BarChart3
        }
      ]
    }
  ];

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen, closeSidebar]);

  // Check if path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Check if group has active item
  const isGroupActive = (items) => {
    return items.some(item => isActive(item.path));
  };

  // Auto-expand active groups
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.type === 'group' && isGroupActive(item.items) && !isGroupExpanded(item.id)) {
        toggleGroup(item.id);
      }
    });
  }, [location.pathname]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full flex flex-col
          bg-gradient-to-b from-gray-50 via-white to-gray-50 
          dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 
          shadow-2xl transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}
          w-80 lg:w-80 lg:translate-x-0 lg:static lg:z-30
          ${isRTL ? 'border-l' : 'border-r'} border-gray-200 dark:border-gray-800
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header with OSOL Branding */}
        <div className="flex h-24 items-center justify-between px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl blur-xl" />
              <div className="relative p-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg">
                <img 
                  src={osoulLogo} 
                  alt="OSOL" 
                  className="h-14 w-14 object-contain"
                />
              </div>
            </div>
            <div className={`flex flex-col ${isRTL && 'text-right'}`}>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                KONAN Pro
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                v2.0.0
              </span>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 sidebar-scrollbar">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                {item.type === 'single' ? (
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${isActive(item.path) 
                        ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary'
                      }
                    `}
                    onClick={() => isMobile && closeSidebar()}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <div>
                    <button
                      onClick={() => toggleGroup(item.id)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                        ${isGroupActive(item.items)
                          ? 'bg-gradient-to-r from-primary/5 to-primary/10 text-primary font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {isGroupExpanded(item.id) 
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                      }
                    </button>
                    
                    {/* Submenu */}
                    <ul 
                      className={`
                        mt-1 space-y-1 overflow-hidden transition-all duration-200
                        ${isGroupExpanded(item.id) ? 'max-h-96' : 'max-h-0'}
                      `}
                    >
                      {item.items.map((subItem) => (
                        <li key={subItem.id}>
                          <Link
                            to={subItem.path}
                            className={`
                              flex items-center gap-3 ${isRTL ? 'pr-10' : 'pl-10'} px-3 py-2 rounded-xl transition-all duration-200
                              ${isActive(subItem.path)
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-primary/5 hover:text-primary'
                              }
                            `}
                            onClick={() => isMobile && closeSidebar()}
                          >
                            <subItem.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{subItem.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-900/50 flex-shrink-0">
          <div className="space-y-2">
            {/* Language Switcher - More Prominent */}
            <button
              onClick={() => {
                const newLang = i18n.language === 'en' ? 'ar' : 'en';
                i18n.changeLanguage(newLang);
              }}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {i18n.language === 'en' ? 'Language' : 'اللغة'}
                </span>
              </div>
              <span className="text-sm font-bold text-primary">
                {i18n.language === 'en' ? 'العربية' : 'English'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => {
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
                document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', newTheme);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 transition-colors"
            >
              <div className="relative">
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:opacity-0 transition-opacity" />
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400 absolute top-0 left-0 opacity-0 dark:opacity-100 transition-opacity" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            {/* Settings */}
            <Link
              to="/settings"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-primary/5 transition-colors"
              onClick={() => isMobile && closeSidebar()}
            >
              <Settings className="w-5 h-5" />
              <span>{t('sidebar.settings')}</span>
            </Link>

            {/* Logout */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('sidebar.logout')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ModernSidebar;