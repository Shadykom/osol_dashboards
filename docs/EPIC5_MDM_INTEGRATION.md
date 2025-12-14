# EPIC 5: Integration & Comprehensive MDM

## Overview

EPIC 5 implements the Master Data Management (MDM) and Integration module for the CMS. This module provides:

- **MDM Golden Records**: Party and Contract master data with source traceability
- **Reference Data Management**: Countries, nationalities, fee types, charge types, etc.
- **Data Ingestion**: Multi-mode ingestion (FILE, MANUAL, API, DB)
- **Data Quality**: Automated DQ rules with issue tracking
- **Idempotency**: Deduplication based on payload hash
- **Data Freshness**: Real-time monitoring of data synchronization status

## Architecture

### Database Schemas

#### `mdm` Schema
- `source_systems` - Registered data sources (LMS, MANUAL, API, etc.)
- `party_golden` - Golden records for parties (persons/organizations)
- `party_source_map` - Maps external refs to golden records (idempotency key)
- `party_source_record` - Raw source records for lineage
- `party_contacts` - Contact information for parties
- `contract_golden` - Golden records for contracts
- `contract_source_map` - Maps external contract refs to golden records
- `contract_charges` - Contract charges from external systems
- `reference_data` - Universal reference data (countries, nationalities, etc.)
- `data_quality_issues` - DQ issues detected during ingestion
- `match_candidates` - Potential duplicate matches for review
- `user_profiles` - Operational user profiles (not auth)

#### `integration` Schema
- `ingestion_runs` - Tracks each ingestion run
- `ingestion_items` - Individual items processed per run
- `reconciliation_summary` - Aggregated stats per run
- `data_freshness` - Freshness tracking per dataset/source
- `mapping_templates` - Configurable field mappings
- `webhook_endpoints` - Registered webhook endpoints
- `scheduled_jobs` - Scheduled DB sync jobs

### Multi-Tenancy

All tables have `tenant_id` with RLS policies:
```sql
tenant_id = current_setting('app.current_tenant')::uuid
```

## Running Migrations

### With Supabase

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Run migrations in order
\i infra/db/migrations/020_create_mdm_schema.sql
\i infra/db/migrations/021_create_integration_schema.sql
\i infra/db/migrations/022_create_mdm_integration_rls_policies.sql
\i infra/db/migrations/023_seed_mdm_integration_data.sql
```

### With Standard PostgreSQL

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/cms"

# Run migrations
psql $DATABASE_URL -f infra/db/migrations/020_create_mdm_schema.sql
psql $DATABASE_URL -f infra/db/migrations/021_create_integration_schema.sql
psql $DATABASE_URL -f infra/db/migrations/022_create_mdm_integration_rls_policies.sql
psql $DATABASE_URL -f infra/db/migrations/023_seed_mdm_integration_data.sql
```

## API Endpoints

### MDM APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mdm/sources` | List source systems |
| POST | `/api/v1/mdm/sources` | Create source system |
| GET | `/api/v1/mdm/reference-data` | List reference data |
| GET | `/api/v1/mdm/reference-data?domain=COUNTRY` | Filter by domain |
| POST | `/api/v1/mdm/reference-data` | Create reference data |
| PATCH | `/api/v1/mdm/reference-data/:id` | Update reference data |
| GET | `/api/v1/mdm/parties` | Search parties |
| GET | `/api/v1/mdm/parties/:party_id` | Get party details |
| GET | `/api/v1/mdm/parties/:party_id/sources` | Get party source mappings |
| GET | `/api/v1/mdm/contracts` | Search contracts |
| GET | `/api/v1/mdm/users` | List users with profiles |
| PATCH | `/api/v1/mdm/users/:user_id/profile` | Update user profile |

### Integration APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/integration/ingest` | Main ingestion endpoint |
| GET | `/api/v1/integration/ingest/method?dataset=PARTY` | Get configured method |
| GET | `/api/v1/integration/runs` | List ingestion runs |
| GET | `/api/v1/integration/runs/:id` | Get run details |
| GET | `/api/v1/integration/runs/:id/items` | Get run items |
| GET | `/api/v1/integration/runs/:id/errors/csv` | Download errors CSV |
| GET | `/api/v1/integration/freshness` | Get data freshness |
| GET | `/api/v1/integration/mappings` | List mapping templates |
| POST | `/api/v1/integration/mappings` | Create mapping template |
| GET | `/api/v1/integration/config` | Get integration config |
| PUT | `/api/v1/integration/config/methods` | Update integration methods |

## Data Ingestion

### Integration Modes

| Mode | Description | Trigger |
|------|-------------|---------|
| FILE | CSV/XLSX file upload | Admin UI upload |
| MANUAL | JSON data entry | Admin UI form |
| API | REST/Webhook ingestion | External system call |
| DB | Database sync | Scheduled job |

### Ingestion Request

```bash
# FILE mode (multipart/form-data)
curl -X POST "http://localhost:3000/api/v1/integration/ingest" \
  -H "x-tenant-id: $TENANT_ID" \
  -F "file=@customers.csv" \
  -F "dataset=PARTY" \
  -F "source_system_code=LMS"

# API/MANUAL mode (JSON)
curl -X POST "http://localhost:3000/api/v1/integration/ingest" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset": "PARTY",
    "source_system_code": "LMS",
    "mode": "API",
    "data": [
      {
        "customer_id": "CUST001",
        "full_name": "John Doe",
        "national_id": "1234567890",
        "mobile": "+966501234567"
      }
    ]
  }'
```

### Idempotency

The ingestion service ensures idempotency using:
1. Unique constraint: `(tenant_id, source_system_id, external_ref)`
2. Payload hash comparison

| Scenario | Outcome |
|----------|---------|
| New external_ref | `INSERTED` |
| Same external_ref, same hash | `SKIPPED` |
| Same external_ref, different hash | `UPDATED` |

### Mapping Templates

Mapping templates define how source data maps to MDM fields:

```json
{
  "externalRefField": "customer_id",
  "partyTypeField": "customer_type",
  "nameFields": {
    "primary": "full_name",
    "primaryAr": "full_name_ar"
  },
  "identifierFields": [
    {"field": "national_id", "type": "NATIONAL_ID"},
    {"field": "iqama_number", "type": "IQAMA"}
  ],
  "contactFields": [
    {"field": "mobile", "type": "MOBILE", "isPrimary": true},
    {"field": "email", "type": "EMAIL"}
  ]
}
```

## Data Quality Rules

### Built-in Rules (Party)

| Rule Code | Severity | Description |
|-----------|----------|-------------|
| MISSING_PRIMARY_ID | critical | No valid identifier found |
| MISSING_NAME | critical | Primary name is missing |
| INVALID_PHONE | medium | Invalid phone format |

### Built-in Rules (Contract)

| Rule Code | Severity | Description |
|-----------|----------|-------------|
| MISSING_CONTRACT_NUMBER | critical | Contract number is missing |
| INVALID_DATE_RANGE | high | Start date after end date |
| ORPHAN_CONTRACT | critical | No matching party found |

## Admin UI Pages

### Integration Module

| Route | Description |
|-------|-------------|
| `/admin/integration/settings` | Configure methods and mappings |
| `/admin/integration/runs` | View ingestion history |
| `/admin/integration/runs/:id` | Run details and items |
| `/admin/integration/ingest` | Upload/submit data |
| `/admin/integration/freshness` | Data freshness dashboard |

### MDM Module

| Route | Description |
|-------|-------------|
| `/admin/mdm/reference-data` | Manage reference data |
| `/admin/mdm/parties` | Search party golden records |
| `/admin/mdm/parties/:id` | Party details with sources, contacts, DQ |
| `/admin/mdm/users` | Manage user profiles |

## Configuration

### Integration Methods

Stored in `tenant_config` table:
- `integration.method.PARTY` - FILE | MANUAL | API | DB
- `integration.method.CONTRACT` - FILE | MANUAL | API | DB
- `integration.method.CHARGE` - FILE | MANUAL | API | DB

### DQ Settings

- `integration.dq.enabled` - Enable DQ checks
- `integration.dq.failOnCritical` - Fail ingestion on critical issues
- `mdm.matching.autoMergeThreshold` - Auto-merge score threshold
- `mdm.matching.reviewThreshold` - Review queue score threshold

## Running Tests

```bash
cd services/api

# Run idempotency and freshness tests
export DATABASE_URL="postgresql://localhost:5432/cms_test"
export TEST_TENANT_ID="00000000-0000-0000-0000-000000000001"
node --test src/tests/integration.idempotency.test.js
```

## Reference Data Domains

The system comes seeded with:

| Domain | Description |
|--------|-------------|
| COUNTRY | Countries (SA, AE, EG, etc.) |
| NATIONALITY | Nationalities |
| FEE_TYPE | Fee types (LATE_FEE, ADMIN_FEE, etc.) |
| CHARGE_TYPE | Charge types (PENALTY, SERVICE_CHARGE, etc.) |
| PARTY_TYPE | Party types (INDIVIDUAL, CORPORATE, etc.) |
| CONTRACT_STATUS | Contract statuses |
| ID_TYPE | Identifier types (NATIONAL_ID, IQAMA, etc.) |
| DQ_RULE | Data quality rules |

## Audit Trail

All operations are logged to `audit_log`:
- Ingestion start/complete/failed
- Reference data create/update/delete
- Config changes
- Mapping template changes

## Security

- All tables have RLS enabled
- Tenant isolation via `current_setting('app.current_tenant')`
- API requires `x-tenant-id` header
- Service role bypass available for background jobs

## Dependencies

### Backend
- Node.js 20+
- PostgreSQL 14+
- @fastify/multipart (file uploads)
- csv-parse (CSV parsing)
- xlsx (Excel parsing)

### Frontend
- React 18+
- React Router 6+
- shadcn/ui components
- Lucide icons

## Migration from Legacy

If migrating from existing systems:
1. Create source system for legacy data
2. Create mapping template matching legacy format
3. Use FILE mode to bulk import historical data
4. Review DQ issues in admin UI
5. Resolve duplicates through match candidates

## Troubleshooting

### Common Issues

**Ingestion fails with "Source system not found"**
- Ensure source system exists: `SELECT * FROM mdm.source_systems WHERE code = 'LMS'`
- Check tenant context is set correctly

**All records show as SKIPPED**
- Same payload hash means no changes detected
- Modify data or use different external_ref values

**DQ issues not created**
- Check `integration.dq.enabled` config is true
- Verify mapping template has required fields

**Freshness not updating**
- Call `integration.update_data_freshness(run_id)` after run completes
- Check run status is 'success' or 'partial'
