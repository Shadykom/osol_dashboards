#!/bin/bash

# OSOL Authentication System Setup Script
# This script sets up the complete authentication and authorization system

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-osol_db}"
DB_USER="${DB_USER:-postgres}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}OSOL Authentication System Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to check if psql is available
check_psql() {
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
        exit 1
    fi
}

# Function to execute SQL file
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo -e "${YELLOW}Executing: ${description}${NC}"
    
    if [ ! -f "$sql_file" ]; then
        echo -e "${RED}Error: SQL file not found: $sql_file${NC}"
        return 1
    fi
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$sql_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ${description} completed successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ ${description} failed${NC}"
        return 1
    fi
}

# Main execution
main() {
    # Check prerequisites
    check_psql
    
    # Get database password
    echo -n "Enter database password for user $DB_USER: "
    read -s DB_PASSWORD
    echo ""
    echo ""
    
    # Test database connection
    echo -e "${YELLOW}Testing database connection...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Unable to connect to database. Please check your credentials.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Database connection successful${NC}"
    echo ""
    
    # Execute SQL scripts in order
    SCRIPT_DIR="$(dirname "$0")"
    
    # 1. Create schema
    if ! execute_sql "$SCRIPT_DIR/auth_schema.sql" "Creating authentication schema and tables"; then
        echo -e "${RED}Schema creation failed. Aborting.${NC}"
        exit 1
    fi
    echo ""
    
    # 2. Insert sample data
    echo -e "${YELLOW}Do you want to insert sample data? (y/n):${NC} "
    read -n 1 INSERT_SAMPLE_DATA
    echo ""
    
    if [[ $INSERT_SAMPLE_DATA =~ ^[Yy]$ ]]; then
        if ! execute_sql "$SCRIPT_DIR/auth_sample_data.sql" "Inserting sample data"; then
            echo -e "${YELLOW}Warning: Sample data insertion failed. You can continue without sample data.${NC}"
        fi
    fi
    echo ""
    
    # 3. Verify installation
    echo -e "${YELLOW}Verifying installation...${NC}"
    
    # Check tables
    TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'roles', 'permissions', 'user_roles', 'user_preferences', 'dashboard_templates', 'user_dashboards');")
    
    if [ $TABLE_COUNT -ge 7 ]; then
        echo -e "${GREEN}✓ All required tables created successfully${NC}"
    else
        echo -e "${RED}✗ Some tables are missing. Please check the installation.${NC}"
    fi
    
    # Check sample data (if inserted)
    if [[ $INSERT_SAMPLE_DATA =~ ^[Yy]$ ]]; then
        USER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM public.users;")
        ROLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM public.roles;")
        
        echo -e "${BLUE}Sample data summary:${NC}"
        echo -e "  - Users created: $USER_COUNT"
        echo -e "  - Roles created: $ROLE_COUNT"
    fi
    
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}Authentication system setup completed!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    
    if [[ $INSERT_SAMPLE_DATA =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Sample User Credentials:${NC}"
        echo -e "  Admin:      admin@osol.sa / Password123!"
        echo -e "  Manager:    manager@osol.sa / Password123!"
        echo -e "  Supervisor: supervisor1@osol.sa / Password123!"
        echo -e "  Officer:    officer1@osol.sa / Password123!"
        echo -e "  Analyst:    analyst@osol.sa / Password123!"
        echo ""
    fi
    
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Update your .env file with database credentials"
    echo -e "  2. Install bcryptjs: npm install bcryptjs"
    echo -e "  3. Restart your application"
    echo -e "  4. Navigate to /login to test the authentication"
    echo ""
}

# Run main function
main