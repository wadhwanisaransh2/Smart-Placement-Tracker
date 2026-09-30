import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, resumeAPI } from '../services/api';
import './Students.css';
import { FiSearch, FiFilter, FiUser, FiMail, FiHash, FiAward, FiArrowRight, FiEye, FiDownload, FiFileText } from 'react-icons/fi';

const Students = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [placementFilter, setPlacementFilter] = useState('all');

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
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${studentName}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Resume download error:', error);
            alert(error.response?.data?.message || 'Resume not found for this student');
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
                                {student.resume && (
                                    <button
                                        className="btn-resume"
                                        onClick={() => handleDownloadResume(student._id, student.name)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 12px',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            marginBottom: '8px'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <FiDownload size={14} /> Download Resume
                                    </button>
                                )}
                                {!student.resume && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 12px',
                                        background: 'rgba(148, 163, 184, 0.1)',
                                        color: '#94a3b8',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        marginBottom: '8px'
                                    }}>
                                        <FiFileText size={14} /> No Resume
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
        </div>
    );
};

export default Students;
