# تحديث لوحة المتأخرات التنفيذية لدعم الترجمة

## نظرة عامة
تم تحديث لوحة المتأخرات التنفيذية (`DelinquencyExecutiveDashboard.tsx`) لاستخدام نظام الترجمة الموحد للموقع بدلاً من النصوص العربية المباشرة.

## التغييرات الرئيسية

### 1. إضافة دعم الترجمة
- تم استيراد `useTranslation` من `react-i18next`
- تم استيراد `useRTL` لدعم اتجاه النص
- تم إضافة دعم اللغة الإنجليزية والعربية للتواريخ باستخدام `date-fns`

### 2. مفاتيح الترجمة الجديدة
تم إضافة قسم جديد `delinquencyDashboard` في ملفات الترجمة:

#### الأقسام الرئيسية:
- **العنوان والوصف**: `title`, `subtitle`
- **اختيار الفترة**: `selectPeriod`, `currentMonth`, `currentQuarter`, `currentYear`
- **مؤشرات الأداء الرئيسية (KPI)**: 
  - `totalPortfolio`, `activeLoans`
  - `totalDelinquency`, `fromTotalPortfolio`
  - `monthlyCollectionRate`, `delinquentAccounts`
- **مقارنة الأداء**: `performanceComparison`
- **الرسوم البيانية**: `charts`
- **فئات التقادم**: `aging`
- **جدول البيانات**: `table`
- **التوصيات**: `recommendations`

### 3. تحسينات التنسيق
- تم تحديث دوال `formatCurrency` و `formatPercentage` لدعم التنسيق حسب اللغة المختارة
- استخدام `Intl.NumberFormat` مع اللغة المناسبة

### 4. دعم RTL/LTR
- تم إزالة `dir="rtl"` الثابت من الحاوية الرئيسية
- استخدام `isRTL` لتحديد اتجاه العناصر ديناميكياً
- تطبيق classes مناسبة للـ margins والـ text alignment

### 5. ترجمة فئات التقادم
تم إضافة دالة `translateAgingBucket` لترجمة أسماء فئات التقادم:
- Current → جاري
- 1-30 Days → 1-30 يوم
- 31-60 Days → 31-60 يوم
- إلخ...

## كيفية الاستخدام

### للمطورين:
1. استخدم `t('delinquencyDashboard.key')` للوصول إلى النصوص المترجمة
2. استخدم `isRTL` لتطبيق تنسيقات مختلفة حسب اتجاه اللغة
3. استخدم دوال التنسيق المحدثة للأرقام والعملات

### للمستخدمين:
- يمكن تبديل اللغة من قائمة اللغات في رأس الصفحة
- ستتغير جميع النصوص والتنسيقات تلقائياً حسب اللغة المختارة
- الأرقام والتواريخ ستظهر بالتنسيق المناسب لكل لغة

## الملفات المحدثة
1. `/src/pages/DelinquencyExecutiveDashboard.tsx`
2. `/public/locales/ar/translation.json`
3. `/public/locales/en/translation.json`

## ملاحظات
- تم الحفاظ على التعليقات العربية في الكود لأنها للمطورين فقط
- جميع النصوص المرئية للمستخدم أصبحت قابلة للترجمة
- يتم حفظ اللغة المختارة في `localStorage` وتطبق على جميع الصفحات