# OSOL Authentication and Authorization System

A comprehensive authentication and authorization system for the OSOL debt collection management platform, featuring role-based access control (RBAC), user preferences, and customizable dashboards.

## Features

### 🔐 Authentication & Security
- Secure password hashing using bcrypt
- Session management with JWT tokens
- Account lockout after failed login attempts
- Password reset functionality
- Remember me option

### 👥 Role-Based Access Control (RBAC)
- Hierarchical role system
- Granular permission management
- Dynamic permission checking
- Custom permission assignments
- Role expiration support

### ⚙️ User Preferences
- Theme selection (light/dark)
- Language preferences (Arabic/English)
- Notification settings
- Dashboard customization
- Accessibility options

### 📊 Dashboard Customization
- Multiple dashboard support
- Widget-based layout
- Drag-and-drop customization
- Template system
- Import/export configurations

## Installation

### Prerequisites
- PostgreSQL 12+
- Node.js 16+
- npm or yarn

### Database Setup

1. **Run the setup script:**
   ```bash
   cd scripts
   ./setup_auth_system.sh
   ```

   The script will:
   - Create all necessary tables
   - Set up indexes and constraints
   - Configure Row Level Security (RLS)
   - Insert sample data (optional)

2. **Manual setup (alternative):**
   ```bash
   # Create schema
   psql -U postgres -d your_database -f scripts/auth_schema.sql
   
   # Insert sample data
   psql -U postgres -d your_database -f scripts/auth_sample_data.sql
   ```

### Application Setup

1. **Install dependencies:**
   ```bash
   npm install bcryptjs
   ```

2. **Update environment variables:**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Update routing (in App.jsx):**
   ```jsx
   import Login from './pages/Login';
   import ProtectedRoute from './components/auth/ProtectedRoute';
   
   // Add login route
   <Route path="/login" element={<Login />} />
   
   // Protect routes
   <Route path="/dashboard" element={
     <ProtectedRoute>
       <Dashboard />
     </ProtectedRoute>
   } />
   ```

## Database Schema

### Core Tables

#### `users`
- User account information
- Password hashing
- Account status tracking
- Login attempt monitoring

#### `roles`
- System and custom roles
- Role hierarchy
- Role descriptions

#### `permissions`
- Resource-based permissions
- Action definitions
- Permission descriptions

#### `user_roles`
- User-role assignments
- Assignment tracking
- Expiration support

#### `user_preferences`
- Key-value preference storage
- Category-based organization
- JSON value support

#### `dashboard_templates`
- Pre-built dashboard layouts
- Widget configurations
- Public/private templates

#### `user_dashboards`
- User-specific dashboards
- Custom layouts
- Widget arrangements

## Usage

### Authentication

```jsx
import { useAuth } from './contexts/AuthContext';

function LoginComponent() {
  const { signIn, signOut, user } = useAuth();
  
  const handleLogin = async () => {
    const { data, error } = await signIn({
      email: 'user@example.com',
      password: 'password'
    });
    
    if (error) {
      console.error('Login failed:', error.message);
    }
  };
}
```

### Role-Based Access Control

```jsx
import ProtectedRoute from './components/auth/ProtectedRoute';

// Protect by roles
<ProtectedRoute requiredRoles={['admin', 'manager']}>
  <AdminPanel />
</ProtectedRoute>

// Protect by permissions
<ProtectedRoute 
  requiredPermissions={[
    { resource: 'report', action: 'view_executive' }
  ]}
>
  <ExecutiveReports />
</ProtectedRoute>
```

### User Preferences

```jsx
import useUserPreferences from './hooks/useUserPreferences';

function SettingsPage() {
  const { preferences, savePreference } = useUserPreferences();
  
  const handleThemeChange = async (theme) => {
    await savePreference('theme', theme);
  };
}
```

### Dashboard Customization

```jsx
import useDashboardCustomization from './hooks/useDashboardCustomization';

function DashboardManager() {
  const { 
    dashboards, 
    createDashboard, 
    addWidget 
  } = useDashboardCustomization();
  
  const handleCreateDashboard = async () => {
    const result = await createDashboard({
      name: 'My Custom Dashboard',
      templateId: 'template-id'
    });
  };
}
```

## Default Roles and Permissions

### Roles
- **Super Admin**: Full system access
- **Admin**: Administrative functions
- **Manager**: Team management
- **Supervisor**: Team supervision
- **Officer**: Field operations
- **Specialist**: Advanced features
- **Analyst**: Reporting and analytics
- **Viewer**: Read-only access

### Permission Categories
- **User Management**: Create, read, update, delete users
- **Role Management**: Manage roles and permissions
- **Dashboard**: Create and customize dashboards
- **Reports**: View various report types
- **Collection**: Manage collection cases
- **Analytics**: Access analytics features
- **System**: System administration

## Sample Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@osol.sa | Password123! |
| Manager | manager@osol.sa | Password123! |
| Supervisor | supervisor1@osol.sa | Password123! |
| Officer | officer1@osol.sa | Password123! |
| Analyst | analyst@osol.sa | Password123! |

## Security Best Practices

1. **Password Requirements:**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Regular password rotation

2. **Session Management:**
   - Sessions expire after inactivity
   - Secure token storage
   - HTTPS only in production

3. **Account Security:**
   - Account lockout after 5 failed attempts
   - Email verification for new accounts
   - Two-factor authentication (planned)

## API Reference

### AuthContext Methods

- `signIn({ email, password })`: Authenticate user
- `signUp({ email, password, metadata })`: Create new account
- `signOut()`: End user session
- `updateProfile(updates)`: Update user profile
- `changePassword(currentPassword, newPassword)`: Change password
- `hasRole(roleName)`: Check if user has role
- `hasPermission(resource, action)`: Check permission

### Hooks

- `useAuth()`: Access authentication context
- `useUserPreferences()`: Manage user preferences
- `useDashboardCustomization()`: Manage dashboards

## Troubleshooting

### Common Issues

1. **Login fails with "Invalid credentials"**
   - Verify password is correct
   - Check if account is locked
   - Ensure account is active

2. **Permissions not working**
   - Clear browser cache
   - Check role assignments
   - Verify permission configuration

3. **Dashboard not loading**
   - Check database connection
   - Verify user has dashboard access
   - Review browser console for errors

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests

## License

This system is part of the OSOL platform and follows the same licensing terms.