# Internationalization (i18n) Guide

This guide explains how to use the Arabic/English internationalization system in the Osol Dashboard.

## Overview

The system supports both Arabic (RTL) and English (LTR) languages with automatic direction switching.

## Features

- ✅ Automatic RTL/LTR switching
- ✅ Language persistence in localStorage
- ✅ Number and currency formatting based on locale
- ✅ Date and time formatting
- ✅ Translated navigation and UI elements
- ✅ Language selector in the header

## Usage

### 1. Import the Translation Hook

```jsx
import { useTranslation } from 'react-i18next';
```

### 2. Use in Components

```jsx
export function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('navigation.customers')}</h1>
      <p>{t('customers.totalCustomers')}</p>
    </div>
  );
}
```

### 3. Translation Keys Structure

Translation files are located in:
- `/public/locales/en/translation.json` (English)
- `/public/locales/ar/translation.json` (Arabic)

Key structure:
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "navigation": {
    "customers": "Customers"
  },
  "customers": {
    "title": "Customers",
    "totalCustomers": "Total Customers"
  }
}
```

### 4. Formatting Numbers and Currency

Use the utility functions from `@/utils/formatters`:

```jsx
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

// Currency formatting
formatCurrency(1500000); // Returns "SAR 1,500,000" or "١٬٥٠٠٬٠٠٠ ر.س" based on language

// Number formatting
formatNumber(12345); // Returns "12,345" or "١٢٬٣٤٥"

// Date formatting
formatDate(new Date()); // Returns localized date
```

### 5. RTL Detection

Use the custom hook for RTL-specific logic:

```jsx
import { useRTL } from '@/hooks/useRTL';

export function MyComponent() {
  const isRTL = useRTL();
  
  return (
    <div className={isRTL ? 'text-right' : 'text-left'}>
      {/* Content */}
    </div>
  );
}
```

### 6. Language Switching

The language selector is available in the header. Users can switch between:
- 🇬🇧 English
- 🇸🇦 العربية

### 7. Adding New Translations

1. Add the key to both translation files:

```json
// public/locales/en/translation.json
{
  "myFeature": {
    "newKey": "English text"
  }
}

// public/locales/ar/translation.json
{
  "myFeature": {
    "newKey": "النص العربي"
  }
}
```

2. Use in your component:
```jsx
<p>{t('myFeature.newKey')}</p>
```

### 8. RTL CSS Classes

The system automatically applies RTL styles when Arabic is selected. Special RTL classes are available:

- Direction-aware spacing: `space-x-4` becomes RTL-friendly
- Icons that flip: chevrons and arrows automatically flip in RTL
- Proper text alignment: `text-left` becomes `text-right` in RTL

### 9. Best Practices

1. **Always use translation keys** instead of hardcoded text
2. **Format numbers and currencies** using the utility functions
3. **Test both languages** when developing new features
4. **Keep translation keys organized** by feature/page
5. **Use semantic keys** (e.g., `customers.title` not `page1.heading`)

### 10. Common Patterns

#### Page Headers
```jsx
<div>
  <h1 className="text-3xl font-bold">{t('customers.title')}</h1>
  <p className="text-muted-foreground">{t('customers.description')}</p>
</div>
```

#### Form Labels
```jsx
<Label>{t('customers.customerName')}</Label>
<Input placeholder={t('customers.searchCustomers')} />
```

#### Buttons
```jsx
<Button>
  <Plus className="mr-2 h-4 w-4" />
  {t('common.add')}
</Button>
```

#### Status Badges
```jsx
<Badge>{t(`status.${status.toLowerCase()}`)}</Badge>
```

## Troubleshooting

1. **Translation not showing**: Check if the key exists in both language files
2. **RTL not working**: Ensure the HTML dir attribute is being set
3. **Numbers showing incorrectly**: Use the formatNumber utility function
4. **Language not persisting**: Check localStorage permissions

## Adding New Languages

To add a new language:

1. Create translation file: `/public/locales/[lang]/translation.json`
2. Add language to `supportedLngs` in `/src/i18n/i18n.js`
3. Add language option to the LanguageSelector component
4. Update RTL detection if needed