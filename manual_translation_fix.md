# Manual Translation Fix Instructions

## Quick Fix for Translation Structure

The issue is that `fieldCollection` needs to be nested under `executiveCollection` in the translation files.

### For English translation (`/public/locales/en/translation.json`):

1. Find the line with `"fieldCollection": {` (around line 1870)
2. This entire section (from line 1870 to approximately line 2082) needs to be moved
3. It should be placed inside the `executiveCollection` object (which starts around line 1785)
4. Specifically, it should be placed after the `"compliance"` section (around line 2140) but before the closing brace of `executiveCollection`

### Structure should look like:
```json
{
  ...
  "executiveCollection": {
    "title": "Executive Collection Dashboard",
    ...
    "compliance": {
      ...
    },
    "fieldCollection": {
      "title": "Field Collection",
      "metrics": {
        "visitsToday": "Visits Today",
        "completed": "completed",
        "amountCollected": "Amount Collected",
        "average": "Avg",
        "perVisit": "/visit",
        "activeAgents": "Active Agents",
        "visitsInProgress": "visits in progress",
        "successRate": "Success Rate",
        "collectionSuccess": "collection success"
      },
      ...
    }
  },
  "dailyCollectionDashboard": {
    ...
  }
}
```

### Key Translation Keys Needed:
Make sure these keys exist under `executiveCollection.fieldCollection`:
- `metrics.visitsToday`
- `metrics.completed`
- `metrics.amountCollected`
- `metrics.average`
- `metrics.perVisit`
- `metrics.activeAgents`
- `metrics.visitsInProgress`
- `metrics.successRate`
- `metrics.collectionSuccess`
- `alerts.missedCheckIns`
- `alerts.viewDetails`
- All the dashboard, tabs, overview, agents, visits, routing sections

### For Arabic translation (`/public/locales/ar/translation.json`):
Apply the same structure changes with Arabic translations.