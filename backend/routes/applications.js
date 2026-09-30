const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Company = require('../models/Company');
const User = require('../models/User');
const { auth, isAdmin, isStudent } = require('../middleware/auth');
const { buildApplicationHashMap, hasAppliedToCompany } = require('../utils/dsa-algorithms');
const { sendStatusUpdateEmail } = require('../utils/emailService');

// @route   GET /api/applications
// @desc    Get all applications (admin) or user's applications (student)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let query = {};

        // If student, only show their applications
        if (req.user.role === 'student') {
            query.student = req.userId;
        }

        // Filter by company if provided
        if (req.query.company) {
            query.company = req.query.company;
        }

        // Filter by status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        const applications = await Application.find(query)
            .populate('student', 'name email rollNumber department cgpa')
            .populate('company', 'name jobRole package applicationDeadline status')
            .sort({ createdAt: -1 });

        res.json({ applications });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/applications/:id
// @desc    Get application by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('student', 'name email rollNumber department cgpa phone skills')
            .populate('company');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const studentId = application.student._id ? application.student._id.toString() : application.student.toString();
        if (req.user.role === 'student' && studentId !== req.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({ application });
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/applications
// @desc    Apply to a company (placement_cell: companyId) OR add manual application (companyName, role, applicationDeadline, status)
// @access  Student only
router.post('/', [auth, isStudent], async (req, res) => {
    try {
        const { companyId, companyName, role, applicationDeadline, status } = req.body;

        const student = await User.findById(req.userId);
        if (student.isPlaced) {
            return res.status(400).json({ message: 'You are already placed' });
        }

        // --- Manual application (Phase 1: student-tracked) ---
        if (companyName && role !== undefined) {
            const name = String(companyName).trim();
            const deadline = applicationDeadline ? new Date(applicationDeadline) : null;
            const appStatus = (status && ['applied', 'oa', 'shortlisted', 'interview-scheduled', 'selected', 'rejected'].includes(status))
                ? status : 'applied';

            if (!name) {
                return res.status(400).json({ message: 'Company name is required for manual application' });
            }

            // Hash-based duplicate prevention: O(1) lookup
            const existingApps = await Application.find({ student: req.userId, source: 'manual' });
            const hashMap = buildApplicationHashMap(
                existingApps.map(a => ({ ...a.toObject(), company: null, companyName: a.companyName }))
            );
            if (hasAppliedToCompany(hashMap, name)) {
                return res.status(400).json({ message: 'You have already added an application for this company' });
            }

            const application = new Application({
                student: req.userId,
                source: 'manual',
                companyName: name,
                role: String(role).trim(),
                applicationDeadline: deadline,
                status: appStatus,
                resumePath: student.resume // Save resume path for manual applications too
            });
            await application.save();

            return res.status(201).json({
                message: 'Application added successfully',
                application
            });
        }

        // --- Placement cell application (companyId) ---
        if (!companyId) {
            return res.status(400).json({ message: 'Provide companyId (placement cell) or companyName + role (manual)' });
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // ⭐ NEW: Check if company has reached application limit
        if (company.appliedStudents.length >= company.totalPositions) {
            return res.status(400).json({
                message: `Application limit reached. This company is only hiring ${company.totalPositions} student(s).`
            });
        }

        if (new Date() > new Date(company.applicationDeadline)) {
            return res.status(400).json({ message: 'Application deadline has passed' });
        }

        if (student.cgpa < (company.eligibilityCriteria?.minCGPA || 0)) {
            return res.status(400).json({
                message: `Minimum CGPA required: ${company.eligibilityCriteria.minCGPA}`
            });
        }

        if (company.eligibilityCriteria?.allowedDepartments?.length > 0 &&
            !company.eligibilityCriteria.allowedDepartments.includes(student.department)) {
            return res.status(400).json({
                message: 'Your department is not eligible for this company'
            });
        }

        const existingApplication = await Application.findOne({
            student: req.userId,
            company: companyId
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied to this company' });
        }

        const application = new Application({
            student: req.userId,
            company: companyId,
            source: 'placement_cell',
            resumePath: student.resume // Save resume path at time of application
        });

        await application.save();

        // Update company's applied students list
        const updatedCompany = await Company.findByIdAndUpdate(
            companyId,
            { $addToSet: { appliedStudents: req.userId } },
            { new: true }
        );

        // ⭐ NEW FEATURE: Auto-update company status when application limit is reached
        if (updatedCompany && updatedCompany.appliedStudents.length >= updatedCompany.totalPositions) {
            await Company.findByIdAndUpdate(companyId, {
                status: 'completed'
            });
        }

        res.status(201).json({
            message: 'Application submitted successfully',
            application
        });
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/applications/:id
// @desc    Update application: Student can update own status; Admin can update all fields
// @access  Private (student: own + status only; admin: all)
router.put('/:id', auth, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const isOwn = application.student.toString() === req.userId;
        const { status, interviewDate, interviewMode, interviewLocation, rounds, finalResult } = req.body;

        // Student: can only update own application's status (and statusHistory is updated)
        if (req.user.role === 'student') {
            if (!isOwn) {
                return res.status(403).json({ message: 'Access denied' });
            }
            if (status) {
                const allowed = ['applied', 'oa', 'shortlisted', 'interview-scheduled', 'selected', 'rejected'];
                if (!allowed.includes(status)) {
                    return res.status(400).json({ message: 'Invalid status' });
                }
                application.status = status;
                application.statusHistory = application.statusHistory || [];
                application.statusHistory.push({ status, changedAt: new Date() });

                // If student marks as 'selected', update their placement status
                if (status === 'selected') {
                    const student = await User.findById(application.student);
                    if (student) {
                        student.isPlaced = true;
                        student.placedCompany = application.company
                            ? (await Company.findById(application.company))?.name
                            : application.companyName;
                        student.package = application.company
                            ? (await Company.findById(application.company))?.package
                            : null;
                        await student.save();

                        // Update company's selectedStudents list if applicable
                        if (application.company) {
                            await Company.findByIdAndUpdate(application.company, {
                                $addToSet: { selectedStudents: application.student }
                            });
                        }

                        // ⭐ NEW: Automatically reject/disable all other pending applications
                        const pendingStatuses = ['applied', 'oa', 'shortlisted', 'interview-scheduled'];
                        await Application.updateMany(
                            {
                                student: application.student,
                                _id: { $ne: application._id }, // Exclude current application
                                status: { $in: pendingStatuses } // Only update pending applications
                            },
                            {
                                $set: {
                                    status: 'rejected',
                                    notes: 'Auto-rejected: Student already placed'
                                },
                                $push: {
                                    statusHistory: {
                                        status: 'rejected',
                                        changedAt: new Date()
                                    }
                                }
                            }
                        );
                    }
                }
            }
            if (interviewDate) application.interviewDate = interviewDate;
            await application.save();
            return res.json({ message: 'Application updated successfully', application });
        }

        // Admin: full update
        const oldStatus = application.status; // Store old status for email

        if (status) application.status = status;
        if (interviewDate) application.interviewDate = interviewDate;
        if (interviewMode) application.interviewMode = interviewMode;
        if (interviewLocation) application.interviewLocation = interviewLocation;
        if (rounds) application.rounds = rounds;
        if (finalResult) application.finalResult = finalResult;
        if (status) {
            application.statusHistory = application.statusHistory || [];
            application.statusHistory.push({ status: application.status, changedAt: new Date() });
        }

        await application.save();

        // Send email notification for status change
        if (status && oldStatus !== status) {
            try {
                const student = await User.findById(application.student);
                const company = application.company
                    ? await Company.findById(application.company)
                    : null;

                const companyName = company ? company.name : application.companyName;

                if (student && companyName) {
                    await sendStatusUpdateEmail(
                        student.email,
                        student.name,
                        companyName,
                        oldStatus,
                        status
                    );
                    console.log(`📧 Status update email sent to ${student.email}`);
                }
            } catch (emailError) {
                console.error('Email notification error:', emailError.message);
                // Don't fail the request if email fails
            }
        }

        // Admin can also mark as selected via status field
        if (status === 'selected' || finalResult === 'selected') {
            const student = await User.findById(application.student);
            student.isPlaced = true;
            student.placedCompany = application.company
                ? (await Company.findById(application.company))?.name
                : application.companyName;
            student.package = application.company
                ? (await Company.findById(application.company))?.package
                : null;
            await student.save();

            if (application.company) {
                await Company.findByIdAndUpdate(application.company, {
                    $addToSet: { selectedStudents: application.student }
                });
            }

            // ⭐ NEW: Automatically reject/disable all other pending applications
            const pendingStatuses = ['applied', 'oa', 'shortlisted', 'interview-scheduled'];
            await Application.updateMany(
                {
                    student: application.student,
                    _id: { $ne: application._id }, // Exclude current application
                    status: { $in: pendingStatuses } // Only update pending applications
                },
                {
                    $set: {
                        status: 'rejected',
                        notes: 'Auto-rejected: Student already placed'
                    },
                    $push: {
                        statusHistory: {
                            status: 'rejected',
                            changedAt: new Date()
                        }
                    }
                }
            );
        }

        res.json({
            message: 'Application updated successfully',
            application
        });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/applications/:id
// @desc    Delete/withdraw application
// @access  Private (Student can delete own, Admin can delete any)
router.delete('/:id', auth, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Students can only delete their own applications
        if (req.user.role === 'student' && application.student.toString() !== req.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (application.company) {
            await Company.findByIdAndUpdate(application.company, {
                $pull: { appliedStudents: application.student }
            });
        }

        await Application.findByIdAndDelete(req.params.id);

        res.json({ message: 'Application withdrawn successfully' });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
