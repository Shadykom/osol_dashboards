#!/bin/bash

# Git Commands for Creating Pull Request
# Executive Delinquency Dashboard Feature

echo "🚀 Starting Pull Request process for Executive Delinquency Dashboard..."

# 1. Create a new branch
echo "📌 Creating new feature branch..."
git checkout -b feature/executive-delinquency-dashboard

# 2. Add all new files
echo "📁 Adding new files..."
git add src/pages/DelinquencyExecutiveDashboard.tsx
git add delinquency_dashboard_schema.sql
git add delinquency_dashboard_fixed.sql
git add insert_delinquency_data.sql
git add insert_delinquency_data_fixed.sql
git add verify_and_test_delinquency_data.sql
git add DELINQUENCY_DASHBOARD_GUIDE.md
git add TEST_DELINQUENCY_DASHBOARD.md
git add QUICK_ACCESS_SOLUTION.md
git add PULL_REQUEST.md
git add debug_sidebar.js
git add git_commands_for_pr.sh

# 3. Add modified files
echo "📝 Adding modified files..."
git add src/App.jsx
git add src/components/layout/Sidebar.jsx
git add public/locales/ar/translation.json
git add public/locales/en/translation.json

# 4. Create commit
echo "💾 Creating commit..."
git commit -m "feat: Add Executive Delinquency Dashboard

- Add new dashboard component for executive-level delinquency insights
- Create database schema with 6 new tables and 3 views
- Implement KPI cards, charts, and performance comparisons
- Add Arabic and English translations
- Include comprehensive documentation and test scripts

Key features:
- Real-time portfolio health metrics
- Aging bucket distribution visualization
- Collection rate trends analysis
- Top delinquent customers tracking
- Strategic recommendations

Closes #[ISSUE_NUMBER]"

# 5. Push to remote
echo "⬆️ Pushing to remote repository..."
git push origin feature/executive-delinquency-dashboard

# 6. Create Pull Request URL
echo "
✅ Branch created and pushed successfully!

📋 To create the Pull Request:

1. Visit your repository on GitHub/GitLab/Bitbucket
2. Click 'Create Pull Request' or 'Merge Request'
3. Use the following information:

Title: feat: Add Executive Delinquency Dashboard

Description:
Copy the content from PULL_REQUEST.md file

Base branch: main (or master)
Compare branch: feature/executive-delinquency-dashboard

4. Add reviewers and labels as needed
5. Submit the Pull Request

🔗 Quick links for popular platforms:
- GitHub: https://github.com/[USERNAME]/[REPO]/compare/main...feature/executive-delinquency-dashboard
- GitLab: https://gitlab.com/[USERNAME]/[REPO]/-/merge_requests/new
- Bitbucket: https://bitbucket.org/[USERNAME]/[REPO]/pull-requests/new
"

# Optional: Show git status
echo "📊 Current git status:"
git status

echo "✨ Done! Your feature branch is ready for Pull Request."