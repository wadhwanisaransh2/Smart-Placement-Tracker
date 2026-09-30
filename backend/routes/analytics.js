const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth, isStudent } = require('../middleware/auth');

/**
 * SMART ANALYTICS ROUTES
 * 
 * These routes provide DSA-powered insights for students
 * All routes are protected and require student authentication
 */

// @route   GET /api/analytics/daily-recommendation
// @desc    Get daily application recommendation using Greedy Algorithm
// @access  Private (Student)
router.get('/daily-recommendation', [auth, isStudent], analyticsController.getDailyRecommendation);

// @route   GET /api/analytics/sorted-applications
// @desc    Get sorted applications (sortBy: deadline, status, package, recent)
// @access  Private (Student)
router.get('/sorted-applications', [auth, isStudent], analyticsController.getSortedApplications);

// @route   GET /api/analytics/cumulative-stats
// @desc    Get cumulative statistics using Prefix Sum
// @access  Private (Student)
router.get('/cumulative-stats', [auth, isStudent], analyticsController.getCumulativeStats);

// @route   GET /api/analytics/interview-schedule
// @desc    Get prioritized interview preparation schedule
// @access  Private (Student)
router.get('/interview-schedule', [auth, isStudent], analyticsController.getInterviewSchedule);

// @route   GET /api/analytics/status-distribution
// @desc    Get application status distribution
// @access  Private (Student)
router.get('/status-distribution', [auth, isStudent], analyticsController.getStatusDistribution);

// @route   GET /api/analytics/dashboard-summary
// @desc    Get comprehensive dashboard summary (combines all DSA operations)
// @access  Private (Student)
router.get('/dashboard-summary', [auth, isStudent], analyticsController.getDashboardSummary);

module.exports = router;
