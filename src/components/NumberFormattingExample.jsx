import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber, formatCurrency, formatPercent, formatCompactNumber } from '../utils/numberFormatting';

/**
 * Example component demonstrating number formatting with Arabic localization
 * Numbers remain in English format even when language is Arabic
 */
export const NumberFormattingExample = () => {
  const { t, i18n } = useTranslation();
  
  // Example values
  const amount = 1234567.89;
  const percentage = 85.5;
  const largeNumber = 1500000;
  
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">
        {t('common.numberFormatting', 'Number Formatting Examples')}
      </h2>
      
      <div className="grid gap-4">
        {/* Basic number formatting */}
        <div className="border p-3 rounded">
          <h3 className="font-semibold">{t('common.basicNumber', 'Basic Number')}</h3>
          <p>{formatNumber(amount)}</p>
          <p className="text-sm text-gray-600">
            {t('common.alwaysEnglish', 'Always in English numerals')}
          </p>
        </div>
        
        {/* Currency formatting */}
        <div className="border p-3 rounded">
          <h3 className="font-semibold">{t('common.currency', 'Currency')}</h3>
          <p>{formatCurrency(amount)}</p>
          <p className="text-sm text-gray-600">
            {t('common.sarCurrency', 'SAR with English numerals')}
          </p>
        </div>
        
        {/* Percentage formatting */}
        <div className="border p-3 rounded">
          <h3 className="font-semibold">{t('common.percentage', 'Percentage')}</h3>
          <p>{formatPercent(percentage)}</p>
          <p className="text-sm text-gray-600">
            {t('common.percentWithEnglish', 'Percentage with English numerals')}
          </p>
        </div>
        
        {/* Compact number formatting */}
        <div className="border p-3 rounded">
          <h3 className="font-semibold">{t('common.compactNumber', 'Compact Number')}</h3>
          <p>{formatCompactNumber(largeNumber)}</p>
          <p className="text-sm text-gray-600">
            {t('common.abbreviatedNumber', 'Abbreviated with English numerals')}
          </p>
        </div>
        
        {/* Using i18n interpolation with formatting */}
        <div className="border p-3 rounded">
          <h3 className="font-semibold">{t('common.i18nFormatting', 'i18n Formatting')}</h3>
          <p>{t('common.totalAmount', 'Total Amount: {{amount, currency}}', { amount })}</p>
          <p>{t('common.completionRate', 'Completion Rate: {{rate, percent}}', { rate: percentage / 100 })}</p>
          <p className="text-sm text-gray-600">
            {t('common.usingI18nFormat', 'Using i18n format functions')}
          </p>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded">
        <p className="text-sm">
          <strong>{t('common.currentLanguage', 'Current Language')}:</strong> {i18n.language}
        </p>
        <p className="text-sm">
          <strong>{t('common.direction', 'Direction')}:</strong> {i18n.language === 'ar' ? 'RTL' : 'LTR'}
        </p>
      </div>
    </div>
  );
};