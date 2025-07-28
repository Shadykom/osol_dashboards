import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, Settings, Download } from 'lucide-react';

export function RTLTestVerification() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">RTL Test Verification - اختبار التحقق من RTL</h1>
      
      {/* Test 1: Basic Text Alignment */}
      <Card>
        <CardHeader>
          <CardTitle>1. Text Alignment Test - اختبار محاذاة النص</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-left mb-2">This text should be right-aligned in RTL - هذا النص يجب أن يكون محاذاة لليمين</p>
          <p className="text-right mb-2">This text should be left-aligned in RTL - هذا النص يجب أن يكون محاذاة لليسار</p>
          <p className="text-center">This text should be centered - هذا النص يجب أن يكون في الوسط</p>
        </CardContent>
      </Card>

      {/* Test 2: Flex Direction */}
      <Card>
        <CardHeader>
          <CardTitle>2. Flex Direction Test - اختبار اتجاه Flex</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-gray-100 rounded mb-4">
            <div className="bg-blue-500 text-white p-2 rounded">First - الأول</div>
            <div className="bg-green-500 text-white p-2 rounded">Second - الثاني</div>
            <div className="bg-red-500 text-white p-2 rounded">Third - الثالث</div>
          </div>
          <p className="text-sm text-gray-600">In RTL, the order should be: Third, Second, First (from right to left)</p>
        </CardContent>
      </Card>

      {/* Test 3: Margins and Paddings */}
      <Card>
        <CardHeader>
          <CardTitle>3. Margins & Paddings Test - اختبار الهوامش والحشوات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-2 mb-2">
            <div className="bg-blue-500 text-white p-2 ml-4">ML-4: Should have margin on right in RTL</div>
          </div>
          <div className="bg-gray-100 p-2 mb-2">
            <div className="bg-green-500 text-white p-2 mr-4">MR-4: Should have margin on left in RTL</div>
          </div>
          <div className="bg-gray-100 p-2 mb-2">
            <div className="bg-red-500 text-white pl-4">PL-4: Should have padding on right in RTL</div>
          </div>
          <div className="bg-gray-100 p-2">
            <div className="bg-purple-500 text-white pr-4">PR-4: Should have padding on left in RTL</div>
          </div>
        </CardContent>
      </Card>

      {/* Test 4: Icons */}
      <Card>
        <CardHeader>
          <CardTitle>4. Icon Direction Test - اختبار اتجاه الأيقونات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ChevronRight className="text-blue-500" />
              <span>ChevronRight - Should flip in RTL</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronLeft className="text-blue-500" />
              <span>ChevronLeft - Should flip in RTL</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="text-green-500" />
              <span>ArrowRight - Should flip in RTL</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowLeft className="text-green-500" />
              <span>ArrowLeft - Should flip in RTL</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="text-gray-500" />
              <span>Settings - Should NOT flip in RTL</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="text-gray-500" />
              <span>Download - Should NOT flip in RTL</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test 5: Borders */}
      <Card>
        <CardHeader>
          <CardTitle>5. Border Test - اختبار الحدود</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="border-l-4 border-l-blue-500 pl-4 py-2 bg-gray-50">
              Border-left-4: Should appear on right in RTL
            </div>
            <div className="border-r-4 border-r-green-500 pr-4 py-2 bg-gray-50">
              Border-right-4: Should appear on left in RTL
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test 6: Button Groups */}
      <Card>
        <CardHeader>
          <CardTitle>6. Button Group Test - اختبار مجموعة الأزرار</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline">First Button</Button>
            <Button variant="outline">Second Button</Button>
            <Button variant="outline">Third Button</Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Buttons should appear in reverse order in RTL</p>
        </CardContent>
      </Card>

      {/* Test 7: Layout Structure */}
      <Card>
        <CardHeader>
          <CardTitle>7. Layout Structure Test - اختبار هيكل التخطيط</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 border rounded overflow-hidden">
            <div className="w-1/4 bg-blue-100 p-4 border-r">
              <p className="font-semibold">Sidebar</p>
              <p className="text-sm">Should be on right in RTL</p>
            </div>
            <div className="flex-1 bg-gray-50 p-4">
              <p className="font-semibold">Main Content</p>
              <p className="text-sm">Should be on left in RTL</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test 8: Forms */}
      <Card>
        <CardHeader>
          <CardTitle>8. Form Input Test - اختبار إدخال النموذج</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Text input - should be right-aligned in RTL"
              className="w-full p-2 border rounded"
            />
            <textarea 
              placeholder="Textarea - should be right-aligned in RTL"
              className="w-full p-2 border rounded"
              rows="3"
            />
            <select className="w-full p-2 border rounded">
              <option>Select option - should be right-aligned in RTL</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Test 9: Table */}
      <Card>
        <CardHeader>
          <CardTitle>9. Table Test - اختبار الجدول</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2 border">Column 1</th>
                <th className="p-2 border">Column 2</th>
                <th className="p-2 border">Column 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border">Data 1</td>
                <td className="p-2 border">Data 2</td>
                <td className="p-2 border">Data 3</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm text-gray-600 mt-2">Table should be right-aligned with columns reversed in RTL</p>
        </CardContent>
      </Card>

      {/* Test 10: Space Utilities */}
      <Card>
        <CardHeader>
          <CardTitle>10. Space Utilities Test - اختبار أدوات المسافة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 bg-gray-100 p-4 rounded">
            <div className="bg-blue-500 text-white p-2 rounded">Item 1</div>
            <div className="bg-green-500 text-white p-2 rounded">Item 2</div>
            <div className="bg-red-500 text-white p-2 rounded">Item 3</div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Space between items should be maintained but items reversed in RTL</p>
        </CardContent>
      </Card>
    </div>
  );
}