import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const SidebarContext = createContext();

// Custom hook to use the sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Sidebar Provider component
export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // Load expanded groups from localStorage
    const saved = localStorage.getItem('sidebarExpandedGroups');
    return saved ? JSON.parse(saved) : {};
  });

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile
      if (mobile) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save expanded groups to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarExpandedGroups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  // Toggle sidebar open/close
  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
  };

  // Open sidebar
  const openSidebar = () => {
    setIsOpen(true);
  };

  // Close sidebar
  const closeSidebar = () => {
    setIsOpen(false);
  };

  // Toggle group expansion
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Expand all groups
  const expandAllGroups = () => {
    const allGroups = {};
    // This would be populated with all group IDs
    setExpandedGroups(allGroups);
  };

  // Collapse all groups
  const collapseAllGroups = () => {
    setExpandedGroups({});
  };

  // Check if a group is expanded
  const isGroupExpanded = (groupId) => {
    return !!expandedGroups[groupId];
  };

  const value = {
    isOpen,
    isMobile,
    expandedGroups,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    toggleGroup,
    expandAllGroups,
    collapseAllGroups,
    isGroupExpanded,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;