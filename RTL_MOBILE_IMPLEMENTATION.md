# RTL/LTR and Mobile Responsive Implementation Guide

## Overview

This document provides a comprehensive guide for implementing RTL (Right-to-Left) support for Arabic localization and mobile responsive design across all pages in the application.

## Key Components Created

### 1. RTL Wrapper Components (`/src/components/ui/rtl-wrapper.jsx`)

- **RTLWrapper**: Base wrapper that applies RTL/LTR direction
- **RTLFlex**: Flex container with automatic direction reversal
- **RTLGrid**: Grid container with RTL support
- **RTLContainer**: Responsive container with RTL support
- **RTLText**: Text component with proper alignment
- **RTLIcon**: Icon wrapper with position support
- **useRTLClasses**: Hook providing RTL-aware utility classes

### 2. Page Layout Components (`/src/components/layout/PageWrapper.jsx`)

- **PageWrapper**: Main page wrapper with header and responsive layout
- **PageSection**: Section wrapper with consistent spacing
- **PageGrid**: Responsive grid with mobile breakpoints
- **PageCard**: Card component with RTL support

### 3. CSS Utilities (`/src/styles/rtl-mobile.css`)

- RTL-aware spacing utilities (margins, padding)
- Mobile-specific classes and media queries
- Touch-friendly sizing for mobile devices
- Direction-aware positioning classes

## Implementation Steps

### 1. Update Existing Pages

To update any existing page with RTL/LTR and mobile support:

```jsx
import { PageWrapper, PageSection, PageGrid, PageCard } from '@/components/layout/PageWrapper';
import { RTLFlex, RTLText, useRTLClasses } from '@/components/ui/rtl-wrapper';

const YourPage = () => {
  const { t } = useTranslation();
  const { isRTL, isMobile } = useRTLClasses();

  return (
    <PageWrapper
      title={t('page.title')}
      subtitle={t('page.subtitle')}
      actions={/* Your action buttons */}
    >
      <PageSection title={t('section.title')}>
        <PageGrid cols={1} smCols={2} lgCols={4}>
          {/* Your grid content */}
        </PageGrid>
      </PageSection>
    </PageWrapper>
  );
};
```

### 2. Use RTL-Aware Flex Layouts

```jsx
// Instead of regular flex
<div className="flex items-center gap-4">

// Use RTLFlex
<RTLFlex className="items-center gap-4">
  {/* Content automatically reverses in RTL */}
</RTLFlex>
```

### 3. Handle Icons with RTL Support

```jsx
// Icon on the start (left in LTR, right in RTL)
<RTLIcon position="start">
  <YourIcon className="w-5 h-5" />
</RTLIcon>

// Icon on the end (right in LTR, left in RTL)
<RTLIcon position="end">
  <YourIcon className="w-5 h-5" />
</RTLIcon>
```

### 4. Mobile Responsive Buttons

```jsx
<Button
  size={isMobile ? "sm" : "default"}
  className={cn(
    "your-classes",
    isMobile && "w-full" // Full width on mobile
  )}
>
  {t('button.label')}
</Button>
```

## Language Switching

The language switcher is integrated into the header and can be toggled between English and Arabic:

- Click the globe icon in the header
- Language preference is saved in localStorage
- All text direction and layout automatically adjusts

## Mobile Responsive Features

### Breakpoints
- Mobile: < 640px
- Tablet: 641px - 768px
- Desktop: > 768px

### Mobile-First Approach
- Components stack vertically on mobile
- Touch-friendly sizing (min 44px touch targets)
- Simplified navigation with hamburger menu
- Optimized spacing for small screens

## Arabic Translations

All UI elements have been translated to Arabic. Key translation files:
- `/public/locales/ar/translation.json` - Arabic translations
- `/public/locales/en/translation.json` - English translations

### Adding New Translations

```json
// In translation.json
{
  "yourSection": {
    "title": "عنوان القسم", // Arabic
    "description": "وصف القسم"
  }
}
```

```jsx
// In your component
const { t } = useTranslation();
<h1>{t('yourSection.title')}</h1>
```

## Best Practices

1. **Always use RTL-aware components** instead of regular HTML elements
2. **Test in both languages** - Switch between English and Arabic frequently
3. **Check mobile view** - Use browser dev tools to test responsive design
4. **Use logical properties** - margin-inline-start instead of margin-left
5. **Avoid hardcoded directions** - Use isRTL conditional for direction-specific styles

## Common Patterns

### Conditional Styling Based on Direction

```jsx
className={cn(
  "base-classes",
  isRTL ? "rtl-specific" : "ltr-specific"
)}
```

### Responsive Grid

```jsx
<PageGrid 
  cols={1}        // 1 column on mobile
  smCols={2}      // 2 columns on tablet
  lgCols={4}      // 4 columns on desktop
>
  {items.map(item => (
    <PageCard key={item.id} {...item} />
  ))}
</PageGrid>
```

### Direction-Aware Spacing

```jsx
// Use the hook
const { marginStart, paddingEnd } = useRTLClasses();

// Apply classes
<div className={cn(marginStart(4), paddingEnd(2))}>
  {/* Content */}
</div>
```

## Testing Checklist

- [ ] Switch to Arabic and verify all text is properly aligned
- [ ] Check that all flex layouts reverse correctly in RTL
- [ ] Test on mobile devices (or using dev tools)
- [ ] Verify touch targets are at least 44px
- [ ] Ensure sidebar opens from the correct side
- [ ] Check that icons are positioned correctly
- [ ] Verify forms and inputs work in both directions
- [ ] Test navigation flow in both languages

## Example Implementation

See `/src/pages/DashboardRTLExample.jsx` for a complete example of a page implementing all RTL/LTR and mobile responsive features.

## Troubleshooting

### Text not aligning correctly
- Ensure you're using `text-start` and `text-end` instead of `text-left` and `text-right`
- Check that the parent component has proper RTL wrapper

### Layout not reversing
- Make sure to use `RTLFlex` instead of regular flex containers
- Check that the component is wrapped in `RTLWrapper`

### Mobile layout issues
- Verify you're using responsive utility classes (sm:, md:, lg:)
- Check that touch targets meet minimum size requirements
- Test with actual mobile devices when possible