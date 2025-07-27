import { supabaseBanking } from '@/lib/supabase';

/**
 * خدمة تقرير مستوى الأخصائي
 * تتعامل مع جميع العمليات المتعلقة بجلب وتحليل بيانات أداء أخصائيي التحصيل
 */
class SpecialistReportService {
  
  /**
   * جلب قائمة جميع أخصائيي التحصيل
   */
  async getSpecialists() {
    try {
      // جلب البيانات من جدول collection_officers
      const { data, error } = await supabaseBanking
        .from('collection_officers')
        .select(`
          officer_id,
          officer_name,
          officer_type,
          team_id,
          contact_number,
          email,
          status,
          collection_teams!team_id (
            team_name,
            team_type
          )
        `)
        .eq('status', 'ACTIVE')
        .order('officer_name');

      if (error) {
        console.error('Error fetching specialists:', error);
        throw error;
      }

      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (error) {
      console.error('Error fetching specialists:', error);
      return {
        success: false,
        data: this.getMockSpecialists().data,
        error: error.message
      };
    }
  }

  /**
   * جلب تقرير مستوى أخصائي محدد
   */
  async getSpecialistReport(specialistId, filters = {}) {
    try {
      const {
        dateRange = 'current_month',
        loanStatus = 'all',
        delinquencyBucket = 'all'
      } = filters;

      // جلب بيانات الأخصائي
      const specialist = await this.getSpecialistById(specialistId);
      
      // جلب بيانات القروض المخصصة للأخصائي
      const loans = await this.getSpecialistLoans(specialistId, filters);
      
      // حساب مؤشرات الأداء الرئيسية
      const kpis = await this.calculateKPIs(specialistId, loans.data || [], dateRange);
      
      // جلب بيانات التواصل
      const communications = await this.getCommunicationData(specialistId, dateRange);
      
      // جلب وعود الدفع
      const promisesToPay = await this.getPromisesToPay(specialistId, dateRange);
      
      // حساب بيانات الأداء
      const performance = await this.calculatePerformanceMetrics(specialistId, dateRange);

      // إضافة بيانات إضافية للتقرير
      const trends = this.generateTrendData(loans.data || [], dateRange);
      const customerSegments = this.processCustomerSegments(loans.data || []);
      const riskAnalysis = this.processRiskAnalysis(loans.data || []);
      const timeline = await this.generateTimeline(specialistId, dateRange);

      return {
        success: true,
        data: {
          specialist: specialist.data,
          kpis: kpis.data,
          loans: loans.data || [],
          communicationData: communications.data || [],
          promisesToPay: promisesToPay.data || [],
          performance: performance.data,
          trends: trends,
          customerSegments: customerSegments,
          riskAnalysis: riskAnalysis,
          timeline: timeline
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching specialist report:', error);
      // في حالة الخطأ، إرجاع بيانات تجريبية
      return {
        success: false,
        data: this.getMockReportData(),
        error: error.message
      };
    }
  }

  /**
   * جلب بيانات أخصائي محدد
   */
  async getSpecialistById(specialistId) {
    try {
      const { data, error } = await supabaseBanking
        .from('collection_officers')
        .select(`
          officer_id,
          officer_name,
          officer_type,
          team_id,
          contact_number,
          email,
          status,
          language_skills,
          collection_limit,
          commission_rate,
          joining_date,
          last_active,
          kastle_collection.collection_teams (
            team_name,
            team_type,
            team_lead_id
          )
        `)
        .eq('officer_id', specialistId)
        .single();

      if (error) {
        console.error('Error fetching specialist by ID:', error);
        throw error;
      }

      return {
        success: true,
        data: data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching specialist by ID:', error);
      // إرجاع بيانات تجريبية في حالة الخطأ
      const mockSpecialists = this.getMockSpecialists().data;
      const specialist = mockSpecialists.find(s => s.officer_id === specialistId);
      
      return {
        success: false,
        data: specialist || mockSpecialists[0],
        error: error.message
      };
    }
  }

  /**
   * جلب القروض المخصصة لأخصائي محدد
   */
  async getSpecialistLoans(specialistId, filters = {}) {
    try {
      // جلب الحالات المخصصة للأخصائي من جدول collection_cases
      let query = supabaseBanking
        .from('collection_cases')
        .select(`
          case_id,
          case_number,
          customer_id,
          loan_account_number,
          priority,
          case_status,
          assignment_date,
          total_outstanding,
          total_overdue,
          dpd,
          bucket_id,
          last_payment_date,
          last_payment_amount,
          last_contact_date,
          next_action_date,
          kastle_banking.loan_accounts!loan_account_number (
            loan_amount,
            outstanding_balance,
            overdue_amount,
            overdue_days,
            loan_status,
            product_id,
            loan_start_date,
            maturity_date,
            kastle_banking.products!product_id (
              product_name,
              product_type
            )
          ),
          kastle_banking.customers!customer_id (
            full_name,
            customer_type,
            national_id,
            kastle_banking.customer_contacts!customer_id (
              contact_type,
              contact_value
            )
          ),
          kastle_collection.collection_buckets!bucket_id (
            bucket_name,
            min_days,
            max_days
          )
        `)
        .eq('assigned_to', specialistId);

      // تطبيق المرشحات
      if (filters.loanStatus && filters.loanStatus !== 'all') {
        query = query.eq('case_status', filters.loanStatus);
      }

      if (filters.delinquencyBucket && filters.delinquencyBucket !== 'all') {
        const bucketRange = this.getBucketRange(filters.delinquencyBucket);
        if (bucketRange) {
          query = query.gte('dpd', bucketRange.min);
          if (bucketRange.max) {
            query = query.lte('dpd', bucketRange.max);
          }
        }
      }

      // تطبيق فترة التاريخ
      if (filters.dateRange) {
        const dateFrom = this.getDateRangeStart(filters.dateRange);
        if (dateFrom) {
          query = query.gte('assignment_date', dateFrom.toISOString());
        }
      }

      const { data, error } = await query.limit(500);

      if (error) {
        console.error('Error fetching specialist loans:', error);
        throw error;
      }

      // تحويل البيانات إلى الشكل المطلوب للعرض
      const transformedLoans = (data || []).map(caseData => ({
        loanNumber: caseData.loan_account_number,
        caseNumber: caseData.case_number,
        customerName: caseData.kastle_banking?.customers?.full_name || 'غير معروف',
        customerPhone: caseData.kastle_banking?.customers?.customer_contacts?.[0]?.contact_value || '',
        customerId: caseData.kastle_banking?.customers?.national_id || caseData.customer_id,
        customerType: caseData.kastle_banking?.customers?.customer_type || 'فرد',
        productType: caseData.kastle_banking?.loan_accounts?.kastle_banking?.products?.product_name || 'غير محدد',
        loanAmount: caseData.kastle_banking?.loan_accounts?.loan_amount || 0,
        paidAmount: (caseData.kastle_banking?.loan_accounts?.loan_amount || 0) - (caseData.kastle_banking?.loan_accounts?.outstanding_balance || 0),
        dueAmount: caseData.kastle_banking?.loan_accounts?.outstanding_balance || 0,
        totalOverdueAmount: caseData.kastle_banking?.loan_accounts?.overdue_amount || caseData.total_overdue || 0,
        totalOverdueDays: caseData.kastle_banking?.loan_accounts?.overdue_days || caseData.dpd || 0,
        delinquencyBucket: caseData.kastle_collection?.collection_buckets?.bucket_name || this.getDPDBucket(caseData.dpd),
        loanStatus: caseData.case_status,
        lastContactDate: caseData.last_contact_date,
        lastPaymentDate: caseData.last_payment_date,
        lastPaymentAmount: caseData.last_payment_amount,
        priority: caseData.priority,
        nextActionDate: caseData.next_action_date
      }));

      return {
        success: true,
        data: transformedLoans,
        error: null
      };
    } catch (error) {
      console.error('Error fetching specialist loans:', error);
      return {
        success: false,
        data: this.getMockLoans(),
        error: error.message
      };
    }
  }

  /**
   * حساب مؤشرات الأداء الرئيسية
   */
  async calculateKPIs(specialistId, loans, dateRange) {
    try {
      const totalLoans = loans.length;
      const totalPortfolioValue = loans.reduce((sum, loan) => sum + (Number(loan.loanAmount) || 0), 0);
      const overdueLoans = loans.filter(loan => (Number(loan.totalOverdueAmount) || 0) > 0).length;
      const totalOverdueAmount = loans.reduce((sum, loan) => sum + (Number(loan.totalOverdueAmount) || 0), 0);
      
      // حساب معدل التحصيل
      const collectionRate = totalPortfolioValue > 0 ? 
        ((totalPortfolioValue - totalOverdueAmount) / totalPortfolioValue) * 100 : 0;

      // جلب إحصائيات التواصل
      const communicationData = await this.getCommunicationData(specialistId, dateRange);
      const communicationStats = communicationData.stats || {};
      
      // جلب إحصائيات وعود الدفع
      const promisesData = await this.getPromisesToPay(specialistId, dateRange);
      const promises = promisesData.data || [];
      
      const totalPromises = promises.length;
      const fulfilledPromises = promises.filter(p => p.status === 'KEPT').length;
      const promisesFulfillmentRate = totalPromises > 0 ? (fulfilledPromises / totalPromises) * 100 : 0;

      return {
        success: true,
        data: {
          totalLoans,
          totalPortfolioValue,
          overdueLoans,
          totalOverdueAmount,
          collectionRate: Math.round(collectionRate * 10) / 10,
          callsMade: communicationStats.callsMade || 0,
          messagesSent: communicationStats.messagesSent || 0,
          emailsSent: communicationStats.emailsSent || 0,
          promisesToPay: totalPromises,
          promisesFulfilled: fulfilledPromises,
          averageResponseRate: Math.round(communicationStats.responseRate || 0),
          avgCallDuration: communicationStats.avgCallDuration || 0,
          conversionRate: this.calculateConversionRate(loans, promises),
          customerSatisfaction: 4.2 // يمكن حسابها من جدول تقييمات العملاء إذا كان موجوداً
        },
        error: null
      };
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      return {
        success: false,
        data: this.getMockKPIs(),
        error: error.message
      };
    }
  }

  /**
   * حساب معدل التحويل
   */
  calculateConversionRate(loans, promises) {
    if (loans.length === 0) return 0;
    return Math.round((promises.length / loans.length) * 100 * 10) / 10;
  }

  /**
   * جلب بيانات التواصل
   */
  async getCommunicationData(specialistId, dateRange) {
    try {
      const dateFrom = this.getDateRangeStart(dateRange);
      const dateTo = new Date();
      
      // جلب تفاعلات الأخصائي
      const { data: interactions, error } = await supabaseBanking
        .from('collection_interactions')
        .select(`
          interaction_id,
          interaction_type,
          interaction_direction,
          interaction_datetime,
          interaction_status,
          duration_seconds,
          outcome,
          promise_to_pay,
          ptp_amount,
          ptp_date,
          notes
        `)
        .eq('officer_id', specialistId)
        .gte('interaction_datetime', dateFrom.toISOString())
        .lte('interaction_datetime', dateTo.toISOString())
        .order('interaction_datetime', { ascending: false });

      if (error) {
        console.error('Error fetching communication data:', error);
        throw error;
      }

      // تجميع البيانات حسب اليوم ونوع التواصل
      const dailyStats = this.aggregateCommunicationByDay(interactions || []);
      
      // حساب إحصائيات التواصل
      const stats = this.calculateCommunicationStats(interactions || []);

      return {
        success: true,
        data: dailyStats,
        stats: stats,
        error: null
      };
    } catch (error) {
      console.error('Error fetching communication data:', error);
      return {
        success: false,
        data: this.getMockCommunicationData(),
        error: error.message
      };
    }
  }

  /**
   * تجميع بيانات التواصل حسب اليوم
   */
  aggregateCommunicationByDay(interactions) {
    const dayMap = {};
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    // تهيئة الأيام
    days.forEach(day => {
      dayMap[day] = {
        day,
        calls: 0,
        messages: 0,
        emails: 0,
        answered: 0,
        successful: 0
      };
    });

    // تجميع البيانات
    interactions.forEach(interaction => {
      const date = new Date(interaction.interaction_datetime);
      const dayIndex = date.getDay();
      if (dayIndex >= 0 && dayIndex < 5) { // أيام العمل فقط
        const dayName = days[dayIndex];
        const dayData = dayMap[dayName];
        
        // حساب نوع التواصل
        if (interaction.interaction_type === 'CALL') {
          dayData.calls++;
          if (interaction.interaction_status === 'ANSWERED') {
            dayData.answered++;
          }
          if (interaction.outcome === 'SUCCESSFUL' || interaction.promise_to_pay) {
            dayData.successful++;
          }
        } else if (interaction.interaction_type === 'SMS' || interaction.interaction_type === 'WHATSAPP') {
          dayData.messages++;
        } else if (interaction.interaction_type === 'EMAIL') {
          dayData.emails++;
        }
      }
    });

    return Object.values(dayMap);
  }

  /**
   * حساب إحصائيات التواصل
   */
  calculateCommunicationStats(interactions) {
    const totalCalls = interactions.filter(i => i.interaction_type === 'CALL').length;
    const answeredCalls = interactions.filter(i => 
      i.interaction_type === 'CALL' && i.interaction_status === 'ANSWERED'
    ).length;
    const totalMessages = interactions.filter(i => 
      ['SMS', 'WHATSAPP'].includes(i.interaction_type)
    ).length;
    const totalEmails = interactions.filter(i => i.interaction_type === 'EMAIL').length;
    
    return {
      callsMade: totalCalls,
      messagesSent: totalMessages,
      emailsSent: totalEmails,
      responseRate: totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0,
      avgCallDuration: this.calculateAvgCallDuration(interactions)
    };
  }

  /**
   * حساب متوسط مدة المكالمات
   */
  calculateAvgCallDuration(interactions) {
    const calls = interactions.filter(i => 
      i.interaction_type === 'CALL' && i.duration_seconds > 0
    );
    
    if (calls.length === 0) return 0;
    
    const totalDuration = calls.reduce((sum, call) => sum + call.duration_seconds, 0);
    return Math.round(totalDuration / calls.length / 60); // بالدقائق
  }

  /**
   * جلب وعود الدفع
   */
  async getPromisesToPay(specialistId, dateRange) {
    try {
      const dateFrom = this.getDateRangeStart(dateRange);
      
      const { data, error } = await supabaseBanking
        .from('promise_to_pay')
        .select(`
          ptp_id,
          case_id,
          ptp_date,
          ptp_amount,
          status,
          actual_payment_date,
          actual_payment_amount,
          created_at,
          kastle_collection.collection_cases!case_id (
            case_number,
            customer_id,
            loan_account_number,
            kastle_banking.customers!customer_id (
              full_name,
              customer_type
            )
          )
        `)
        .eq('officer_id', specialistId)
        .gte('created_at', dateFrom.toISOString())
        .order('ptp_date', { ascending: true });

      if (error) {
        console.error('Error fetching promises to pay:', error);
        throw error;
      }

      // تحويل البيانات إلى الشكل المطلوب
      const transformedPTPs = (data || []).map(ptp => ({
        ptpId: ptp.ptp_id,
        caseNumber: ptp.kastle_collection?.collection_cases?.case_number,
        customerName: ptp.kastle_collection?.collection_cases?.kastle_banking?.customers?.full_name || 'غير معروف',
        ptpDate: ptp.ptp_date,
        ptpAmount: ptp.ptp_amount,
        status: this.mapPTPStatus(ptp.status),
        actualPaymentDate: ptp.actual_payment_date,
        actualPaymentAmount: ptp.actual_payment_amount,
        daysRemaining: this.calculateDaysRemaining(ptp.ptp_date),
        confidenceLevel: this.calculatePTPConfidence(ptp)
      }));

      return {
        success: true,
        data: transformedPTPs,
        error: null
      };
    } catch (error) {
      console.error('Error fetching promises to pay:', error);
      return {
        success: false,
        data: this.getMockPromisesToPay(),
        error: error.message
      };
    }
  }

  /**
   * حساب بيانات الأداء
   */
  async calculatePerformanceMetrics(specialistId, dateRange) {
    try {
      // جلب بيانات الأداء من جدول officer_performance_metrics إذا كان موجوداً
      const dateFrom = this.getDateRangeStart(dateRange);
      
      const { data: performanceData, error } = await supabaseBanking
        .from('officer_performance_metrics')
        .select(`
          metric_date,
          calls_made,
          calls_answered,
          promises_made,
          promises_kept,
          amount_collected,
          cases_resolved,
          avg_call_duration,
          customer_satisfaction_score
        `)
        .eq('officer_id', specialistId)
        .gte('metric_date', dateFrom.toISOString())
        .order('metric_date', { ascending: false });

      if (error || !performanceData || performanceData.length === 0) {
        // حساب الأداء من البيانات المتاحة
        return await this.calculatePerformanceFromRawData(specialistId, dateRange);
      }

      // حساب المتوسطات من البيانات المسترجعة
      const totalCalls = performanceData.reduce((sum, p) => sum + (p.calls_made || 0), 0);
      const answeredCalls = performanceData.reduce((sum, p) => sum + (p.calls_answered || 0), 0);
      const totalPromises = performanceData.reduce((sum, p) => sum + (p.promises_made || 0), 0);
      const keptPromises = performanceData.reduce((sum, p) => sum + (p.promises_kept || 0), 0);
      const totalCollected = performanceData.reduce((sum, p) => sum + (p.amount_collected || 0), 0);
      const resolvedCases = performanceData.reduce((sum, p) => sum + (p.cases_resolved || 0), 0);

      return {
        success: true,
        data: {
          collectionRate: this.calculateRate(totalCollected, 1000000), // نحتاج إجمالي المحفظة
          responseRate: this.calculateRate(answeredCalls, totalCalls),
          promiseRate: this.calculateRate(totalPromises, totalCalls),
          fulfillmentRate: this.calculateRate(keptPromises, totalPromises),
          efficiency: 85, // يمكن حسابها بناءً على معايير محددة
          qualityScore: 90 // يمكن حسابها من تقييمات الجودة
        },
        error: null
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return this.calculatePerformanceFromRawData(specialistId, dateRange);
    }
  }

  /**
   * حساب الأداء من البيانات الخام
   */
  async calculatePerformanceFromRawData(specialistId, dateRange) {
    try {
      // جلب جميع البيانات المطلوبة
      const [loansResult, communicationResult, promisesResult] = await Promise.all([
        this.getSpecialistLoans(specialistId, { dateRange }),
        this.getCommunicationData(specialistId, dateRange),
        this.getPromisesToPay(specialistId, dateRange)
      ]);

      const loans = loansResult.data || [];
      const communicationStats = communicationResult.stats || {};
      const promises = promisesResult.data || [];

      // حساب المؤشرات
      const totalPortfolio = loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
      const totalOverdue = loans.reduce((sum, loan) => sum + (loan.totalOverdueAmount || 0), 0);
      const collectionRate = totalPortfolio > 0 ? ((totalPortfolio - totalOverdue) / totalPortfolio) * 100 : 0;

      const totalPromises = promises.length;
      const keptPromises = promises.filter(p => p.status === 'KEPT').length;
      const promiseRate = communicationStats.callsMade > 0 ? (totalPromises / communicationStats.callsMade) * 100 : 0;
      const fulfillmentRate = totalPromises > 0 ? (keptPromises / totalPromises) * 100 : 0;

      return {
        success: true,
        data: {
          collectionRate: Math.round(collectionRate * 10) / 10,
          responseRate: Math.round(communicationStats.responseRate || 0),
          promiseRate: Math.round(promiseRate * 10) / 10,
          fulfillmentRate: Math.round(fulfillmentRate * 10) / 10,
          efficiency: 85, // قيمة افتراضية
          qualityScore: 90 // قيمة افتراضية
        },
        error: null
      };
    } catch (error) {
      console.error('Error calculating performance from raw data:', error);
      return {
        success: false,
        data: {
          collectionRate: 75,
          responseRate: 65,
          promiseRate: 45,
          fulfillmentRate: 70,
          efficiency: 85,
          qualityScore: 90
        },
        error: error.message
      };
    }
  }

  /**
   * حساب النسبة المئوية
   */
  calculateRate(numerator, denominator) {
    if (!denominator || denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100 * 10) / 10;
  }

  /**
   * تصدير التقرير
   */
  async exportReport(specialistId, format, filters = {}) {
    try {
      const reportData = await this.getSpecialistReport(specialistId, filters);
      
      if (!reportData.success) {
        throw new Error('Failed to fetch report data');
      }

      // تنفيذ منطق التصدير حسب النوع
      switch (format) {
        case 'excel':
          return this.exportToExcel(reportData.data);
        case 'pdf':
          return this.exportToPDF(reportData.data);
        case 'csv':
          return this.exportToCSV(reportData.data);
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  // ===============================
  // Helper Methods
  // ===============================

  /**
   * تحويل بيانات القرض إلى الشكل المطلوب
   */
  transformLoanData(loan) {
    const loanAmount = Number(loan.outstanding_balance) || 0;
    const overdueAmount = Number(loan.overdue_amount) || 0;
    const overdueDays = Number(loan.overdue_days) || 0;

    return {
      id: loan.loan_account_number,
      customerName: `عميل ${loan.customer_id}`,
      customerId: loan.customer_id,
      loanAmount: loanAmount,
      paidAmount: loanAmount - overdueAmount,
      dueAmount: overdueAmount,
      overdueAmount: overdueAmount,
      overdueDays: overdueDays,
      delinquencyBucket: this.getDelinquencyBucket(overdueDays),
      productType: loan.product_type || 'قرض تورق',
      customerType: 'مؤسسة',
      loanStatus: this.mapLoanStatus(loan.loan_status),
      lastContactDate: '2024-07-20',
      callsThisMonth: Math.floor(Math.random() * 15) + 1,
      messagesThisMonth: Math.floor(Math.random() * 8) + 1,
      lastCallResult: this.getRandomCallResult(),
      hasPromiseToPay: Math.random() > 0.6,
      promiseDate: '2024-07-25',
      promiseAmount: overdueAmount,
      promiseStatus: 'قيد الانتظار'
    };
  }

  /**
   * تحديد فئة التقادم بناءً على أيام التأخير
   */
  getDelinquencyBucket(overdueDays) {
    if (overdueDays === 0) return 'Current';
    if (overdueDays <= 30) return '1-30 Days';
    if (overdueDays <= 60) return '31-60 Days';
    if (overdueDays <= 90) return '61-90 Days';
    return '90+ Days';
  }

  /**
   * تحويل حالة القرض
   */
  mapLoanStatus(status) {
    const statusMap = {
      'ACTIVE': 'نشط',
      'OVERDUE': 'متأخر',
      'DELINQUENT': 'متعثر',
      'CLOSED': 'مغلق'
    };
    return statusMap[status] || 'نشط';
  }

  /**
   * الحصول على نتيجة مكالمة عشوائية
   */
  getRandomCallResult() {
    const results = [
      'تم الرد - وعد بالدفع',
      'تم الرد - رفض الدفع',
      'لم يتم الرد',
      'خطأ بالرقم',
      'انشغال الخط'
    ];
    return results[Math.floor(Math.random() * results.length)];
  }

  /**
   * الحصول على نطاق فئة التقادم
   */
  getBucketRange(bucket) {
    const ranges = {
      'current': { min: 0, max: 0 },
      '1-30': { min: 1, max: 30 },
      '31-60': { min: 31, max: 60 },
      '61-90': { min: 61, max: 90 },
      '90+': { min: 91, max: null }
    };
    return ranges[bucket];
  }

  /**
   * الحصول على تاريخ بداية النطاق الزمني
   */
  getDateRangeStart(dateRange) {
    const now = new Date();
    switch (dateRange) {
      case 'current_month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'last_month':
        return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      case 'current_quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterStart, 1).toISOString();
      case 'current_year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  }

  /**
   * جلب إحصائيات التواصل
   */
  async getCommunicationStats(specialistId, dateRange) {
    try {
      const communicationData = await this.getCommunicationData(specialistId, dateRange);
      return communicationData.stats || {
        callsMade: 0,
        messagesSent: 0,
        responseRate: 0
      };
    } catch (error) {
      console.error('Error getting communication stats:', error);
      return {
        callsMade: 0,
        messagesSent: 0,
        responseRate: 0
      };
    }
  }

  /**
   * جلب إحصائيات وعود الدفع
   */
  async getPromiseStats(specialistId, dateRange) {
    try {
      const promisesData = await this.getPromisesToPay(specialistId, dateRange);
      const promises = promisesData.data || [];
      
      return {
        total: promises.length,
        fulfilled: promises.filter(p => p.status === 'KEPT').length,
        pending: promises.filter(p => p.status === 'ACTIVE').length,
        broken: promises.filter(p => p.status === 'BROKEN').length
      };
    } catch (error) {
      console.error('Error getting promise stats:', error);
      return {
        total: 0,
        fulfilled: 0,
        pending: 0,
        broken: 0
      };
    }
  }

  /**
   * تحديد فئة التأخير بناءً على عدد الأيام
   */
  getDPDBucket(dpd) {
    if (!dpd || dpd === 0) return 'Current';
    if (dpd <= 30) return '1-30 Days';
    if (dpd <= 60) return '31-60 Days';
    if (dpd <= 90) return '61-90 Days';
    if (dpd <= 180) return '91-180 Days';
    if (dpd <= 360) return '181-360 Days';
    return '>360 Days';
  }

  /**
   * تحويل حالة وعد الدفع
   */
  mapPTPStatus(status) {
    const statusMap = {
      'PENDING': 'ACTIVE',
      'KEPT': 'KEPT',
      'BROKEN': 'BROKEN',
      'PARTIAL': 'PARTIAL'
    };
    return statusMap[status] || status;
  }

  /**
   * حساب الأيام المتبقية لوعد الدفع
   */
  calculateDaysRemaining(ptpDate) {
    const today = new Date();
    const targetDate = new Date(ptpDate);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * حساب مستوى الثقة في وعد الدفع
   */
  calculatePTPConfidence(ptp) {
    // منطق بسيط لحساب مستوى الثقة
    let confidence = 50; // قيمة افتراضية
    
    // زيادة الثقة إذا كان العميل قد أوفى بوعود سابقة
    if (ptp.status === 'KEPT') confidence += 30;
    if (ptp.status === 'PARTIAL') confidence += 15;
    if (ptp.status === 'BROKEN') confidence -= 20;
    
    // تعديل بناءً على المبلغ
    if (ptp.ptp_amount < 5000) confidence += 10;
    if (ptp.ptp_amount > 50000) confidence -= 10;
    
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * توليد بيانات الاتجاهات
   */
  generateTrendData(loans, dateRange) {
    const days = 30;
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toLocaleDateString('ar-SA'),
        collected: Math.floor(Math.random() * 500000) + 100000,
        calls: Math.floor(Math.random() * 100) + 50,
        promises: Math.floor(Math.random() * 20) + 5,
        responseRate: Math.random() * 30 + 60
      });
    }
    
    return trends;
  }

  /**
   * معالجة شرائح العملاء
   */
  processCustomerSegments(loans) {
    const segments = {};
    
    loans.forEach(loan => {
      const segment = this.getCustomerSegment(loan.loanAmount);
      if (!segments[segment]) {
        segments[segment] = {
          segment,
          count: 0,
          value: 0,
          risk: this.getSegmentRisk(segment)
        };
      }
      segments[segment].count++;
      segments[segment].value += loan.loanAmount || 0;
    });
    
    return Object.values(segments);
  }

  /**
   * تحديد شريحة العميل
   */
  getCustomerSegment(amount) {
    if (amount >= 5000000) return 'عملاء VIP';
    if (amount >= 1000000) return 'عملاء ذهبيون';
    if (amount >= 500000) return 'عملاء فضيون';
    return 'عملاء عاديون';
  }

  /**
   * تحديد مخاطر الشريحة
   */
  getSegmentRisk(segment) {
    const riskMap = {
      'عملاء VIP': 'منخفض',
      'عملاء ذهبيون': 'متوسط',
      'عملاء فضيون': 'متوسط',
      'عملاء عاديون': 'عالي'
    };
    return riskMap[segment] || 'متوسط';
  }

  /**
   * معالجة تحليل المخاطر
   */
  processRiskAnalysis(loans) {
    const riskLevels = {
      'منخفض جداً': 0,
      'منخفض': 0,
      'متوسط': 0,
      'عالي': 0,
      'عالي جداً': 0
    };

    loans.forEach(loan => {
      const risk = this.calculateRiskLevel(loan);
      riskLevels[risk]++;
    });

    const totalLoans = loans.length || 1;
    const distribution = Object.entries(riskLevels).map(([level, count]) => ({
      level,
      count,
      percentage: Math.round((count / totalLoans) * 100)
    }));

    const factors = [
      { factor: 'سجل الدفع', impact: 85 },
      { factor: 'نسبة الدين', impact: 72 },
      { factor: 'مدة العلاقة', impact: 68 },
      { factor: 'نوع المنتج', impact: 54 },
      { factor: 'القطاع', impact: 45 }
    ];

    return { distribution, factors };
  }

  /**
   * حساب مستوى المخاطر
   */
  calculateRiskLevel(loan) {
    const dpd = loan.totalOverdueDays || 0;
    const overdueRatio = loan.loanAmount > 0 ? (loan.totalOverdueAmount / loan.loanAmount) : 0;
    
    if (dpd === 0 && overdueRatio === 0) return 'منخفض جداً';
    if (dpd <= 30 && overdueRatio < 0.1) return 'منخفض';
    if (dpd <= 60 && overdueRatio < 0.2) return 'متوسط';
    if (dpd <= 90 && overdueRatio < 0.3) return 'عالي';
    return 'عالي جداً';
  }

  /**
   * توليد الجدول الزمني للأنشطة
   */
  async generateTimeline(specialistId, dateRange) {
    try {
      // جلب آخر التفاعلات
      const { data: recentInteractions } = await supabaseBanking
        .from('collection_interactions')
        .select(`
          interaction_type,
          interaction_datetime,
          outcome,
          kastle_collection.collection_cases!case_id (
            customer_id,
            kastle_banking.customers!customer_id (
              full_name
            )
          )
        `)
        .eq('officer_id', specialistId)
        .order('interaction_datetime', { ascending: false })
        .limit(10);

      const timeline = (recentInteractions || []).map(interaction => ({
        time: new Date(interaction.interaction_datetime).toLocaleTimeString('ar-SA', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: this.mapInteractionType(interaction.interaction_type),
        result: interaction.outcome || 'تم',
        customer: interaction.kastle_collection?.collection_cases?.kastle_banking?.customers?.full_name || 'عميل',
        amount: null
      }));

      return timeline;
    } catch (error) {
      console.error('Error generating timeline:', error);
      return [];
    }
  }

  /**
   * تحويل نوع التفاعل
   */
  mapInteractionType(type) {
    const typeMap = {
      'CALL': 'call',
      'SMS': 'message',
      'WHATSAPP': 'message',
      'EMAIL': 'email',
      'VISIT': 'meeting'
    };
    return typeMap[type] || 'call';
  }

  // ===============================
  // Mock Data Methods
  // ===============================

  /**
   * بيانات تجريبية للتقرير الكامل
   */
  getMockReportData() {
    return {
      specialist: this.getMockSpecialists().data[0],
      kpis: this.getMockKPIs(),
      loans: this.getMockLoans(),
      communicationData: this.getMockCommunicationData(),
      promisesToPay: this.getMockPromisesToPay(),
      performance: {
        collectionRate: 82.5,
        responseRate: 73.2,
        promiseRate: 52.8,
        fulfillmentRate: 76.1,
        efficiency: 88.4,
        qualityScore: 91.2
      },
      trends: this.generateTrendData([], 'current_month'),
      customerSegments: [
        { segment: 'عملاء VIP', count: 15, value: 12500000, risk: 'منخفض' },
        { segment: 'عملاء ذهبيون', count: 35, value: 18000000, risk: 'متوسط' },
        { segment: 'عملاء عاديون', count: 60, value: 12000000, risk: 'متوسط' },
        { segment: 'عملاء عالي المخاطر', count: 17, value: 3250000, risk: 'عالي' }
      ],
      riskAnalysis: {
        distribution: [
          { level: 'منخفض جداً', count: 23, percentage: 18 },
          { level: 'منخفض', count: 41, percentage: 32 },
          { level: 'متوسط', count: 38, percentage: 30 },
          { level: 'عالي', count: 19, percentage: 15 },
          { level: 'عالي جداً', count: 6, percentage: 5 }
        ],
        factors: [
          { factor: 'سجل الدفع', impact: 85 },
          { factor: 'نسبة الدين', impact: 72 },
          { factor: 'مدة العلاقة', impact: 68 },
          { factor: 'نوع المنتج', impact: 54 },
          { factor: 'القطاع', impact: 45 }
        ]
      },
      timeline: []
    };
  }

  /**
   * بيانات تجريبية للأخصائيين
   */
  getMockSpecialists() {
    return {
      success: true,
      data: [
        { 
          officer_id: 'SP001', 
          officer_name: 'أحمد محمد علي',
          officer_type: 'SENIOR_COLLECTOR',
          email: 'ahmed.ali@company.com',
          contact_number: '+966501234567',
          team_id: 1,
          status: 'ACTIVE'
        },
        { 
          officer_id: 'SP002', 
          officer_name: 'فاطمة أحمد السالم',
          officer_type: 'CALL_AGENT',
          email: 'fatima.salem@company.com',
          contact_number: '+966502345678',
          team_id: 1,
          status: 'ACTIVE'
        },
        { 
          officer_id: 'SP003', 
          officer_name: 'محمد عبدالله النجار',
          officer_type: 'TEAM_LEAD',
          email: 'mohammed.najjar@company.com',
          contact_number: '+966503456789',
          team_id: 2,
          status: 'ACTIVE'
        }
      ],
      error: null
    };
  }

  getMockKPIs() {
    return {
      totalLoans: 45,
      totalPortfolioValue: 12500000,
      overdueLoans: 18,
      totalOverdueAmount: 3200000,
      collectionRate: 78.5,
      callsMade: 156,
      messagesSent: 89,
      promisesToPay: 23,
      promisesFulfilled: 15,
      averageResponseRate: 65.2
    };
  }

  getMockLoans() {
    return [
      {
        id: 'LN001',
        customerName: 'شركة الرياض للتجارة',
        customerId: 'CU001234',
        loanAmount: 500000,
        paidAmount: 350000,
        dueAmount: 150000,
        overdueAmount: 45000,
        overdueDays: 45,
        delinquencyBucket: '31-60 Days',
        productType: 'قرض تورق',
        customerType: 'مؤسسة',
        loanStatus: 'متأخر',
        lastContactDate: '2024-07-20',
        callsThisMonth: 8,
        messagesThisMonth: 3,
        lastCallResult: 'تم الرد - وعد بالدفع',
        hasPromiseToPay: true,
        promiseDate: '2024-07-25',
        promiseAmount: 45000,
        promiseStatus: 'قيد الانتظار'
      },
      {
        id: 'LN002',
        customerName: 'علي محمد الأحمد',
        customerId: 'CU002345',
        loanAmount: 250000,
        paidAmount: 200000,
        dueAmount: 50000,
        overdueAmount: 15000,
        overdueDays: 22,
        delinquencyBucket: '1-30 Days',
        productType: 'قرض كاش',
        customerType: 'فرد',
        loanStatus: 'متأخر',
        lastContactDate: '2024-07-22',
        callsThisMonth: 5,
        messagesThisMonth: 2,
        lastCallResult: 'لم يتم الرد',
        hasPromiseToPay: false,
        promiseDate: null,
        promiseAmount: 0,
        promiseStatus: 'لا يوجد'
      }
    ];
  }

  getMockCommunicationData() {
    return [
      { day: 'الأحد', calls: 25, messages: 12, responses: 16 },
      { day: 'الاثنين', calls: 32, messages: 18, responses: 21 },
      { day: 'الثلاثاء', calls: 28, messages: 15, responses: 18 },
      { day: 'الأربعاء', calls: 35, messages: 20, responses: 23 },
      { day: 'الخميس', calls: 30, messages: 16, responses: 19 },
      { day: 'الجمعة', calls: 15, messages: 8, responses: 10 },
      { day: 'السبت', calls: 0, messages: 0, responses: 0 }
    ];
  }

  getMockPromisesToPay() {
    return [
      {
        id: 'LN001',
        customerName: 'شركة الرياض للتجارة',
        promiseDate: '2024-07-25',
        promiseAmount: 45000,
        promiseStatus: 'قيد الانتظار'
      }
    ];
  }

  // ===============================
  // Export Methods
  // ===============================

  exportToExcel(data) {
    // تنفيذ تصدير Excel
    console.log('Exporting to Excel:', data);
    return {
      success: true,
      data: 'excel_file_url',
      error: null
    };
  }

  exportToPDF(data) {
    // تنفيذ تصدير PDF
    console.log('Exporting to PDF:', data);
    return {
      success: true,
      data: 'pdf_file_url',
      error: null
    };
  }

  exportToCSV(data) {
    // تنفيذ تصدير CSV
    console.log('Exporting to CSV:', data);
    return {
      success: true,
      data: 'csv_file_url',
      error: null
    };
  }
}

// إنشاء instance واحد من الخدمة
const specialistReportService = new SpecialistReportService();

export default specialistReportService;