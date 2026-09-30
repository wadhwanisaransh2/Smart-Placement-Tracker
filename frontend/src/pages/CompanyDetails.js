import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companyAPI, applicationAPI, resumeAPI } from '../services/api';
import { FiArrowLeft, FiBriefcase, FiMapPin, FiDollarSign, FiCalendar, FiUsers, FiCheckCircle, FiGlobe, FiEdit, FiFileText, FiAward } from 'react-icons/fi';
import './CompanyDetails.css';

const CompanyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isStudent, isAdmin } = useAuth();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [selectedRoleIndex, setSelectedRoleIndex] = useState(0); // Track selected job role
    const [showEditModal, setShowEditModal] = useState(false);
    const [editNumRoles, setEditNumRoles] = useState(0);
    const [editJobOpenings, setEditJobOpenings] = useState([]);
    const [resumeScore, setResumeScore] = useState(null);
    const [scoringResume, setScoringResume] = useState(false);
    const [showScoreModal, setShowScoreModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        website: '',
        industry: '',
        location: '',
        jobRole: '',
        jobDescription: '',
        package: '',
        applicationDeadline: '',
        visitDate: '',
        totalPositions: 1,
        status: 'upcoming',
        eligibilityCriteria: {
            minCGPA: 0,
            allowedDepartments: [],
            graduationYear: new Date().getFullYear(),
            backlogs: 0
        }
    });

    useEffect(() => {
        // Reset hasApplied when navigating to a different company
        setHasApplied(false);
        fetchCompanyDetails();
    }, [id]);

    const fetchCompanyDetails = async () => {
        try {
            setLoading(true);
            const response = await companyAPI.getById(id);
            setCompany(response.data.company);

            // Check if student has already applied to THIS specific company
            if (isStudent) {
                const applicationsRes = await applicationAPI.getAll();
                // Filter applications to find if student applied to THIS company
                const appliedToThisCompany = applicationsRes.data.applications.some(
                    app => app.company?._id === id || app.company === id
                );
                setHasApplied(appliedToThisCompany);
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreResume = async () => {
        if (!user.resume) {
            alert('Please upload your resume first to get it scored!');
            navigate('/profile');
            return;
        }

        try {
            setScoringResume(true);
            const response = await resumeAPI.score(id);
            setResumeScore(response.data);
            setShowScoreModal(true);
        } catch (error) {
            console.error('Resume scoring error:', error);
            alert(error.response?.data?.message || 'Failed to score resume');
        } finally {
            setScoringResume(false);
        }
    };

    const handleApply = async () => {
        if (!isStudent) return;

        // Check if resume is uploaded
        if (!user.resume) {
            const confirmApply = window.confirm(
                '⚠️ Resume Not Uploaded!\n\n' +
                'You haven\'t uploaded your resume yet. While you can still apply, ' +
                'uploading your resume increases your chances of selection.\n\n' +
                'Do you want to:\n' +
                '• Click "Cancel" to go to Profile and upload resume first (Recommended)\n' +
                '• Click "OK" to apply without resume'
            );

            if (!confirmApply) {
                navigate('/profile');
                return;
            }
        }

        try {
            setApplying(true);
            await applicationAPI.create({ companyId: id });
            alert('Application submitted successfully!' + (user.resume ? ' Your resume has been attached.' : ''));
            setHasApplied(true);
            fetchCompanyDetails();
        } catch (error) {
            console.error('Error applying:', error);
            alert(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setApplying(false);
        }
    };

    const handleEditClick = () => {
        if (!company) return;

        // Pre-fill form with current company data
        setFormData({
            name: company.name || '',
            description: company.description || '',
            website: company.website || '',
            industry: company.industry || '',
            location: company.location || '',
            jobRole: company.jobRole || '',
            jobDescription: company.jobDescription || '',
            package: company.package || '',
            applicationDeadline: company.applicationDeadline ? new Date(company.applicationDeadline).toISOString().split('T')[0] : '',
            visitDate: company.visitDate ? new Date(company.visitDate).toISOString().split('T')[0] : '',
            totalPositions: company.totalPositions || 1,
            status: company.status || 'upcoming',
            eligibilityCriteria: {
                minCGPA: company.eligibilityCriteria?.minCGPA || 0,
                allowedDepartments: company.eligibilityCriteria?.allowedDepartments || [],
                graduationYear: company.eligibilityCriteria?.graduationYear || new Date().getFullYear(),
                backlogs: company.eligibilityCriteria?.backlogs || 0
            }
        });

        // Initialize job openings for editing
        setEditNumRoles(0);
        setEditJobOpenings([]);

        setShowEditModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('eligibility.')) {
            const field = name.split('.')[1];
            setFormData({
                ...formData,
                eligibilityCriteria: {
                    ...formData.eligibilityCriteria,
                    [field]: value
                }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleEditNumRolesChange = (num) => {
        const count = parseInt(num) || 0;
        setEditNumRoles(count);

        // Adjust editJobOpenings array
        const newOpenings = [];
        for (let i = 0; i < count; i++) {
            if (editJobOpenings[i]) {
                newOpenings.push(editJobOpenings[i]);
            } else {
                newOpenings.push({
                    role: '',
                    description: '',
                    package: '',
                    totalPositions: 1,
                    applicationDeadline: '',
                    eligibilityCriteria: {
                        minCGPA: 0,
                        allowedDepartments: [],
                        graduationYear: new Date().getFullYear(),
                        backlogs: 0
                    }
                });
            }
        }
        setEditJobOpenings(newOpenings);
    };

    const handleEditJobOpeningChange = (index, field, value) => {
        const newJobOpenings = [...editJobOpenings];

        if (field.startsWith('eligibility.')) {
            const eligibilityField = field.split('.')[1];
            newJobOpenings[index] = {
                ...newJobOpenings[index],
                eligibilityCriteria: {
                    ...newJobOpenings[index].eligibilityCriteria,
                    [eligibilityField]: value
                }
            };
        } else {
            newJobOpenings[index] = {
                ...newJobOpenings[index],
                [field]: value
            };
        }

        setEditJobOpenings(newJobOpenings);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            // Build update object with only changed fields
            const updateData = {};

            // Compare each field with original company data and only include if changed
            if (formData.name.trim() !== company.name) {
                updateData.name = formData.name.trim();
            }

            if (formData.jobRole.trim() !== company.jobRole) {
                updateData.jobRole = formData.jobRole.trim();
            }

            if (formData.description?.trim() !== company.description) {
                updateData.description = formData.description?.trim() || 'No description provided';
            }

            if (formData.jobDescription?.trim() !== company.jobDescription) {
                updateData.jobDescription = formData.jobDescription?.trim() || formData.description?.trim() || 'No job description provided';
            }

            if (formData.website?.trim() !== company.website) {
                updateData.website = formData.website?.trim() || '';
            }

            if (formData.industry?.trim() !== company.industry) {
                updateData.industry = formData.industry?.trim() || '';
            }

            if (formData.location?.trim() !== company.location) {
                updateData.location = formData.location?.trim() || '';
            }

            if (formData.status !== company.status) {
                updateData.status = formData.status;
            }

            // Compare dates
            const originalDeadline = new Date(company.applicationDeadline).toISOString().split('T')[0];
            if (formData.applicationDeadline !== originalDeadline) {
                updateData.applicationDeadline = new Date(formData.applicationDeadline).toISOString();
            }

            if (formData.visitDate) {
                const originalVisitDate = company.visitDate ? new Date(company.visitDate).toISOString().split('T')[0] : '';
                if (formData.visitDate !== originalVisitDate) {
                    updateData.visitDate = new Date(formData.visitDate).toISOString();
                }
            }

            if (parseFloat(formData.package) !== company.package) {
                updateData.package = parseFloat(formData.package);
            }

            if (parseInt(formData.totalPositions) !== company.totalPositions) {
                updateData.totalPositions = parseInt(formData.totalPositions) || 1;
            }

            // Check eligibility criteria changes
            const eligibilityChanged =
                parseFloat(formData.eligibilityCriteria.minCGPA) !== company.eligibilityCriteria?.minCGPA ||
                parseInt(formData.eligibilityCriteria.backlogs) !== company.eligibilityCriteria?.backlogs ||
                parseInt(formData.eligibilityCriteria.graduationYear) !== company.eligibilityCriteria?.graduationYear ||
                JSON.stringify(formData.eligibilityCriteria.allowedDepartments) !== JSON.stringify(company.eligibilityCriteria?.allowedDepartments || []);

            if (eligibilityChanged) {
                updateData.eligibilityCriteria = {
                    minCGPA: parseFloat(formData.eligibilityCriteria.minCGPA) || 0,
                    allowedDepartments: formData.eligibilityCriteria.allowedDepartments || [],
                    graduationYear: parseInt(formData.eligibilityCriteria.graduationYear) || new Date().getFullYear(),
                    backlogs: parseInt(formData.eligibilityCriteria.backlogs) || 0
                };
            }

            // Add new job openings if any
            if (editNumRoles > 0 && editJobOpenings.length > 0) {
                // Validate new job openings
                for (let i = 0; i < editJobOpenings.length; i++) {
                    const job = editJobOpenings[i];
                    if (!job.role?.trim()) {
                        alert(`Job role is required for New Role #${i + 1}`);
                        return;
                    }
                    if (!job.package || isNaN(parseFloat(job.package))) {
                        alert(`Valid package amount is required for ${job.role || `New Role #${i + 1}`}`);
                        return;
                    }
                    if (!job.applicationDeadline) {
                        alert(`Application deadline is required for ${job.role || `New Role #${i + 1}`}`);
                        return;
                    }
                }

                updateData.$push = {
                    jobOpenings: {
                        $each: editJobOpenings.map(job => ({
                            role: job.role.trim(),
                            description: job.description?.trim() || 'No job description provided',
                            package: parseFloat(job.package),
                            totalPositions: parseInt(job.totalPositions) || 1,
                            applicationDeadline: new Date(job.applicationDeadline).toISOString(),
                            eligibilityCriteria: {
                                minCGPA: parseFloat(job.eligibilityCriteria.minCGPA) || 0,
                                allowedDepartments: job.eligibilityCriteria.allowedDepartments || [],
                                graduationYear: parseInt(job.eligibilityCriteria.graduationYear) || new Date().getFullYear(),
                                backlogs: parseInt(job.eligibilityCriteria.backlogs) || 0
                            }
                        }))
                    }
                };
            }

            // Check if any changes were made
            if (Object.keys(updateData).length === 0) {
                alert('No changes detected');
                return;
            }

            console.log('Updating company with:', updateData);
            await companyAPI.update(id, updateData);
            setShowEditModal(false);
            setEditNumRoles(0);
            setEditJobOpenings([]);
            fetchCompanyDetails();
            alert('Company updated successfully!');
        } catch (error) {
            console.error('Error updating company:', error);
            alert(error.response?.data?.message || 'Failed to update company');
        }
    };

    // Check if company has multiple job roles
    const hasMultipleRoles = () => {
        return company?.jobOpenings && company.jobOpenings.length > 0;
    };

    // Get the currently selected job opening
    const getCurrentJobOpening = () => {
        if (hasMultipleRoles()) {
            return company.jobOpenings[selectedRoleIndex];
        }
        // Fallback to legacy single role
        return {
            role: company?.jobRole,
            description: company?.jobDescription,
            package: company?.package,
            totalPositions: company?.totalPositions,
            applicationDeadline: company?.applicationDeadline,
            eligibilityCriteria: company?.eligibilityCriteria,
            appliedStudents: company?.appliedStudents,
            selectedStudents: company?.selectedStudents
        };
    };

    const isEligible = () => {
        if (!company || !user) return false;

        const currentJob = getCurrentJobOpening();
        const { eligibilityCriteria } = currentJob;

        // Check if student has filled required profile information
        if (user.cgpa === undefined || user.cgpa === null) {
            return false;
        }

        if (!user.department || user.department === '') {
            return false;
        }

        // Check CGPA requirement
        if (user.cgpa < eligibilityCriteria.minCGPA) {
            return false;
        }

        // Check department requirement
        if (eligibilityCriteria.allowedDepartments &&
            eligibilityCriteria.allowedDepartments.length > 0 &&
            !eligibilityCriteria.allowedDepartments.includes(user.department)) {
            return false;
        }

        // Check graduation year
        if (eligibilityCriteria.graduationYear && user.graduationYear) {
            if (user.graduationYear < eligibilityCriteria.graduationYear) {
                return false;
            }
        }

        return true;
    };

    const getIneligibilityReason = () => {
        if (!company || !user) return 'Loading...';

        const currentJob = getCurrentJobOpening();
        const { eligibilityCriteria } = currentJob;

        // Check profile completeness first
        if (user.cgpa === undefined || user.cgpa === null) {
            return 'Complete your profile (CGPA required)';
        }

        if (!user.department || user.department === '') {
            return 'Complete your profile (Department required)';
        }

        // Check specific eligibility criteria
        if (user.cgpa < eligibilityCriteria.minCGPA) {
            return `CGPA too low (Required: ${eligibilityCriteria.minCGPA}, Yours: ${user.cgpa})`;
        }

        if (eligibilityCriteria.allowedDepartments &&
            eligibilityCriteria.allowedDepartments.length > 0 &&
            !eligibilityCriteria.allowedDepartments.includes(user.department)) {
            return `Department not allowed (Allowed: ${eligibilityCriteria.allowedDepartments.join(', ')})`;
        }

        if (eligibilityCriteria.graduationYear && user.graduationYear) {
            if (user.graduationYear < eligibilityCriteria.graduationYear) {
                return `Graduation year too early (Required: ${eligibilityCriteria.graduationYear} or later, Yours: ${user.graduationYear})`;
            }
        }

        return 'Not Eligible';
    };

    const isDeadlinePassed = () => {
        if (!company) return false;
        const currentJob = getCurrentJobOpening();
        return new Date() > new Date(currentJob.applicationDeadline);
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="container">
                <div className="empty-state">
                    <h2>Company not found</h2>
                    <button className="btn btn-primary" onClick={() => navigate('/companies')}>
                        Back to Companies
                    </button>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const badges = {
            upcoming: 'badge-info',
            ongoing: 'badge-warning',
            completed: 'badge-success',
            cancelled: 'badge-error'
        };
        return badges[status] || 'badge-info';
    };

    const currentJob = getCurrentJobOpening();

    return (
        <div className="company-details-container">
            <button className="back-btn" onClick={() => navigate('/companies')}>
                <FiArrowLeft /> Back to Companies
            </button>

            <div className="company-details-header fade-in">
                <div className="company-title-section">
                    <h1>{company.name}</h1>
                    <span className={`badge ${getStatusBadge(company.status)}`}>
                        {company.status}
                    </span>
                </div>

                {isAdmin && (
                    <div className="action-section">
                        <button className="btn btn-primary" onClick={handleEditClick}>
                            <FiEdit /> Edit Company
                        </button>
                    </div>
                )}

                {isStudent && (
                    <div className="action-section">
                        {user.isPlaced ? (
                            <div className="alert alert-info">
                                You are already placed at {user.placedCompany}
                            </div>
                        ) : hasApplied ? (
                            <button className="btn btn-success" disabled>
                                <FiCheckCircle /> Applied
                            </button>
                        ) : company.appliedStudents?.length >= company.totalPositions ? (
                            <button className="btn btn-outline" disabled>
                                All Positions Filled ({company.appliedStudents.length}/{company.totalPositions})
                            </button>
                        ) : isDeadlinePassed() ? (
                            <button className="btn btn-outline" disabled>
                                Deadline Passed
                            </button>
                        ) : !isEligible() ? (
                            <div>
                                <button className="btn btn-outline" disabled title={getIneligibilityReason()}>
                                    {getIneligibilityReason()}
                                </button>
                                {(user.cgpa === undefined || user.cgpa === null || !user.department) && (
                                    <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#e53e3e' }}>
                                        Please <a href="/profile" style={{ color: '#667eea', textDecoration: 'underline' }}>update your profile</a> with CGPA and Department to apply.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        className="btn btn-outline"
                                        onClick={handleScoreResume}
                                        disabled={scoringResume}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FiAward /> {scoringResume ? 'Scoring...' : 'Score My Resume'}
                                    </button>
                                    <button className="btn btn-primary" onClick={handleApply} disabled={applying}>
                                        {applying ? 'Applying...' : 'Apply Now'}
                                    </button>
                                </div>
                                {!user.resume && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 12px',
                                        background: 'rgba(251, 191, 36, 0.1)',
                                        border: '1px solid rgba(251, 191, 36, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        color: '#f59e0b'
                                    }}>
                                        <span>⚠️</span>
                                        <span>Resume not uploaded - <a href="/profile" style={{ color: '#667eea', textDecoration: 'underline', fontWeight: '600' }}>Upload now</a></span>
                                    </div>
                                )}
                                {user.resume && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 12px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        color: '#10b981'
                                    }}>
                                        <FiCheckCircle />
                                        <span>Resume ready to submit</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="company-details-grid">
                <div className="company-main-info fade-in">
                    {/* Job Roles Section - Show clickable links if multiple roles */}
                    {hasMultipleRoles() ? (
                        <div className="info-card">
                            <h2>Job Roles ({company.jobOpenings.length})</h2>
                            <div className="job-roles-list">
                                {company.jobOpenings.map((job, index) => (
                                    <button
                                        key={index}
                                        className={`job-role-link ${selectedRoleIndex === index ? 'active' : ''}`}
                                        onClick={() => setSelectedRoleIndex(index)}
                                    >
                                        <FiBriefcase />
                                        <div className="job-role-info">
                                            <span className="job-role-name">{job.role}</span>
                                            <span className="job-role-package">₹{job.package} LPA</span>
                                        </div>
                                        {selectedRoleIndex === index && (
                                            <span className="active-indicator">Selected</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                                Click on a role to view its specific requirements and details
                            </p>
                        </div>
                    ) : (
                        <div className="info-card">
                            <h2>Job Role</h2>
                            <p className="role-title">
                                <FiBriefcase /> {company.jobRole}
                            </p>
                        </div>
                    )}

                    <div className="info-card">
                        <h2>About the Company</h2>
                        <p>{company.description}</p>
                    </div>

                    <div className="info-card">
                        <h2>Job Description - {currentJob.role}</h2>
                        <p>{currentJob.description}</p>
                    </div>

                    <div className="info-card">
                        <h2>Key Details</h2>
                        <div className="details-grid">
                            <div className="detail-box">
                                <FiDollarSign className="detail-icon" />
                                <div>
                                    <span className="detail-label">Package</span>
                                    <span className="detail-value">₹{currentJob.package} LPA</span>
                                </div>
                            </div>

                            {company.location && (
                                <div className="detail-box">
                                    <FiMapPin className="detail-icon" />
                                    <div>
                                        <span className="detail-label">Location</span>
                                        <span className="detail-value">{company.location}</span>
                                    </div>
                                </div>
                            )}

                            {company.industry && (
                                <div className="detail-box">
                                    <FiBriefcase className="detail-icon" />
                                    <div>
                                        <span className="detail-label">Industry</span>
                                        <span className="detail-value">{company.industry}</span>
                                    </div>
                                </div>
                            )}

                            <div className="detail-box">
                                <FiUsers className="detail-icon" />
                                <div>
                                    <span className="detail-label">Positions</span>
                                    <span className="detail-value">{currentJob.totalPositions}</span>
                                </div>
                            </div>

                            <div className="detail-box">
                                <FiCalendar className="detail-icon" />
                                <div>
                                    <span className="detail-label">Deadline</span>
                                    <span className="detail-value">
                                        {new Date(currentJob.applicationDeadline).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {company.visitDate && (
                                <div className="detail-box">
                                    <FiCalendar className="detail-icon" />
                                    <div>
                                        <span className="detail-label">Visit Date</span>
                                        <span className="detail-value">
                                            {new Date(company.visitDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {company.website && (
                                <div className="detail-box">
                                    <FiGlobe className="detail-icon" />
                                    <div>
                                        <span className="detail-label">Website</span>
                                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="detail-value link">
                                            Visit Website
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="company-sidebar fade-in">
                    <div className="info-card">
                        <h2>Eligibility Criteria - {currentJob.role}</h2>
                        <div className="eligibility-list">
                            <div className="eligibility-item">
                                <span className="label">Minimum CGPA</span>
                                <span className="value">{currentJob.eligibilityCriteria.minCGPA}</span>
                            </div>

                            {currentJob.eligibilityCriteria.graduationYear && (
                                <div className="eligibility-item">
                                    <span className="label">Graduation Year</span>
                                    <span className="value">{currentJob.eligibilityCriteria.graduationYear}</span>
                                </div>
                            )}

                            {currentJob.eligibilityCriteria.allowedDepartments.length > 0 && (
                                <div className="eligibility-item">
                                    <span className="label">Allowed Departments</span>
                                    <div className="departments">
                                        {currentJob.eligibilityCriteria.allowedDepartments.map((dept, index) => (
                                            <span key={index} className="badge badge-primary">{dept}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="eligibility-item">
                                <span className="label">Max Backlogs</span>
                                <span className="value">{currentJob.eligibilityCriteria.backlogs}</span>
                            </div>
                        </div>
                    </div>

                    <div className="info-card">
                        <h2>Application Stats</h2>
                        <div className="stats-list">
                            <div className="stat-item">
                                <span className="stat-label">Total Applications</span>
                                <span className="stat-value">{currentJob.appliedStudents?.length || 0} / {currentJob.totalPositions}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Remaining Positions</span>
                                <span className="stat-value" style={{
                                    color: (currentJob.totalPositions - (currentJob.appliedStudents?.length || 0)) > 0 ? '#10b981' : '#ef4444'
                                }}>
                                    {Math.max(0, currentJob.totalPositions - (currentJob.appliedStudents?.length || 0))}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Selected Students</span>
                                <span className="stat-value">{currentJob.selectedStudents?.length || 0}</span>
                            </div>
                            {/* Progress bar showing application fill percentage */}
                            <div className="stat-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                <span className="stat-label">Application Progress</span>
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${Math.min(100, ((currentJob.appliedStudents?.length || 0) / currentJob.totalPositions) * 100)}%`,
                                        height: '100%',
                                        backgroundColor: ((currentJob.appliedStudents?.length || 0) >= currentJob.totalPositions) ? '#ef4444' : '#14b8a6',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                    {Math.round(((currentJob.appliedStudents?.length || 0) / currentJob.totalPositions) * 100)}% filled
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Company Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Company</h2>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
                        </div>

                        <div style={{
                            padding: '1rem 1.5rem',
                            background: 'rgba(102, 126, 234, 0.1)',
                            borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
                            fontSize: '0.9rem',
                            color: '#4a5568'
                        }}>
                            💡 <strong>Tip:</strong> Only modify the fields you want to update. Unchanged fields will remain as they are.
                        </div>

                        <form onSubmit={handleEditSubmit} className="modal-form">
                            <div className="input-group">
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Job Role *</label>
                                <input
                                    type="text"
                                    name="jobRole"
                                    value={formData.jobRole}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Package (LPA) *</label>
                                    <input
                                        type="number"
                                        name="package"
                                        value={formData.package}
                                        onChange={handleInputChange}
                                        required
                                        step="0.1"
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Industry</label>
                                    <input
                                        type="text"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Website</label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Application Deadline *</label>
                                    <input
                                        type="date"
                                        name="applicationDeadline"
                                        value={formData.applicationDeadline}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Visit Date</label>
                                    <input
                                        type="date"
                                        name="visitDate"
                                        value={formData.visitDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Total Positions *</label>
                                    <input
                                        type="number"
                                        name="totalPositions"
                                        value={formData.totalPositions}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                />
                            </div>

                            <div className="input-group">
                                <label>Job Description</label>
                                <textarea
                                    name="jobDescription"
                                    value={formData.jobDescription}
                                    onChange={handleInputChange}
                                    rows="3"
                                />
                            </div>

                            <h3 className="mt-3 mb-2">Eligibility Criteria</h3>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Minimum CGPA</label>
                                    <input
                                        type="number"
                                        name="eligibility.minCGPA"
                                        value={formData.eligibilityCriteria.minCGPA}
                                        onChange={handleInputChange}
                                        step="0.1"
                                        min="0"
                                        max="10"
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Max Backlogs</label>
                                    <input
                                        type="number"
                                        name="eligibility.backlogs"
                                        value={formData.eligibilityCriteria.backlogs}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Graduation Year</label>
                                <input
                                    type="number"
                                    name="eligibility.graduationYear"
                                    value={formData.eligibilityCriteria.graduationYear}
                                    onChange={handleInputChange}
                                    min="2020"
                                    max="2030"
                                />
                            </div>

                            <div className="input-group">
                                <label>Allowed Departments (comma-separated, leave empty for all)</label>
                                <input
                                    type="text"
                                    name="eligibility.allowedDepartments"
                                    value={formData.eligibilityCriteria.allowedDepartments.join(', ')}
                                    placeholder="Computer Science, IT, Electronics"
                                    onChange={(e) => {
                                        const depts = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                                        setFormData({
                                            ...formData,
                                            eligibilityCriteria: {
                                                ...formData.eligibilityCriteria,
                                                allowedDepartments: depts
                                            }
                                        });
                                    }}
                                />
                            </div>

                            {/* Add New Job Roles Section */}
                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>Add New Job Roles (Optional)</h3>

                                <div className="input-group">
                                    <label>How many new job roles do you want to add?</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={editNumRoles}
                                        onChange={(e) => handleEditNumRolesChange(e.target.value)}
                                        style={{ maxWidth: '200px' }}
                                    />
                                    <small style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                                        Add additional job roles to this company (e.g., SDE-2, Data Analyst)
                                    </small>
                                </div>
                            </div>

                            {/* Dynamic New Job Role Forms */}
                            {editJobOpenings.map((job, index) => (
                                <div key={index} style={{
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    marginTop: '1rem',
                                    border: '2px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                    <h3 style={{ marginBottom: '1rem', color: '#ef4444' }}>
                                        New Job Role #{index + 1}
                                    </h3>

                                    <div className="input-group">
                                        <label>Role Name *</label>
                                        <input
                                            type="text"
                                            value={job.role}
                                            onChange={(e) => handleEditJobOpeningChange(index, 'role', e.target.value)}
                                            placeholder="e.g., Senior SDE, Data Analyst"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Job Description</label>
                                        <textarea
                                            value={job.description}
                                            onChange={(e) => handleEditJobOpeningChange(index, 'description', e.target.value)}
                                            placeholder="Describe this specific role..."
                                            rows="2"
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <label>Package (LPA) *</label>
                                            <input
                                                type="number"
                                                value={job.package}
                                                onChange={(e) => handleEditJobOpeningChange(index, 'package', e.target.value)}
                                                step="0.1"
                                                min="0"
                                                placeholder="e.g., 12.5"
                                            />
                                        </div>

                                        <div className="input-group">
                                            <label>Total Positions *</label>
                                            <input
                                                type="number"
                                                value={job.totalPositions}
                                                onChange={(e) => handleEditJobOpeningChange(index, 'totalPositions', e.target.value)}
                                                min="1"
                                                placeholder="e.g., 5"
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label>Application Deadline *</label>
                                        <input
                                            type="date"
                                            value={job.applicationDeadline}
                                            onChange={(e) => handleEditJobOpeningChange(index, 'applicationDeadline', e.target.value)}
                                        />
                                    </div>

                                    <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#64748b' }}>
                                        Eligibility Criteria for this Role
                                    </h4>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <label>Minimum CGPA</label>
                                            <input
                                                type="number"
                                                value={job.eligibilityCriteria.minCGPA}
                                                onChange={(e) => handleEditJobOpeningChange(index, 'eligibility.minCGPA', e.target.value)}
                                                step="0.1"
                                                min="0"
                                                max="10"
                                                placeholder="e.g., 7.5"
                                            />
                                        </div>

                                        <div className="input-group">
                                            <label>Max Backlogs Allowed</label>
                                            <input
                                                type="number"
                                                value={job.eligibilityCriteria.backlogs}
                                                onChange={(e) => handleEditJobOpeningChange(index, 'eligibility.backlogs', e.target.value)}
                                                min="0"
                                                placeholder="e.g., 0"
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label>Allowed Departments (comma-separated, leave empty for all)</label>
                                        <input
                                            type="text"
                                            value={job.eligibilityCriteria.allowedDepartments.join(', ')}
                                            onChange={(e) => {
                                                const depts = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                                                handleEditJobOpeningChange(index, 'eligibility.allowedDepartments', depts);
                                            }}
                                            placeholder="e.g., Computer Science, IT, Electronics"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Graduation Year</label>
                                        <input
                                            type="number"
                                            value={job.eligibilityCriteria.graduationYear}
                                            onChange={(e) => handleEditJobOpeningChange(index, 'eligibility.graduationYear', e.target.value)}
                                            min="2020"
                                            max="2030"
                                            placeholder={new Date().getFullYear().toString()}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Update Company
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resume Score Modal */}
            {showScoreModal && resumeScore && (
                <div className="modal-overlay" onClick={() => setShowScoreModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>Resume Score Analysis</h2>
                            <button className="close-btn" onClick={() => setShowScoreModal(false)}>×</button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            {/* Overall Score */}
                            <div style={{
                                textAlign: 'center',
                                padding: '2rem',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                borderRadius: '12px',
                                marginBottom: '1.5rem',
                                color: 'white'
                            }}>
                                <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                                    {resumeScore.score}/10
                                </div>
                                <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                                    Resume Match Score
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                                    for {resumeScore.jobRole} at {resumeScore.companyName}
                                </div>
                            </div>

                            {/* Feedback */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#2d3748' }}>Feedback</h3>
                                {resumeScore.feedback.map((item, index) => (
                                    <div key={index} style={{
                                        padding: '0.75rem',
                                        background: '#f7fafc',
                                        borderRadius: '8px',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.9rem',
                                        color: '#4a5568'
                                    }}>
                                        {item}
                                    </div>
                                ))}
                            </div>

                            {/* Score Breakdown */}
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#2d3748' }}>Score Breakdown</h3>

                                {/* Skills */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '600', color: '#4a5568' }}>Technical Skills</span>
                                        <span style={{ fontWeight: '700', color: '#667eea' }}>{resumeScore.breakdown.skills.score}/4.0</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: '#e2e8f0',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(parseFloat(resumeScore.breakdown.skills.score) / 4) * 100}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>
                                        Found {resumeScore.breakdown.skills.matched} relevant skills
                                    </div>
                                </div>

                                {/* Structure */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '600', color: '#4a5568' }}>Resume Structure</span>
                                        <span style={{ fontWeight: '700', color: '#667eea' }}>{resumeScore.breakdown.structure.score}/2.0</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: '#e2e8f0',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(parseFloat(resumeScore.breakdown.structure.score) / 2) * 100}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '600', color: '#4a5568' }}>Contact Information</span>
                                        <span style={{ fontWeight: '700', color: '#667eea' }}>{resumeScore.breakdown.contact.score}/1.0</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: '#e2e8f0',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(parseFloat(resumeScore.breakdown.contact.score) / 1) * 100}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                </div>

                                {/* Achievements */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '600', color: '#4a5568' }}>Quantifiable Achievements</span>
                                        <span style={{ fontWeight: '700', color: '#667eea' }}>{resumeScore.breakdown.achievements.score}/1.5</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: '#e2e8f0',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(parseFloat(resumeScore.breakdown.achievements.score) / 1.5) * 100}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>
                                        {resumeScore.breakdown.achievements.count} metrics found
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: '#edf2f7',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                color: '#4a5568'
                            }}>
                                💡 <strong>Tip:</strong> Update your resume based on the feedback above to improve your score and increase your chances of selection!
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowScoreModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDetails;
