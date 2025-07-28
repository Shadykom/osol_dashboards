import React from 'react';
import { useTranslation } from 'react-i18next';

export function RTLDebug() {
  const { i18n } = useTranslation();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const debugInfo = {
    'HTML dir': document.documentElement.dir,
    'HTML lang': document.documentElement.lang,
    'HTML class': document.documentElement.className,
    'Body dir': document.body.dir,
    'Body class': document.body.className,
    'i18n language': i18n.language,
    'localStorage lang': localStorage.getItem('i18nextLng'),
    'Has RTL class (html)': document.documentElement.classList.contains('rtl'),
    'Has RTL class (body)': document.body.classList.contains('rtl'),
    'Root element dir': document.getElementById('root')?.getAttribute('dir'),
  };
  
  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="font-bold mb-2">RTL Debug Info</div>
      {Object.entries(debugInfo).map(([key, value]) => (
        <div key={key} className="flex justify-between gap-4">
          <span className="text-gray-400">{key}:</span>
          <span className={value === 'rtl' || value === 'ar' || value === true ? 'text-green-400' : 'text-yellow-400'}>
            {String(value || 'not set')}
          </span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-gray-600">
        <button 
          onClick={() => {
            localStorage.removeItem('i18nextLng');
            window.location.reload();
          }}
          className="text-red-400 hover:text-red-300"
        >
          Clear Language & Reload
        </button>
      </div>
    </div>
  );
}