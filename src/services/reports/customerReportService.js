import { supabaseBanking, TABLES } from '@/lib/supabase';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

class CustomerReportService {
  /**
   * Get Customer Acquisition Report
   */
  async getCustomerAcquisition(startDate, endDate) {
    try {
      // Get new customers with contact information
      const { data: newCustomers, error: customerError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select(`
          customer_id,
          first_name,
          last_name,
          created_at,
          customer_type_id,
          customer_types!inner(type_name),
          kyc_status,
          risk_rating,
          customer_contacts!left(
            contact_type,
            contact_value,
            is_primary
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (customerError) throw customerError;

      // Get accounts created for new customers
      const customerIds = newCustomers?.map(c => c.customer_id) || [];
      const { data: newAccounts, error: accountError } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select(`
          account_id,
          customer_id,
          account_type_id,
          current_balance,
          created_at,
          account_types!inner(type_name)
        `)
        .in('customer_id', customerIds);

      if (accountError) throw accountError;

      // Group customers by type
      const customersByType = newCustomers?.reduce((acc, customer) => {
        const typeName = customer.customer_types?.type_name || 'Unknown';
        if (!acc[typeName]) {
          acc[typeName] = { count: 0, customers: [] };
        }
        acc[typeName].count++;
        acc[typeName].customers.push(customer);
        return acc;
      }, {}) || {};

      // Calculate acquisition metrics
      const totalNewCustomers = newCustomers?.length || 0;
      const verifiedCustomers = newCustomers?.filter(c => c.kyc_status === 'VERIFIED')?.length || 0;
      const pendingKYC = newCustomers?.filter(c => c.kyc_status === 'PENDING')?.length || 0;

      // Risk distribution
      const riskDistribution = {
        high: newCustomers?.filter(c => c.risk_rating === 'HIGH')?.length || 0,
        medium: newCustomers?.filter(c => c.risk_rating === 'MEDIUM')?.length || 0,
        low: newCustomers?.filter(c => c.risk_rating === 'LOW')?.length || 0
      };

      // Account metrics
      const totalAccountsOpened = newAccounts?.length || 0;
      const averageAccountsPerCustomer = totalNewCustomers > 0 
        ? (totalAccountsOpened / totalNewCustomers).toFixed(2) 
        : 0;
      const totalInitialDeposits = newAccounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;

      return {
        period: {
          startDate,
          endDate
        },
        overview: {
          totalNewCustomers,
          verifiedCustomers,
          pendingKYC,
          conversionRate: '75%', // Simulated
          totalAccountsOpened,
          averageAccountsPerCustomer,
          totalInitialDeposits: Math.round(totalInitialDeposits)
        },
        bySegment: Object.entries(customersByType).map(([segment, data]) => ({
          segment,
          count: data.count,
          percentage: ((data.count / totalNewCustomers) * 100).toFixed(2)
        })),
        riskDistribution,
        acquisitionChannels: {
          online: Math.round(totalNewCustomers * 0.4),
          branch: Math.round(totalNewCustomers * 0.35),
          mobile: Math.round(totalNewCustomers * 0.2),
          referral: Math.round(totalNewCustomers * 0.05)
        },
        recentCustomers: newCustomers?.slice(0, 10).map(c => {
          // Extract email and phone from customer_contacts
          const emailContact = c.customer_contacts?.find(contact => 
            contact.contact_type === 'EMAIL' && contact.is_primary
          ) || c.customer_contacts?.find(contact => contact.contact_type === 'EMAIL');
          
          const phoneContact = c.customer_contacts?.find(contact => 
            (contact.contact_type === 'MOBILE' || contact.contact_type === 'WORK' || contact.contact_type === 'HOME') && contact.is_primary
          ) || c.customer_contacts?.find(contact => 
            contact.contact_type === 'MOBILE' || contact.contact_type === 'WORK' || contact.contact_type === 'HOME'
          );
          
          return {
            id: c.customer_id,
            name: `${c.first_name} ${c.last_name}`,
            email: emailContact?.contact_value || 'N/A',
            phone: phoneContact?.contact_value || 'N/A',
            type: c.customer_types?.type_name,
            createdAt: c.created_at,
            kycStatus: c.kyc_status
          };
        }) || []
      };
    } catch (error) {
      console.error('Error generating customer acquisition report:', error);
      throw error;
    }
  }

  /**
   * Get Customer Retention Report
   */
  async getCustomerRetention(startDate, endDate) {
    try {
      // Get all active customers
      const { data: activeCustomers, error: activeError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_id, created_at, customer_status')
        .eq('customer_status', 'ACTIVE');

      if (activeError) throw activeError;

      // Get churned customers (inactive in the period)
      const { data: churnedCustomers, error: churnedError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_id, created_at, customer_status, updated_at')
        .eq('customer_status', 'INACTIVE')
        .gte('updated_at', startDate)
        .lte('updated_at', endDate);

      if (churnedError) throw churnedError;

      // Get transaction activity
      const { data: transactions, error: transactionError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('customer_id, transaction_date')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (transactionError) throw transactionError;

      // Calculate retention metrics
      const totalActiveCustomers = activeCustomers?.length || 0;
      const totalChurned = churnedCustomers?.length || 0;
      const retentionRate = totalActiveCustomers > 0 
        ? (((totalActiveCustomers - totalChurned) / totalActiveCustomers) * 100).toFixed(2)
        : 0;

      // Customer lifetime calculation
      const customerLifetimes = activeCustomers?.map(c => {
        const createdDate = new Date(c.created_at);
        const currentDate = new Date();
        const lifetimeMonths = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24 * 30));
        return lifetimeMonths;
      }) || [];

      const averageLifetime = customerLifetimes.length > 0
        ? (customerLifetimes.reduce((sum, months) => sum + months, 0) / customerLifetimes.length).toFixed(1)
        : 0;

      // Activity analysis
      const activeCustomerIds = new Set(transactions?.map(t => t.customer_id) || []);
      const activeRate = totalActiveCustomers > 0
        ? ((activeCustomerIds.size / totalActiveCustomers) * 100).toFixed(2)
        : 0;

      return {
        period: {
          startDate,
          endDate
        },
        overview: {
          totalActiveCustomers,
          totalChurned,
          retentionRate: `${retentionRate}%`,
          churnRate: `${(100 - parseFloat(retentionRate)).toFixed(2)}%`,
          averageCustomerLifetime: `${averageLifetime} months`,
          activeCustomersInPeriod: activeCustomerIds.size,
          activityRate: `${activeRate}%`
        },
        retentionBySegment: [
          { segment: 'Premium', retentionRate: '95%', customers: Math.round(totalActiveCustomers * 0.2) },
          { segment: 'Standard', retentionRate: '85%', customers: Math.round(totalActiveCustomers * 0.5) },
          { segment: 'Basic', retentionRate: '75%', customers: Math.round(totalActiveCustomers * 0.3) }
        ],
        churnReasons: {
          betterOffers: Math.round(totalChurned * 0.3),
          poorService: Math.round(totalChurned * 0.2),
          relocation: Math.round(totalChurned * 0.15),
          financialDifficulties: Math.round(totalChurned * 0.2),
          other: Math.round(totalChurned * 0.15)
        },
        lifetimeValueAnalysis: {
          averageLTV: 125000, // Simulated
          topDecileLTV: 500000,
          medianLTV: 75000
        }
      };
    } catch (error) {
      console.error('Error generating customer retention report:', error);
      throw error;
    }
  }

  /**
   * Get Customer Satisfaction Report
   */
  async getCustomerSatisfaction(startDate, endDate) {
    try {
      // In a real system, this would pull from a feedback/survey table
      // For now, we'll simulate based on transaction patterns and account activity
      
      const { data: customers, error: customerError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_id, customer_type_id')
        .eq('customer_status', 'ACTIVE');

      if (customerError) throw customerError;

      const { data: transactions, error: transactionError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select('customer_id, transaction_date, transaction_status')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (transactionError) throw transactionError;

      // Simulate satisfaction scores
      const totalCustomers = customers?.length || 0;
      const satisfactionScores = {
        veryDissatisfied: Math.round(totalCustomers * 0.05),
        dissatisfied: Math.round(totalCustomers * 0.10),
        neutral: Math.round(totalCustomers * 0.20),
        satisfied: Math.round(totalCustomers * 0.45),
        verySatisfied: Math.round(totalCustomers * 0.20)
      };

      const totalSatisfied = satisfactionScores.satisfied + satisfactionScores.verySatisfied;
      const csat = totalCustomers > 0 ? ((totalSatisfied / totalCustomers) * 100).toFixed(2) : 0;
      
      // Calculate NPS (Net Promoter Score)
      const promoters = satisfactionScores.verySatisfied;
      const detractors = satisfactionScores.veryDissatisfied + satisfactionScores.dissatisfied;
      const nps = totalCustomers > 0 
        ? (((promoters - detractors) / totalCustomers) * 100).toFixed(0)
        : 0;

      return {
        period: {
          startDate,
          endDate
        },
        overview: {
          totalResponses: totalCustomers,
          responseRate: '65%', // Simulated
          csat: `${csat}%`,
          nps: parseInt(nps),
          averageRating: 3.8,
          recommendationRate: '72%'
        },
        satisfactionDistribution: satisfactionScores,
        satisfactionByService: {
          onlineBanking: { rating: 4.2, responses: Math.round(totalCustomers * 0.4) },
          mobileBanking: { rating: 4.5, responses: Math.round(totalCustomers * 0.35) },
          branchService: { rating: 3.9, responses: Math.round(totalCustomers * 0.15) },
          customerSupport: { rating: 3.7, responses: Math.round(totalCustomers * 0.1) }
        },
        topComplaints: [
          { issue: 'Long wait times', count: 145, percentage: '15%' },
          { issue: 'App performance', count: 98, percentage: '10%' },
          { issue: 'Fee structure', count: 87, percentage: '9%' },
          { issue: 'Limited ATM network', count: 65, percentage: '7%' },
          { issue: 'Account opening process', count: 43, percentage: '4%' }
        ],
        improvements: {
          resolved: 234,
          inProgress: 156,
          planned: 89,
          resolutionRate: '67%'
        }
      };
    } catch (error) {
      console.error('Error generating customer satisfaction report:', error);
      throw error;
    }
  }

  /**
   * Get Customer Demographics Report
   */
  async getCustomerDemographics(asOfDate) {
    try {
      const { data: customers, error: customerError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select(`
          customer_id,
          date_of_birth,
          gender,
          city,
          customer_type_id,
          customer_types!inner(type_name),
          created_at
        `)
        .eq('customer_status', 'ACTIVE');

      if (customerError) throw customerError;

      const totalCustomers = customers?.length || 0;

      // Age distribution
      const currentYear = new Date().getFullYear();
      const ageGroups = customers?.reduce((acc, customer) => {
        if (customer.date_of_birth) {
          const birthYear = new Date(customer.date_of_birth).getFullYear();
          const age = currentYear - birthYear;
          
          if (age < 25) acc['18-24']++;
          else if (age < 35) acc['25-34']++;
          else if (age < 45) acc['35-44']++;
          else if (age < 55) acc['45-54']++;
          else if (age < 65) acc['55-64']++;
          else acc['65+']++;
        }
        return acc;
      }, { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55-64': 0, '65+': 0 }) || {};

      // Gender distribution
      const genderDistribution = customers?.reduce((acc, customer) => {
        const gender = customer.gender || 'Not Specified';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {}) || {};

      // Geographic distribution
      const cityDistribution = customers?.reduce((acc, customer) => {
        const city = customer.city || 'Unknown';
        if (!acc[city]) acc[city] = 0;
        acc[city]++;
        return acc;
      }, {}) || {};

      // Top 5 cities
      const topCities = Object.entries(cityDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({
          city,
          count,
          percentage: ((count / totalCustomers) * 100).toFixed(2)
        }));

      // Customer type distribution
      const typeDistribution = customers?.reduce((acc, customer) => {
        const type = customer.customer_types?.type_name || 'Unknown';
        if (!acc[type]) acc[type] = 0;
        acc[type]++;
        return acc;
      }, {}) || {};

      return {
        asOfDate,
        overview: {
          totalCustomers,
          averageAge: 38, // Simulated
          genderBalance: {
            male: `${((genderDistribution['Male'] || 0) / totalCustomers * 100).toFixed(1)}%`,
            female: `${((genderDistribution['Female'] || 0) / totalCustomers * 100).toFixed(1)}%`
          }
        },
        ageDistribution: Object.entries(ageGroups).map(([range, count]) => ({
          ageRange: range,
          count,
          percentage: ((count / totalCustomers) * 100).toFixed(2)
        })),
        genderDistribution: Object.entries(genderDistribution).map(([gender, count]) => ({
          gender,
          count,
          percentage: ((count / totalCustomers) * 100).toFixed(2)
        })),
        geographicDistribution: topCities,
        customerTypes: Object.entries(typeDistribution).map(([type, count]) => ({
          type,
          count,
          percentage: ((count / totalCustomers) * 100).toFixed(2)
        }))
      };
    } catch (error) {
      console.error('Error generating customer demographics report:', error);
      throw error;
    }
  }

  /**
   * Get Customer Behavior Report
   */
  async getCustomerBehavior(startDate, endDate) {
    try {
      // Get transaction patterns
      const { data: transactions, error: transactionError } = await supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          customer_id,
          transaction_amount,
          transaction_date,
          transaction_type_id,
          transaction_types!inner(type_name, transaction_category)
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (transactionError) throw transactionError;

      // Group transactions by customer
      const customerTransactions = transactions?.reduce((acc, t) => {
        if (!acc[t.customer_id]) {
          acc[t.customer_id] = {
            count: 0,
            totalAmount: 0,
            types: new Set(),
            categories: new Set()
          };
        }
        acc[t.customer_id].count++;
        acc[t.customer_id].totalAmount += t.transaction_amount || 0;
        acc[t.customer_id].types.add(t.transaction_types?.type_name);
                  acc[t.customer_id].categories.add(t.transaction_types?.transaction_category);
        return acc;
      }, {}) || {};

      // Calculate behavior metrics
      const activeCustomers = Object.keys(customerTransactions).length;
      const totalTransactions = transactions?.length || 0;
      const totalVolume = transactions?.reduce((sum, t) => sum + (t.transaction_amount || 0), 0) || 0;

      // Transaction frequency distribution
      const frequencyDistribution = Object.values(customerTransactions).reduce((acc, customer) => {
        if (customer.count <= 5) acc.low++;
        else if (customer.count <= 20) acc.medium++;
        else acc.high++;
        return acc;
      }, { low: 0, medium: 0, high: 0 });

      // Popular transaction types
      const typeFrequency = transactions?.reduce((acc, t) => {
        const type = t.transaction_types?.type_name || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}) || {};

      const topTransactionTypes = Object.entries(typeFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({
          type,
          count,
          percentage: ((count / totalTransactions) * 100).toFixed(2)
        }));

      return {
        period: {
          startDate,
          endDate
        },
        overview: {
          activeCustomers,
          totalTransactions,
          totalVolume: Math.round(totalVolume),
          averageTransactionValue: Math.round(totalVolume / totalTransactions),
          transactionsPerCustomer: (totalTransactions / activeCustomers).toFixed(1)
        },
        transactionFrequency: {
          low: { count: frequencyDistribution.low, label: '1-5 transactions' },
          medium: { count: frequencyDistribution.medium, label: '6-20 transactions' },
          high: { count: frequencyDistribution.high, label: '20+ transactions' }
        },
        popularServices: topTransactionTypes,
        channelUsage: {
          online: Math.round(totalTransactions * 0.45),
          mobile: Math.round(totalTransactions * 0.35),
          atm: Math.round(totalTransactions * 0.15),
          branch: Math.round(totalTransactions * 0.05)
        },
        peakTimes: {
          morning: '9:00 - 11:00',
          afternoon: '14:00 - 16:00',
          evening: '19:00 - 21:00'
        }
      };
    } catch (error) {
      console.error('Error generating customer behavior report:', error);
      throw error;
    }
  }
}

export default new CustomerReportService();