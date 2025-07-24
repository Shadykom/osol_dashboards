# Osol Dashboard Technical Documentation

## Architecture Overview

### System Architecture
The Osol Dashboard follows a modern web application architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer     │    │   Database      │
│   React/Vite    │◄──►│   Supabase      │◄──►│   PostgreSQL    │
│                 │    │   REST/GraphQL  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **TypeScript**: Type-safe JavaScript (future enhancement)
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI component library

#### Backend & Database
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Relational database with advanced features
- **Row Level Security**: Database-level security policies
- **Real-time Subscriptions**: Live data updates

#### Libraries & Tools
- **React Router**: Client-side routing
- **Recharts**: Data visualization library
- **React Grid Layout**: Drag-and-drop dashboard layouts
- **Lucide React**: Icon library
- **date-fns**: Date manipulation utilities

## Database Schema

### Core Banking Tables

#### kastle_banking_customers
```sql
CREATE TABLE kastle_banking_customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    national_id VARCHAR(50) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    customer_type VARCHAR(50) DEFAULT 'individual',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### kastle_banking_accounts
```sql
CREATE TABLE kastle_banking_accounts (
    account_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES kastle_banking_customers(customer_id),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'SAR',
    status VARCHAR(20) DEFAULT 'active',
    opened_date DATE DEFAULT CURRENT_DATE,
    closed_date DATE,
    branch_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### kastle_banking_transactions
```sql
CREATE TABLE kastle_banking_transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES kastle_banking_accounts(account_id),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    description TEXT,
    reference_number VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_date TIMESTAMP,
    channel VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes and Performance
```sql
-- Performance indexes
CREATE INDEX idx_customers_email ON kastle_banking_customers(email);
CREATE INDEX idx_accounts_customer_id ON kastle_banking_accounts(customer_id);
CREATE INDEX idx_transactions_account_id ON kastle_banking_transactions(account_id);
CREATE INDEX idx_transactions_date ON kastle_banking_transactions(transaction_date);
CREATE INDEX idx_transactions_status ON kastle_banking_transactions(status);
```

## API Documentation

### Supabase Client Configuration
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### Service Layer Architecture

#### Customer Service
```javascript
// src/services/customerService.js
import { supabase } from '../lib/supabase'

export const customerService = {
  // Get all customers with pagination
  async getCustomers(page = 1, limit = 50, filters = {}) {
    let query = supabase
      .from('kastle_banking_customers')
      .select('*')
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    const { data, error, count } = await query
    if (error) throw error
    return { data, count }
  },

  // Get customer by ID with related data
  async getCustomerById(customerId) {
    const { data, error } = await supabase
      .from('kastle_banking_customers')
      .select(`
        *,
        kastle_banking_accounts (
          *,
          kastle_banking_transactions (
            *
          )
        )
      `)
      .eq('customer_id', customerId)
      .single()

    if (error) throw error
    return data
  },

  // Create new customer
  async createCustomer(customerData) {
    const { data, error } = await supabase
      .from('kastle_banking_customers')
      .insert([customerData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update customer
  async updateCustomer(customerId, updates) {
    const { data, error } = await supabase
      .from('kastle_banking_customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('customer_id', customerId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
```

#### Dashboard Service
```javascript
// src/services/dashboardService.js
import { supabase } from '../lib/supabase'

export const dashboardService = {
  // Get key performance indicators
  async getKPIs() {
    const [
      totalCustomers,
      totalAccounts,
      totalTransactions,
      totalBalance
    ] = await Promise.all([
      supabase.from('kastle_banking_customers').select('*', { count: 'exact', head: true }),
      supabase.from('kastle_banking_accounts').select('*', { count: 'exact', head: true }),
      supabase.from('kastle_banking_transactions').select('*', { count: 'exact', head: true }),
      supabase.from('kastle_banking_accounts').select('balance').then(({ data }) => 
        data?.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0) || 0
      )
    ])

    return {
      totalCustomers: totalCustomers.count || 0,
      totalAccounts: totalAccounts.count || 0,
      totalTransactions: totalTransactions.count || 0,
      totalBalance: totalBalance
    }
  },

  // Get transaction trends
  async getTransactionTrends(days = 30) {
    const { data, error } = await supabase
      .from('kastle_banking_transactions')
      .select('transaction_date, amount, transaction_type')
      .gte('transaction_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('transaction_date', { ascending: true })

    if (error) throw error
    return data
  },

  // Get customer growth
  async getCustomerGrowth(months = 12) {
    const { data, error } = await supabase
      .from('kastle_banking_customers')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  }
}
```

## Component Architecture

### Layout Components

#### Header Component
```javascript
// src/components/layout/Header.jsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Bell, User } from 'lucide-react'

export function Header({ onMenuClick }) {
  const [searchQuery, setSearchQuery] = useState('')
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <img src="/src/assets/osol-logo.png" alt="Osol Logo" className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold osol-text-secondary">Osol Dashboard</h1>
            <p className="text-xs text-muted-foreground arabic-text">أصول الحديثة للتمويل</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers, accounts, transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-full"
            />
          </div>
        </div>
        
        {/* User Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
```

### Widget System

#### Base Widget Component
```javascript
// src/components/widgets/BaseWidget.jsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, RefreshCw } from 'lucide-react'

export function BaseWidget({ 
  title, 
  description, 
  children, 
  onRefresh, 
  onConfigure,
  isLoading = false 
}) {
  return (
    <Card className="osol-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          {onConfigure && (
            <Button variant="ghost" size="sm" onClick={onConfigure}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="loading-skeleton h-24 w-full rounded" />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
```

#### KPI Widget Component
```javascript
// src/components/widgets/KPIWidget.jsx
import { BaseWidget } from './BaseWidget'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function KPIWidget({ 
  title, 
  value, 
  trend, 
  trendValue, 
  format = 'number',
  onRefresh 
}) {
  const formatValue = (val) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('ar-SA', {
          style: 'currency',
          currency: 'SAR'
        }).format(val)
      case 'percentage':
        return `${val}%`
      default:
        return new Intl.NumberFormat('ar-SA').format(val)
    }
  }

  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown
  const trendColor = trend === 'up' ? 'kpi-trend-up' : 'kpi-trend-down'

  return (
    <BaseWidget title={title} onRefresh={onRefresh}>
      <div className="space-y-2">
        <div className="kpi-value">{formatValue(value)}</div>
        {trend && (
          <div className={`flex items-center text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4 mr-1" />
            <span>{trendValue}% from last period</span>
          </div>
        )}
      </div>
    </BaseWidget>
  )
}
```

## State Management

### Custom Hooks

#### useDashboard Hook
```javascript
// src/hooks/useDashboard.js
import { useState, useEffect } from 'react'
import { dashboardService } from '../services/dashboardService'

export function useDashboard() {
  const [kpis, setKpis] = useState(null)
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [kpiData, trendData] = await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getTransactionTrends()
      ])
      
      setKpis(kpiData)
      setTrends(trendData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    kpis,
    trends,
    loading,
    error,
    refresh: fetchDashboardData
  }
}
```

## Styling and Theming

### CSS Custom Properties
```css
/* src/App.css */
:root {
  /* Osol Brand Colors */
  --osol-primary: #E6B800;
  --osol-primary-dark: #CC9900;
  --osol-secondary: #4A5568;
  --osol-accent: #2D3748;
  --osol-light: #F7FAFC;
  --osol-success: #48BB78;
  --osol-warning: #ED8936;
  --osol-error: #F56565;
}
```

### Component Styling
```css
/* Enhanced KPI Cards */
.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--osol-primary), var(--osol-primary-dark));
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}
```

### RTL Support
```css
/* RTL Support for Arabic */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .sidebar {
  right: 0;
  left: auto;
}

[dir="rtl"] .main-content {
  margin-right: 16rem;
  margin-left: 0;
}

/* Arabic Font Support */
.arabic-text {
  font-family: 'Noto Sans Arabic', 'Amiri', 'Scheherazade', sans-serif;
  font-weight: 400;
  line-height: 1.8;
}
```

## Security Implementation

### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE kastle_banking_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking_transactions ENABLE ROW LEVEL SECURITY;

-- Customer access policy
CREATE POLICY "Users can view own customer data" ON kastle_banking_customers
  FOR SELECT USING (auth.uid()::text = customer_id::text);

-- Account access policy
CREATE POLICY "Users can view own accounts" ON kastle_banking_accounts
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM kastle_banking_customers 
      WHERE auth.uid()::text = customer_id::text
    )
  );
```

### Authentication Flow
```javascript
// Authentication service
import { supabase } from '../lib/supabase'

export const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
```

## Performance Optimization

### Code Splitting
```javascript
// Lazy loading of dashboard components
import { lazy, Suspense } from 'react'

const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'))
const OperationsDashboard = lazy(() => import('./pages/OperationsDashboard'))
const CustomDashboard = lazy(() => import('./pages/CustomDashboard'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
        <Route path="/operations-dashboard" element={<OperationsDashboard />} />
        <Route path="/custom-dashboard" element={<CustomDashboard />} />
      </Routes>
    </Suspense>
  )
}
```

### Data Caching
```javascript
// React Query for data caching
import { useQuery } from '@tanstack/react-query'

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

## Deployment

### Environment Configuration
```bash
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://api.osoulmodern.com
```

### Build Process
```bash
# Install dependencies
pnpm install

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Deploy to hosting platform
pnpm run deploy
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Monitoring and Logging

### Error Tracking
```javascript
// Error boundary component
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('Dashboard Error:', error, errorInfo)
    
    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Performance Monitoring
```javascript
// Performance tracking
export function trackPerformance(metricName, value) {
  // Send to analytics service
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metricName,
      value: Math.round(value)
    })
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Performance: ${metricName} = ${value}ms`)
  }
}
```

## Testing

### Unit Testing
```javascript
// Component test example
import { render, screen } from '@testing-library/react'
import { KPIWidget } from '../components/widgets/KPIWidget'

describe('KPIWidget', () => {
  test('renders KPI value correctly', () => {
    render(
      <KPIWidget 
        title="Total Customers" 
        value={1234} 
        format="number"
      />
    )
    
    expect(screen.getByText('Total Customers')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })
  
  test('displays trend indicator', () => {
    render(
      <KPIWidget 
        title="Revenue" 
        value={50000} 
        trend="up"
        trendValue={15}
        format="currency"
      />
    )
    
    expect(screen.getByText('15% from last period')).toBeInTheDocument()
  })
})
```

### Integration Testing
```javascript
// API integration test
import { customerService } from '../services/customerService'

describe('Customer Service', () => {
  test('fetches customers successfully', async () => {
    const result = await customerService.getCustomers(1, 10)
    
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('count')
    expect(Array.isArray(result.data)).toBe(true)
  })
  
  test('handles search filters', async () => {
    const result = await customerService.getCustomers(1, 10, {
      search: 'john',
      status: 'active'
    })
    
    expect(result.data.every(customer => 
      customer.status === 'active'
    )).toBe(true)
  })
})
```

## Maintenance

### Regular Tasks
- **Database Maintenance**: Regular VACUUM and ANALYZE operations
- **Index Optimization**: Monitor and optimize database indexes
- **Cache Clearing**: Clear application and browser caches
- **Log Rotation**: Manage log file sizes and retention
- **Security Updates**: Keep dependencies updated

### Backup Procedures
- **Database Backups**: Daily automated backups with point-in-time recovery
- **Code Backups**: Version control with Git and remote repositories
- **Configuration Backups**: Environment and configuration file backups
- **Asset Backups**: Static assets and media file backups

### Monitoring Checklist
- [ ] Application uptime and availability
- [ ] Database performance and query times
- [ ] API response times and error rates
- [ ] User authentication and session management
- [ ] Security alerts and intrusion detection
- [ ] Resource usage (CPU, memory, storage)
- [ ] Business metrics and KPI accuracy

---

For technical support or questions, contact the development team at dev@osoulmodern.com

