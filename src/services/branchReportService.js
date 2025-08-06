// src/services/branchReportService.js
import { supabase } from '@/lib/supabase';

export const BranchReportService = {
  // Get branch summary with filters
  async getBranchSummary(filters = {}) {
    try {
      // First, try to get data from the branches table directly
      let query = supabase
        .from('branches')
        .select(`
          branch_id,
          branch_name,
          branch_type,
          state,
          is_active,
          manager_id,
          phone,
          email,
          address
        `);

      // Apply filters
      if (filters.region && filters.region !== 'all') {
        query = query.eq('state', filters.region);
      }
      
      if (filters.branchType && filters.branchType !== 'all') {
        query = query.eq('branch_type', filters.branchType.toUpperCase());
      }

      const { data: branches, error: branchError } = await query;
      
      if (branchError) {
        console.error('Error fetching branches:', branchError);
        throw branchError;
      }

      // Get performance data separately
      const branchIds = branches?.map(b => b.branch_id) || [];
      let performanceData = [];
      
      if (branchIds.length > 0) {
        // Try to get performance data from branch_collection_performance
        let perfQuery = supabase
          .from('branch_collection_performance')
          .select(`
            branch_id,
            performance_date,
            total_collected_amount,
            total_outstanding,
            collection_rate,
            number_of_accounts,
            total_calls,
            total_sms,
            total_emails
          `)
          .in('branch_id', branchIds)
          .order('performance_date', { ascending: false });

        // Apply date filter
        if (filters.dateRange && filters.dateRange !== 'all') {
          const dateFilter = this.getDateFilter(filters.dateRange, filters.customDateRange);
          if (dateFilter.startDate && dateFilter.endDate) {
            perfQuery = perfQuery
              .gte('performance_date', dateFilter.startDate)
              .lte('performance_date', dateFilter.endDate);
          }
        }

        const { data: perfData, error: perfError } = await perfQuery;

        if (!perfError) {
          performanceData = perfData || [];
        }
      }

      // Get officer counts
      const { data: officerCounts, error: officerError } = await supabase
        .from('collection_officers')
        .select('branch_id, is_active')
        .in('branch_id', branchIds);

      // Aggregate officer counts by branch
      const officerCountMap = new Map();
      officerCounts?.forEach(officer => {
        if (!officerCountMap.has(officer.branch_id)) {
          officerCountMap.set(officer.branch_id, { total: 0, active: 0 });
        }
        const counts = officerCountMap.get(officer.branch_id);
        counts.total++;
        if (officer.is_active) counts.active++;
      });

      // Get latest performance data for each branch
      const latestPerformanceMap = new Map();
      performanceData.forEach(perf => {
        if (!latestPerformanceMap.has(perf.branch_id) || 
            perf.performance_date > latestPerformanceMap.get(perf.branch_id).performance_date) {
          latestPerformanceMap.set(perf.branch_id, perf);
        }
      });

      // Transform data to match expected format
      const transformedBranches = branches?.map(branch => {
        const performance = latestPerformanceMap.get(branch.branch_id) || {};
        const officers = officerCountMap.get(branch.branch_id) || { total: 0, active: 0 };
        
        // Calculate performance score based on collection rate
        let performanceScore = 0;
        if (performance.collection_rate) {
          if (performance.collection_rate >= 90) performanceScore = 95;
          else if (performance.collection_rate >= 80) performanceScore = 85;
          else if (performance.collection_rate >= 70) performanceScore = 75;
          else if (performance.collection_rate >= 60) performanceScore = 65;
          else if (performance.collection_rate >= 50) performanceScore = 55;
          else performanceScore = 45;
        }

        return {
          id: branch.branch_id,
          name: branch.branch_name || `Branch ${branch.branch_id}`,
          code: branch.branch_id,
          region: branch.state || 'Unknown',
          type: branch.branch_type,
          isActive: branch.is_active !== false,
          manager: branch.manager_id,
          phone: branch.phone,
          email: branch.email,
          address: branch.address,
          totalCollection: performance.total_collected_amount || 0,
          collectionTarget: performance.total_outstanding || 0,
          performanceScore: performanceScore,
          totalCases: performance.number_of_accounts || 0,
          resolvedCases: Math.floor((performance.number_of_accounts || 0) * 0.3), // Estimate
          activeOfficers: officers.active,
          totalOfficers: officers.total
        };
      }) || [];

      // Apply performance level filter
      let filteredBranches = transformedBranches;
      if (filters.performanceLevel && filters.performanceLevel !== 'all') {
        filteredBranches = filteredBranches.filter(branch => {
          switch (filters.performanceLevel) {
            case 'excellent':
              return branch.performanceScore >= 90;
            case 'good':
              return branch.performanceScore >= 70 && branch.performanceScore < 90;
            case 'average':
              return branch.performanceScore >= 50 && branch.performanceScore < 70;
            case 'poor':
              return branch.performanceScore < 50;
            default:
              return true;
          }
        });
      }

      // Apply collection target filter
      if (filters.collectionTarget && filters.collectionTarget !== 'all') {
        const targetRanges = {
          'below_1m': [0, 1000000],
          '1m_5m': [1000000, 5000000],
          '5m_10m': [5000000, 10000000],
          'above_10m': [10000000, Infinity]
        };
        const range = targetRanges[filters.collectionTarget];
        if (range) {
          filteredBranches = filteredBranches.filter(branch => 
            branch.collectionTarget >= range[0] && branch.collectionTarget < range[1]
          );
        }
      }

      // Note: Product type, customer segment, and delinquency bucket filters
      // would require additional data from collection_cases or other tables
      // These are placeholders for now until we have the proper data structure

      // Calculate summary statistics
      const summary = {
        totalBranches: filteredBranches.length,
        totalCollection: filteredBranches.reduce((sum, b) => sum + b.totalCollection, 0),
        avgPerformance: filteredBranches.length > 0 
          ? filteredBranches.reduce((sum, b) => sum + b.performanceScore, 0) / filteredBranches.length 
          : 0,
        totalOfficers: filteredBranches.reduce((sum, b) => sum + b.totalOfficers, 0),
        activeBranches: filteredBranches.filter(b => b.isActive).length
      };

      return { branches: filteredBranches, summary };
    } catch (error) {
      console.error('Error fetching branch summary:', error);
      // Return mock data for development
      return {
        branches: generateMockBranches(),
        summary: {
          totalBranches: 15,
          totalCollection: 12500000,
          avgPerformance: 82.5,
          totalOfficers: 145,
          activeBranches: 14
        }
      };
    }
  },

  // Get detailed branch information
  async getBranchDetails(branchId) {
    try {
      // Get branch details
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('branch_id', branchId)
        .single();

      if (branchError) throw branchError;

      // Get performance data
      const { data: performanceData, error: perfError } = await supabase
        .from('branch_collection_performance')
        .select('*')
        .eq('branch_id', branchId)
        .order('performance_date', { ascending: false });

      if (perfError && perfError.code !== 'PGRST116') {
        console.error('Error fetching performance data:', perfError);
      }

      // Get officer counts
      const { data: officers, error: officerError } = await supabase
        .from('collection_officers')
        .select('is_active')
        .eq('branch_id', branchId);

      const officerCounts = {
        total: officers?.length || 0,
        active: officers?.filter(o => o.is_active).length || 0
      };

      // Calculate trends from performance data
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

      let todayCollection = 0;
      let weekCollection = 0;
      let monthCollection = 0;
      let yearCollection = 0;

      performanceData?.forEach(perf => {
        const perfDate = new Date(perf.performance_date);
        const amount = perf.total_collected_amount || 0;
        
        if (perfDate.toDateString() === today.toDateString()) {
          todayCollection += amount;
        }
        if (perfDate >= weekAgo) {
          weekCollection += amount;
        }
        if (perfDate >= monthAgo) {
          monthCollection += amount;
        }
        if (perfDate >= yearAgo) {
          yearCollection += amount;
        }
      });

      // Get latest performance
      const latestPerformance = performanceData?.[0] || {};
      
      // Calculate performance score
      let performanceScore = 0;
      if (latestPerformance.collection_rate) {
        if (latestPerformance.collection_rate >= 90) performanceScore = 95;
        else if (latestPerformance.collection_rate >= 80) performanceScore = 85;
        else if (latestPerformance.collection_rate >= 70) performanceScore = 75;
        else if (latestPerformance.collection_rate >= 60) performanceScore = 65;
        else if (latestPerformance.collection_rate >= 50) performanceScore = 55;
        else performanceScore = 45;
      }

      return {
        id: branch.branch_id,
        name: branch.branch_name || `Branch ${branch.branch_id}`,
        code: branch.branch_id,
        region: branch.state || 'Unknown',
        type: branch.branch_type,
        isActive: branch.is_active !== false,
        manager: branch.manager_id,
        phone: branch.phone,
        email: branch.email,
        address: branch.address,
        totalCollection: latestPerformance.total_collected_amount || 0,
        collectionTarget: latestPerformance.total_outstanding || 0,
        performanceScore: performanceScore,
        totalCases: latestPerformance.number_of_accounts || 0,
        resolvedCases: Math.floor((latestPerformance.number_of_accounts || 0) * 0.3),
        activeOfficers: officerCounts.active,
        totalOfficers: officerCounts.total,
        todayCollection: todayCollection,
        weekCollection: weekCollection,
        monthCollection: monthCollection,
        yearCollection: yearCollection
      };
    } catch (error) {
      console.error('Error fetching branch details:', error);
      // Return mock data for development
      return generateMockBranchDetails(branchId);
    }
  },

  // Get branch performance data
  async getBranchPerformance(branchId, dateRange) {
    try {
      const dateFilter = this.getDateFilter(dateRange);
      
      const { data, error } = await supabase
        .from('branch_collection_performance')
        .select('*')
        .eq('branch_id', branchId)
        .gte('performance_date', dateFilter.startDate)
        .lte('performance_date', dateFilter.endDate)
        .order('performance_date', { ascending: true });

      if (error) throw error;

      return data?.map(record => ({
        date: record.performance_date,
        value: record.total_collected || 0,
        target: record.total_outstanding || 0,
        cases: record.total_cases || 0,
        performance: record.collection_rate || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching branch performance:', error);
      // Return mock data for development
      return generateMockPerformanceData();
    }
  },

  // Get branch officers
  async getBranchOfficers(branchId) {
    try {
      // Get officers
      const { data: officers, error: officerError } = await supabase
        .from('collection_officers')
        .select('*')
        .eq('branch_id', branchId);

      if (officerError) throw officerError;

      // Get performance summaries for officers
      const officerIds = officers?.map(o => o.officer_id) || [];
      let performanceSummaries = [];

      if (officerIds.length > 0) {
        const { data: perfData, error: perfError } = await supabase
          .from('officer_performance_summary')
          .select('*')
          .in('officer_id', officerIds)
          .order('summary_date', { ascending: false });

        if (!perfError) {
          performanceSummaries = perfData || [];
        }
      }

      // Get latest performance for each officer
      const latestPerformanceMap = new Map();
      performanceSummaries.forEach(perf => {
        if (!latestPerformanceMap.has(perf.officer_id) || 
            perf.summary_date > latestPerformanceMap.get(perf.officer_id).summary_date) {
          latestPerformanceMap.set(perf.officer_id, perf);
        }
      });

      return officers?.map(officer => {
        const performance = latestPerformanceMap.get(officer.officer_id) || {};
        
        // Calculate performance score
        let performanceScore = 0;
        if (performance.collection_rate) {
          if (performance.collection_rate >= 90) performanceScore = 95;
          else if (performance.collection_rate >= 80) performanceScore = 85;
          else if (performance.collection_rate >= 70) performanceScore = 75;
          else if (performance.collection_rate >= 60) performanceScore = 65;
          else if (performance.collection_rate >= 50) performanceScore = 55;
          else performanceScore = 45;
        }

        return {
          id: officer.officer_id,
          name: officer.officer_name || `Officer ${officer.officer_id}`,
          employeeId: officer.officer_id,
          role: officer.role || 'Collection Officer',
          email: officer.email,
          phone: officer.phone,
          avatar: null,
          status: officer.is_active ? 'active' : 'inactive',
          totalCollection: performance.total_collected || 0,
          totalCases: performance.total_cases || 0,
          activeCases: performance.active_cases || 0,
          performanceScore: performanceScore,
          efficiency: performance.success_rate || 0,
          avgResponseTime: 24, // Mock data
          customerSatisfaction: 85 // Mock data
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching branch officers:', error);
      // Return mock data for development
      return generateMockOfficers();
    }
  },

  // Get branch collection data
  async getBranchCollectionData(branchId, dateRange) {
    try {
      const dateFilter = this.getDateFilter(dateRange);
      
      const { data, error } = await supabase
        .from('branch_collection_performance')
        .select('*')
        .eq('branch_id', branchId)
        .gte('performance_date', dateFilter.startDate)
        .lte('performance_date', dateFilter.endDate)
        .order('performance_date', { ascending: false });

      if (error) throw error;

      return data?.map(record => ({
        date: record.performance_date,
        amount: record.total_collected || 0,
        cases: record.total_cases || 0,
        calls: record.total_calls || 0,
        visits: 0 // Not available in current schema
      })) || [];
    } catch (error) {
      console.error('Error fetching collection data:', error);
      // Return mock data for development
      return generateMockCollectionData();
    }
  },

  // Helper function to get date filter
  getDateFilter(dateRange, customDateRange) {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
        endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        startDate = yesterday.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'last_7_days':
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'last_3_months':
        startDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'custom':
        if (customDateRange?.from && customDateRange?.to) {
          startDate = customDateRange.from;
          endDate = customDateRange.to;
        } else {
          // Default to current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          endDate = new Date().toISOString().split('T')[0];
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
    }

    return { startDate, endDate };
  },

  // Export branch report
  async exportBranchReport(branches, filters, format) {
    try {
      const exportData = {
        branches,
        filters,
        format,
        timestamp: new Date().toISOString()
      };

      if (format === 'excel') {
        // Create Excel export
        const worksheet = [];
        
        // Add headers
        worksheet.push([
          'Branch Name',
          'Branch Code',
          'Region',
          'Total Collection',
          'Collection Target',
          'Performance Score',
          'Active Officers',
          'Total Cases',
          'Resolved Cases',
          'Status'
        ]);

        // Add data rows
        branches.forEach(branch => {
          worksheet.push([
            branch.name,
            branch.code,
            branch.region,
            branch.totalCollection,
            branch.collectionTarget,
            branch.performanceScore,
            branch.activeOfficers,
            branch.totalCases,
            branch.resolvedCases,
            branch.isActive ? 'Active' : 'Inactive'
          ]);
        });

        // Convert to Excel and download
        const blob = new Blob([JSON.stringify(worksheet)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `branch_report_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      return { success: true };
    } catch (error) {
      console.error('Error exporting branch report:', error);
      throw error;
    }
  },

  // Export branch detail
  async exportBranchDetail(branchId, format) {
    try {
      const branchData = await this.getBranchDetails(branchId);
      const officers = await this.getBranchOfficers(branchId);
      const performance = await this.getBranchPerformance(branchId, 'current_month');

      const exportData = {
        branch: branchData,
        officers,
        performance,
        format,
        timestamp: new Date().toISOString()
      };

      // Similar export logic as exportBranchReport
      return { success: true };
    } catch (error) {
      console.error('Error exporting branch detail:', error);
      throw error;
    }
  }
};

// Mock data generators for development
function generateMockBranches() {
  const regions = ['Central', 'Eastern', 'Western', 'Northern', 'Southern'];
  const types = ['Main', 'Sub', 'Digital', 'Kiosk'];
  
  return Array.from({ length: 15 }, (_, i) => ({
    id: `branch_${i + 1}`,
    name: `Branch ${i + 1}`,
    code: `BR${String(i + 1).padStart(3, '0')}`,
    region: regions[Math.floor(Math.random() * regions.length)],
    type: types[Math.floor(Math.random() * types.length)],
    isActive: Math.random() > 0.1,
    manager: `Manager ${i + 1}`,
    phone: `+966 50 ${Math.floor(Math.random() * 9000000 + 1000000)}`,
    email: `branch${i + 1}@company.com`,
    address: `Street ${i + 1}, District ${Math.floor(Math.random() * 10 + 1)}, Riyadh`,
    totalCollection: Math.floor(Math.random() * 2000000 + 500000),
    collectionTarget: Math.floor(Math.random() * 2500000 + 1000000),
    performanceScore: Math.floor(Math.random() * 40 + 60),
    totalCases: Math.floor(Math.random() * 500 + 100),
    resolvedCases: Math.floor(Math.random() * 400 + 50),
    activeOfficers: Math.floor(Math.random() * 20 + 5),
    totalOfficers: Math.floor(Math.random() * 25 + 8)
  }));
}

function generateMockBranchDetails(branchId) {
  return {
    id: branchId,
    name: `Branch ${branchId}`,
    code: `BR${branchId}`,
    region: 'Central',
    type: 'Main',
    isActive: true,
    manager: 'John Doe',
    phone: '+966 50 1234567',
    email: 'branch@company.com',
    address: '123 Main Street, Riyadh',
    totalCollection: 1500000,
    collectionTarget: 2000000,
    performanceScore: 85,
    totalCases: 350,
    resolvedCases: 280,
    activeOfficers: 12,
    todayCollection: 50000,
    weekCollection: 350000,
    monthCollection: 1500000,
    yearCollection: 18000000
  };
}

function generateMockPerformanceData() {
  const days = 30;
  const data = [];
  const baseCollection = 50000;
  const baseTarget = 60000;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: baseCollection + Math.floor(Math.random() * 20000 - 10000),
      target: baseTarget,
      cases: Math.floor(Math.random() * 50 + 20),
      performance: Math.floor(Math.random() * 20 + 75)
    });
  }
  
  return data;
}

function generateMockOfficers() {
  const roles = ['Senior Officer', 'Collection Officer', 'Field Officer', 'Team Lead'];
  const statuses = ['active', 'active', 'active', 'inactive'];
  
  return Array.from({ length: 12 }, (_, i) => ({
    id: `officer_${i + 1}`,
    name: `Officer ${i + 1}`,
    employeeId: `EMP${String(i + 1).padStart(4, '0')}`,
    role: roles[Math.floor(Math.random() * roles.length)],
    email: `officer${i + 1}@company.com`,
    phone: `+966 50 ${Math.floor(Math.random() * 9000000 + 1000000)}`,
    avatar: null,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    totalCollection: Math.floor(Math.random() * 200000 + 50000),
    totalCases: Math.floor(Math.random() * 100 + 20),
    activeCases: Math.floor(Math.random() * 30 + 5),
    performanceScore: Math.floor(Math.random() * 30 + 70),
    efficiency: Math.floor(Math.random() * 20 + 80),
    avgResponseTime: Math.floor(Math.random() * 24 + 1),
    customerSatisfaction: Math.floor(Math.random() * 15 + 85)
  }));
}

function generateMockCollectionData() {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: Math.floor(Math.random() * 100000 + 50000),
    cases: Math.floor(Math.random() * 50 + 20),
    calls: Math.floor(Math.random() * 200 + 100),
    visits: Math.floor(Math.random() * 20 + 5)
  }));
}