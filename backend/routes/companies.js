const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');
const { sendNewCompanyEmail } = require('../utils/emailService');

// @route   GET /api/companies
// @desc    Get all companies
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { jobRole: { $regex: search, $options: 'i' } },
                { industry: { $regex: search, $options: 'i' } }
            ];
        }

        const companies = await Company.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ companies });
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/companies/:id
// @desc    Get company by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('appliedStudents', 'name email rollNumber department cgpa')
            .populate('selectedStudents', 'name email rollNumber department cgpa');

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json({ company });
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/companies
// @desc    Create a new company (supports both single-role and multi-role)
// @access  Admin only
router.post('/', [auth, isAdmin, [
    body('name').trim().notEmpty().withMessage('Company name is required')
]], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const companyData = {
            ...req.body,
            createdBy: req.userId,
            description: req.body.description || 'No description provided'
        };

        // Support both formats:
        // 1. New format: jobOpenings array (multi-role)
        // 2. Legacy format: jobRole, package, etc. (single-role)

        if (req.body.jobOpenings && Array.isArray(req.body.jobOpenings) && req.body.jobOpenings.length > 0) {
            // New multi-role format
            console.log('Creating company with multiple job openings');
        } else if (req.body.jobRole && req.body.package && req.body.applicationDeadline) {
            // Legacy single-role format - convert to jobOpenings array
            console.log('Converting legacy single-role to multi-role format');
            companyData.jobOpenings = [{
                role: req.body.jobRole,
                description: req.body.jobDescription || req.body.description || 'No job description provided',
                package: req.body.package,
                totalPositions: req.body.totalPositions || 1,
                eligibilityCriteria: req.body.eligibilityCriteria || {
                    minCGPA: 0,
                    allowedDepartments: [],
                    graduationYear: new Date().getFullYear(),
                    backlogs: 0
                },
                applicationDeadline: req.body.applicationDeadline,
                appliedStudents: [],
                selectedStudents: []
            }];
        } else {
            return res.status(400).json({
                message: 'Either jobOpenings array or legacy fields (jobRole, package, applicationDeadline) are required'
            });
        }

        const company = new Company(companyData);
        await company.save();

        // Send email notification to all eligible students (async, don't wait)
        try {
            const eligibleStudents = await User.find({
                role: 'student',
                isPlaced: false
            });

            if (eligibleStudents.length > 0) {
                // Send emails in background (don't wait)
                eligibleStudents.forEach(student => {
                    sendNewCompanyEmail(
                        student.email,
                        student.name,
                        company
                    ).catch(err => console.error(`Email failed for ${student.email}:`, err.message));
                });

                console.log(`📧 Sending new company notifications to ${eligibleStudents.length} students`);
            }
        } catch (emailError) {
            console.error('Email notification error:', emailError.message);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            message: 'Company created successfully',
            company
        });
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({
            message: 'Failed to create company',
            error: error.message
        });
    }
});

// @route   PUT /api/companies/:id
// @desc    Update company
// @access  Admin only
router.put('/:id', [auth, isAdmin], async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Company updated successfully',
            company: updatedCompany
        });
    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/companies/:id
// @desc    Delete company
// @access  Admin only
router.delete('/:id', [auth, isAdmin], async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        await Company.findByIdAndDelete(req.params.id);

        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
