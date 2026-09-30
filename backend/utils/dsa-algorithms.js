/**
 * DSA ALGORITHMS FOR SMART PLACEMENT TRACKER
 * 
 * This file contains production-ready DSA implementations used throughout the application.
 * Each algorithm is documented with time/space complexity and real-world justification.
 * Supports both placement_cell (company ref) and manual (inline companyName/role/deadline) applications.
 */

/**
 * Normalize application for DSA: unified view for company-ref and manual applications.
 * O(1) per application. Enables same logic for both sources.
 */
function getApplicationDeadline(app) {
    if (app.company && app.company.applicationDeadline) return new Date(app.company.applicationDeadline);
    if (app.applicationDeadline) return new Date(app.applicationDeadline);
    return null;
}
function getCompanyName(app) {
    if (!app) return 'Career Opportunity';
    // 1. Check for populated company object
    if (app.company && typeof app.company === 'object' && app.company.name) return app.company.name;
    // 2. Check for manual company name, rejecting the literal string "Unknown"
    if (app.companyName && app.companyName !== 'Unknown') return app.companyName;
    // 3. Fallback for unpopulated ID
    if (app.company && typeof app.company === 'string') return 'Placement Drive';
    // 4. Ultimate fallback to Role or Career Opportunity
    const roleFallback = (app.company && typeof app.company === 'object' && app.company.jobRole) ? app.company.jobRole : null;
    return roleFallback || app.role || 'Career Opportunity';
}
function getRole(app) {
    if (!app) return '';
    if (app.company && typeof app.company === 'object' && app.company.jobRole) return app.company.jobRole;
    return app.role || '';
}
function getPackage(app) {
    return (app.company && app.company.package != null) ? app.company.package : null;
}

/**
 * GREEDY ALGORITHM: Daily Application Recommendation
 * 
 * Problem: Given multiple pending applications, which one should a student focus on today?
 * 
 * Approach: Greedy choice based on:
 * 1. Nearest deadline (most urgent)
 * 2. Current status (prioritize interviews over applied)
 * 3. Company priority score
 * 
 * Time Complexity: O(n log n) - due to sorting
 * Space Complexity: O(1) - in-place sorting
 * 
 * Why Greedy Works Here:
 * - Local optimal choice (nearest deadline) leads to global optimum (no missed deadlines)
 * - Deadline-driven prioritization is proven effective in task scheduling
 * 
 * @param {Array} applications - Array of application objects
 * @returns {Object} - Recommended application with reasoning
 */
function getDailyRecommendation(applications) {
    if (!applications || applications.length === 0) {
        return null;
    }

    // Filter only pending/active applications with valid future deadline
    const now = new Date();
    const activeApplications = applications.filter(app => {
        const deadline = getApplicationDeadline(app);
        return app.status !== 'selected' &&
            app.status !== 'rejected' &&
            deadline && deadline > now;
    });

    if (activeApplications.length === 0) {
        return null;
    }

    // Status priority weights (higher = more urgent). Spec: Applied / OA / Interview / Selected / Rejected
    const statusPriority = {
        'interview-scheduled': 5,
        'shortlisted': 4,
        'oa': 3,
        'applied': 3,
        'pending': 2
    };

    // Calculate priority score for each application
    const scoredApplications = activeApplications.map(app => {
        const deadline = getApplicationDeadline(app);
        const daysRemaining = Math.ceil(
            (deadline - new Date()) / (1000 * 60 * 60 * 24)
        );

        // Priority score = status weight / days remaining
        // Lower days = higher urgency
        const priorityScore = (statusPriority[app.status] || 1) / Math.max(daysRemaining, 1);

        return {
            ...app,
            daysRemaining,
            priorityScore,
            urgencyLevel: daysRemaining <= 3 ? 'critical' : daysRemaining <= 7 ? 'high' : 'medium'
        };
    });

    // Greedy choice: Sort by priority score (descending)
    scoredApplications.sort((a, b) => b.priorityScore - a.priorityScore);

    const recommended = scoredApplications[0];

    return {
        application: recommended,
        reasoning: {
            choice: 'Greedy Algorithm - Deadline-Driven Priority',
            factors: [
                `${recommended.daysRemaining} days remaining until deadline`,
                `Current status: ${recommended.status}`,
                `Urgency level: ${recommended.urgencyLevel}`,
                `Priority score: ${recommended.priorityScore.toFixed(2)}`
            ],
            action: recommended.status === 'interview-scheduled'
                ? 'Prepare for interview'
                : recommended.daysRemaining <= 3
                    ? 'Apply immediately - deadline approaching!'
                    : 'Review and prepare application'
        }
    };
}

/**
 * HASH MAP: Fast Duplicate Detection
 * 
 * Problem: Prevent students from applying to the same company twice
 * 
 * Approach: Use HashMap (JavaScript Object) for O(1) lookup
 * 
 * Time Complexity: O(1) for lookup, O(n) for building hash
 * Space Complexity: O(n) - stores all company IDs
 * 
 * Why HashMap:
 * - Constant time duplicate checking
 * - Scalable to thousands of applications
 * - Better than linear search O(n) through array
 * 
 * @param {Array} applications - Student's existing applications
 * @returns {Object} - HashMap: key = companyId or normalized company name (manual), value = app info
 */
function buildApplicationHashMap(applications) {
    const hashMap = {};

    applications.forEach(app => {
        const key = app.company && (app.company._id || app.company)
            ? String(app.company._id || app.company)
            : normalizeCompanyNameForHash(app.companyName);
        hashMap[key] = {
            applicationId: app._id,
            status: app.status,
            appliedDate: app.appliedDate
        };
    });

    return hashMap;
}

/** Normalize company name for O(1) duplicate check (lowercase, trim). */
function normalizeCompanyNameForHash(name) {
    return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if student has already applied to a company (by ID or by name for manual).
 * 
 * @param {Object} hashMap - Application hash map from buildApplicationHashMap
 * @param {String} companyIdOrName - Company ID (placement_cell) or company name (manual)
 * @returns {Boolean} - True if already applied
 */
function hasAppliedToCompany(hashMap, companyIdOrName) {
    if (!companyIdOrName) return false;
    const key = companyIdOrName.length <= 30 && /^[a-f0-9]{24}$/i.test(companyIdOrName)
        ? companyIdOrName
        : normalizeCompanyNameForHash(companyIdOrName);
    return Object.prototype.hasOwnProperty.call(hashMap, key);
}

/**
 * SORTING ALGORITHMS: Multi-criteria Application Sorting
 * 
 * Problem: Sort applications by various criteria for better organization
 * 
 * Implementations:
 * 1. Sort by deadline (ascending)
 * 2. Sort by status priority
 * 3. Sort by package (descending)
 * 
 * Time Complexity: O(n log n) - JavaScript's Timsort
 * Space Complexity: O(n) - creates new sorted array
 * 
 * @param {Array} applications - Applications to sort
 * @param {String} criteria - Sorting criteria
 * @returns {Array} - Sorted applications
 */
function sortApplications(applications, criteria = 'deadline') {
    const sortedApps = [...applications]; // Create copy to avoid mutation

    switch (criteria) {
        case 'deadline':
            // Sort by nearest deadline first (null/missing last)
            sortedApps.sort((a, b) => {
                const da = getApplicationDeadline(a);
                const db = getApplicationDeadline(b);
                if (!da) return 1;
                if (!db) return -1;
                return da - db;
            });
            break;

        case 'status':
            // Sort by status priority. Spec: Applied / OA / Interview / Selected / Rejected
            const statusOrder = {
                'interview-scheduled': 1,
                'shortlisted': 2,
                'oa': 3,
                'applied': 4,
                'selected': 5,
                'rejected': 6
            };
            sortedApps.sort((a, b) =>
                (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
            );
            break;

        case 'package':
            // Sort by package (highest first); manual apps without package go last
            sortedApps.sort((a, b) =>
                (getPackage(b) || 0) - (getPackage(a) || 0)
            );
            break;

        case 'recent':
            // Sort by application date (most recent first)
            sortedApps.sort((a, b) =>
                new Date(b.appliedDate) - new Date(a.appliedDate)
            );
            break;

        default:
            break;
    }

    return sortedApps;
}

/**
 * PREFIX SUM: Cumulative Application Statistics
 * 
 * Problem: Calculate cumulative statistics over time periods
 * 
 * Approach: Build prefix sum array for O(1) range queries
 * 
 * Time Complexity: O(n) for building, O(1) for queries
 * Space Complexity: O(n) - stores prefix sums
 * 
 * Use Cases:
 * - Applications per week/month
 * - Cumulative selection rate
 * - Trend analysis
 * 
 * @param {Array} applications - Applications with dates
 * @returns {Object} - Prefix sum statistics
 */
function calculateCumulativeStats(applications) {
    if (!applications || applications.length === 0) {
        return {
            daily: [],
            weekly: [],
            monthly: [],
            total: 0
        };
    }

    // Sort applications by date
    const sortedApps = [...applications].sort((a, b) =>
        new Date(a.appliedDate) - new Date(b.appliedDate)
    );

    // Group by date
    const dailyCount = {};
    sortedApps.forEach(app => {
        const date = new Date(app.appliedDate).toISOString().split('T')[0];
        dailyCount[date] = (dailyCount[date] || 0) + 1;
    });

    // Build prefix sum array
    const dates = Object.keys(dailyCount).sort();
    const prefixSum = [];
    let cumulative = 0;

    dates.forEach(date => {
        cumulative += dailyCount[date];
        prefixSum.push({
            date,
            count: dailyCount[date],
            cumulative
        });
    });

    // Calculate weekly aggregates
    const weeklyStats = calculateWeeklyStats(sortedApps);

    // Calculate monthly aggregates
    const monthlyStats = calculateMonthlyStats(sortedApps);

    return {
        daily: prefixSum,
        weekly: weeklyStats,
        monthly: monthlyStats,
        total: cumulative,
        averagePerWeek: weeklyStats.length > 0
            ? (cumulative / weeklyStats.length).toFixed(2)
            : 0
    };
}

/**
 * Helper: Calculate weekly statistics
 */
function calculateWeeklyStats(applications) {
    const weeklyMap = {};

    applications.forEach(app => {
        const date = new Date(app.appliedDate);
        const weekStart = getWeekStart(date);
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyMap[weekKey]) {
            weeklyMap[weekKey] = {
                week: weekKey,
                count: 0,
                applications: []
            };
        }

        weeklyMap[weekKey].count++;
        weeklyMap[weekKey].applications.push(app);
    });

    return Object.values(weeklyMap).sort((a, b) =>
        new Date(a.week) - new Date(b.week)
    );
}

/**
 * Helper: Calculate monthly statistics
 */
function calculateMonthlyStats(applications) {
    const monthlyMap = {};

    applications.forEach(app => {
        const date = new Date(app.appliedDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = {
                month: monthKey,
                count: 0,
                selected: 0,
                rejected: 0,
                pending: 0
            };
        }

        monthlyMap[monthKey].count++;

        if (app.status === 'selected') monthlyMap[monthKey].selected++;
        else if (app.status === 'rejected') monthlyMap[monthKey].rejected++;
        else monthlyMap[monthKey].pending++;
    });

    return Object.values(monthlyMap).sort((a, b) =>
        a.month.localeCompare(b.month)
    );
}

/**
 * Helper: Get start of week (Monday)
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

/**
 * PRIORITY QUEUE SIMULATION: Interview Preparation Schedule
 * 
 * Problem: Given multiple interviews, create optimal preparation schedule
 * 
 * Approach: Priority-based scheduling (similar to CPU scheduling)
 * 
 * Time Complexity: O(n log n)
 * Space Complexity: O(n)
 * 
 * @param {Array} applications - Applications with interview dates
 * @returns {Array} - Prioritized preparation schedule
 */
function generatePreparationSchedule(applications) {
    const interviewApps = applications.filter(app =>
        app.status === 'interview-scheduled' && app.interviewDate
    );

    if (interviewApps.length === 0) {
        return [];
    }

    // Sort by interview date (earliest first)
    const schedule = interviewApps
        .map(app => {
            const daysUntilInterview = Math.ceil(
                (new Date(app.interviewDate) - new Date()) / (1000 * 60 * 60 * 24)
            );
            const role = getRole(app);
            return {
                company: getCompanyName(app),
                role,
                interviewDate: app.interviewDate,
                daysRemaining: daysUntilInterview,
                priority: daysUntilInterview <= 3 ? 'high' : daysUntilInterview <= 7 ? 'medium' : 'low',
                preparationTasks: generatePreparationTasks(role, daysUntilInterview)
            };
        })
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return schedule;
}

/**
 * Helper: Generate preparation tasks based on role and time
 */
function generatePreparationTasks(role, daysRemaining) {
    const tasks = [];
    const r = (role || '').toLowerCase();

    if (r.includes('software') || r.includes('developer')) {
        tasks.push('Review DSA concepts');
        tasks.push('Practice coding problems');
        tasks.push('Review system design basics');
    }

    tasks.push('Research company background');
    tasks.push('Prepare behavioral questions');
    tasks.push('Review resume projects');

    if (daysRemaining <= 2) {
        tasks.push('URGENT: Mock interview practice');
    }

    return tasks;
}

/**
 * ANALYTICS: Status Distribution (Array Processing)
 * 
 * Problem: Calculate distribution of application statuses
 * 
 * Time Complexity: O(n)
 * Space Complexity: O(1) - fixed number of statuses
 * 
 * @param {Array} applications - All applications
 * @returns {Object} - Status distribution
 */
function getStatusDistribution(applications) {
    const distribution = {
        applied: 0,
        oa: 0,
        shortlisted: 0,
        'interview-scheduled': 0,
        selected: 0,
        rejected: 0,
        total: applications.length
    };

    applications.forEach(app => {
        if (distribution.hasOwnProperty(app.status)) {
            distribution[app.status]++;
        }
    });

    // Calculate percentages
    const percentages = {};
    Object.keys(distribution).forEach(key => {
        if (key !== 'total') {
            percentages[key] = distribution.total > 0
                ? ((distribution[key] / distribution.total) * 100).toFixed(1)
                : 0;
        }
    });

    return {
        counts: distribution,
        percentages,
        successRate: distribution.total > 0
            ? ((distribution.selected / distribution.total) * 100).toFixed(1)
            : 0
    };
}

module.exports = {
    getDailyRecommendation,
    buildApplicationHashMap,
    hasAppliedToCompany,
    normalizeCompanyNameForHash,
    sortApplications,
    calculateCumulativeStats,
    generatePreparationSchedule,
    getStatusDistribution,
    getApplicationDeadline,
    getCompanyName,
    getRole,
    getPackage
};
