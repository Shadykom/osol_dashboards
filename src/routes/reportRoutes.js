// src/routes/reportRoutes.js
// Add these routes to your main router configuration

import { lazy } from 'react';

// Lazy load the report components for better performance
const BranchReportPage = lazy(() => import('@/pages/collection/BranchReport'));
const ProductReportPage = lazy(() => import('@/pages/collection/ProductReport'));

export const reportRoutes = [
  {
    path: '/collection/branch-report',
    element: <BranchReportPage />,
    meta: {
      title: 'تقرير مستوى الفرع',
      requiresAuth: true,
      permissions: ['collection.reports.branch']
    }
  },
  {
    path: '/collection/product-report',
    element: <ProductReportPage />,
    meta: {
      title: 'تقرير مستوى المنتج',
      requiresAuth: true,
      permissions: ['collection.reports.product']
    }
  }
];

// Update your sidebar navigation to include these new reports
export const reportNavigationItems = [
  {
    title: 'التقارير الشاملة',
    icon: 'FileText',
    items: [
      {
        title: 'تقرير مستوى الفرع',
        href: '/collection/branch-report',
        icon: 'Building',
        badge: 'جديد',
        badgeVariant: 'default',
        description: 'تحليل شامل لأداء التحصيل على مستوى الفروع'
      },
      {
        title: 'تقرير مستوى المنتج',
        href: '/collection/product-report',
        icon: 'Package',
        badge: 'جديد',
        badgeVariant: 'default',
        description: 'تحليل أداء المنتجات التمويلية المختلفة'
      }
    ]
  }
];