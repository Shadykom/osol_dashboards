# Report Generation Error Fixes

## Overview
The application is experiencing multiple errors when generating financial reports. This document provides solutions for each error type.

## Error Analysis

### 1. Foreign Key Relationship Error
**Error**: `Could not find a relationship between 'loan_accounts' and 'loan_types' in the schema cache`
**URL**: `https://bzlenegoilnswsbanxgb.supabase.co/rest/v1/loan_accounts?select=outstanding_balance,loan_status,loan_amount,disbursement_date,loan_types!inner(type_name,max_amount)`

**Root Cause**: The direct relationship between `loan_accounts` and `loan_types` doesn't exist in the database schema.

**Solution**: Query through the intermediate table (likely `loan_applications`):

```javascript
// Instead of direct join:
// loan_accounts?select=...,loan_types!inner(...)

// Use proper relationship path:
const { data, error } = await supabase
  .from('loan_accounts')
  .select(`
    outstanding_balance,
    loan_status,
    loan_amount,
    disbursement_date,
    loan_applications!inner(
      loan_type_id,
      loan_types!inner(
        type_name,
        max_amount
      )
    )
  `)
  .in('loan_status', ['ACTIVE', 'DISBURSED'])
  .lte('disbursement_date', endDate);
```

### 2. Undefined Table Reference
**Error**: `HEAD https://bzlenegoilnswsbanxgb.supabase.co/rest/v1/undefined?select=*&status=eq.ACTIVE 404`

**Root Cause**: A variable containing the table name is undefined.

**Solution**: Add proper table name validation:

```javascript
function getTableName(reportType) {
  const tableMap = {
    'balance_sheet': 'financial_statements',
    'income_statement': 'financial_statements',
    'cash_flow': 'financial_statements',
    'sama_monthly': 'regulatory_reports',
    'basel_iii': 'regulatory_reports',
    'aml_report': 'compliance_reports',
    'liquidity_coverage': 'liquidity_reports',
    'capital_adequacy': 'capital_reports'
  };
  
  const tableName = tableMap[reportType];
  if (!tableName) {
    throw new Error(`No table mapping found for report type: ${reportType}`);
  }
  
  return tableName;
}
```

### 3. Unknown Report Types
**Errors**: Unknown financial report type for: sama_monthly, basel_iii, aml_report, liquidity_coverage, capital_adequacy

**Solution**: Implement handlers for each report type:

```javascript
class ReportService {
  async getFinancialReportData(reportType, startDate, endDate) {
    switch (reportType) {
      case 'balance_sheet':
      case 'income_statement':
      case 'cash_flow':
        return this.getStandardReport(reportType, startDate, endDate);
        
      case 'sama_monthly':
        return this.getSAMAMonthlyReport(startDate, endDate);
        
      case 'basel_iii':
        return this.getBaselIIIReport(startDate, endDate);
        
      case 'aml_report':
        return this.getAMLReport(startDate, endDate);
        
      case 'liquidity_coverage':
        return this.getLiquidityCoverageReport(startDate, endDate);
        
      case 'capital_adequacy':
        return this.getCapitalAdequacyReport(startDate, endDate);
        
      default:
        throw new Error(`Unknown financial report type: ${reportType}`);
    }
  }

  async getSAMAMonthlyReport(startDate, endDate) {
    // Saudi Arabian Monetary Authority monthly report
    const sections = await Promise.all([
      this.getAssetsSummary(endDate),
      this.getLiabilitiesSummary(endDate),
      this.getCapitalMetrics(endDate),
      this.getLiquidityMetrics(endDate),
      this.getCreditExposure(endDate)
    ]);

    return {
      reportType: 'sama_monthly',
      reportName: 'SAMA Monthly Statistical Report',
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      sections
    };
  }

  async getBaselIIIReport(startDate, endDate) {
    // Basel III compliance report
    const [capitalData, leverageData, liquidityData] = await Promise.all([
      this.getCapitalAdequacyData(endDate),
      this.getLeverageRatioData(endDate),
      this.getLiquidityCoverageData(endDate)
    ]);

    return {
      reportType: 'basel_iii',
      reportName: 'Basel III Regulatory Compliance Report',
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      metrics: {
        capitalAdequacy: capitalData,
        leverageRatio: leverageData,
        liquidityCoverage: liquidityData
      }
    };
  }

  async getAMLReport(startDate, endDate) {
    // Anti-Money Laundering report
    const [transactions, riskAssessment, sarData] = await Promise.all([
      this.getSuspiciousTransactions(startDate, endDate),
      this.getCustomerRiskAssessment(endDate),
      this.getSARFilings(startDate, endDate)
    ]);

    return {
      reportType: 'aml_report',
      reportName: 'Anti-Money Laundering Compliance Report',
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      summary: {
        suspiciousTransactions: transactions,
        riskAssessment: riskAssessment,
        sarFilings: sarData
      }
    };
  }

  async getLiquidityCoverageReport(startDate, endDate) {
    // Liquidity Coverage Ratio (LCR) report
    const [hqla, cashflows, stressScenarios] = await Promise.all([
      this.getHighQualityLiquidAssets(endDate),
      this.getNetCashOutflows(endDate),
      this.getStressTestResults(endDate)
    ]);

    const lcr = hqla.total / Math.max(cashflows.net30Day, 1);

    return {
      reportType: 'liquidity_coverage',
      reportName: 'Liquidity Coverage Ratio Report',
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      lcrMetrics: {
        ratio: lcr,
        hqla: hqla,
        netCashOutflows: cashflows,
        stressTests: stressScenarios,
        compliance: lcr >= 1.0 ? 'COMPLIANT' : 'NON_COMPLIANT'
      }
    };
  }

  async getCapitalAdequacyReport(startDate, endDate) {
    // Capital Adequacy report
    const [capital, rwa, buffers] = await Promise.all([
      this.getCapitalComponents(endDate),
      this.getRiskWeightedAssets(endDate),
      this.getCapitalBuffers(endDate)
    ]);

    return {
      reportType: 'capital_adequacy',
      reportName: 'Capital Adequacy Report',
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      capitalMetrics: {
        tier1Capital: capital.tier1,
        tier2Capital: capital.tier2,
        totalCapital: capital.total,
        riskWeightedAssets: rwa,
        ratios: {
          cet1Ratio: (capital.cet1 / rwa.total) * 100,
          tier1Ratio: (capital.tier1 / rwa.total) * 100,
          totalCapitalRatio: (capital.total / rwa.total) * 100
        },
        buffers: buffers
      }
    };
  }
}
```

## Implementation Steps

1. **Update Database Queries**
   - Modify all queries using `loan_types!inner` to use the correct relationship path
   - Add error handling for missing relationships

2. **Fix Table References**
   - Create a centralized table mapping configuration
   - Validate table names before making queries

3. **Implement Report Handlers**
   - Add handler methods for each missing report type
   - Ensure each handler returns data in the expected format

4. **Add Error Handling**
   - Wrap all database queries in try-catch blocks
   - Provide meaningful error messages
   - Log errors for debugging

5. **Test Each Report Type**
   - Test with valid date ranges
   - Verify data accuracy
   - Check performance with large datasets

## Quick Fix Script

```javascript
// emergency-fix.js
// Run this to patch the immediate issues

const reportFixes = {
  // Fix loan query
  fixLoanQuery: (query) => {
    return query.replace(
      'loan_types!inner(type_name,max_amount)',
      'loan_applications!inner(loan_types!inner(type_name,max_amount))'
    );
  },
  
  // Add missing report types
  addReportHandlers: (service) => {
    const missingTypes = ['sama_monthly', 'basel_iii', 'aml_report', 'liquidity_coverage', 'capital_adequacy'];
    
    missingTypes.forEach(type => {
      if (!service[`get${type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Report`]) {
        service[`get${type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Report`] = async (start, end) => {
          return {
            reportType: type,
            reportName: type.replace(/_/g, ' ').toUpperCase(),
            period: { startDate: start, endDate: end },
            data: {},
            message: 'Report handler implemented - data collection pending'
          };
        };
      }
    });
  }
};

export default reportFixes;
```

## Testing

After implementing these fixes, test each report type:

```javascript
// test-reports.js
const testReports = async () => {
  const reportTypes = [
    'balance_sheet',
    'income_statement', 
    'cash_flow',
    'sama_monthly',
    'basel_iii',
    'aml_report',
    'liquidity_coverage',
    'capital_adequacy'
  ];
  
  const startDate = '2025-01-01';
  const endDate = '2025-01-31';
  
  for (const type of reportTypes) {
    try {
      console.log(`Testing ${type}...`);
      const result = await reportService.getFinancialReportData(type, startDate, endDate);
      console.log(`✓ ${type} working`);
    } catch (error) {
      console.error(`✗ ${type} failed:`, error.message);
    }
  }
};
```
