import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI, analyticsAPI } from '../services/api';
import { FiBriefcase, FiClock, FiPlus, FiCalendar, FiHash, FiEye } from 'react-icons/fi';
import ApplicationTimeline from '../components/ApplicationTimeline';
import './Dashboard.css';
import './MyApplications.css';

const STATUS_OPTIONS = [
    { value: 'applied', label: 'Applied' },
    { value: 'oa', label: 'OA' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview-scheduled', label: 'Interview' },
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' }
];

const SORT_OPTIONS = [
    { value: 'deadline', label: 'Nearest deadline' },
    { value: 'status', label: 'Status' },
    { value: 'package', label: 'Package' },
    { value: 'recent', label: 'Most recent' }
];

const getStatusBadge = (status) => {
    const badges = {
        applied: 'badge-info',
        oa: 'badge-primary',
        shortlisted: 'badge-primary',
        'interview-scheduled': 'badge-warning',
        selected: 'badge-success',
        rejected: 'badge-error'
    };
    return badges[status] || 'badge-info';
};

function getCompanyName(app) {
    return app.company?.name || app.companyName || '—';
}

function getRole(app) {
    return app.company?.jobRole || app.role || '—';
}

function getDeadline(app) {
    return app.company?.applicationDeadline || app.applicationDeadline;
}

function getDaysRemaining(app) {
    const deadline = getDeadline(app);
    if (!deadline) return null;
    const now = new Date();
    const d = new Date(deadline);
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    return diff;
}

const MyApplications = () => {
    const [applications, setApplications] = useState([]);
    const [sortBy, setSortBy] = useState('deadline');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [form, setForm] = useState({
        companyName: '',
        role: '',
        applicationDeadline: '',
        status: 'applied'
    });
    const [submitError, setSubmitError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await analyticsAPI.getSortedApplications(sortBy);
            setApplications(res.data.applications || []);
        } catch (err) {
            const fallback = await applicationAPI.getAll().catch(() => ({ data: { applications: [] } }));
            setApplications(fallback.data.applications || []);
        } finally {
            setLoading(false);
        }
    }, [sortBy]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleAddApplication = async (e) => {
        e.preventDefault();
        setSubmitError('');
        if (!form.companyName.trim() || !form.role.trim() || !form.applicationDeadline) {
            setSubmitError('Company name, role and deadline are required.');
            return;
        }
        try {
            await applicationAPI.create({
                companyName: form.companyName.trim(),
                role: form.role.trim(),
                applicationDeadline: form.applicationDeadline,
                status: form.status
            });
            setForm({ companyName: '', role: '', applicationDeadline: '', status: 'applied' });
            setShowAddModal(false);
            fetchApplications();
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Failed to add application.');
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        setUpdatingId(appId);
        try {
            await applicationAPI.update(appId, { status: newStatus });
            fetchApplications();
        } catch (err) {
            console.error('Update status failed:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading && applications.length === 0) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header fade-in flex-between">
                <div>
                    <h1>My Applications</h1>
                    <p className="text-muted">Track and prioritize your placement applications</p>
                </div>
                <div className="my-apps-actions">
                    <label className="sort-label">
                        <span>Sort by</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        <FiPlus /> Add application
                    </button>
                </div>
            </div>

            {applications.length === 0 ? (
                <div className="card text-center">
                    <FiBriefcase size={64} style={{ margin: '0 auto var(--spacing-lg)', opacity: 0.5 }} />
                    <h2>No Applications Yet</h2>
                    <p className="text-muted">Add applications manually or apply via placement cell companies</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <FiPlus /> Add application
                        </button>
                        <Link to="/companies" className="btn btn-outline">Browse companies</Link>
                    </div>
                </div>
            ) : (
                <div className="card fade-in">
                    <div className="applications-list my-apps-list">
                        {applications.map((app) => {
                            const days = getDaysRemaining(app);
                            const isExpanded = expandedId === app._id;
                            const isAutoRejected = app.status === 'rejected' && app.notes?.includes('Auto-rejected');
                            const isDisabled = app.status === 'rejected' || app.status === 'selected';

                            return (
                                <div
                                    key={app._id}
                                    className={`application-item my-app-item ${isDisabled ? 'disabled-application' : ''}`}
                                    style={{
                                        opacity: isDisabled ? 0.6 : 1,
                                        pointerEvents: isAutoRejected ? 'none' : 'auto'
                                    }}
                                >
                                    <div className="application-info">
                                        <h3>{getCompanyName(app)}</h3>
                                        <p className="text-muted">
                                            <FiBriefcase /> {getRole(app)}
                                        </p>
                                        <p className="text-muted">
                                            <FiClock /> Applied on {new Date(app.appliedDate).toLocaleDateString()}
                                        </p>
                                        {getDeadline(app) && (
                                            <p className="text-muted">
                                                <FiCalendar /> Deadline: {new Date(getDeadline(app)).toLocaleDateString()}
                                                {days !== null && (
                                                    <span className={`days-remaining ${days <= 3 ? 'urgent' : days <= 7 ? 'soon' : ''}`}>
                                                        {' '}({days > 0 ? `${days} days left` : days === 0 ? 'Today' : 'Overdue'})
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                        {app.source === 'manual' && (
                                            <span className="badge badge-outline" title="Manually added">Manual</span>
                                        )}
                                        {isAutoRejected && (
                                            <div className="alert alert-info" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                                🔒 {app.notes}
                                            </div>
                                        )}
                                        {app.statusHistory && app.statusHistory.length > 1 && (
                                            <button
                                                type="button"
                                                className="link-button status-history-toggle"
                                                onClick={() => setExpandedId(isExpanded ? null : app._id)}
                                            >
                                                <FiHash /> Status history ({app.statusHistory.length})
                                            </button>
                                        )}
                                        {isExpanded && app.statusHistory && (
                                            <ul className="status-history-list">
                                                {app.statusHistory.map((entry, i) => (
                                                    <li key={i}>
                                                        {entry.status} — {new Date(entry.changedAt).toLocaleString()}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {app.interviewDate && (
                                            <p className="text-muted">
                                                Interview: {new Date(app.interviewDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="application-actions">
                                        <span className={`badge ${getStatusBadge(app.status)}`}>
                                            {app.status.replace('-', ' ')}
                                        </span>
                                        {app.status !== 'selected' && app.status !== 'rejected' && (
                                            <select
                                                className="status-select"
                                                value={app.status}
                                                onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                                disabled={!!updatingId}
                                            >
                                                {STATUS_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add application</h2>
                            <button type="button" className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <p className="text-muted mb-3">Track an application (off-campus or manual)</p>
                        <form onSubmit={handleAddApplication}>
                            {submitError && <div className="alert alert-error mb-3">{submitError}</div>}
                            <div className="form-group">
                                <label>Company name *</label>
                                <input
                                    type="text"
                                    value={form.companyName}
                                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                                    placeholder="e.g. Google"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Role *</label>
                                <input
                                    type="text"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    placeholder="e.g. SDE Intern"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Application deadline *</label>
                                <input
                                    type="date"
                                    value={form.applicationDeadline}
                                    onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyApplications;
