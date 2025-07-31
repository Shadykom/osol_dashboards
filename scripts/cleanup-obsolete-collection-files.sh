#!/bin/bash

echo "🧹 Cleaning up obsolete collection schema files..."
echo "================================================"
echo ""
echo "These files reference the old kastle_collection schema"
echo "and are no longer needed since all tables are now in kastle_banking."
echo ""

# List of obsolete files
obsolete_files=(
    "fix_collection_schema.sql"
    "fix_collection_schema_v2.sql"
    "fix_collection_minimal.sql"
    "fix_collection_core_only.sql"
    "fix_collection_final.sql"
    "fix_collection_complete.sql"
    "fix_collection_foreign_keys.sql"
    "fix_collection_buckets_hotfix.sql"
    "fix_collection_buckets_comprehensive.sql"
    "check_collection_buckets_structure.sql"
    "COLLECTION_FIX_README.md"
    "COLLECTION_FIX_INSTRUCTIONS.md"
    "run_collection_fix.sh"
    "scripts/fix-collection-schema.js"
    "scripts/fix-collection-via-supabase.js"
    "scripts/apply-collection-fixes.sh"
)

# Backup directory
backup_dir="obsolete_collection_files_backup_$(date +%Y%m%d_%H%M%S)"

echo "Creating backup directory: $backup_dir"
mkdir -p "$backup_dir"

# Move files to backup directory
moved_count=0
for file in "${obsolete_files[@]}"; do
    if [ -f "$file" ]; then
        echo "📁 Moving $file to backup..."
        mv "$file" "$backup_dir/"
        ((moved_count++))
    else
        echo "⏭️  Skipping $file (not found)"
    fi
done

echo ""
echo "✅ Cleanup complete!"
echo "📊 Moved $moved_count files to $backup_dir"
echo ""
echo "💡 The backup directory contains all the old files in case you need them."
echo "   You can safely delete it once you're sure everything works correctly."
echo ""
echo "📝 Note: The new documentation is in COLLECTION_SCHEMA_UPDATE.md"