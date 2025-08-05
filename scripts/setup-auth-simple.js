const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ptzwfhyqbcwrqtbxqvqn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0endmaHlxYmN3cnF0YnhxdnFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTMwODM1MiwiZXhwIjoyMDUwODg0MzUyfQ.Ym9HsZvCKfT3xN_0KoQqBXy2OQNgzYJr6g-jLlQRgBY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAuthTables() {
  console.log('Setting up authentication tables...');

  try {
    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          avatar_url TEXT,
          phone_number VARCHAR(20),
          department VARCHAR(100),
          position VARCHAR(100),
          employee_id VARCHAR(50) UNIQUE,
          is_active BOOLEAN DEFAULT true,
          is_verified BOOLEAN DEFAULT false,
          last_login TIMESTAMP WITH TIME ZONE,
          failed_login_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by UUID,
          updated_by UUID
        );
      `
    });

    if (usersError) {
      console.log('Creating users table directly...');
      // Try direct creation if RPC doesn't work
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.error('Users table creation failed. You may need to create it manually.');
      }
    }

    // Create roles table
    const { error: rolesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(50) UNIQUE NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          description TEXT,
          is_system_role BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    // Create permissions table
    const { error: permissionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.permissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          resource VARCHAR(100) NOT NULL,
          action VARCHAR(50) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(resource, action)
        );
      `
    });

    // Create user_roles table
    const { error: userRolesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          role_id UUID NOT NULL,
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          assigned_by UUID,
          expires_at TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN DEFAULT true,
          UNIQUE(user_id, role_id)
        );
      `
    });

    console.log('Tables created successfully!');

    // Insert default roles
    const defaultRoles = [
      { name: 'super_admin', display_name: 'Super Admin', description: 'Full system access', is_system_role: true },
      { name: 'admin', display_name: 'Admin', description: 'Administrative access', is_system_role: true },
      { name: 'manager', display_name: 'Manager', description: 'Manager access', is_system_role: true },
      { name: 'supervisor', display_name: 'Supervisor', description: 'Supervisor access', is_system_role: true },
      { name: 'officer', display_name: 'Officer', description: 'Officer access', is_system_role: true },
      { name: 'viewer', display_name: 'Viewer', description: 'Read-only access', is_system_role: true }
    ];

    for (const role of defaultRoles) {
      const { error } = await supabase
        .from('roles')
        .upsert(role, { onConflict: 'name' });
      
      if (error) {
        console.error(`Error creating role ${role.name}:`, error);
      }
    }

    console.log('Default roles created!');

    // Create sample users
    const sampleUsers = [
      {
        email: 'admin@osol.sa',
        password: 'Password123!',
        full_name: 'Admin User',
        department: 'IT',
        position: 'System Administrator',
        role: 'admin'
      },
      {
        email: 'manager@osol.sa',
        password: 'Password123!',
        full_name: 'Manager User',
        department: 'Operations',
        position: 'Operations Manager',
        role: 'manager'
      },
      {
        email: 'officer1@osol.sa',
        password: 'Password123!',
        full_name: 'Field Officer 1',
        department: 'Collections',
        position: 'Collection Officer',
        role: 'officer'
      }
    ];

    for (const userData of sampleUsers) {
      const { password, role, ...userInfo } = userData;
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const { data: user, error: userError } = await supabase
        .from('users')
        .upsert({
          ...userInfo,
          password_hash: passwordHash,
          is_active: true,
          is_verified: true
        }, { onConflict: 'email' })
        .select()
        .single();

      if (userError) {
        console.error(`Error creating user ${userData.email}:`, userError);
        continue;
      }

      // Get role
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role)
        .single();

      if (roleData && user) {
        // Assign role
        await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role_id: roleData.id,
            is_active: true
          }, { onConflict: 'user_id,role_id' });
      }
    }

    console.log('Sample users created!');
    console.log('\nYou can now login with:');
    console.log('Email: admin@osol.sa, Password: Password123!');
    console.log('Email: manager@osol.sa, Password: Password123!');
    console.log('Email: officer1@osol.sa, Password: Password123!');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Run setup
setupAuthTables();