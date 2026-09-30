const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (admin) or current user profile (student)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const { role, department, isPlaced, search } = req.query;
            let query = {};

            if (role) query.role = role;
            if (department) query.department = department;
            if (isPlaced !== undefined) query.isPlaced = isPlaced === 'true';

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { rollNumber: { $regex: search, $options: 'i' } }
                ];
            }

            const users = await User.find(query).select('-password').sort({ createdAt: -1 });
            res.json({ users });
        } else {
            const user = await User.findById(req.userId).select('-password');
            res.json({ user });
        }
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/profile
// @desc    Get current user profile (alias for students; admin gets own profile)
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/stats
// @desc    Get placement statistics
// @access  Admin only
router.get('/stats', [auth, isAdmin], async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const placedStudents = await User.countDocuments({ role: 'student', isPlaced: true });
        const unplacedStudents = totalStudents - placedStudents;

        // Department-wise stats
        const departmentStats = await User.aggregate([
            { $match: { role: 'student' } },
            {
                $group: {
                    _id: '$department',
                    total: { $sum: 1 },
                    placed: {
                        $sum: { $cond: ['$isPlaced', 1, 0] }
                    },
                    avgPackage: { $avg: '$package' }
                }
            }
        ]);

        // Package distribution
        const packageStats = await User.aggregate([
            { $match: { role: 'student', isPlaced: true } },
            {
                $group: {
                    _id: null,
                    avgPackage: { $avg: '$package' },
                    minPackage: { $min: '$package' },
                    maxPackage: { $max: '$package' }
                }
            }
        ]);

        // Top companies
        const topCompanies = await User.aggregate([
            { $match: { role: 'student', isPlaced: true } },
            {
                $group: {
                    _id: '$placedCompany',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            overview: {
                totalStudents,
                placedStudents,
                unplacedStudents,
                placementPercentage: totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) : 0
            },
            departmentStats,
            packageStats: packageStats[0] || { avgPackage: 0, minPackage: 0, maxPackage: 0 },
            topCompanies
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (own profile) or Admin
router.put('/:id', auth, async (req, res) => {
    try {
        // Check if user is updating their own profile or is admin
        // Convert both IDs to strings for proper comparison
        if (req.userId.toString() !== req.params.id.toString() && req.user.role !== 'admin') {
            console.log('Access denied - User ID mismatch:', {
                requestUserId: req.userId.toString(),
                paramsId: req.params.id.toString(),
                userRole: req.user.role
            });
            return res.status(403).json({ message: 'Access denied: You can only update your own profile' });
        }

        const { name, phone, department, cgpa, graduationYear, skills, resume } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (department) updateData.department = department;
        if (cgpa !== undefined) updateData.cgpa = cgpa;
        if (graduationYear !== undefined) updateData.graduationYear = graduationYear;
        if (skills) updateData.skills = skills;
        if (resume) updateData.resume = resume;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNumber: user.rollNumber,
                department: user.department,
                cgpa: user.cgpa,
                graduationYear: user.graduationYear,
                phone: user.phone,
                skills: user.skills,
                isPlaced: user.isPlaced,
                placedCompany: user.placedCompany
            }
        });
    } catch (error) {
        console.error('Update user error:', error);

        // Return more specific error messages
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                details: error.message
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        res.status(500).json({
            message: 'Server error while updating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Admin only
router.delete('/:id', [auth, isAdmin], async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
