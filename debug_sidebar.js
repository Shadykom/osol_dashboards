// سكريبت تشخيص القائمة الجانبية
// يمكن تشغيله في console المتصفح

console.log("=== تشخيص القائمة الجانبية ===");

// 1. التحقق من وجود الترجمات
const checkTranslations = () => {
  try {
    const i18n = window.i18n || window.$nuxt?.$i18n;
    if (i18n) {
      console.log("✓ نظام الترجمة موجود");
      console.log("اللغة الحالية:", i18n.language);
      console.log("ترجمة delinquencyExecutive:", i18n.t('navigation.delinquencyExecutive'));
    } else {
      console.error("✗ لم يتم العثور على نظام الترجمة");
    }
  } catch (e) {
    console.error("خطأ في التحقق من الترجمات:", e);
  }
};

// 2. التحقق من المسارات
const checkRoutes = () => {
  console.log("\n=== المسارات المسجلة ===");
  const links = document.querySelectorAll('a[href*="/collection"]');
  links.forEach(link => {
    console.log(`- ${link.textContent.trim()}: ${link.href}`);
  });
};

// 3. البحث عن العنصر في DOM
const findDelinquencyLink = () => {
  console.log("\n=== البحث عن رابط المتأخرات ===");
  
  // البحث بالنص العربي
  const arabicText = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent.includes('لوحة المتأخرات التنفيذية')
  );
  
  if (arabicText) {
    console.log("✓ تم العثور على النص العربي:", arabicText);
  } else {
    console.log("✗ لم يتم العثور على النص العربي");
  }
  
  // البحث بالنص الإنجليزي
  const englishText = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent.includes('Executive Delinquency Dashboard')
  );
  
  if (englishText) {
    console.log("✓ تم العثور على النص الإنجليزي:", englishText);
  } else {
    console.log("✗ لم يتم العثور على النص الإنجليزي");
  }
  
  // البحث بالرابط
  const delinquencyLink = document.querySelector('a[href*="delinquency-executive"]');
  if (delinquencyLink) {
    console.log("✓ تم العثور على الرابط:", delinquencyLink);
  } else {
    console.log("✗ لم يتم العثور على الرابط");
  }
};

// 4. التحقق من حالة القائمة الجانبية
const checkSidebarState = () => {
  console.log("\n=== حالة القائمة الجانبية ===");
  
  // التحقق من وجود قسم التحصيل
  const collectionSection = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent.includes('لوحات تحكم التحصيل') || 
    el.textContent.includes('Collection Dashboards')
  );
  
  if (collectionSection) {
    console.log("✓ قسم التحصيل موجود");
    
    // التحقق من حالة القسم (مفتوح/مغلق)
    const parent = collectionSection.closest('[role="button"]') || collectionSection.parentElement;
    if (parent) {
      console.log("حالة القسم:", parent.getAttribute('aria-expanded') === 'true' ? 'مفتوح' : 'مغلق');
      
      // محاولة فتح القسم
      if (parent.getAttribute('aria-expanded') === 'false') {
        console.log("محاولة فتح القسم...");
        parent.click();
        setTimeout(() => {
          findDelinquencyLink();
        }, 500);
      }
    }
  } else {
    console.log("✗ قسم التحصيل غير موجود");
  }
};

// تشغيل جميع الفحوصات
checkTranslations();
checkRoutes();
findDelinquencyLink();
checkSidebarState();

console.log("\n=== اقتراحات ===");
console.log("1. تأكد من حفظ جميع الملفات");
console.log("2. أعد تشغيل خادم التطوير (npm run dev)");
console.log("3. امسح ذاكرة التخزين المؤقت (Ctrl+Shift+R)");
console.log("4. تحقق من console للأخطاء");
console.log("5. جرب الوصول المباشر: /collection/delinquency-executive");