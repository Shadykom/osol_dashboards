import { supabaseBanking, supabaseCollection } from '@/lib/supabase';

/**
 * خدمة التقارير الشاملة
 * تتعامل مع جميع أنواع التقارير في النظام
 */
class ReportService {
  /**
   * جلب تقرير الأداء الشهري
   */
  async getMonthlyPerformanceReport(filters = {}) {
    try {
      const { specialistId, month = new Date().getMonth() + 1, year = new Date().getFullYear() } = filters;
      
      // حساب تاريخ البداية والنهاية للشهر
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      // جلب بيانات الأداء
      const performanceQuery = supabaseCollection
        .from('officer_performance_metrics')
        .select(`
          *,
          collection_officers!inner(
            officer_id,
            officer_name,
            team_id,
            collection_teams(team_name)
          )
        `)
        .gte('metric_date', startDate)
        .lte('metric_date', endDate);

      if (specialistId) {
        performanceQuery.eq('officer_id', specialistId);
      }

      const { data: performanceData, error: performanceError } = await performanceQuery;

      if (performanceError) throw performanceError;

      // جلب بيانات التحصيل
      const collectionQuery = supabaseCollection
        .from('daily_collection_summary')
        .select('*')
        .gte('collection_date', startDate)
        .lte('collection_date', endDate);

      if (specialistId) {
        collectionQuery.eq('officer_id', specialistId);
      }

      const { data: collectionData, error: collectionError } = await collectionQuery;

      if (collectionError) throw collectionError;

      // حساب الملخصات
      const summary = this.calculateMonthlySummary(performanceData, collectionData);

      return {
        success: true,
        data: {
          period: { month, year },
          performance: performanceData,
          collections: collectionData,
          summary,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching monthly performance report:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * جلب تقرير المحفظة التفصيلي
   */
  async getDetailedPortfolioReport(filters = {}) {
    try {
      const { specialistId, status = 'all', bucket = 'all' } = filters;

      // جلب بيانات القروض
      let loansQuery = supabaseBanking
        .from('loan_accounts')
        .select(`
          *,
          customers!inner(
            customer_id,
            full_name,
            phone_number,
            email
          ),
          collection_cases!inner(
            case_id,
            assigned_to,
            bucket_id,
            total_outstanding,
            days_past_due,
            last_payment_date,
            last_payment_amount
          )
        `);

      if (specialistId) {
        loansQuery = loansQuery.eq('collection_cases.assigned_to', specialistId);
      }

      if (status !== 'all') {
        loansQuery = loansQuery.eq('status', status);
      }

      if (bucket !== 'all') {
        loansQuery = loansQuery.eq('collection_cases.bucket_id', bucket);
      }

      const { data: loansData, error: loansError } = await loansQuery;

      if (loansError) throw loansError;

      // تحليل المحفظة
      const portfolioAnalysis = this.analyzePortfolio(loansData);

      return {
        success: true,
        data: {
          loans: loansData,
          analysis: portfolioAnalysis,
          totalLoans: loansData.length,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching portfolio report:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * جلب تقرير الاتجاهات
   */
  async getTrendsReport(filters = {}) {
    try {
      const { specialistId, period = 'last_3_months' } = filters;
      
      // حساب فترة التحليل
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'last_month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'last_3_months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'last_6_months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'last_year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // جلب بيانات الأداء التاريخية
      const trendsQuery = supabaseCollection
        .from('officer_performance_summary')
        .select('*')
        .gte('summary_date', startDate.toISOString())
        .lte('summary_date', endDate.toISOString())
        .order('summary_date', { ascending: true });

      if (specialistId) {
        trendsQuery.eq('officer_id', specialistId);
      }

      const { data: trendsData, error: trendsError } = await trendsQuery;

      if (trendsError) throw trendsError;

      // تحليل الاتجاهات
      const trendsAnalysis = this.analyzeTrends(trendsData);

      return {
        success: true,
        data: {
          period: { start: startDate, end: endDate },
          trends: trendsData,
          analysis: trendsAnalysis,
          predictions: this.generatePredictions(trendsAnalysis),
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching trends report:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * إنشاء تقرير مخصص
   */
  async generateCustomReport(config) {
    try {
      const {
        reportType,
        period,
        contents = [],
        filters = {}
      } = config;

      const reportData = {};

      // جمع البيانات بناءً على المحتويات المطلوبة
      if (contents.includes('ملخص تنفيذي')) {
        reportData.executiveSummary = await this.getExecutiveSummary(filters);
      }

      if (contents.includes('مؤشرات الأداء')) {
        reportData.performanceIndicators = await this.getPerformanceIndicators(filters);
      }

      if (contents.includes('تحليل المحفظة')) {
        reportData.portfolioAnalysis = await this.getPortfolioAnalysis(filters);
      }

      if (contents.includes('تحليل المخاطر')) {
        reportData.riskAnalysis = await this.getRiskAnalysis(filters);
      }

      if (contents.includes('توزيع العملاء')) {
        reportData.customerDistribution = await this.getCustomerDistribution(filters);
      }

      if (contents.includes('اتجاهات التحصيل')) {
        reportData.collectionTrends = await this.getCollectionTrends(filters);
      }

      if (contents.includes('تحليل قنوات التواصل')) {
        reportData.channelAnalysis = await this.getChannelAnalysis(filters);
      }

      if (contents.includes('التوصيات')) {
        reportData.recommendations = await this.generateRecommendations(reportData);
      }

      return {
        success: true,
        data: {
          reportType,
          period,
          contents,
          data: reportData,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating custom report:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * تصدير التقرير
   */
  async exportReport(reportData, format = 'pdf') {
    try {
      // هنا يمكن إضافة منطق التصدير الفعلي
      // حالياً سنعيد البيانات مع معلومات التصدير
      return {
        success: true,
        data: {
          format,
          content: reportData,
          exportedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error exporting report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods
  calculateMonthlySummary(performanceData, collectionData) {
    if (!performanceData || !collectionData) return {};

    const totalCalls = performanceData.reduce((sum, p) => sum + (p.total_calls || 0), 0);
    const totalCollected = collectionData.reduce((sum, c) => sum + (c.total_collected || 0), 0);
    const totalPromises = performanceData.reduce((sum, p) => sum + (p.promises_made || 0), 0);
    const keptPromises = performanceData.reduce((sum, p) => sum + (p.promises_kept || 0), 0);

    return {
      totalCalls,
      totalCollected,
      totalPromises,
      keptPromises,
      promiseRate: totalPromises > 0 ? (keptPromises / totalPromises * 100).toFixed(2) : 0,
      avgCollectionPerDay: (totalCollected / collectionData.length).toFixed(2)
    };
  }

  analyzePortfolio(loansData) {
    if (!loansData || loansData.length === 0) return {};

    const totalOutstanding = loansData.reduce((sum, loan) => 
      sum + (loan.collection_cases?.[0]?.total_outstanding || 0), 0);
    
    const bucketDistribution = loansData.reduce((acc, loan) => {
      const bucket = loan.collection_cases?.[0]?.current_bucket || 'Unknown';
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, {});

    const avgDPD = loansData.reduce((sum, loan) => 
      sum + (loan.collection_cases?.[0]?.days_past_due || 0), 0) / loansData.length;

    return {
      totalOutstanding,
      bucketDistribution,
      averageDPD: avgDPD.toFixed(2),
      totalAccounts: loansData.length
    };
  }

  analyzeTrends(trendsData) {
    if (!trendsData || trendsData.length === 0) return {};

    // حساب معدلات النمو والاتجاهات
    const collectionTrend = this.calculateTrend(trendsData.map(t => t.total_collected));
    const contactRateTrend = this.calculateTrend(trendsData.map(t => t.contact_rate));
    const promiseRateTrend = this.calculateTrend(trendsData.map(t => t.promise_rate));

    return {
      collectionTrend,
      contactRateTrend,
      promiseRateTrend,
      dataPoints: trendsData.length
    };
  }

  calculateTrend(values) {
    if (!values || values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  generatePredictions(trendsAnalysis) {
    // منطق بسيط للتنبؤات بناءً على الاتجاهات
    const predictions = [];
    
    if (trendsAnalysis.collectionTrend === 'increasing') {
      predictions.push('من المتوقع استمرار نمو معدلات التحصيل في الشهر القادم');
    } else if (trendsAnalysis.collectionTrend === 'decreasing') {
      predictions.push('يُنصح بمراجعة استراتيجيات التحصيل لتحسين الأداء');
    }
    
    return predictions;
  }

  // Additional helper methods for custom report sections
  async getExecutiveSummary(filters) {
    // Implementation for executive summary
    return {
      overview: 'ملخص تنفيذي شامل',
      keyHighlights: [],
      criticalIssues: []
    };
  }

  async getPerformanceIndicators(filters) {
    // Implementation for performance indicators
    return {
      kpis: [],
      targets: [],
      achievements: []
    };
  }

  async getPortfolioAnalysis(filters) {
    // Implementation for portfolio analysis
    return await this.getDetailedPortfolioReport(filters);
  }

  async getRiskAnalysis(filters) {
    // Implementation for risk analysis
    return {
      riskCategories: [],
      mitigationStrategies: []
    };
  }

  async getCustomerDistribution(filters) {
    // Implementation for customer distribution
    return {
      bySegment: {},
      byRegion: {},
      byProduct: {}
    };
  }

  async getCollectionTrends(filters) {
    // Implementation for collection trends
    return await this.getTrendsReport(filters);
  }

  async getChannelAnalysis(filters) {
    // Implementation for channel analysis
    return {
      channelPerformance: {},
      channelPreferences: {}
    };
  }

  async generateRecommendations(reportData) {
    // Implementation for generating recommendations
    return [
      'التركيز على العملاء ذوي المخاطر المتوسطة',
      'زيادة استخدام القنوات الرقمية',
      'تحسين معدلات الوفاء بالوعود'
    ];
  }
}

export default new ReportService();