const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/emailService');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student', 'admin']).withMessage('Invalid role')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, role, rollNumber, department, cgpa, graduationYear, phone } = req.body;

        // Validate Gmail email
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            return res.status(400).json({ message: 'Only Gmail addresses (@gmail.com) are allowed for registration' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Check if roll number exists (for students)
        if (role === 'student' && rollNumber) {
            const existingRoll = await User.findOne({ rollNumber });
            if (existingRoll) {
                return res.status(400).json({ message: 'Roll number already exists' });
            }

            // Validate that roll number is provided for students
            if (!rollNumber) {
                return res.status(400).json({ message: 'Roll number is required for students' });
            }
        }

        // Create new user
        user = new User({
            name,
            email,
            password,
            role,
            rollNumber: role === 'student' ? rollNumber : undefined,
            department: role === 'student' ? department : undefined,
            cgpa: role === 'student' ? cgpa : undefined,
            graduationYear: role === 'student' ? graduationYear : undefined,
            phone: role === 'student' ? phone : undefined
        });

        await user.save();

        // Send welcome email (async, don't wait for it)
        if (role === 'student') {
            sendWelcomeEmail(user.email, user.name).catch(err =>
                console.error('Welcome email failed:', err.message)
            );
        }

        const token = generateToken(user._id);

        res.status(201).json({
            message: 'User registered successfully',
            token,
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
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
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
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
