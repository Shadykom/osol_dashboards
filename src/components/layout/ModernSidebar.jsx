import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSidebar } from '../../contexts/SidebarContext';
import osoulLogo from '@/assets/osol-logo.png';
import { RTLWrapper, RTLFlex, RTLIcon, useRTLClasses } from '../ui/rtl-wrapper';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
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
  Zap,
  User,
  Package
} from 'lucide-react';

const ModernSidebar = ({ isMobile }) => {
  const { t, i18n, ready } = useTranslation('translation');
  const location = useLocation();
  const { 
    isOpen, 
    expandedGroups, 
    closeSidebar, 
    toggleSidebar,
    toggleGroup,
    isGroupExpanded 
  } = useSidebar();
  const sidebarRef = useRef(null);
  const { isRTL, marginStart, marginEnd, paddingStart, paddingEnd } = useRTLClasses();
  const [theme, setTheme] = React.useState(() => 
    localStorage.getItem('theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  );

  // Don't render until translations are ready
  if (!ready) {
    return null;
  }

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
        },
        {
          id: 'branch-report',
          label: t('sidebar.branchLevelReport'),
          path: '/collection/branch-report',
          icon: Building2
        },
        {
          id: 'product-report',
          label: t('sidebar.productLevelReport'),
          path: '/collection/product-report',
          icon: Package
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

  // Navigation Item Component with RTL support
  const NavItem = ({ item, level = 0, isActive, onClick }) => {
    const hasChildren = item.items && item.items.length > 0;
    const isExpanded = isGroupExpanded(item.id);
    const ItemIcon = item.icon;
    
    const itemContent = (
      <div
        className={cn(
          "group flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-osoul-golden-100 dark:hover:bg-osoul-golden-900/20",
          "hover:border-osoul-primary hover:border hover:shadow-md",
          isActive && "bg-primary/10 text-primary dark:bg-primary/20",
          !isActive && "text-gray-700 dark:text-gray-300 hover:text-osoul-primary dark:hover:text-osoul-golden-400",
          level > 0 && paddingStart(level * 4),
          !isOpen && !isMobile && "justify-center"
        )}
        onClick={onClick}
        title={!isOpen && !isMobile ? item.label : undefined}
      >
        {ItemIcon && (
          <ItemIcon className={cn(
            "w-5 h-5 transition-colors",
            isActive ? "text-primary" : "text-gray-500 dark:text-gray-400",
            "group-hover:text-osoul-primary dark:group-hover:text-osoul-golden-400",
            isRTL ? "ml-3" : "mr-3"
          )} />
        )}
        
        {(isOpen || isMobile) && (
          <>
            <span className={cn(
              "font-medium text-sm flex-1",
              isRTL ? "text-right" : "text-left"
            )}>
              {item.label}
            </span>
            
            {hasChildren && (
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-200",
                isExpanded && "rotate-180",
                "text-gray-400 group-hover:text-osoul-primary dark:group-hover:text-osoul-golden-400"
              )} />
            )}
          </>
        )}
      </div>
    );

    if (item.path && !hasChildren) {
      return (
        <Link to={item.path} className="block">
          {itemContent}
        </Link>
      );
    }

    return (
      <button className="w-full text-start">
        {itemContent}
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed lg:relative z-50 lg:z-0",
          "h-full bg-white dark:bg-gray-900",
          isRTL ? "border-l right-0 lg:right-auto" : "border-r left-0 lg:left-auto",
          "border-gray-200 dark:border-gray-700",
          "transition-all duration-300 ease-in-out",
          "flex flex-col",
          // Desktop width handling
          !isMobile && (isOpen ? "w-64" : "w-20"),
          // Mobile positioning
          isMobile && "top-0 bottom-0 w-64",
          isMobile && (isRTL ? "right-0" : "left-0"),
          // Transform handling
          !isMobile && "lg:translate-x-0",
          isMobile && (isOpen 
            ? "translate-x-0" 
            : (isRTL ? "translate-x-full" : "-translate-x-full")
          )
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700",
          !isOpen && !isMobile && "justify-center"
        )}>
          {(isOpen || isMobile) ? (
            <div className="flex items-center gap-3">
              <img 
                src={osoulLogo} 
                alt="Osoul" 
                className="h-8 w-auto"
              />
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                {t('appName', 'Osoul')}
              </span>
            </div>
          ) : (
            <img 
              src={osoulLogo} 
              alt="Osoul" 
              className="h-8 w-auto"
              title={t('appName', 'Osoul')}
            />
          )}
          
          {isMobile && (
            <button
              onClick={closeSidebar}
              className="p-2 rounded-lg hover:bg-osoul-golden-100 dark:hover:bg-osoul-golden-900/20 lg:hidden group"
              aria-label={t('common.closeSidebar')}
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-osoul-primary dark:group-hover:text-osoul-golden-400" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = item.path ? location.pathname === item.path : 
                              item.items?.some(subItem => location.pathname === subItem.path);
              
              return (
                <div key={item.id}>
                  <NavItem
                    item={item}
                    isActive={isActive}
                    onClick={() => {
                      if (item.type === 'group') {
                        toggleGroup(item.id);
                      } else if (isMobile && item.path) {
                        closeSidebar();
                      }
                    }}
                  />
                  
                  {/* Sub-items */}
                  {item.items && isGroupExpanded(item.id) && (isOpen || !isMobile) && (
                    <div className={cn(
                      "mt-1 space-y-1",
                      "transition-all duration-200",
                      !isOpen && !isMobile && "lg:hidden"
                    )}>
                      {item.items.map((subItem) => (
                        <NavItem
                          key={subItem.id}
                          item={subItem}
                          level={1}
                          isActive={location.pathname === subItem.path}
                          onClick={() => {
                            if (isMobile) {
                              closeSidebar();
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        {(isOpen || !isMobile) && (
          <div className={cn(
            "p-4 border-t border-gray-200 dark:border-gray-700",
            !isOpen && !isMobile && "lg:px-2"
          )}>
            {isOpen ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('common.adminUser')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      admin@osoul.com
                    </p>
                  </div>
                </div>
                
                <button className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
                  "text-gray-700 dark:text-gray-300",
                  "hover:bg-osoul-golden-100 dark:hover:bg-osoul-golden-900/20",
                  "hover:text-osoul-primary dark:hover:text-osoul-golden-400",
                  "transition-colors group"
                )}>
                  <LogOut className="w-4 h-4 group-hover:text-osoul-primary dark:group-hover:text-osoul-golden-400" />
                  <span className="text-sm">{t('common.logout')}</span>
                </button>
              </>
            ) : (
              <button className={cn(
                "w-full flex items-center justify-center p-2 rounded-lg",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-osoul-golden-100 dark:hover:bg-osoul-golden-900/20",
                "transition-colors group"
              )}>
                <LogOut className="w-4 h-4 group-hover:text-osoul-primary dark:group-hover:text-osoul-golden-400" />
              </button>
            )}
          </div>
        )}

        {/* Collapse button for desktop */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className={cn(
              "absolute top-9",
              isRTL ? "-left-3" : "-right-3",
              "w-6 h-6 bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              "rounded-full flex items-center justify-center",
              "hover:bg-osoul-golden-100 dark:hover:bg-osoul-golden-900/20",
              "hover:border-osoul-primary dark:hover:border-osoul-golden-400",
              "transition-all duration-200 group"
            )}
          >
            <ChevronRight className={cn(
              "w-3 h-3 text-gray-600 dark:text-gray-400",
              "group-hover:text-osoul-primary dark:group-hover:text-osoul-golden-400",
              isRTL ? (!isOpen && "rotate-180") : (isOpen && "rotate-180")
            )} />
          </button>
        )}
      </aside>
    </>
  );
};

export default ModernSidebar;