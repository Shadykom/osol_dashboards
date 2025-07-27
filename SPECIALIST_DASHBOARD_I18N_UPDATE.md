# Specialist Dashboard Internationalization Update

## Summary
Updated the Specialist Level Report dashboard to use the system's default language (English) and proper number formatting.

## Changes Made

### 1. Added Translation Support
- Added `useTranslation` hook from `react-i18next`
- Imported number and currency formatters from `@/utils/formatters`
- Updated component to use `t()` function for all text

### 2. Fixed Number Formatting
- Changed `formatNumber` from using `'ar-SA'` locale to using the utility function that always uses `'en-US'`
- Updated `formatCurrency` to use the utility function
- This ensures all numbers are displayed in English format (1,234 instead of ١٬٢٣٤)

### 3. Updated Translation Files
- Added complete `specialistLevelReport` section to both English and Arabic translation files
- Includes translations for:
  - Dashboard title and subtitle
  - Tab names (Portfolio, Activities, Collections, Reports)
  - Metric labels (Loans Missed, Collection Value, etc.)
  - Filter labels and options
  - Chart titles

### 4. Replaced Hardcoded Arabic Text
- Dashboard title: "لوحة تحكم الأخصائي" → Dynamic translation
- Tab names: Arabic text → Dynamic translations
- KPI titles: Arabic text → Dynamic translations
- Filter labels: Arabic text → Dynamic translations
- Error messages: Arabic text → English messages
- Date options: Arabic text → Dynamic translations

### 5. Updated Date Formatting
- Changed `formatDate` to use locale based on current language
- Returns '-' instead of 'غير متوفر' for empty dates

## Result
- Dashboard now displays in the system's default language (English)
- All numbers are displayed in English format
- Language can be switched using the language selector in the header
- Maintains full Arabic support when Arabic is selected

## Files Modified
1. `/workspace/src/pages/SpecialistLevelReport.jsx`
2. `/workspace/public/locales/en/translation.json`
3. `/workspace/public/locales/ar/translation.json`

## Testing
The dashboard should now:
- Display in English by default
- Show numbers in English format (1,234,567)
- Allow switching to Arabic via the language selector
- Maintain proper RTL layout when Arabic is selected