import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, applicationAPI, resumeAPI } from '../services/api';
import { FiUser, FiMail, FiPhone, FiBook, FiBriefcase, FiEdit2, FiCalendar, FiCheckCircle, FiClock, FiXCircle, FiFileText, FiUpload, FiDownload, FiTrash2, FiEye } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        selected: 0,
        rejected: 0
    });
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        department: user?.department || '',
        cgpa: user?.cgpa || '',
        graduationYear: user?.graduationYear || '',
        rollNumber: user?.rollNumber || '',
        skills: user?.skills?.join(', ') || ''
    });

    // Fetch fresh profile data on component mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await userAPI.getProfile();
                const freshUser = response.data.user;

                // Normalize the user ID field
                if (freshUser._id && !freshUser.id) {
                    freshUser.id = freshUser._id;
                }

                // Update the auth context with fresh data
                updateUser(freshUser);

                // Update form data
                setFormData({
                    name: freshUser.name || '',
                    phone: freshUser.phone || '',
                    department: freshUser.department || '',
                    cgpa: freshUser.cgpa || '',
                    graduationYear: freshUser.graduationYear || '',
                    rollNumber: freshUser.rollNumber || '',
                    skills: freshUser.skills?.join(', ') || ''
                });
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, []); // Only run on mount

    // Update form data when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                department: user.department || '',
                cgpa: user.cgpa || '',
                graduationYear: user.graduationYear || '',
                rollNumber: user.rollNumber || '',
                skills: user.skills?.join(', ') || ''
            });
        }
    }, [user]);

    // Fetch application statistics for students
    useEffect(() => {
        const fetchStats = async () => {
            if (user?.role === 'student') {
                try {
                    const response = await applicationAPI.getAll();
                    const applications = response.data.applications || [];

                    console.log('Fetched applications for stats:', applications.length);

                    setStats({
                        total: applications.length,
                        pending: applications.filter(app =>
                            ['applied', 'oa', 'shortlisted', 'interview-scheduled'].includes(app.status)
                        ).length,
                        selected: applications.filter(app => app.status === 'selected').length,
                        rejected: applications.filter(app => app.status === 'rejected').length
                    });
                } catch (error) {
                    console.error('Error fetching application stats:', error);
                }
            }
        };

        fetchStats();
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Get user ID - try both id and _id fields
        const userId = user?.id || user?._id;

        // Validate user ID exists
        if (!user || !userId) {
            console.error('User object:', user);
            alert('Error: User not found. Please try logging in again.');
            return;
        }

        try {
            const updateData = {
                ...formData,
                cgpa: formData.cgpa ? parseFloat(formData.cgpa) : undefined,
                graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
            };

            console.log('Updating profile for user ID:', userId);
            console.log('Update data:', updateData);

            const response = await userAPI.updateProfile(userId, updateData);
            const updatedUser = response.data.user;

            // Normalize the user ID field
            if (updatedUser._id && !updatedUser.id) {
                updatedUser.id = updatedUser._id;
            }

            updateUser(updatedUser);
            setEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
            alert(`Failed to update profile: ${errorMessage}`);
        }
    };

    // Resume handlers
    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        try {
            setUploadingResume(true);
            const formData = new FormData();
            formData.append('resume', file);

            const response = await resumeAPI.upload(formData);

            // Update user context with new resume path
            updateUser({ ...user, resume: response.data.resume });

            alert('Resume uploaded successfully!');
        } catch (error) {
            console.error('Resume upload error:', error);
            alert(error.response?.data?.message || 'Failed to upload resume');
        } finally {
            setUploadingResume(false);
        }
    };

    const handleResumeDownload = async () => {
        try {
            const response = await resumeAPI.download();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${user.name}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Resume download error:', error);
            alert('Failed to download resume');
        }
    };

    const handleResumeView = async () => {
        try {
            const response = await resumeAPI.view();
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (error) {
            console.error('Resume view error:', error);
            alert('Failed to view resume');
        }
    };

    const handleResumeDelete = async () => {
        if (!window.confirm('Are you sure you want to delete your resume?')) {
            return;
        }

        try {
            await resumeAPI.delete();
            updateUser({ ...user, resume: null });
            alert('Resume deleted successfully');
        } catch (error) {
            console.error('Resume delete error:', error);
            alert('Failed to delete resume');
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header fade-in">
                <h1>My Profile</h1>
                <button className="btn btn-primary" onClick={() => setEditing(!editing)}>
                    <FiEdit2 /> {editing ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>

            {/* Statistics Cards for Students */}
            {user?.role === 'student' && !editing && (
                <div className="profile-stats-grid fade-in">
                    <div className="stat-card">
                        <FiFileText className="stat-card-icon" />
                        <div className="stat-card-value">{stats.total}</div>
                        <div className="stat-card-label">Total Applications</div>
                    </div>
                    <div className="stat-card">
                        <FiClock className="stat-card-icon" style={{ color: 'var(--warning)' }} />
                        <div className="stat-card-value">{stats.pending}</div>
                        <div className="stat-card-label">Pending</div>
                    </div>
                    <div className="stat-card">
                        <FiCheckCircle className="stat-card-icon" style={{ color: 'var(--success)' }} />
                        <div className="stat-card-value">{stats.selected}</div>
                        <div className="stat-card-label">Selected</div>
                    </div>
                    <div className="stat-card">
                        <FiXCircle className="stat-card-icon" style={{ color: 'var(--error)' }} />
                        <div className="stat-card-value">{stats.rejected}</div>
                        <div className="stat-card-label">Rejected</div>
                    </div>
                </div>
            )}

            {/* Resume Section for Students */}
            {user?.role === 'student' && !editing && (
                <div className="resume-section fade-in" style={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                    border: '2px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.25rem', fontWeight: '700' }}>
                            <FiFileText style={{ marginRight: '0.5rem' }} />
                            Resume
                        </h3>
                        {user.resume && (
                            <span style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                            }}>
                                <FiCheckCircle style={{ marginRight: '0.25rem' }} />
                                Uploaded
                            </span>
                        )}
                    </div>

                    {user.resume ? (
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={handleResumeView}
                                className="btn btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    border: 'none'
                                }}
                            >
                                <FiEye /> View Resume
                            </button>
                            <button
                                onClick={handleResumeDownload}
                                className="btn btn-outline"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <FiDownload /> Download
                            </button>
                            <label
                                htmlFor="resume-upload"
                                className="btn btn-outline"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    margin: 0
                                }}
                            >
                                <FiUpload /> {uploadingResume ? 'Uploading...' : 'Replace'}
                                <input
                                    id="resume-upload"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleResumeUpload}
                                    style={{ display: 'none' }}
                                    disabled={uploadingResume}
                                />
                            </label>
                            <button
                                onClick={handleResumeDelete}
                                className="btn btn-outline"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: '#ef4444',
                                    borderColor: '#ef4444'
                                }}
                            >
                                <FiTrash2 /> Delete
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p style={{ color: '#718096', marginBottom: '1rem', fontSize: '0.95rem' }}>
                                Upload your resume to apply for companies. Only PDF files are accepted (Max 5MB).
                            </p>
                            <label
                                htmlFor="resume-upload"
                                className="btn btn-primary"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    border: 'none'
                                }}
                            >
                                <FiUpload /> {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                                <input
                                    id="resume-upload"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleResumeUpload}
                                    style={{ display: 'none' }}
                                    disabled={uploadingResume}
                                />
                            </label>
                        </div>
                    )}
                </div>
            )}

            <div className="profile-grid">
                {/* Left Side - Profile Card */}
                <div className="profile-card fade-in">
                    <div className="profile-avatar">
                        <FiUser size={72} />
                    </div>
                    <h2>{user?.name}</h2>
                    <p className="text-muted">{user?.role === 'admin' ? 'Administrator' : 'Student'}</p>
                    {user?.isPlaced && (
                        <div className="badge badge-success mt-2">
                            Placed at {user.placedCompany}
                        </div>
                    )}

                    {/* Quick Stats in Profile Card */}
                    {user?.role === 'student' && !editing && (
                        <div className="profile-quick-stats">
                            <div className="quick-stat-item">
                                <span className="quick-stat-value">{user?.cgpa || 'N/A'}</span>
                                <span className="quick-stat-label">CGPA</span>
                            </div>
                            <div className="quick-stat-item">
                                <span className="quick-stat-value">{user?.graduationYear || 'N/A'}</span>
                                <span className="quick-stat-label">Grad Year</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side - Profile Details */}
                <div className="profile-details fade-in">
                    {editing ? (
                        <form onSubmit={handleSubmit} className="profile-form">
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Basic Information</h3>

                            <div className="input-group">
                                <label><FiUser /> Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {user?.role === 'student' && (
                                <>
                                    <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Academic Details</h3>

                                    <div className="input-group">
                                        <label><FiBook /> Roll Number</label>
                                        <input
                                            type="text"
                                            name="rollNumber"
                                            value={formData.rollNumber}
                                            onChange={handleChange}
                                            disabled
                                            style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                                        />
                                        <small className="text-muted">Roll number cannot be changed</small>
                                    </div>

                                    <div className="input-group">
                                        <label><FiBriefcase /> Department *</label>
                                        <select
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            <option value="Computer Science">Computer Science</option>
                                            <option value="Information Technology">Information Technology</option>
                                            <option value="Electronics">Electronics</option>
                                            <option value="Mechanical">Mechanical</option>
                                            <option value="Civil">Civil</option>
                                            <option value="Electrical">Electrical</option>
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label><FiBook /> CGPA *</label>
                                        <input
                                            type="number"
                                            name="cgpa"
                                            value={formData.cgpa}
                                            onChange={handleChange}
                                            step="0.01"
                                            min="0"
                                            max="10"
                                            required
                                            placeholder="Enter your CGPA (0-10)"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label><FiCalendar /> Graduation Year *</label>
                                        <input
                                            type="number"
                                            name="graduationYear"
                                            value={formData.graduationYear}
                                            onChange={handleChange}
                                            min="2020"
                                            max="2030"
                                            required
                                            placeholder="e.g., 2026"
                                        />
                                    </div>

                                    <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Contact Information</h3>

                                    <div className="input-group">
                                        <label><FiPhone /> Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Enter your phone number"
                                        />
                                    </div>

                                    <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Skills</h3>

                                    <div className="input-group">
                                        <label>Skills (comma separated)</label>
                                        <textarea
                                            name="skills"
                                            value={formData.skills}
                                            onChange={handleChange}
                                            placeholder="e.g., JavaScript, React, Node.js, Python"
                                            rows="3"
                                        />
                                    </div>
                                </>
                            )}

                            {user?.role === 'admin' && (
                                <>
                                    <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Contact Information</h3>

                                    <div className="input-group">
                                        <label><FiPhone /> Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                                Save Changes
                            </button>
                        </form>
                    ) : (
                        <div className="info-list">
                            {/* Basic Information Section */}
                            <div>
                                <h3 className="info-section-title">Basic Information</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                                    <div className="info-item">
                                        <FiMail className="info-icon" />
                                        <div>
                                            <span className="info-label">Email</span>
                                            <span className="info-value">{user?.email}</span>
                                        </div>
                                    </div>

                                    {user?.phone && (
                                        <div className="info-item">
                                            <FiPhone className="info-icon" />
                                            <div>
                                                <span className="info-label">Phone</span>
                                                <span className="info-value">{user.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {user?.role === 'student' && (
                                <>
                                    {/* Academic Information Section */}
                                    <div style={{ marginTop: 'var(--spacing-xl)' }}>
                                        <h3 className="info-section-title">Academic Information</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                                            <div className="info-item">
                                                <FiBook className="info-icon" />
                                                <div>
                                                    <span className="info-label">Roll Number</span>
                                                    <span className="info-value">{user?.rollNumber || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div className="info-item">
                                                <FiBriefcase className="info-icon" />
                                                <div>
                                                    <span className="info-label">Department</span>
                                                    <span className="info-value">{user?.department || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div className="info-item">
                                                <FiBook className="info-icon" />
                                                <div>
                                                    <span className="info-label">CGPA</span>
                                                    <span className="info-value">{user?.cgpa || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div className="info-item">
                                                <FiCalendar className="info-icon" />
                                                <div>
                                                    <span className="info-label">Graduation Year</span>
                                                    <span className="info-value">{user?.graduationYear || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills Section */}
                                    {user?.skills && user.skills.length > 0 && (
                                        <div style={{ marginTop: 'var(--spacing-xl)' }}>
                                            <h3 className="info-section-title">Skills & Expertise</h3>
                                            <div className="info-item">
                                                <div>
                                                    <div className="skills-list">
                                                        {user.skills.map((skill, index) => (
                                                            <span key={index} className="badge badge-primary">{skill}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {user?.role === 'admin' && (
                                <div style={{ marginTop: 'var(--spacing-xl)' }}>
                                    <h3 className="info-section-title">Role & Permissions</h3>
                                    <div className="info-item">
                                        <FiBriefcase className="info-icon" />
                                        <div>
                                            <span className="info-label">Access Level</span>
                                            <span className="info-value">Full Administrative Access</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
