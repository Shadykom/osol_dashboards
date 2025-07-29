# Arabic Localization Implementation Guide

## Overview

This application has been fully configured for Arabic localization with the following features:
- Complete Arabic translations for all UI elements
- RTL (Right-to-Left) layout support
- Numbers remain in English format (Western Arabic numerals)
- Automatic language detection and persistence

## Key Features

### 1. Language Switching
- Users can switch between English and Arabic using the language selector
- Language preference is saved in localStorage
- Language changes are applied immediately without page reload

### 2. RTL Support
- Automatic RTL layout when Arabic is selected
- All UI components properly mirror for RTL reading
- CSS styles include RTL-specific adjustments

### 3. Number Formatting
Numbers, dates, and currencies always display in English format regardless of the selected language:
- Numbers: 1,234,567.89 (not ١٬٢٣٤٬٥٦٧٫٨٩)
- Currency: SAR 1,234,567
- Percentages: 85.5%
- Dates: 12/25/2023

## Implementation Details

### i18n Configuration
Located in `src/i18n/i18n.js`:
```javascript
// Custom formatters ensure numbers stay in English
interpolation: {
  format: function(value, format, lng) {
    if (format === 'number') return formatNumber(value, lng);
    if (format === 'currency') return formatCurrency(value, lng);
    if (format === 'percent') return formatPercent(value, lng);
    return value;
  }
}
```

### Number Formatting Utilities
Located in `src/utils/numberFormatting.js`:
- `formatNumber()` - Basic number formatting
- `formatCurrency()` - Currency with SAR
- `formatPercent()` - Percentage formatting
- `formatCompactNumber()` - Abbreviated numbers (1.5M)
- `formatDate()` - Date formatting
- `formatDateTime()` - Date and time formatting

### Translation Files
- English: `/public/locales/en/translation.json`
- Arabic: `/public/locales/ar/translation.json`

## Usage in Components

### Basic Translation
```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('common.welcome')}</h1>;
}
```

### Number Formatting
```jsx
import { formatNumber, formatCurrency } from '../utils/numberFormatting';

function MyComponent() {
  const amount = 1234567.89;
  
  return (
    <div>
      <p>Number: {formatNumber(amount)}</p>
      <p>Currency: {formatCurrency(amount)}</p>
    </div>
  );
}
```

### Using i18n Interpolation
```jsx
function MyComponent() {
  const { t } = useTranslation();
  const amount = 1234567.89;
  
  return (
    <p>{t('common.totalAmount', 'Total: {{amount, currency}}', { amount })}</p>
  );
}
```

## Adding New Translations

1. Add the English text to `/public/locales/en/translation.json`
2. Add the Arabic translation to `/public/locales/ar/translation.json`
3. Use the translation key in your component with `t('key.path')`

Example:
```json
// English
{
  "dashboard": {
    "newFeature": "New Feature"
  }
}

// Arabic
{
  "dashboard": {
    "newFeature": "ميزة جديدة"
  }
}
```

## RTL Styling

RTL styles are automatically applied when Arabic is selected. For custom RTL adjustments:

```css
/* Normal LTR styles */
.my-component {
  margin-left: 20px;
  text-align: left;
}

/* RTL overrides */
[dir="rtl"] .my-component {
  margin-left: 0;
  margin-right: 20px;
  text-align: right;
}
```

## Testing

To test Arabic localization:
1. Click the language selector in the header
2. Select "العربية" (Arabic)
3. Verify:
   - All text is translated to Arabic
   - Layout switches to RTL
   - Numbers remain in English format
   - Navigation and interactions work correctly

## Troubleshooting

### Missing Translations
If you see translation keys instead of text:
1. Check if the key exists in both translation files
2. Ensure the JSON structure matches between files
3. Check browser console for i18n errors

### RTL Layout Issues
If RTL layout isn't working:
1. Verify `document.documentElement.dir` is set to 'rtl'
2. Check CSS for proper RTL selectors
3. Ensure no absolute positioning conflicts

### Number Formatting Issues
If numbers show in Arabic numerals:
1. Use the utility functions from `numberFormatting.js`
2. For i18n interpolation, use the format parameter: `{{value, number}}`
3. Avoid using browser's default number formatting

## Best Practices

1. **Always provide fallback text**: `t('key', 'Fallback Text')`
2. **Use semantic keys**: `dashboard.metrics.totalRevenue` not `text1`
3. **Keep translations synchronized**: Update both files together
4. **Test both languages**: Verify UI works in both English and Arabic
5. **Consider text expansion**: Arabic text can be 30% longer than English
6. **Use number utilities**: Always format numbers through provided utilities