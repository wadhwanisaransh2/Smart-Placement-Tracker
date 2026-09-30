import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companyAPI } from '../services/api';
import { FiPlus, FiSearch, FiFilter, FiBriefcase, FiMapPin, FiDollarSign, FiCalendar, FiTrash2 } from 'react-icons/fi';
import './Companies.css';

const Companies = () => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [packageFilter, setPackageFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [sortBy, setSortBy] = useState('deadline');
    const [showAddModal, setShowAddModal] = useState(false);
    const [numRoles, setNumRoles] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        website: '',
        industry: '',
        location: '',
        visitDate: '',
        status: 'upcoming',
        jobOpenings: [
            {
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
            }
        ]
    });

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await companyAPI.getAll();
            setCompanies(response.data.companies);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterCompanies = useCallback(() => {
        let filtered = companies;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(company =>
                company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.jobRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.location?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(company => company.status === statusFilter);
        }

        // Package filter
        if (packageFilter !== 'all') {
            filtered = filtered.filter(company => {
                const pkg = company.package;
                switch (packageFilter) {
                    case '0-5': return pkg >= 0 && pkg <= 5;
                    case '5-10': return pkg > 5 && pkg <= 10;
                    case '10-15': return pkg > 10 && pkg <= 15;
                    case '15+': return pkg > 15;
                    default: return true;
                }
            });
        }

        // Location filter
        if (locationFilter !== 'all') {
            filtered = filtered.filter(company =>
                company.location?.toLowerCase().includes(locationFilter.toLowerCase())
            );
        }

        // Sorting
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'deadline':
                    return new Date(a.applicationDeadline) - new Date(b.applicationDeadline);
                case 'package-high':
                    return b.package - a.package;
                case 'package-low':
                    return a.package - b.package;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                default:
                    return 0;
            }
        });

        setFilteredCompanies(filtered);
    }, [companies, searchTerm, statusFilter, packageFilter, locationFilter, sortBy]);

    useEffect(() => {
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        filterCompanies();
    }, [filterCompanies]);

    const handleNumRolesChange = (num) => {
        const count = parseInt(num) || 1;
        setNumRoles(count);

        // Adjust jobOpenings array
        const currentOpenings = formData.jobOpenings;
        const newOpenings = [];

        for (let i = 0; i < count; i++) {
            if (currentOpenings[i]) {
                newOpenings.push(currentOpenings[i]);
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

        setFormData({ ...formData, jobOpenings: newOpenings });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleJobOpeningChange = (index, field, value) => {
        const newJobOpenings = [...formData.jobOpenings];

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

        setFormData({ ...formData, jobOpenings: newJobOpenings });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate required fields
            if (!formData.name?.trim()) {
                alert('Company name is required');
                return;
            }

            // Validate job openings
            for (let i = 0; i < formData.jobOpenings.length; i++) {
                const job = formData.jobOpenings[i];
                if (!job.role?.trim()) {
                    alert(`Job role is required for Role #${i + 1}`);
                    return;
                }
                if (!job.package || isNaN(parseFloat(job.package))) {
                    alert(`Valid package amount is required for ${job.role || `Role #${i + 1}`}`);
                    return;
                }
                if (!job.applicationDeadline) {
                    alert(`Application deadline is required for ${job.role || `Role #${i + 1}`}`);
                    return;
                }
                if (!job.totalPositions || isNaN(parseInt(job.totalPositions)) || parseInt(job.totalPositions) < 1) {
                    alert(`Total positions must be at least 1 for ${job.role || `Role #${i + 1}`}`);
                    return;
                }
            }

            // Prepare data with proper formatting
            const submitData = {
                name: formData.name.trim(),
                description: formData.description?.trim() || 'No description provided',
                website: formData.website?.trim() || '',
                industry: formData.industry?.trim() || '',
                location: formData.location?.trim() || '',
                visitDate: formData.visitDate ? new Date(formData.visitDate).toISOString() : undefined,
                status: formData.status || 'upcoming',
                jobOpenings: formData.jobOpenings.map(job => ({
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
            };

            console.log('Submitting company data:', submitData);
            const response = await companyAPI.create(submitData);
            console.log('Company created successfully:', response);
            setShowAddModal(false);
            setNumRoles(1);
            fetchCompanies();
            alert('Company created successfully!');

            // Reset form
            setFormData({
                name: '',
                description: '',
                website: '',
                industry: '',
                location: '',
                visitDate: '',
                status: 'upcoming',
                jobOpenings: [
                    {
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
                    }
                ]
            });
        } catch (error) {
            console.error('Error creating company:', error);
            console.error('Error response:', error.response?.data);

            let errorMessage = 'Failed to create company';

            // Handle validation errors
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                const validationErrors = error.response.data.errors.map(err => err.msg).join(', ');
                errorMessage = `Validation Error: ${validationErrors}`;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(errorMessage);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            upcoming: 'badge-info',
            ongoing: 'badge-warning',
            completed: 'badge-success',
            cancelled: 'badge-error'
        };
        return badges[status] || 'badge-info';
    };

    const handleDeleteCompany = async (companyId, companyName, e) => {
        e.stopPropagation(); // Prevent card click navigation

        const confirmed = window.confirm(
            `Are you sure you want to delete "${companyName}"?\n\nThis will also delete all applications associated with this company. This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            await companyAPI.delete(companyId);
            alert(`Company "${companyName}" deleted successfully!`);
            fetchCompanies(); // Refresh the list
        } catch (error) {
            console.error('Error deleting company:', error);
            alert(error.response?.data?.message || 'Failed to delete company');
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="companies-container">
            <div className="companies-header fade-in">
                <div>
                    <h1>Companies</h1>
                    <p className="text-muted">Browse and manage placement opportunities</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <FiPlus /> Add Company
                    </button>
                )}
            </div>

            <div className="companies-filters fade-in">
                <div className="search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search companies, roles, locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <FiFilter />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div className="filter-group">
                    <FiDollarSign />
                    <select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)}>
                        <option value="all">All Packages</option>
                        <option value="0-5">0-5 LPA</option>
                        <option value="5-10">5-10 LPA</option>
                        <option value="10-15">10-15 LPA</option>
                        <option value="15+">15+ LPA</option>
                    </select>
                </div>

                <div className="filter-group">
                    <FiMapPin />
                    <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                        <option value="all">All Locations</option>
                        <option value="bangalore">Bangalore</option>
                        <option value="hyderabad">Hyderabad</option>
                        <option value="pune">Pune</option>
                        <option value="mumbai">Mumbai</option>
                        <option value="delhi">Delhi/NCR</option>
                        <option value="chennai">Chennai</option>
                        <option value="remote">Remote</option>
                    </select>
                </div>

                <div className="filter-group">
                    <FiCalendar />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="deadline">Sort: Deadline</option>
                        <option value="package-high">Sort: Package (High-Low)</option>
                        <option value="package-low">Sort: Package (Low-High)</option>
                        <option value="name">Sort: Name (A-Z)</option>
                        <option value="newest">Sort: Newest First</option>
                    </select>
                </div>
            </div>

            <div className="filter-summary">
                <span>Showing {filteredCompanies.length} of {companies.length} companies</span>
                {(searchTerm || statusFilter !== 'all' || packageFilter !== 'all' || locationFilter !== 'all') && (
                    <button
                        className="clear-filters-btn"
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setPackageFilter('all');
                            setLocationFilter('all');
                            setSortBy('deadline');
                        }}
                    >
                        Clear All Filters
                    </button>
                )}
            </div>

            {filteredCompanies.length === 0 ? (
                <div className="empty-state">
                    <FiBriefcase size={64} />
                    <h2>No companies found</h2>
                    <p>Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="companies-grid fade-in">
                    {filteredCompanies.map((company) => (
                        <div key={company._id} className="company-card" onClick={() => navigate(`/companies/${company._id}`)}>
                            <div className="company-card-header">
                                <h3>{company.name}</h3>
                                <div className="header-actions">
                                    <span className={`badge ${getStatusBadge(company.status)}`}>
                                        {company.status}
                                    </span>
                                    {isAdmin && (
                                        <button
                                            className="btn-icon-delete"
                                            onClick={(e) => handleDeleteCompany(company._id, company.name, e)}
                                            title="Delete Company"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="company-role">
                                <FiBriefcase /> {company.jobRole}
                            </p>

                            <div className="company-details">
                                {company.location && (
                                    <div className="detail-item">
                                        <FiMapPin />
                                        <span>{company.location}</span>
                                    </div>
                                )}
                                <div className="detail-item">
                                    <FiDollarSign />
                                    <span>₹{company.package} LPA</span>
                                </div>
                                <div className="detail-item">
                                    <FiCalendar />
                                    <span>Deadline: {new Date(company.applicationDeadline).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="company-card-footer">
                                <span className="text-muted">{company.appliedStudents?.length || 0} applications</span>
                                <button className="btn btn-primary btn-sm">View Details</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Company Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Company</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {/* Company Basic Info */}
                            <div style={{ background: 'rgba(102, 126, 234, 0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>Company Information</h3>

                                <div className="input-group">
                                    <label>Company Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Microsoft"
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Company Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Brief description about the company..."
                                        rows="2"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label>Industry</label>
                                        <input
                                            type="text"
                                            name="industry"
                                            value={formData.industry}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Technology, Finance"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Bangalore"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label>Website</label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleInputChange}
                                            placeholder="https://example.com"
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
                            </div>

                            {/* Number of Job Roles */}
                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>Job Roles</h3>

                                <div className="input-group">
                                    <label>How many job roles do you want to add? *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={numRoles}
                                        onChange={(e) => handleNumRolesChange(e.target.value)}
                                        style={{ maxWidth: '200px' }}
                                    />
                                    <small style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                                        You can add up to 10 different job roles (e.g., SDE, Data Analyst, UI/UX Designer)
                                    </small>
                                </div>
                            </div>

                            {/* Dynamic Job Role Forms */}
                            {formData.jobOpenings.map((job, index) => (
                                <div key={index} style={{
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    marginBottom: '1.5rem',
                                    border: '2px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                    <h3 style={{ marginBottom: '1rem', color: '#ef4444' }}>
                                        Job Role #{index + 1}
                                    </h3>

                                    <div className="input-group">
                                        <label>Role Name * (e.g., Software Engineer, Data Analyst)</label>
                                        <input
                                            type="text"
                                            value={job.role}
                                            onChange={(e) => handleJobOpeningChange(index, 'role', e.target.value)}
                                            placeholder="e.g., SDE Intern, Business Analyst"
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Job Description</label>
                                        <textarea
                                            value={job.description}
                                            onChange={(e) => handleJobOpeningChange(index, 'description', e.target.value)}
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
                                                onChange={(e) => handleJobOpeningChange(index, 'package', e.target.value)}
                                                required
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
                                                onChange={(e) => handleJobOpeningChange(index, 'totalPositions', e.target.value)}
                                                required
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
                                            onChange={(e) => handleJobOpeningChange(index, 'applicationDeadline', e.target.value)}
                                            required
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
                                                onChange={(e) => handleJobOpeningChange(index, 'eligibility.minCGPA', e.target.value)}
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
                                                onChange={(e) => handleJobOpeningChange(index, 'eligibility.backlogs', e.target.value)}
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
                                                handleJobOpeningChange(index, 'eligibility.allowedDepartments', depts);
                                            }}
                                            placeholder="e.g., Computer Science, IT, Electronics"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Graduation Year</label>
                                        <input
                                            type="number"
                                            value={job.eligibilityCriteria.graduationYear}
                                            onChange={(e) => handleJobOpeningChange(index, 'eligibility.graduationYear', e.target.value)}
                                            min="2020"
                                            max="2030"
                                            placeholder={new Date().getFullYear().toString()}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Company with {numRoles} Role{numRoles > 1 ? 's' : ''}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Companies;
