const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Company = require('../models/Company');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { scoreResume } = require('../utils/resumeScorer');

// @route   POST /api/resume/upload
// @desc    Upload resume
// @access  Private (Student)
router.post('/upload', [auth, upload.single('resume')], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            // Delete uploaded file if user not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old resume file if exists
        if (user.resume) {
            const oldResumePath = path.join(__dirname, '../uploads/resumes', path.basename(user.resume));
            if (fs.existsSync(oldResumePath)) {
                fs.unlinkSync(oldResumePath);
            }
        }

        // Save resume path to user
        const resumePath = `/uploads/resumes/${req.file.filename}`;
        user.resume = resumePath;
        await user.save();

        res.json({
            message: 'Resume uploaded successfully',
            resume: resumePath,
            filename: req.file.originalname
        });
    } catch (error) {
        console.error('Resume upload error:', error);
        // Delete uploaded file on error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server error during upload' });
    }
});

// @route   GET /api/resume/download
// @desc    Download own resume
// @access  Private
router.get('/download', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        const resumePath = path.join(__dirname, '../uploads/resumes', path.basename(user.resume));

        if (!fs.existsSync(resumePath)) {
            return res.status(404).json({ message: 'Resume file not found' });
        }

        res.download(resumePath, `${user.name}_Resume.pdf`);
    } catch (error) {
        console.error('Resume download error:', error);
        res.status(500).json({ message: 'Server error during download' });
    }
});

// @route   GET /api/resume/download/:userId
// @desc    Download student resume (Admin only)
// @access  Private (Admin)
router.get('/download/:userId', auth, async (req, res) => {
    try {
        // Check if user is admin
        const requestingUser = await User.findById(req.userId);
        if (requestingUser.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const user = await User.findById(req.params.userId);
        if (!user || !user.resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        const resumePath = path.join(__dirname, '../uploads/resumes', path.basename(user.resume));

        if (!fs.existsSync(resumePath)) {
            return res.status(404).json({ message: 'Resume file not found' });
        }

        res.download(resumePath, `${user.name}_Resume.pdf`);
    } catch (error) {
        console.error('Resume download error:', error);
        res.status(500).json({ message: 'Server error during download' });
    }
});

// @route   DELETE /api/resume
// @desc    Delete resume
// @access  Private
router.delete('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        // Delete file from filesystem
        const resumePath = path.join(__dirname, '../uploads/resumes', path.basename(user.resume));
        if (fs.existsSync(resumePath)) {
            fs.unlinkSync(resumePath);
        }

        // Remove resume path from user
        user.resume = null;
        await user.save();

        res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
        console.error('Resume delete error:', error);
        res.status(500).json({ message: 'Server error during deletion' });
    }
});

// @route   GET /api/resume/view
// @desc    View resume (returns file for preview)
// @access  Private
router.get('/view', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        const resumePath = path.join(__dirname, '../uploads/resumes', path.basename(user.resume));

        if (!fs.existsSync(resumePath)) {
            return res.status(404).json({ message: 'Resume file not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.sendFile(resumePath);
    } catch (error) {
        console.error('Resume view error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/resume/score
// @desc    Score resume for a specific company/job
// @access  Private (Student)
router.post('/score', auth, async (req, res) => {
    try {
        const { companyId } = req.body;

        console.log('=== Resume Scoring Request ===');
        console.log('User ID:', req.userId);
        console.log('Company ID:', companyId);

        if (!companyId) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            console.error('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.resume) {
            console.error('No resume uploaded for user');
            return res.status(404).json({ message: 'Please upload your resume first' });
        }

        console.log('User resume path:', user.resume);

        const company = await Company.findById(companyId);
        if (!company) {
            console.error('Company not found');
            return res.status(404).json({ message: 'Company not found' });
        }

        console.log('Company:', company.name, '| Job Role:', company.jobRole);

        const resumePath = path.join(__dirname, '../uploads/resumes', path.basename(user.resume));
        console.log('Full resume path:', resumePath);
        console.log('File exists:', fs.existsSync(resumePath));

        if (!fs.existsSync(resumePath)) {
            console.error('Resume file not found at:', resumePath);
            return res.status(404).json({ message: 'Resume file not found on server' });
        }

        console.log('Starting resume scoring...');
        // Score the resume
        const scoringResult = await scoreResume(resumePath, company.jobRole, company.name);
        console.log('Scoring completed successfully. Score:', scoringResult.score);

        res.json({
            message: 'Resume scored successfully',
            ...scoringResult
        });
    } catch (error) {
        console.error('=== Resume Scoring Error ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Failed to score resume',
            error: error.message
        });
    }
});

module.exports = router;
