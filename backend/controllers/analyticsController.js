const Application = require('../models/Application');
const Company = require('../models/Company'); // Ensure Company model is registered for populate
const {
    getDailyRecommendation,
    sortApplications,
    calculateCumulativeStats,
    generatePreparationSchedule,
    getStatusDistribution,
    getCompanyName,
    getRole,
    getApplicationDeadline
} = require('../utils/dsa-algorithms');

/**
 * SMART ANALYTICS CONTROLLER
 * 
 * This controller provides intelligent insights using DSA algorithms
 * All endpoints are optimized for performance and scalability
 */

/**
 * @route   GET /api/analytics/daily-recommendation
 * @desc    Get AI-powered daily application recommendation (Greedy Algorithm)
 * @access  Private (Student)
 */
exports.getDailyRecommendation = async (req, res) => {
    try {
        const applications = await Application.find({ student: req.userId })
            .populate('company')
            .lean();

        console.log('Daily recommendation - Applications found:', applications.length);
        if (applications.length > 0) {
            console.log('Sample application:', {
                id: applications[0]._id,
                hasCompany: !!applications[0].company,
                companyData: applications[0].company,
                companyName: applications[0].companyName,
                source: applications[0].source
            });
        }

        const recommendation = getDailyRecommendation(applications);

        if (!recommendation) {
            return res.json({
                message: 'No pending applications. Great job staying on top of things!',
                recommendation: null
            });
        }

        const companyName = getCompanyName(recommendation.application);
        console.log('Recommendation company name:', companyName);

        res.json({
            success: true,
            recommendation: {
                company: recommendation.application.company?.name || recommendation.application.companyName || 'Active Drive',
                role: recommendation.application.company?.jobRole || recommendation.application.role || 'Position',
                deadline: getApplicationDeadline(recommendation.application),
                daysRemaining: recommendation.application.daysRemaining,
                currentStatus: recommendation.application.status,
                urgencyLevel: recommendation.application.urgencyLevel,
                priorityScore: recommendation.application.priorityScore,
                reasoning: recommendation.reasoning
            },
            algorithm: {
                name: 'Greedy Algorithm',
                approach: 'Deadline-driven priority scheduling',
                complexity: 'O(n log n) time, O(1) space'
            }
        });
    } catch (error) {
        console.error('Daily recommendation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/analytics/sorted-applications
 * @desc    Get sorted applications by various criteria
 * @access  Private (Student)
 */
exports.getSortedApplications = async (req, res) => {
    try {
        const { sortBy = 'deadline' } = req.query;

        const applications = await Application.find({ student: req.userId })
            .populate('company')
            .lean();

        const sortedApplications = sortApplications(applications, sortBy);

        res.json({
            success: true,
            applications: sortedApplications,
            sortedBy: sortBy,
            count: sortedApplications.length,
            algorithm: {
                name: 'Merge Sort (Timsort)',
                complexity: 'O(n log n) time, O(n) space'
            }
        });
    } catch (error) {
        console.error('Sorted applications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/analytics/cumulative-stats
 * @desc    Get cumulative application statistics (Prefix Sum)
 * @access  Private (Student)
 */
exports.getCumulativeStats = async (req, res) => {
    try {
        const applications = await Application.find({ student: req.userId })
            .populate('company')
            .lean();

        const stats = calculateCumulativeStats(applications);

        res.json({
            success: true,
            statistics: {
                total: stats.total,
                averagePerWeek: stats.averagePerWeek,
                daily: stats.daily,
                weekly: stats.weekly,
                monthly: stats.monthly
            },
            insights: {
                mostActiveWeek: stats.weekly.length > 0
                    ? stats.weekly.reduce((max, week) => week.count > max.count ? week : max, stats.weekly[0])
                    : null,
                mostActiveMonth: stats.monthly.length > 0
                    ? stats.monthly.reduce((max, month) => month.count > max.count ? month : max, stats.monthly[0])
                    : null
            },
            algorithm: {
                name: 'Prefix Sum Array',
                approach: 'Cumulative sum for O(1) range queries',
                complexity: 'O(n) time, O(n) space'
            }
        });
    } catch (error) {
        console.error('Cumulative stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/analytics/interview-schedule
 * @desc    Get optimized interview preparation schedule (Priority Queue)
 * @access  Private (Student)
 */
exports.getInterviewSchedule = async (req, res) => {
    try {
        const applications = await Application.find({
            student: req.userId,
            status: 'interview-scheduled'
        }).populate('company').lean();

        const schedule = generatePreparationSchedule(applications);

        res.json({
            success: true,
            schedule,
            upcomingCount: schedule.length,
            criticalCount: schedule.filter(s => s.priority === 'high').length,
            algorithm: {
                name: 'Priority-based Scheduling',
                approach: 'Sort by urgency, similar to CPU scheduling',
                complexity: 'O(n log n) time, O(n) space'
            }
        });
    } catch (error) {
        console.error('Interview schedule error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/analytics/status-distribution
 * @desc    Get application status distribution
 * @access  Private (Student)
 */
exports.getStatusDistribution = async (req, res) => {
    try {
        const applications = await Application.find({ student: req.userId }).lean();

        const distribution = getStatusDistribution(applications);

        res.json({
            success: true,
            distribution: distribution.counts,
            percentages: distribution.percentages,
            successRate: distribution.successRate,
            insights: {
                totalApplications: distribution.counts.total,
                activeApplications: (distribution.counts.applied || 0) +
                    (distribution.counts.oa || 0) +
                    (distribution.counts.shortlisted || 0) +
                    (distribution.counts['interview-scheduled'] || 0),
                conversionRate: distribution.counts.total > 0
                    ? ((distribution.counts['interview-scheduled'] / distribution.counts.total) * 100).toFixed(1)
                    : 0
            },
            algorithm: {
                name: 'Array Processing',
                approach: 'Single-pass counting',
                complexity: 'O(n) time, O(1) space'
            }
        });
    } catch (error) {
        console.error('Status distribution error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/analytics/dashboard-summary
 * @desc    Get comprehensive dashboard summary (combines multiple DSA operations)
 * @access  Private (Student)
 */
exports.getDashboardSummary = async (req, res) => {
    try {
        const applications = await Application.find({ student: req.userId })
            .populate('company')
            .lean();

        // Run multiple DSA operations
        const recommendation = getDailyRecommendation(applications);
        const distribution = getStatusDistribution(applications);
        const cumulativeStats = calculateCumulativeStats(applications);
        const interviewSchedule = generatePreparationSchedule(applications);

        // Calculate additional insights (works for both company-ref and manual apps)
        const urgentApplications = applications.filter(app => {
            const deadline = getApplicationDeadline(app);
            if (!deadline) return false;
            const daysRemaining = Math.ceil(
                (deadline - new Date()) / (1000 * 60 * 60 * 24)
            );
            return daysRemaining <= 7 && daysRemaining > 0 &&
                app.status !== 'selected' && app.status !== 'rejected';
        });

        const activeCount = (distribution.counts.applied || 0) + (distribution.counts.oa || 0) +
            (distribution.counts.shortlisted || 0) + (distribution.counts['interview-scheduled'] || 0);

        res.json({
            success: true,
            summary: {
                totalApplications: applications.length,
                activeApplications: activeCount,
                successRate: distribution.successRate,
                averageApplicationsPerWeek: cumulativeStats.averagePerWeek,
                urgentCount: urgentApplications.length,
                upcomingInterviews: interviewSchedule.length
            },
            dailyRecommendation: recommendation ? {
                company: recommendation.application.company?.name || recommendation.application.companyName || 'Active Drive',
                urgency: recommendation.application.urgencyLevel,
                action: recommendation.reasoning.action
            } : null,
            statusBreakdown: distribution.counts,
            recentTrend: cumulativeStats.weekly.slice(-4), // Last 4 weeks
            algorithms: {
                used: ['Greedy', 'HashMap', 'Sorting', 'Prefix Sum', 'Priority Queue'],
                totalComplexity: 'O(n log n) time, O(n) space'
            }
        });
    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;
