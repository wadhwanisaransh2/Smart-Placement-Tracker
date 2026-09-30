import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser, FiBriefcase, FiUserCheck, FiPhone, FiBook, FiShield, FiBookOpen } from 'react-icons/fi';
import './Login.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        rollNumber: '',
        graduationYear: new Date().getFullYear(),
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleRoleChange = (role) => {
        setFormData({
            ...formData,
            role
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate Gmail email
        if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
            setError('Only Gmail addresses (@gmail.com) are allowed for registration');
            setLoading(false);
            return;
        }

        // Validate student fields
        if (formData.role === 'student') {
            if (!formData.rollNumber) {
                setError('Roll number is required for students');
                setLoading(false);
                return;
            }
        }

        // Prepare data with proper types
        const registrationData = {
            ...formData,
            graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined
        };

        const result = await register(registrationData);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card fade-in">
                <div className="auth-header">
                    <div className="auth-icon">
                        <FiBriefcase />
                    </div>
                    <h1>Create Account</h1>
                    <p>Join the Placement Tracker system</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {/* Role Selection */}
                    <div className="role-selector">
                        <div
                            className={`role-option ${formData.role === 'student' ? 'selected' : ''}`}
                            onClick={() => handleRoleChange('student')}
                        >
                            <input
                                type="radio"
                                name="role"
                                value="student"
                                checked={formData.role === 'student'}
                                onChange={() => { }}
                            />
                            <div className="role-option-icon student-portal-icon">
                                <FiBookOpen />
                            </div>
                            <span className="role-option-label">Student</span>
                            <span className="role-option-desc">Student Portal - Apply to companies</span>
                        </div>

                        <div
                            className={`role-option ${formData.role === 'admin' ? 'selected' : ''}`}
                            onClick={() => handleRoleChange('admin')}
                        >
                            <input
                                type="radio"
                                name="role"
                                value="admin"
                                checked={formData.role === 'admin'}
                                onChange={() => { }}
                            />
                            <div className="role-option-icon admin-portal-icon">
                                <FiShield />
                            </div>
                            <span className="role-option-label">Admin</span>
                            <span className="role-option-desc">Admin Portal - Manage placements</span>
                        </div>
                    </div>

                    {/* Common Fields */}
                    <div className="common-fields">
                        <div className="input-group">
                            <label htmlFor="name">
                                <FiUser /> Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="email">
                                <FiMail /> Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your Gmail address (e.g., name@gmail.com)"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">
                            <FiLock /> Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password (min 6 characters)"
                            required
                            minLength={6}
                        />
                    </div>

                    {/* Student-specific Fields */}
                    {formData.role === 'student' && (
                        <>
                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="rollNumber">
                                        <FiBook /> Roll Number
                                    </label>
                                    <input
                                        type="text"
                                        id="rollNumber"
                                        name="rollNumber"
                                        value={formData.rollNumber}
                                        onChange={handleChange}
                                        placeholder="Enter your roll number"
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="graduationYear">Graduation Year</label>
                                    <input
                                        type="number"
                                        id="graduationYear"
                                        name="graduationYear"
                                        value={formData.graduationYear}
                                        onChange={handleChange}
                                        min="2020"
                                        max="2030"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="phone">
                                    <FiPhone /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter your phone number"
                                />
                            </div>

                            <div className="alert alert-info" style={{
                                marginTop: '1rem',
                                padding: '0.875rem',
                                background: 'rgba(102, 126, 234, 0.1)',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '12px',
                                color: '#2d3748',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                📝 After registration, please complete your profile with CGPA and Department to apply for companies.
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
