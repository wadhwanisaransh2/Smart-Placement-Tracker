import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FiArrowLeft, FiMail, FiPhone, FiBook,
    FiCheckCircle, FiXCircle, FiClock, FiTrendingUp,
    FiCalendar, FiBriefcase, FiEdit
} from 'react-icons/fi';
import './StudentProfile.css';

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchStudentProfile = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/students/${id}/profile`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProfileData(response.data);
        } catch (error) {
            console.error('Error fetching student profile:', error);
            alert('Failed to load student profile');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchStudentProfile();
    }, [fetchStudentProfile]);

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'selected': 'badge-success',
            'rejected': 'badge-danger',
            'interview-scheduled': 'badge-info',
            'shortlisted': 'badge-primary',
            'applied': 'badge-warning',
            'oa': 'badge-secondary'
        };
        return statusMap[status] || 'badge-default';
    };

    const getStatusIcon = (status) => {
        const iconMap = {
            'selected': <FiCheckCircle />,
            'rejected': <FiXCircle />,
            'interview-scheduled': <FiCalendar />,
            'shortlisted': <FiTrendingUp />,
            'applied': <FiClock />,
            'oa': <FiBriefcase />
        };
        return iconMap[status] || <FiClock />;
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!profileData) {
        return <div className="error-message">Failed to load student profile</div>;
    }

    const { student, applications, stats } = profileData;

    return (
        <div className="student-profile-container">
            <div className="profile-header">
                <button className="back-button" onClick={() => navigate('/students')}>
                    <FiArrowLeft /> Back to Students
                </button>
                <h1>Student Profile Analysis</h1>
            </div>

            {/* Student Info Card */}
            <div className="profile-card fade-in">
                <div className="student-info-header">
                    <div className="student-avatar">
                        {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="student-details">
                        <h2>{student.name}</h2>
                        <div className="student-meta">
                            <span><FiMail /> {student.email}</span>
                            {student.phone && <span><FiPhone /> {student.phone}</span>}
                            {student.rollNumber && <span><FiBook /> {student.rollNumber}</span>}
                        </div>
                        <div className="student-badges">
                            {student.department && <span className="badge badge-primary">{student.department}</span>}
                            {student.cgpa && <span className="badge badge-info">CGPA: {student.cgpa}</span>}
                            {student.graduationYear && <span className="badge badge-secondary">Class of {student.graduationYear}</span>}
                            {student.isPlaced ? (
                                <span className="badge badge-success">
                                    <FiCheckCircle /> Placed at {student.placedCompany} (₹{student.package} LPA)
                                </span>
                            ) : (
                                <span className="badge badge-warning">Not Placed</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid fade-in">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <FiBriefcase />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalApplications}</h3>
                        <p>Total Applications</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success">
                        <FiCheckCircle />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.selected}</h3>
                        <p>Selected</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon danger">
                        <FiXCircle />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.rejected}</h3>
                        <p>Rejected</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon pending">
                        <FiClock />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.pending}</h3>
                        <p>Pending</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon info">
                        <FiTrendingUp />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.successRate}%</h3>
                        <p>Success Rate</p>
                    </div>
                </div>
            </div>

            {/* Detailed Statistics */}
            <div className="detailed-stats fade-in">
                <div className="stat-item">
                    <span className="stat-label">Interview Scheduled:</span>
                    <span className="stat-value">{stats.interviewScheduled}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Shortlisted:</span>
                    <span className="stat-value">{stats.shortlisted}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Online Assessment:</span>
                    <span className="stat-value">{stats.oa}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Applied:</span>
                    <span className="stat-value">{stats.applied}</span>
                </div>
            </div>

            {/* Tabs for Applications */}
            <div className="applications-section fade-in">
                <div className="tabs">
                    <button
                        className={activeTab === 'overview' ? 'tab active' : 'tab'}
                        onClick={() => setActiveTab('overview')}
                    >
                        All Applications ({applications.all.length})
                    </button>
                    <button
                        className={activeTab === 'selected' ? 'tab active' : 'tab'}
                        onClick={() => setActiveTab('selected')}
                    >
                        Selected ({applications.selected.length})
                    </button>
                    <button
                        className={activeTab === 'rejected' ? 'tab active' : 'tab'}
                        onClick={() => setActiveTab('rejected')}
                    >
                        Rejected ({applications.rejected.length})
                    </button>
                    <button
                        className={activeTab === 'pending' ? 'tab active' : 'tab'}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending ({applications.pending.length})
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <ApplicationsList
                            applications={applications.all}
                            getStatusBadgeClass={getStatusBadgeClass}
                            getStatusIcon={getStatusIcon}
                            onUpdate={fetchStudentProfile}
                        />
                    )}
                    {activeTab === 'selected' && (
                        <ApplicationsList
                            applications={applications.selected}
                            getStatusBadgeClass={getStatusBadgeClass}
                            getStatusIcon={getStatusIcon}
                            onUpdate={fetchStudentProfile}
                        />
                    )}
                    {activeTab === 'rejected' && (
                        <ApplicationsList
                            applications={applications.rejected}
                            getStatusBadgeClass={getStatusBadgeClass}
                            getStatusIcon={getStatusIcon}
                            onUpdate={fetchStudentProfile}
                        />
                    )}
                    {activeTab === 'pending' && (
                        <ApplicationsList
                            applications={applications.pending}
                            getStatusBadgeClass={getStatusBadgeClass}
                            getStatusIcon={getStatusIcon}
                            onUpdate={fetchStudentProfile}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

const ApplicationsList = ({ applications, getStatusBadgeClass, getStatusIcon, onUpdate }) => {
    const [editingApp, setEditingApp] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [interviewDate, setInterviewDate] = useState('');
    const [notes, setNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    const handleUpdateStatus = async (appId) => {
        try {
            setUpdating(true);
            const token = localStorage.getItem('token');
            const updateData = {
                status: newStatus,
                ...(newStatus === 'interview-scheduled' && interviewDate && { interviewDate }),
                ...(notes && { notes })
            };

            console.log('Updating application:', appId, updateData);

            const response = await axios.put(
                `http://localhost:5000/api/applications/${appId}`,
                updateData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Update response:', response.data);

            alert('Application status updated successfully!');
            setEditingApp(null);
            setNewStatus('');
            setInterviewDate('');
            setNotes('');
            onUpdate(); // Refresh the data
        } catch (error) {
            console.error('Error updating application:', error);
            console.error('Error response:', error.response?.data);
            alert(error.response?.data?.message || 'Failed to update application status');
        } finally {
            setUpdating(false);
        }
    };

    const startEditing = (app) => {
        setEditingApp(app._id);
        setNewStatus(app.status);
        setInterviewDate(app.interviewDate ? new Date(app.interviewDate).toISOString().split('T')[0] : '');
        setNotes(app.notes || '');
    };

    if (applications.length === 0) {
        return <div className="no-data">No applications in this category</div>;
    }

    return (
        <div className="applications-list">
            {applications.map((app) => (
                <div key={app._id} className="application-card">
                    <div className="application-header">
                        <h3>
                            {app.source === 'placement_cell' && app.company
                                ? app.company.name
                                : app.companyName || 'Unknown Company'}
                        </h3>
                        <div className="header-actions">
                            <span className={`badge ${getStatusBadgeClass(app.status)}`}>
                                {getStatusIcon(app.status)} {app.status.replace('-', ' ').toUpperCase()}
                            </span>
                            <button
                                className="btn-icon"
                                onClick={() => startEditing(app)}
                                title="Update Status"
                            >
                                <FiEdit />
                            </button>
                        </div>
                    </div>

                    {editingApp === app._id ? (
                        <div className="edit-form">
                            <div className="form-group">
                                <label>Status:</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="form-control"
                                >
                                    <option value="applied">Applied</option>
                                    <option value="shortlisted">Shortlisted</option>
                                    <option value="oa">Online Assessment</option>
                                    <option value="interview-scheduled">Interview Scheduled</option>
                                    <option value="selected">Selected</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            {newStatus === 'interview-scheduled' && (
                                <div className="form-group">
                                    <label>Interview Date:</label>
                                    <input
                                        type="date"
                                        value={interviewDate}
                                        onChange={(e) => setInterviewDate(e.target.value)}
                                        className="form-control"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Notes (optional):</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="form-control"
                                    rows="2"
                                    placeholder="Add any notes about this application..."
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleUpdateStatus(app._id)}
                                    disabled={updating || (newStatus === 'interview-scheduled' && !interviewDate)}
                                >
                                    {updating ? 'Updating...' : 'Save Changes'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setEditingApp(null);
                                        setNewStatus('');
                                        setInterviewDate('');
                                        setNotes('');
                                    }}
                                    disabled={updating}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="application-details">
                            <div className="detail-item">
                                <strong>Role:</strong>
                                {app.source === 'placement_cell' && app.company
                                    ? app.company.jobRole
                                    : app.role || 'N/A'}
                            </div>
                            <div className="detail-item">
                                <strong>Applied Date:</strong>
                                {new Date(app.appliedDate).toLocaleDateString('en-IN')}
                            </div>
                            {app.source === 'placement_cell' && app.company && (
                                <>
                                    <div className="detail-item">
                                        <strong>Package:</strong> ₹{app.company.package} LPA
                                    </div>
                                    <div className="detail-item">
                                        <strong>Location:</strong> {app.company.location}
                                    </div>
                                </>
                            )}
                            {app.interviewDate && (
                                <div className="detail-item">
                                    <strong>Interview Date:</strong>
                                    {new Date(app.interviewDate).toLocaleDateString('en-IN')}
                                </div>
                            )}
                            {app.notes && (
                                <div className="detail-item notes">
                                    <strong>Notes:</strong> {app.notes}
                                </div>
                            )}
                        </div>
                    )}
                    {app.rounds && app.rounds.length > 0 && (
                        <div className="rounds-section">
                            <strong>Interview Rounds:</strong>
                            <div className="rounds-list">
                                {app.rounds.map((round, idx) => (
                                    <div key={idx} className="round-item">
                                        <span className="round-name">{round.roundName}</span>
                                        <span className={`round-status ${round.status}`}>
                                            {round.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default StudentProfile;
