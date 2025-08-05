import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { RTLWrapper, RTLFlex, RTLGrid, RTLText, useRTLClasses } from '@/components/ui/rtl-wrapper';
import { FiArrowRight, FiUser, FiSettings, FiHome } from 'react-icons/fi';

const TestLanguageSwitch = () => {
  const { t, i18n } = useTranslation();
  const { isRTL, textAlign, flexRow, spaceX, marginStart, marginEnd } = useRTLClasses();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-4 ${textAlign}`}>
          {t('common.language')} & RTL/LTR Test
        </h1>
        
        <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <p className={`text-gray-600 ${textAlign}`}>
            Current Language: <strong>{i18n.language === 'ar' ? 'العربية' : 'English'}</strong>
          </p>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Test Cards Grid */}
      <RTLGrid cols={1} mdCols={2} lgCols={3} gap={4}>
        {/* Navigation Test */}
        <Card>
          <CardHeader>
            <CardTitle className={textAlign}>{t('navigation.dashboard')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex flex-col gap-3`}>
              <Button variant="outline" className={`w-full justify-start ${flexRow}`}>
                <FiHome className={`h-4 w-4 ${marginEnd(2)}`} />
                {t('navigation.home')}
              </Button>
              <Button variant="outline" className={`w-full justify-start ${flexRow}`}>
                <FiUser className={`h-4 w-4 ${marginEnd(2)}`} />
                {t('navigation.customers')}
              </Button>
              <Button variant="outline" className={`w-full justify-start ${flexRow}`}>
                <FiSettings className={`h-4 w-4 ${marginEnd(2)}`} />
                {t('common.settings')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Numbers Test */}
        <Card>
          <CardHeader>
            <CardTitle className={textAlign}>{t('common.statistics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex justify-between items-center ${flexRow}`}>
                <span className="text-gray-600">{t('common.total')}</span>
                <span className="font-bold text-xl">1,234,567</span>
              </div>
              <div className={`flex justify-between items-center ${flexRow}`}>
                <span className="text-gray-600">{t('common.currency')}</span>
                <span className="font-bold text-xl">SAR 99,999.99</span>
              </div>
              <div className={`flex justify-between items-center ${flexRow}`}>
                <span className="text-gray-600">{t('common.percentage')}</span>
                <span className="font-bold text-xl">85.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements Test */}
        <Card>
          <CardHeader>
            <CardTitle className={textAlign}>{t('common.filter')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder={t('common.searchPlaceholder')}
                className={`w-full px-3 py-2 border rounded-md ${textAlign}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <select className={`w-full px-3 py-2 border rounded-md ${textAlign}`}>
                <option>{t('common.all')}</option>
                <option>{t('common.active')}</option>
                <option>{t('common.inactive')}</option>
              </select>
              <Button className={`w-full ${flexRow}`}>
                <FiArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''} ${marginEnd(2)}`} />
                {t('common.submit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </RTLGrid>

      {/* Mobile Responsive Test */}
      <div className="mt-8">
        <h2 className={`text-xl font-bold mb-4 ${textAlign}`}>
          Mobile Responsive Test
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((num) => (
            <Card key={num} className="p-4">
              <p className={`font-medium ${textAlign}`}>
                {t('common.card')} {num}
              </p>
              <p className={`text-sm text-gray-600 mt-2 ${textAlign}`}>
                {i18n.language === 'ar' ? 
                  'هذا نص تجريبي لاختبار التوافق مع الأجهزة المحمولة' : 
                  'This is test text for mobile responsiveness'
                }
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Direction Test */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className={textAlign}>Direction Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`p-4 bg-gray-100 rounded-md ${textAlign}`}>
              <p>Text alignment: {isRTL ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}</p>
            </div>
            <RTLFlex className="gap-4 p-4 bg-blue-50 rounded-md">
              <div className="bg-blue-200 p-2 rounded">Start</div>
              <div className="bg-blue-300 p-2 rounded">Middle</div>
              <div className="bg-blue-400 p-2 rounded">End</div>
            </RTLFlex>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestLanguageSwitch;