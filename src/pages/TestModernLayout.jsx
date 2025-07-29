import React from 'react';
import { useTranslation } from 'react-i18next';

const TestModernLayout = () => {
  const { t } = useTranslation();
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Modern Layout Test</h1>
      <p className="text-lg">
        If you can see the modern sidebar on the left (or right in RTL mode), 
        then the modern layout is working correctly!
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Features to check:</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Sidebar is visible with organized menu items</li>
          <li>Menu groups can be expanded/collapsed</li>
          <li>Active page is highlighted in the sidebar</li>
          <li>Language switcher works (English/Arabic)</li>
          <li>Mobile responsive (try resizing the window)</li>
          <li>RTL layout when Arabic is selected</li>
        </ul>
      </div>
    </div>
  );
};

export default TestModernLayout;