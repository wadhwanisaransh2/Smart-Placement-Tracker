const mongoose = require('mongoose');

const jobOpeningSchema = new mongoose.Schema({
    role: {
        type: String,
        required: [true, 'Job role is required'],
        trim: true
    },
    description: {
        type: String,
        default: 'No job description provided'
    },
    package: {
        type: Number,
        required: [true, 'Package is required']
    },
    totalPositions: {
        type: Number,
        default: 1,
        min: 1
    },
    eligibilityCriteria: {
        minCGPA: {
            type: Number,
            default: 0,
            min: 0,
            max: 10
        },
        allowedDepartments: [{
            type: String
        }],
        graduationYear: {
            type: Number
        },
        backlogs: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    applicationDeadline: {
        type: Date,
        required: true
    },
    appliedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    selectedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { _id: true });

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    description: {
        type: String,
        default: 'No description provided'
    },
    website: {
        type: String,
        trim: true
    },
    logo: {
        type: String
    },
    industry: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    visitDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    // New: Array of job openings
    jobOpenings: [jobOpeningSchema],

    // Legacy fields (for backward compatibility - will be deprecated)
    jobRole: {
        type: String,
        trim: true
    },
    jobDescription: {
        type: String,
        default: 'No job description provided'
    },
    eligibilityCriteria: {
        minCGPA: {
            type: Number,
            default: 0
        },
        allowedDepartments: [{
            type: String
        }],
        graduationYear: {
            type: Number
        },
        backlogs: {
            type: Number,
            default: 0
        }
    },
    package: {
        type: Number
    },
    applicationDeadline: {
        type: Date
    },
    totalPositions: {
        type: Number,
        default: 1
    },
    appliedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    selectedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // End legacy fields

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
