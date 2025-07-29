# Application Update Guide After Schema Migration

After migrating all your database objects to the `kastle_banking` schema, you need to update your application code. Here's a comprehensive guide:

## 1. Supabase Client Configuration

### JavaScript/TypeScript
```javascript
// Before
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public' // or not specified (defaults to public)
  }
})

// After
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'kastle_banking'
  }
})
```

### Python
```python
# Before
supabase = create_client(url, key)

# After
supabase = create_client(
    url, 
    key,
    options=ClientOptions(
        schema='kastle_banking'
    )
)
```

## 2. Update RPC Function Calls

### Before
```javascript
// Functions were in public schema
const { data, error } = await supabase
  .rpc('calculate_interest', { 
    amount: 1000 
  })
```

### After
```javascript
// Explicitly reference kastle_banking schema
const { data, error } = await supabase
  .rpc('calculate_interest', { 
    amount: 1000 
  }, {
    schema: 'kastle_banking'
  })

// Or if you've set the default schema in client config, just use:
const { data, error } = await supabase
  .rpc('calculate_interest', { 
    amount: 1000 
  })
```

## 3. Update Direct SQL Queries

### Before
```sql
SELECT * FROM customers WHERE status = 'active';
SELECT * FROM public.customers WHERE status = 'active';
```

### After
```sql
SELECT * FROM kastle_banking.customers WHERE status = 'active';
-- Or set search_path first
SET search_path TO kastle_banking;
SELECT * FROM customers WHERE status = 'active';
```

## 4. Update Database Types (TypeScript)

If you're using generated types:

```bash
# Regenerate types with the new schema
supabase gen types typescript --schema=kastle_banking > types/database.types.ts
```

## 5. Update Edge Functions

### Before
```javascript
// In your Edge Function
const { data } = await supabaseClient
  .from('customers')
  .select('*')
```

### After
```javascript
// In your Edge Function
const { data } = await supabaseClient
  .schema('kastle_banking')
  .from('customers')
  .select('*')
```

## 6. Update Supabase Project Settings

1. Go to your Supabase Dashboard
2. Navigate to Settings → API
3. In the "Exposed schemas" section, add `kastle_banking`
4. Save the changes

## 7. Update Environment Variables

If you have schema-specific environment variables:

```bash
# .env
# Before
DB_SCHEMA=public

# After
DB_SCHEMA=kastle_banking
```

## 8. Update Migrations

For new migrations:

```sql
-- Ensure new objects are created in kastle_banking
SET search_path TO kastle_banking;

-- Or explicitly specify schema
CREATE TABLE kastle_banking.new_table (
    id SERIAL PRIMARY KEY,
    ...
);
```

## 9. Testing Checklist

After making these changes, test:

- [ ] Authentication still works
- [ ] All CRUD operations on tables
- [ ] RPC function calls
- [ ] Real-time subscriptions
- [ ] Row Level Security policies
- [ ] File uploads (if using Supabase Storage)
- [ ] Edge Functions

## 10. Common Issues and Solutions

### Issue: "relation does not exist"
**Solution**: Ensure you're using the correct schema in your queries or have set the proper search_path.

### Issue: "permission denied for schema kastle_banking"
**Solution**: Run the permission grants from `configure_supabase_for_kastle_banking.sql`

### Issue: RPC functions not found
**Solution**: Ensure functions are in kastle_banking schema and you're calling them correctly

### Issue: Types not matching (TypeScript)
**Solution**: Regenerate your database types with the new schema

## Example: Complete Update

### Before
```javascript
// Initialize client
const supabase = createClient(url, key)

// Query data
const { data: customers } = await supabase
  .from('customers')
  .select('*')

// Call function
const { data: result } = await supabase
  .rpc('process_payment', { amount: 100 })

// Insert data
const { error } = await supabase
  .from('transactions')
  .insert({ amount: 100, status: 'pending' })
```

### After
```javascript
// Initialize client with schema
const supabase = createClient(url, key, {
  db: { schema: 'kastle_banking' }
})

// Query data (schema is now default)
const { data: customers } = await supabase
  .from('customers')
  .select('*')

// Call function (schema is now default)
const { data: result } = await supabase
  .rpc('process_payment', { amount: 100 })

// Insert data (schema is now default)
const { error } = await supabase
  .from('transactions')
  .insert({ amount: 100, status: 'pending' })
```

## Need Help?

If you encounter issues:
1. Check the migration logs for any errors
2. Verify all objects are in kastle_banking schema
3. Ensure proper permissions are granted
4. Test with direct SQL queries first
5. Check Supabase logs for API errors