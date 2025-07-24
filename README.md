# Osol Dashboard - أصول الحديثة للتمويل

A comprehensive fintech dashboard system built for Osol company with React/Vite frontend, Supabase database integration, and customizable widgets.

![Osol Logo](./src/assets/osol-logo.png)

## 🌟 Features

### 📊 Dynamic Dashboards
- **Executive Dashboard** - Strategic KPIs, financial performance, and risk management overview
- **Operations Dashboard** - Real-time transaction monitoring and operational metrics
- **Custom Dashboard** - Drag-and-drop widget system for personalized views
- **Customer Analytics** - Customer insights and behavior analysis
- **Financial Reporting** - Comprehensive financial reports and analytics

### 🎨 User Experience
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **RTL Support** - Full Arabic language support with proper text direction
- **Company Branding** - Osol golden yellow theme and professional styling
- **Dark/Light Mode** - Theme switching capability
- **Multi-language** - English and Arabic language support

### 🔧 Technical Features
- **Real-time Data** - Live updates from Supabase database
- **Customizable Widgets** - Drag-and-drop dashboard customization
- **Advanced Charts** - Interactive data visualizations with Recharts
- **Secure Authentication** - User management and role-based access
- **Performance Optimized** - Fast loading and smooth interactions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd osol-dashboard
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   pnpm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
osol-dashboard/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/         # Layout components (Header, Sidebar, Layout)
│   │   ├── widgets/        # Dashboard widgets (KPI, Chart, Base)
│   │   ├── dashboard/      # Dashboard-specific components
│   │   └── ui/            # shadcn/ui components
│   ├── pages/             # Page components
│   │   ├── Dashboard.jsx
│   │   ├── ExecutiveDashboard.jsx
│   │   ├── OperationsDashboard.jsx
│   │   ├── CustomDashboard.jsx
│   │   └── Customers.jsx
│   ├── services/          # API services
│   │   ├── customerService.js
│   │   └── dashboardService.js
│   ├── hooks/             # Custom React hooks
│   │   └── useDashboard.js
│   ├── lib/               # Utility libraries
│   │   └── supabase.js
│   ├── assets/            # Static assets (logos, icons)
│   └── App.css           # Global styles and Osol branding
├── public/               # Public assets
├── docs/                # Documentation
└── osol.sql            # Database schema
```

## 🗄️ Database Schema

The system uses a comprehensive banking database schema with the following key tables:

### Core Banking Tables
- **kastle_banking_customers** - Customer information and profiles
- **kastle_banking_accounts** - Bank accounts and balances
- **kastle_banking_transactions** - Transaction records and history
- **kastle_banking_loans** - Loan applications and management
- **kastle_banking_cards** - Credit/debit card management

### System Tables
- **kastle_banking_branches** - Branch locations and information
- **kastle_banking_employees** - Staff management
- **kastle_banking_audit_logs** - System audit trails
- **kastle_banking_notifications** - User notifications

## 🎨 Design System

### Color Palette
- **Primary**: #E6B800 (Osol Golden Yellow)
- **Primary Dark**: #CC9900
- **Secondary**: #4A5568 (Dark Gray)
- **Accent**: #2D3748 (Darker Gray)
- **Success**: #48BB78 (Green)
- **Warning**: #ED8936 (Orange)
- **Error**: #F56565 (Red)

### Typography
- **Primary Font**: Inter, Segoe UI, sans-serif
- **Arabic Font**: Noto Sans Arabic, Amiri, Scheherazade

### Components
- **Cards**: Rounded corners (12px), subtle shadows, hover effects
- **Buttons**: Golden yellow primary, smooth transitions
- **Charts**: Professional styling with Osol color scheme
- **Icons**: Lucide React icons with consistent sizing

## 📊 Dashboard Features

### Executive Dashboard
- Financial performance KPIs
- Customer growth metrics
- Revenue and profit analysis
- Risk management indicators
- Strategic business insights

### Operations Dashboard
- Real-time transaction monitoring
- System health indicators
- Channel performance metrics
- Operational alerts and notifications
- Daily operational summaries

### Custom Dashboard
- Drag-and-drop widget placement
- Resizable dashboard components
- Personal dashboard configurations
- Widget library with various chart types
- Save and load dashboard layouts

## 🔧 Widget System

### Available Widgets
- **KPI Cards** - Display key metrics with trend indicators
- **Line Charts** - Time-series data visualization
- **Bar Charts** - Comparative data analysis
- **Pie Charts** - Distribution and percentage data
- **Area Charts** - Cumulative data trends
- **Table Widgets** - Tabular data display

### Widget Configuration
- Customizable titles and descriptions
- Data source selection
- Color scheme options
- Refresh intervals
- Export capabilities

## 🌐 API Integration

### Supabase Integration
- Real-time database connections
- Row Level Security (RLS) policies
- Automatic data synchronization
- Optimistic updates for better UX

### Service Layer
```javascript
// Example API usage
import { customerService } from './services/customerService';

// Fetch customers
const customers = await customerService.getCustomers();

// Get dashboard KPIs
const kpis = await dashboardService.getKPIs();
```

## 🔒 Security Features

- **Authentication** - Supabase Auth integration
- **Authorization** - Role-based access control
- **Data Protection** - Encrypted data transmission
- **Audit Logging** - Comprehensive activity tracking
- **Session Management** - Secure session handling

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Collapsible sidebar navigation
- Touch-friendly interface elements
- Optimized chart rendering
- Swipe gestures for navigation

## 🌍 Internationalization

### Supported Languages
- **English** (Default)
- **Arabic** (RTL support)

### RTL Features
- Right-to-left text direction
- Mirrored layout components
- Arabic font optimization
- Cultural date/number formatting

## 🚀 Deployment

### Development
```bash
pnpm run dev
```

### Production Build
```bash
pnpm run build
```

### Preview Production Build
```bash
pnpm run preview
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📈 Performance

### Optimization Features
- **Code Splitting** - Lazy loading of dashboard components
- **Image Optimization** - Compressed and optimized assets
- **Bundle Analysis** - Webpack bundle optimization
- **Caching Strategy** - Efficient data caching
- **Virtual Scrolling** - Large dataset handling

### Performance Metrics
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Time to Interactive** < 3.5s
- **Cumulative Layout Shift** < 0.1

## 🧪 Testing

### Testing Strategy
- **Unit Tests** - Component and utility testing
- **Integration Tests** - API and service testing
- **E2E Tests** - Full user workflow testing
- **Performance Tests** - Load and stress testing

### Running Tests
```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Coverage report
pnpm run test:coverage
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Standards
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **TypeScript** - Type safety (future enhancement)
- **Conventional Commits** - Commit message standards

## 📞 Support

### Documentation
- [User Guide](./docs/user-guide.md)
- [API Documentation](./docs/api-documentation.md)
- [Deployment Guide](./docs/deployment-guide.md)

### Contact
- **Company**: Osol Modern Finance (أصول الحديثة للتمويل)
- **Website**: https://osoulmodern.com
- **Email**: support@osoulmodern.com

## 📄 License

This project is proprietary software developed for Osol Modern Finance. All rights reserved.

---

**Built with ❤️ for Osol Modern Finance**

