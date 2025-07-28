import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function RTLTest() {
  const { i18n } = useTranslation();
  
  return (
    <Card className="p-6 m-4">
      <h2 className="text-2xl font-bold mb-4">RTL Test Component</h2>
      <div className="space-y-4">
        <p>Current Language: {i18n.language}</p>
        <p>Document Dir: {document.documentElement.dir || 'not set'}</p>
        <p>Document Lang: {document.documentElement.lang || 'not set'}</p>
        <p>Body Dir: {document.body.dir || 'not set'}</p>
        <p>Has RTL class: {document.documentElement.classList.contains('rtl') ? 'Yes' : 'No'}</p>
        
        <div className="flex gap-4 items-center">
          <span>This text should be RTL in Arabic</span>
          <Button>Test Button</Button>
        </div>
        
        <div className="border-l-4 border-blue-500 pl-4">
          <p>This should have a right border in RTL</p>
        </div>
        
        <div className="flex justify-between">
          <span>Start</span>
          <span>End</span>
        </div>
      </div>
    </Card>
  );
}
