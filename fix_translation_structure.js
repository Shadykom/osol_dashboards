import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fix translation file structure
function fixTranslationFile(filePath) {
    console.log(`Fixing ${filePath}...`);
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Check if executiveCollection exists
    if (!data.executiveCollection) {
        console.log('executiveCollection not found, skipping...');
        return;
    }
    
    // Check if fieldCollection is misplaced (at root level or wrong place)
    let fieldCollectionData = null;
    
    // Look for fieldCollection in various places
    if (data.fieldCollection) {
        // It's at root level, need to move it
        fieldCollectionData = data.fieldCollection;
        delete data.fieldCollection;
        console.log('Found fieldCollection at root level, moving to executiveCollection...');
    } else if (data.executiveCollection.performance && data.executiveCollection.performance.fieldCollection) {
        // It might be under performance section
        fieldCollectionData = data.executiveCollection.performance.fieldCollection;
        console.log('Found fieldCollection under performance section...');
    }
    
    // If we found fieldCollection data, ensure it's properly structured under executiveCollection
    if (fieldCollectionData) {
        // Ensure fieldCollection has all required nested structures
        if (!data.executiveCollection.fieldCollection) {
            data.executiveCollection.fieldCollection = {};
        }
        
        // Merge the data
        Object.assign(data.executiveCollection.fieldCollection, fieldCollectionData);
        
        // Ensure all required keys exist
        const requiredStructure = {
            metrics: {
                visitsToday: "Visits Today",
                completed: "completed",
                amountCollected: "Amount Collected",
                average: "Avg",
                perVisit: "/visit",
                activeAgents: "Active Agents",
                visitsInProgress: "visits in progress",
                successRate: "Success Rate",
                collectionSuccess: "collection success"
            },
            dashboard: {
                title: "Field Collection Dashboard",
                subtitle: "Monitor and manage field collection activities",
                lastUpdated: "Last updated",
                refresh: "Refresh",
                selectRegion: "Select Region",
                selectAgent: "Select Agent",
                allRegions: "All Regions",
                allAgents: "All Agents",
                regions: {
                    north: "North Riyadh",
                    south: "South Riyadh",
                    east: "East Riyadh",
                    west: "West Riyadh",
                    central: "Central"
                }
            },
            alerts: {
                missedCheckIns: "missed check-ins",
                viewDetails: "View Details"
            },
            tabs: {
                overview: "Overview",
                agents: "Agents",
                visits: "Visits",
                routing: "Routing",
                safety: "Safety",
                analytics: "Analytics"
            },
            time: {
                min: "min",
                km: "km"
            },
            overview: {
                visitStatusDistribution: "Visit Status Distribution",
                todaysFieldVisitsByStatus: "Today's field visits by status",
                agentLocations: "Agent Locations",
                heat: "Heat",
                pins: "Pins",
                interactiveMapPlaceholder: "Interactive map placeholder",
                todaysFieldVisits: "Today's Field Visits",
                detailedVisitInformation: "Detailed visit information",
                upcomingVisits: "Upcoming Visits",
                nextScheduledFieldVisits: "Next scheduled field visits",
                tableHeaders: {
                    visitId: "Visit ID",
                    agent: "Agent",
                    customer: "Customer",
                    scheduled: "Scheduled",
                    actual: "Actual",
                    status: "Status",
                    amount: "Amount",
                    duration: "Duration",
                    distance: "Distance"
                },
                visitStatus: {
                    completed: "Completed",
                    inProgress: "In Progress",
                    scheduled: "Scheduled",
                    cancelled: "Cancelled"
                },
                agentStatus: {
                    active: "Active",
                    break: "Break",
                    offline: "Offline"
                },
                upcomingVisitDetails: {
                    agent: "Agent",
                    dpd: "DPD"
                }
            },
            agents: {
                fieldAgentPerformance: "Field Agent Performance",
                monthlyPerformanceMetrics: "Monthly performance metrics",
                agentActivityTimeline: "Agent Activity Timeline",
                realtimeAgentActivities: "Real-time agent activities",
                tableHeaders: {
                    agentName: "Agent Name",
                    visits: "Visits",
                    successful: "Successful",
                    successRate: "Success Rate",
                    amountCollected: "Amount Collected",
                    avgTime: "Avg Time",
                    distance: "Distance",
                    rating: "Rating"
                },
                activities: {
                    checkIn: "Checked in",
                    visitStarted: "Visit started",
                    paymentCollected: "Payment collected",
                    visitCompleted: "Visit completed",
                    customer: "Customer",
                    eta: "ETA"
                }
            },
            visits: {
                fieldVisitPerformanceTrend: "Field Visit Performance Trend",
                dailyVisitsAndCollectionAmounts: "Daily visits and collection amounts",
                performanceByRegion: "Performance by Region",
                fieldCollectionEffectivenessAcrossRegions: "Field collection effectiveness across regions",
                chartLabels: {
                    totalVisits: "Total Visits",
                    successful: "Successful",
                    amount: "Amount",
                    visits: "Visits",
                    successRate: "Success Rate"
                }
            },
            routing: {
                routeOptimizationSummary: "Route Optimization Summary",
                dailyRouteEfficiencyImprovements: "Daily route efficiency improvements",
                metrics: {
                    originalDistance: "Original Distance",
                    optimizedDistance: "Optimized Distance"
                }
            },
            notes: {
                customerNotHome: "Customer not home",
                paymentCollected: "Payment collected",
                promiseToPay: "Promise to pay",
                disputeRaised: "Dispute raised",
                wrongAddress: "Wrong address",
                customerRefused: "Customer refused",
                partialPayment: "Partial payment",
                rescheduleRequested: "Reschedule requested"
            }
        };
        
        // Deep merge function
        function deepMerge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else if (!target[key]) {
                    target[key] = source[key];
                }
            }
        }
        
        // Ensure all required keys exist
        deepMerge(data.executiveCollection.fieldCollection, requiredStructure);
    }
    
    // Write the fixed file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Fixed ${filePath}`);
}

// Fix both English and Arabic translation files
const translationFiles = [
    path.join(__dirname, 'public/locales/en/translation.json'),
    path.join(__dirname, 'public/locales/ar/translation.json')
];

translationFiles.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            fixTranslationFile(file);
        } catch (error) {
            console.error(`Error fixing ${file}:`, error.message);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});

console.log('Translation structure fix completed!');