import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, resumeAPI } from '../services/api';
import './Students.css';
import { FiSearch, FiFilter, FiUser, FiMail, FiHash, FiAward, FiDownload, FiFileText, FiEye, FiX, FiExternalLink } from 'react-icons/fi';

const Students = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [placementFilter, setPlacementFilter] = useState('all');
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewStudentName, setPreviewStudentName] = useState('');
    const [loadingResumeId, setLoadingResumeId] = useState(null);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getAllUsers();
            // Filter out admin users - only show students
            const studentsOnly = response.data.users.filter(user => user.role === 'student');
            setStudents(studentsOnly);
            setFilteredStudents(studentsOnly);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadResume = async (studentId, studentName) => {
        try {
            const response = await resumeAPI.downloadStudent(studentId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${(studentName || 'Student').replace(/\s+/g, '_')}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Resume download error:', error);
            alert('Resume file could not be downloaded for this student');
        }
    };

    const handleViewResume = async (studentId, studentName) => {
        try {
            setLoadingResumeId(studentId);
            const response = await resumeAPI.viewStudent(studentId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
            setPreviewStudentName(studentName);
            setPreviewModalOpen(true);
        } catch (error) {
            console.error('Resume view error:', error);
            alert('Resume file could not be previewed for this student');
        } finally {
            setLoadingResumeId(null);
        }
    };

    const handleClosePreview = () => {
        setPreviewModalOpen(false);
        if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const filterStudents = useCallback(() => {
        let filtered = students;

        if (searchTerm) {
            filtered = filtered.filter(student =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (placementFilter !== 'all') {
            filtered = filtered.filter(student =>
                placementFilter === 'placed' ? student.isPlaced : !student.isPlaced
            );
        }

        setFilteredStudents(filtered);
    }, [students, searchTerm, placementFilter]);

    useEffect(() => {
        fetchStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        filterStudents();
    }, [filterStudents]);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="students-container">
            <div className="students-header fade-in">
                <div>
                    <h1>Student Database</h1>
                    <p className="text-muted">Comprehensive directory of the placement cohort</p>
                </div>
            </div>

            <div className="students-filters fade-in">
                <div className="search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search by name, email or roll number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <FiFilter />
                    <select value={placementFilter} onChange={(e) => setPlacementFilter(e.target.value)}>
                        <option value="all">All Records</option>
                        <option value="placed">Placed Only</option>
                        <option value="unplaced">Seeking Only</option>
                    </select>
                </div>
            </div>

            <div className="students-grid fade-in">
                {filteredStudents.length === 0 ? (
                    <div className="card text-center py-5" style={{ gridColumn: '1 / -1' }}>
                        <p className="text-muted">No students found matching your criteria</p>
                    </div>
                ) : (
                    filteredStudents.map((student) => (
                        <div key={student._id} className="student-card">
                            <span className={`status-indicator ${student.isPlaced ? 'status-placed' : 'status-seeking'}`}>
                                {student.isPlaced ? 'Placed' : 'Seeking'}
                            </span>

                            <div className="student-main">
                                <h3>{student.name}</h3>
                                <span className="student-email">
                                    <FiMail size={12} style={{ marginRight: '6px' }} />
                                    {student.email}
                                </span>

                                <div className="student-meta">
                                    {student.department && (
                                        <span className="meta-pill pill-dept">{student.department}</span>
                                    )}
                                    {student.cgpa && (
                                        <span className="meta-pill pill-cgpa">
                                            <FiAward size={10} style={{ marginRight: '4px' }} />
                                            {student.cgpa} CGPA
                                        </span>
                                    )}
                                    {student.rollNumber && (
                                        <span className="meta-pill pill-roll">
                                            <FiHash size={10} style={{ marginRight: '4px' }} />
                                            {student.rollNumber}
                                        </span>
                                    )}
                                </div>

                                {student.isPlaced && student.placedCompany && (
                                    <div className="placement-details">
                                        <p className="text-muted">Hired By</p>
                                        <p className="company-name">{student.placedCompany}</p>
                                        {student.package && (
                                            <p className="text-primary" style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '4px' }}>
                                                ₹{student.package} LPA
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="student-footer">
                                {student.resume ? (
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                        <button
                                            className="btn-resume"
                                            onClick={() => handleViewResume(student._id, student.name)}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '8px 10px',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '0.82rem',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                            disabled={loadingResumeId === student._id}
                                        >
                                            <FiEye size={13} /> {loadingResumeId === student._id ? 'Loading...' : 'Preview'}
                                        </button>
                                        <button
                                            className="btn-resume"
                                            onClick={() => handleDownloadResume(student._id, student.name)}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '8px 10px',
                                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '0.82rem',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <FiDownload size={13} /> PDF
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        padding: '8px 12px',
                                        background: 'rgba(148, 163, 184, 0.1)',
                                        color: '#94a3b8',
                                        borderRadius: '8px',
                                        fontSize: '0.82rem',
                                        marginBottom: '8px'
                                    }}>
                                        <FiFileText size={13} /> No Resume Uploaded
                                    </div>
                                )}
                                <button
                                    className="btn-profile"
                                    onClick={() => navigate(`/students/${student._id}`)}
                                >
                                    <FiUser size={14} /> Full Profile Analysis
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Resume Preview Modal for Admin */}
            {previewModalOpen && previewUrl && (
                <div className="modal-overlay" onClick={handleClosePreview}>
                    <div
                        className="modal-content resume-preview-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '900px', width: '95%', height: '88vh', display: 'flex', flexDirection: 'column' }}
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiFileText style={{ color: 'var(--primary)', fontSize: '1.4rem' }} />
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{previewStudentName}'s Resume</h2>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Student Resume Preview</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <a
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-primary btn-sm"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <FiExternalLink /> Open in Tab
                                </a>
                                <button className="close-btn" onClick={handleClosePreview} title="Close">
                                    <FiX />
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, position: 'relative', background: '#0f172a', borderRadius: '12px', overflow: 'hidden', minHeight: '400px' }}>
                            <iframe
                                src={`${previewUrl}#toolbar=1`}
                                title="Student Resume Preview"
                                width="100%"
                                height="100%"
                                style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Students;
