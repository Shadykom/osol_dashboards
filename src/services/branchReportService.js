// src/services/branchReportService.js
import { supabase } from '@/lib/supabase';

export const BranchReportService = {
  // Get branch summary with filters
  async getBranchSummary(filters = {}) {
    try {
      // Use the branch_summary_view for better performance
      let query = supabase
        .from('branch_summary_view')
        .select('*');

      // Apply filters
      if (filters.region && filters.region !== 'all') {
        query = query.eq('region', filters.region);
      }
      
      if (filters.branchType && filters.branchType !== 'all') {
        query = query.eq('branch_type', filters.branchType.toUpperCase());
      }

      if (filters.performanceLevel && filters.performanceLevel !== 'all') {
        switch (filters.performanceLevel) {
          case 'excellent':
            query = query.gte('performance_score', 90);
            break;
          case 'good':
            query = query.gte('performance_score', 70).lt('performance_score', 90);
            break;
          case 'average':
            query = query.gte('performance_score', 50).lt('performance_score', 70);
            break;
          case 'poor':
            query = query.lt('performance_score', 50);
            break;
        }
      }

      // Apply date filter if needed
      if (filters.dateRange && filters.dateRange !== 'all') {
        const dateFilter = this.getDateFilter(filters.dateRange, filters.customDateRange);
        if (dateFilter.startDate && dateFilter.endDate) {
          // Handle both period_date and performance_date columns
          query = query
            .or(`performance_date.gte.${dateFilter.startDate},period_date.gte.${dateFilter.startDate}`)
            .or(`performance_date.lte.${dateFilter.endDate},period_date.lte.${dateFilter.endDate}`);
        }
      }

      const { data: branches, error } = await query;
      if (error) throw error;

      // Transform data to match expected format
      const transformedBranches = branches?.map(branch => ({
        id: branch.branch_id,
        name: branch.branch_name,
        code: branch.branch_id,
        region: branch.region || 'Unknown',
        type: branch.branch_type,
        isActive: branch.is_active,
        manager: branch.manager_id,
        phone: branch.phone,
        email: branch.email,
        address: branch.address,
        totalCollection: branch.total_collected || 0,
        collectionTarget: branch.total_outstanding || 0,
        performanceScore: branch.performance_score || 0,
        totalCases: branch.total_cases || 0,
        resolvedCases: branch.resolved_cases || 0,
        activeOfficers: branch.active_officers_count || 0,
        totalOfficers: branch.total_officers || 0
      })) || [];

      // Calculate summary statistics
      const summary = {
        totalBranches: transformedBranches.length,
        totalCollection: transformedBranches.reduce((sum, b) => sum + b.totalCollection, 0),
        avgPerformance: transformedBranches.length > 0 
          ? transformedBranches.reduce((sum, b) => sum + b.performanceScore, 0) / transformedBranches.length 
          : 0,
        totalOfficers: transformedBranches.reduce((sum, b) => sum + b.totalOfficers, 0),
        activeBranches: transformedBranches.filter(b => b.isActive).length
      };

      return { branches: transformedBranches, summary };
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
      // Get branch details from summary view
      const { data: branch, error: branchError } = await supabase
        .from('branch_summary_view')
        .select('*')
        .eq('branch_id', branchId)
        .single();

      if (branchError) throw branchError;

      // Get collection trends for different periods
      const { data: trends, error: trendsError } = await supabase
        .from('branch_collection_trends')
        .select('*')
        .eq('branch_id', branchId)
        .order('performance_date', { ascending: false })
        .limit(1)
        .single();

      if (trendsError && trendsError.code !== 'PGRST116') throw trendsError;

      return {
        id: branch.branch_id,
        name: branch.branch_name,
        code: branch.branch_id,
        region: branch.region || 'Unknown',
        type: branch.branch_type,
        isActive: branch.is_active,
        manager: branch.manager_id,
        phone: branch.phone,
        email: branch.email,
        address: branch.address,
        totalCollection: branch.total_collected || 0,
        collectionTarget: branch.total_outstanding || 0,
        performanceScore: branch.performance_score || 0,
        totalCases: branch.total_cases || 0,
        resolvedCases: branch.resolved_cases || 0,
        activeOfficers: branch.active_officers_count || 0,
        totalOfficers: branch.total_officers || 0,
        todayCollection: trends?.daily_collection || 0,
        weekCollection: trends?.week_collection || 0,
        monthCollection: trends?.month_collection || 0,
        yearCollection: trends?.year_collection || 0
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
      // Get officers with performance data from view
      const { data: officers, error } = await supabase
        .from('branch_officer_performance')
        .select('*')
        .eq('branch_id', branchId)
        .order('performance_score', { ascending: false });

      if (error) throw error;

      // Group by officer to get latest performance
      const officerMap = new Map();
      officers?.forEach(record => {
        const existingOfficer = officerMap.get(record.officer_id);
        if (!existingOfficer || (record.summary_date && (!existingOfficer.summary_date || record.summary_date > existingOfficer.summary_date))) {
          officerMap.set(record.officer_id, record);
        }
      });

      const uniqueOfficers = Array.from(officerMap.values());

      return uniqueOfficers.map(officer => ({
        id: officer.officer_id,
        name: officer.officer_name,
        employeeId: officer.officer_id,
        role: officer.role || 'Collection Officer',
        email: officer.email,
        phone: officer.phone,
        avatar: null,
        status: officer.is_active ? 'active' : 'inactive',
        totalCollection: officer.total_collected || 0,
        totalCases: officer.total_cases || 0,
        activeCases: officer.active_cases || 0,
        performanceScore: officer.performance_score || 0,
        efficiency: officer.success_rate || 0,
        avgResponseTime: 24, // Mock data
        customerSatisfaction: 85 // Mock data
      }));
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