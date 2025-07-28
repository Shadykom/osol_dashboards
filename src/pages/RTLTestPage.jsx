import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft,
  User,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

export function RTLTestPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: ''
  });

  const handleLanguageToggle = () => {
    changeLanguage(isRTL ? 'en' : 'ar');
  };

  return (
    <div className="space-y-6">
      {/* Language Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Language & Direction Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Language: {i18n.language}</p>
              <p className="text-sm text-muted-foreground">Direction: {isRTL ? 'RTL' : 'LTR'}</p>
            </div>
            <Button onClick={handleLanguageToggle}>
              Switch to {isRTL ? 'English' : 'العربية'}
            </Button>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="mb-2">HTML dir: {document.documentElement.dir}</p>
            <p className="mb-2">Body dir: {document.body.dir}</p>
            <p>Has RTL class: {document.documentElement.classList.contains('rtl') ? 'Yes' : 'No'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Layout Test */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Direction Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Flex Row Test */}
            <div className="p-4 border rounded">
              <p className="mb-2 font-semibold">Flex Row (should reverse in RTL):</p>
              <div className="flex gap-4">
                <div className="p-4 bg-blue-100 rounded">First</div>
                <div className="p-4 bg-green-100 rounded">Second</div>
                <div className="p-4 bg-yellow-100 rounded">Third</div>
              </div>
            </div>

            {/* Icons Test */}
            <div className="p-4 border rounded">
              <p className="mb-2 font-semibold">Directional Icons:</p>
              <div className="flex gap-4">
                <Button variant="outline" size="icon">
                  {isRTL ? <ChevronLeft /> : <ChevronRight />}
                </Button>
                <Button variant="outline" size="icon">
                  {isRTL ? <ArrowLeft /> : <ArrowRight />}
                </Button>
              </div>
            </div>

            {/* Text Alignment */}
            <div className="p-4 border rounded">
              <p className="mb-2 font-semibold">Text Alignment:</p>
              <p>This paragraph should align to the {isRTL ? 'right' : 'left'}.</p>
              <p className="text-center">This text should be centered.</p>
              <p className={isRTL ? 'text-left' : 'text-right'}>This text should be on the opposite side.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Test */}
      <Card>
        <CardHeader>
          <CardTitle>Form Layout Test</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name
                </Label>
                <Input 
                  id="name" 
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input 
                  id="phone" 
                  placeholder="Enter your phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </Label>
                <Input 
                  id="date" 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="flex-1">Submit</Button>
              <Button type="button" variant="outline" className="flex-1">Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Spacing Test */}
      <Card>
        <CardHeader>
          <CardTitle>Spacing & Margins Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded">
              <p className="mb-2 font-semibold">Margin Start/End:</p>
              <div className="flex items-center">
                <div className="ml-auto p-2 bg-blue-100 rounded">ML Auto</div>
              </div>
              <div className="flex items-center mt-2">
                <div className="mr-auto p-2 bg-green-100 rounded">MR Auto</div>
              </div>
            </div>
            <div className="p-4 border rounded">
              <p className="mb-2 font-semibold">Padding Test:</p>
              <div className="pl-8 py-2 bg-gray-100 rounded mb-2">Padding Left 8</div>
              <div className="pr-8 py-2 bg-gray-100 rounded">Padding Right 8</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RTLTestPage;