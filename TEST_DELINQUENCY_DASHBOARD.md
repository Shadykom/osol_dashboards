# اختبار لوحة بيانات المتأخرات التنفيذية

## خطوات الاختبار

### 1. تحديث التطبيق
```bash
# إعادة تشغيل خادم التطوير
npm run dev
# أو
pnpm dev
```

### 2. التحقق من القائمة الجانبية
1. افتح التطبيق في المتصفح
2. انتقل إلى القائمة الجانبية
3. ابحث عن "لوحات تحكم التحصيل" أو "Collection Dashboards"
4. يجب أن تجد "لوحة المتأخرات التنفيذية" أو "Executive Delinquency Dashboard" مع شارة "New"

### 3. الوصول المباشر
يمكنك الوصول مباشرة عبر الرابط:
- http://localhost:5173/collection/delinquency-executive

### 4. التحقق من البيانات
إذا لم تظهر البيانات، تأكد من:
1. تنفيذ سكريبت إنشاء الجداول
2. تنفيذ سكريبت إدراج البيانات
3. التحقق من اتصال قاعدة البيانات

## حل المشاكل المحتملة

### المشكلة: لا تظهر في القائمة الجانبية
**الحل:**
1. تأكد من حفظ جميع الملفات
2. أعد تشغيل خادم التطوير
3. امسح ذاكرة التخزين المؤقت للمتصفح (Ctrl+Shift+R)

### المشكلة: خطأ 404 عند الوصول للصفحة
**الحل:**
1. تحقق من أن الملف موجود: `src/pages/DelinquencyExecutiveDashboard.tsx`
2. تحقق من أن المسار مضاف في `src/App.jsx`

### المشكلة: لا تظهر البيانات
**الحل:**
```sql
-- تحقق من وجود البيانات
SELECT COUNT(*) FROM kastle_banking.delinquencies;
SELECT COUNT(*) FROM kastle_banking.portfolio_summary;
SELECT * FROM kastle_banking.executive_delinquency_summary LIMIT 1;
```

## الملفات المحدثة
1. ✅ `src/components/layout/Sidebar.jsx` - تم تحديث الروابط
2. ✅ `src/App.jsx` - تم إضافة المسار
3. ✅ `public/locales/ar/translation.json` - تمت إضافة الترجمة العربية
4. ✅ `public/locales/en/translation.json` - تمت إضافة الترجمة الإنجليزية
5. ✅ `src/pages/DelinquencyExecutiveDashboard.tsx` - الصفحة الرئيسية

## النتيجة المتوقعة
يجب أن ترى:
- عنصر جديد في القائمة الجانبية: "لوحة المتأخرات التنفيذية" مع شارة "New"
- أيقونة TrendingUp بجانب العنصر
- عند النقر، يتم التوجيه إلى لوحة البيانات الجديدة