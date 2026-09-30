const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Application = require('../models/Application');
const { auth, isAdmin } = require('../middleware/auth');

// @route   GET /api/students/:id/profile
// @desc    Get detailed student profile with all applications (Admin only)
// @access  Admin only
router.get('/:id/profile', [auth, isAdmin], async (req, res) => {
    try {
        const studentId = req.params.id;

        // Get student details
        const student = await User.findById(studentId).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (student.role !== 'student') {
            return res.status(400).json({ message: 'User is not a student' });
        }

        // Get all applications with company details populated
        const applications = await Application.find({ student: studentId })
            .populate('company')
            .sort({ appliedDate: -1 });

        // Categorize applications
        const selectedApplications = applications.filter(app => app.status === 'selected');
        const rejectedApplications = applications.filter(app => app.status === 'rejected');
        const pendingApplications = applications.filter(app =>
            app.status !== 'selected' && app.status !== 'rejected'
        );

        // Calculate statistics
        const stats = {
            totalApplications: applications.length,
            selected: selectedApplications.length,
            rejected: rejectedApplications.length,
            pending: pendingApplications.length,
            interviewScheduled: applications.filter(app => app.status === 'interview-scheduled').length,
            shortlisted: applications.filter(app => app.status === 'shortlisted').length,
            applied: applications.filter(app => app.status === 'applied').length,
            oa: applications.filter(app => app.status === 'oa').length
        };

        // Calculate success rate
        const completedApplications = selectedApplications.length + rejectedApplications.length;
        const successRate = completedApplications > 0
            ? ((selectedApplications.length / completedApplications) * 100).toFixed(2)
            : 0;

        // Get application timeline (grouped by month)
        const timeline = applications.reduce((acc, app) => {
            const month = new Date(app.appliedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
            });
            if (!acc[month]) {
                acc[month] = { month, count: 0 };
            }
            acc[month].count++;
            return acc;
        }, {});

        res.json({
            student,
            applications: {
                all: applications,
                selected: selectedApplications,
                rejected: rejectedApplications,
                pending: pendingApplications
            },
            stats: {
                ...stats,
                successRate: parseFloat(successRate)
            },
            timeline: Object.values(timeline).sort((a, b) =>
                new Date(a.month) - new Date(b.month)
            )
        });

    } catch (error) {
        console.error('Get student profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
