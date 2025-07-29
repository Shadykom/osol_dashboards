import React from 'react';
import { useTranslation } from 'react-i18next';

const TestModernLayout = () => {
  const { t } = useTranslation();
  
  return (
    <div className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Modern Layout Test</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300">
        If you can see the modern sidebar on the left (or right in RTL mode), 
        then the modern layout is working correctly!
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Features to check:</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Sidebar is visible with organized menu items</li>
          <li>Menu groups can be expanded/collapsed</li>
          <li>Active page is highlighted in the sidebar</li>
          <li>Language switcher works (English/Arabic)</li>
          <li>Mobile responsive (try resizing the window)</li>
          <li>RTL layout when Arabic is selected</li>
        </ul>
      </div>
      <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Debug Info:</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Current path: {window.location.pathname}
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          If this page shows content but others don't, there might be an issue with those page components.
        </p>
      </div>
    </div>
  );
};

export default TestModernLayout;