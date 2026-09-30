const mongoose = require('mongoose');

/**
 * Application Schema
 * Supports two sources:
 * - placement_cell: application to admin-posted Company (company ref required)
 * - manual: student-tracked application (companyName, role, applicationDeadline on document)
 */
const statusHistorySchema = new mongoose.Schema({
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now }
}, { _id: false });

const applicationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Optional: set when applying via placement cell
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    // New: Track which specific job opening within the company
    jobOpeningId: {
        type: mongoose.Schema.Types.ObjectId
    },
    // Resume path at time of application
    resumePath: {
        type: String
    },
    // Source: placement_cell (admin-posted) or manual (student-added)
    source: {
        type: String,
        enum: ['placement_cell', 'manual'],
        default: 'placement_cell'
    },
    // Inline fields for manual applications (required when source === 'manual')
    companyName: { type: String, trim: true },
    role: { type: String, trim: true },
    applicationDeadline: { type: Date },
    // ---
    status: {
        type: String,
        enum: ['applied', 'oa', 'shortlisted', 'interview-scheduled', 'selected', 'rejected'],
        default: 'applied'
    },
    statusHistory: [statusHistorySchema],
    appliedDate: {
        type: Date,
        default: Date.now
    },
    interviewDate: { type: Date },
    interviewMode: { type: String, enum: ['online', 'offline', 'hybrid'] },
    interviewLocation: { type: String },
    rounds: [{
        roundName: String,
        roundDate: Date,
        status: { type: String, enum: ['pending', 'cleared', 'rejected'] },
        feedback: String
    }],
    finalResult: { type: String, enum: ['pending', 'selected', 'rejected'], default: 'pending' },
    offerLetter: { type: String },
    notes: { type: String }
}, {
    timestamps: true
});

// Unique constraint: one application per student per job opening
// For new multi-role system: student + company + jobOpeningId must be unique
// For legacy single-role: student + company (when jobOpeningId is null)
applicationSchema.index(
    { student: 1, company: 1, jobOpeningId: 1 },
    { unique: true, partialFilterExpression: { company: { $ne: null } } }
);

// For fast lookup: student's applications and duplicate check by company name (manual)
applicationSchema.index({ student: 1 });
applicationSchema.index({ student: 1, companyName: 1 }, { partialFilterExpression: { source: 'manual' } });

// Push initial status to history before first save
applicationSchema.pre('save', function (next) {
    if (this.isNew && this.status) {
        this.statusHistory = [{ status: this.status, changedAt: this.appliedDate || new Date() }];
    }
    next();
});

module.exports = mongoose.model('Application', applicationSchema);
