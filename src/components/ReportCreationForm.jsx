import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import reportService from '@/services/reportService';

const ReportCreationForm = ({ onReportGenerated }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('');
  const [periodType, setPeriodType] = useState('');
  const [selectedContents, setSelectedContents] = useState({
    executiveSummary: true,
    performanceIndicators: true,
    portfolioAnalysis: true,
    riskAnalysis: false,
    customerDistribution: false,
    collectionTrends: true,
    channelAnalysis: false,
    recommendations: true
  });

  const contentOptions = [
    { id: 'executiveSummary', label: 'ملخص تنفيذي' },
    { id: 'performanceIndicators', label: 'مؤشرات الأداء' },
    { id: 'portfolioAnalysis', label: 'تحليل المحفظة' },
    { id: 'riskAnalysis', label: 'تحليل المخاطر' },
    { id: 'customerDistribution', label: 'توزيع العملاء' },
    { id: 'collectionTrends', label: 'اتجاهات التحصيل' },
    { id: 'channelAnalysis', label: 'تحليل قنوات التواصل' },
    { id: 'recommendations', label: 'التوصيات' }
  ];

  const handleGenerateReport = async () => {
    if (!reportType || !periodType) {
      alert('الرجاء اختيار نوع التقرير والفترة الزمنية');
      return;
    }

    const contents = Object.entries(selectedContents)
      .filter(([_, selected]) => selected)
      .map(([key]) => contentOptions.find(opt => opt.id === key)?.label)
      .filter(Boolean);

    if (contents.length === 0) {
      alert('الرجاء اختيار محتوى واحد على الأقل');
      return;
    }

    try {
      setLoading(true);
      const result = await reportService.generateCustomReport({
        reportType,
        period: periodType,
        contents
      });

      if (result.success) {
        alert('تم إنشاء التقرير بنجاح');
        if (onReportGenerated) {
          onReportGenerated(result.data);
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('فشل إنشاء التقرير');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>إنشاء تقرير مخصص</CardTitle>
        <CardDescription>
          قم بإنشاء تقرير مخصص حسب احتياجاتك
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">تقرير الأداء</SelectItem>
                  <SelectItem value="portfolio">تقرير المحفظة</SelectItem>
                  <SelectItem value="collection">تقرير التحصيل</SelectItem>
                  <SelectItem value="risk">تقرير المخاطر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الفترة الزمنية</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  <SelectItem value="yearly">سنوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>المحتويات</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              {contentOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Switch
                    id={option.id}
                    checked={selectedContents[option.id]}
                    onCheckedChange={(checked) =>
                      setSelectedContents(prev => ({ ...prev, [option.id]: checked }))
                    }
                  />
                  <Label htmlFor={option.id} className="text-sm font-normal cursor-pointer mr-2">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  إنشاء التقرير
                </>
              )}
            </Button>
            <Button variant="outline" disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة تعيين
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCreationForm;