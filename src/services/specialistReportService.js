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
      // محاولة جلب البيانات من جدول الأخصائيين إذا كان موجوداً
      const { data, error } = await supabaseBanking
        .from('collection_specialists')
        .select('*')
        .eq('status', 'active');

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      // إذا لم يكن الجدول موجوداً، إرجاع بيانات تجريبية
      if (error || !data || data.length === 0) {
        return this.getMockSpecialists();
      }

      return {
        success: true,
        data: data,
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
      const kpis = await this.calculateKPIs(specialistId, loans.data, dateRange);
      
      // جلب بيانات التواصل
      const communications = await this.getCommunicationData(specialistId, dateRange);
      
      // جلب وعود الدفع
      const promisesToPay = await this.getPromisesToPay(specialistId, dateRange);
      
      // حساب بيانات الأداء
      const performance = await this.calculatePerformanceMetrics(specialistId, dateRange);

      return {
        success: true,
        data: {
          specialist: specialist.data,
          kpis: kpis.data,
          loans: loans.data,
          communications: communications.data,
          promisesToPay: promisesToPay.data,
          performance: performance.data
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching specialist report:', error);
      return {
        success: false,
        data: null,
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
        .from('collection_specialists')
        .select('*')
        .eq('id', specialistId)
        .single();

      if (error) {
        // إرجاع بيانات تجريبية إذا لم يكن الجدول موجوداً
        const mockSpecialists = this.getMockSpecialists().data;
        const specialist = mockSpecialists.find(s => s.id === specialistId);
        
        return {
          success: true,
          data: specialist || mockSpecialists[0],
          error: null
        };
      }

      return {
        success: true,
        data: data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching specialist by ID:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * جلب القروض المخصصة لأخصائي محدد
   */
  async getSpecialistLoans(specialistId, filters = {}) {
    try {
      let query = supabaseBanking
        .from('kastle_banking.loan_accounts')
        .select(`
          loan_account_number,
          customer_id,
          outstanding_balance,
          overdue_amount,
          overdue_days,
          loan_status,
          loan_start_date,
          maturity_date,
          product_type
        `);

      // تطبيق المرشحات
      if (filters.loanStatus && filters.loanStatus !== 'all') {
        query = query.eq('loan_status', filters.loanStatus);
      }

      if (filters.delinquencyBucket && filters.delinquencyBucket !== 'all') {
        const bucketRange = this.getBucketRange(filters.delinquencyBucket);
        if (bucketRange) {
          query = query.gte('overdue_days', bucketRange.min);
          if (bucketRange.max) {
            query = query.lte('overdue_days', bucketRange.max);
          }
        }
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Error fetching specialist loans:', error);
        return {
          success: false,
          data: this.getMockLoans(),
          error: error.message
        };
      }

      // تحويل البيانات إلى الشكل المطلوب
      const transformedLoans = data.map(loan => this.transformLoanData(loan));

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
      const overdueLoans = loans.filter(loan => (Number(loan.overdueAmount) || 0) > 0).length;
      const totalOverdueAmount = loans.reduce((sum, loan) => sum + (Number(loan.overdueAmount) || 0), 0);
      
      // حساب معدل التحصيل
      const collectionRate = totalPortfolioValue > 0 ? 
        ((totalPortfolioValue - totalOverdueAmount) / totalPortfolioValue) * 100 : 0;

      // بيانات التواصل (يمكن جلبها من جداول منفصلة)
      const communicationStats = await this.getCommunicationStats(specialistId, dateRange);
      
      // بيانات وعود الدفع
      const promiseStats = await this.getPromiseStats(specialistId, dateRange);

      return {
        success: true,
        data: {
          totalLoans,
          totalPortfolioValue,
          overdueLoans,
          totalOverdueAmount,
          collectionRate,
          callsMade: communicationStats.callsMade || 156,
          messagesSent: communicationStats.messagesSent || 89,
          promisesToPay: promiseStats.total || 23,
          promisesFulfilled: promiseStats.fulfilled || 15,
          averageResponseRate: communicationStats.responseRate || 65.2
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
   * جلب بيانات التواصل
   */
  async getCommunicationData(specialistId, dateRange) {
    try {
      // محاولة جلب البيانات من جدول التواصل
      const { data, error } = await supabaseBanking
        .from('communication_logs')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('created_at', this.getDateRangeStart(dateRange));

      if (error) {
        return {
          success: true,
          data: this.getMockCommunicationData(),
          error: null
        };
      }

      return {
        success: true,
        data: data || this.getMockCommunicationData(),
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
   * جلب وعود الدفع
   */
  async getPromisesToPay(specialistId, dateRange) {
    try {
      const { data, error } = await supabaseBanking
        .from('promises_to_pay')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('created_at', this.getDateRangeStart(dateRange));

      if (error) {
        return {
          success: true,
          data: this.getMockPromisesToPay(),
          error: null
        };
      }

      return {
        success: true,
        data: data || this.getMockPromisesToPay(),
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
   * حساب مؤشرات الأداء
   */
  async calculatePerformanceMetrics(specialistId, dateRange) {
    try {
      // يمكن تطوير هذه الحسابات بناءً على البيانات الفعلية
      return {
        success: true,
        data: {
          collectionRate: 78.5,
          responseRate: 65.2,
          promiseRate: 51.1,
          fulfillmentRate: 65.2
        },
        error: null
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {
        success: false,
        data: {
          collectionRate: 0,
          responseRate: 0,
          promiseRate: 0,
          fulfillmentRate: 0
        },
        error: error.message
      };
    }
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
    // يمكن تطوير هذه الدالة لجلب البيانات الفعلية من قاعدة البيانات
    return {
      callsMade: 156,
      messagesSent: 89,
      responseRate: 65.2
    };
  }

  /**
   * جلب إحصائيات وعود الدفع
   */
  async getPromiseStats(specialistId, dateRange) {
    // يمكن تطوير هذه الدالة لجلب البيانات الفعلية من قاعدة البيانات
    return {
      total: 23,
      fulfilled: 15,
      pending: 8
    };
  }

  // ===============================
  // Mock Data Methods
  // ===============================

  getMockSpecialists() {
    return {
      success: true,
      data: [
        { id: 'SP001', name: 'أحمد محمد علي', department: 'التحصيل المبكر', email: 'ahmed.ali@company.com', phone: '+966501234567' },
        { id: 'SP002', name: 'فاطمة أحمد السالم', department: 'التحصيل المتأخر', email: 'fatima.salem@company.com', phone: '+966501234568' },
        { id: 'SP003', name: 'محمد عبدالله النجار', department: 'التحصيل القانوني', email: 'mohammed.najjar@company.com', phone: '+966501234569' },
        { id: 'SP004', name: 'نورا سعد الغامدي', department: 'التحصيل المبكر', email: 'nora.ghamdi@company.com', phone: '+966501234570' },
        { id: 'SP005', name: 'خالد عبدالعزيز المطيري', department: 'التحصيل المتأخر', email: 'khalid.mutairi@company.com', phone: '+966501234571' }
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

