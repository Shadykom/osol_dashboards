import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';

export function RTLDebug() {
  const { i18n } = useTranslation();
  const isRTL = useRTL();
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      left: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>Language: {i18n.language}</div>
      <div>RTL: {isRTL ? 'Yes' : 'No'}</div>
      <div>HTML dir: {document.documentElement.dir || 'not set'}</div>
      <div>HTML lang: {document.documentElement.lang || 'not set'}</div>
    </div>
  );
}