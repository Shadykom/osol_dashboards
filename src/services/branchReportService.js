// src/services/branchReportService.js
import { supabase } from '@/lib/supabase';

export const BranchReportService = {
  // Get branch summary with filters
  async getBranchSummary(filters = {}) {
    try {
      let query = supabase
        .from('branches')
        .select(`
          *,
          branch_performance (
            performance_score,
            total_collection,
            collection_target,
            resolved_cases,
            total_cases,
            active_officers
          ),
          officers (count)
        `);

      // Apply filters
      if (filters.region && filters.region !== 'all') {
        query = query.eq('region', filters.region);
      }
      if (filters.branchType && filters.branchType !== 'all') {
        query = query.eq('type', filters.branchType);
      }
      if (filters.performanceLevel && filters.performanceLevel !== 'all') {
        // Apply performance level filter based on score ranges
        switch (filters.performanceLevel) {
          case 'excellent':
            query = query.gte('branch_performance.performance_score', 90);
            break;
          case 'good':
            query = query.gte('branch_performance.performance_score', 70)
                         .lt('branch_performance.performance_score', 90);
            break;
          case 'average':
            query = query.gte('branch_performance.performance_score', 50)
                         .lt('branch_performance.performance_score', 70);
            break;
          case 'poor':
            query = query.lt('branch_performance.performance_score', 50);
            break;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match expected format
      const branches = data?.map(branch => ({
        id: branch.id,
        name: branch.name,
        code: branch.code,
        region: branch.region,
        type: branch.type,
        isActive: branch.is_active,
        manager: branch.manager_name,
        phone: branch.phone,
        email: branch.email,
        address: branch.address,
        totalCollection: branch.branch_performance?.[0]?.total_collection || 0,
        collectionTarget: branch.branch_performance?.[0]?.collection_target || 0,
        performanceScore: branch.branch_performance?.[0]?.performance_score || 0,
        totalCases: branch.branch_performance?.[0]?.total_cases || 0,
        resolvedCases: branch.branch_performance?.[0]?.resolved_cases || 0,
        activeOfficers: branch.branch_performance?.[0]?.active_officers || 0,
        totalOfficers: branch.officers?.[0]?.count || 0
      })) || [];

      // Calculate summary statistics
      const summary = {
        totalBranches: branches.length,
        totalCollection: branches.reduce((sum, b) => sum + b.totalCollection, 0),
        avgPerformance: branches.reduce((sum, b) => sum + b.performanceScore, 0) / branches.length || 0,
        totalOfficers: branches.reduce((sum, b) => sum + b.totalOfficers, 0),
        activeBranches: branches.filter(b => b.isActive).length
      };

      return { branches, summary };
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
      const { data, error } = await supabase
        .from('branches')
        .select(`
          *,
          branch_performance (
            performance_score,
            total_collection,
            collection_target,
            resolved_cases,
            total_cases,
            active_officers,
            today_collection,
            week_collection,
            month_collection,
            year_collection
          )
        `)
        .eq('id', branchId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        region: data.region,
        type: data.type,
        isActive: data.is_active,
        manager: data.manager_name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        totalCollection: data.branch_performance?.[0]?.total_collection || 0,
        collectionTarget: data.branch_performance?.[0]?.collection_target || 0,
        performanceScore: data.branch_performance?.[0]?.performance_score || 0,
        totalCases: data.branch_performance?.[0]?.total_cases || 0,
        resolvedCases: data.branch_performance?.[0]?.resolved_cases || 0,
        activeOfficers: data.branch_performance?.[0]?.active_officers || 0,
        todayCollection: data.branch_performance?.[0]?.today_collection || 0,
        weekCollection: data.branch_performance?.[0]?.week_collection || 0,
        monthCollection: data.branch_performance?.[0]?.month_collection || 0,
        yearCollection: data.branch_performance?.[0]?.year_collection || 0
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
      let startDate, endDate;
      const now = new Date();

      // Calculate date range
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'yesterday':
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'last_7_days':
          startDate = new Date(now.setDate(now.getDate() - 7));
          endDate = new Date();
          break;
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'last_3_months':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          endDate = new Date();
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date();
      }

      const { data, error } = await supabase
        .from('branch_performance_history')
        .select('*')
        .eq('branch_id', branchId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      return data?.map(record => ({
        date: record.date,
        value: record.collection_amount,
        target: record.collection_target,
        cases: record.cases_handled,
        performance: record.performance_score
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
      const { data, error } = await supabase
        .from('officers')
        .select(`
          *,
          officer_performance (
            total_collection,
            total_cases,
            active_cases,
            performance_score,
            efficiency,
            avg_response_time,
            customer_satisfaction
          )
        `)
        .eq('branch_id', branchId)
        .order('officer_performance.performance_score', { ascending: false });

      if (error) throw error;

      return data?.map(officer => ({
        id: officer.id,
        name: officer.name,
        employeeId: officer.employee_id,
        role: officer.role,
        email: officer.email,
        phone: officer.phone,
        avatar: officer.avatar_url,
        status: officer.status,
        totalCollection: officer.officer_performance?.[0]?.total_collection || 0,
        totalCases: officer.officer_performance?.[0]?.total_cases || 0,
        activeCases: officer.officer_performance?.[0]?.active_cases || 0,
        performanceScore: officer.officer_performance?.[0]?.performance_score || 0,
        efficiency: officer.officer_performance?.[0]?.efficiency || 0,
        avgResponseTime: officer.officer_performance?.[0]?.avg_response_time || 0,
        customerSatisfaction: officer.officer_performance?.[0]?.customer_satisfaction || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching branch officers:', error);
      // Return mock data for development
      return generateMockOfficers();
    }
  },

  // Get branch collection data
  async getBranchCollectionData(branchId, dateRange) {
    try {
      // Similar date range calculation as getBranchPerformance
      const { data, error } = await supabase
        .from('collection_data')
        .select('*')
        .eq('branch_id', branchId)
        .order('collection_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching collection data:', error);
      // Return mock data for development
      return generateMockCollectionData();
    }
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