// Filter context implementation
//
// Provides a React context around global filters used by the dashboard.  It
// exposes the current filter values, functions to update or reset them, and
// loads available options on mount.  Filters are persisted to localStorage
// between page loads.

import React, { createContext, useContext, useState, useEffect } from 'react';

const FilterContext = createContext();

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  // Initialise filters from localStorage if available
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('dashboard_filters');
    return saved
      ? JSON.parse(saved)
      : {
          dateRange: 'last_30_days',
          branch: 'all',
          productType: 'all',
          customerSegment: 'all',
          comparisonPeriod: 'previous_period'
        };
  });
  const [filterOptions, setFilterOptions] = useState({
    branches: [],
    products: [],
    customerSegments: []
  });

  // Persist filters on change
  useEffect(() => {
    localStorage.setItem('dashboard_filters', JSON.stringify(filters));
  }, [filters]);

  // Load available filter options on mount.  In a real project these calls
  // would hit backend services; here they are left as placeholders.
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Placeholder: fetch branches/products/segments
      const branches = [];
      const products = [];
      const segments = [];
      setFilterOptions({
        branches,
        products,
        customerSegments: segments
      });
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateRange: 'last_30_days',
      branch: 'all',
      productType: 'all',
      customerSegment: 'all',
      comparisonPeriod: 'previous_period'
    };
    setFilters(defaultFilters);
  };

  const value = {
    filters,
    filterOptions,
    updateFilter,
    updateFilters,
    resetFilters,
    loadFilterOptions
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};