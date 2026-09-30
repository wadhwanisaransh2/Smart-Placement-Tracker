import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiLogOut, FiUser, FiBriefcase, FiHome, FiBarChart2, FiUsers, FiMoon, FiSun, FiShield, FiBookOpen } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/dashboard" className="navbar-brand">
                    <FiBriefcase className="brand-icon" />
                    <div className="brand-content">
                        <span className="brand-name">Placement Tracker</span>
                        <span className={`portal-badge ${user.role === 'admin' ? 'admin-badge' : 'student-badge'}`}>
                            {user.role === 'admin' ? <FiShield /> : <FiBookOpen />}
                            {user.role === 'admin' ? 'Admin Portal' : 'Student Portal'}
                        </span>
                    </div>
                </Link>

                <div className="navbar-menu">
                    <Link to="/dashboard" className="nav-link">
                        <FiHome /> Dashboard
                    </Link>

                    <Link to="/companies" className="nav-link">
                        <FiBriefcase /> Companies
                    </Link>

                    {user.role === 'student' && (
                        <Link to="/my-applications" className="nav-link">
                            <FiBarChart2 /> My Applications
                        </Link>
                    )}

                    {user.role === 'admin' && (
                        <>
                            <Link to="/students" className="nav-link">
                                <FiUsers /> Students
                            </Link>
                            <Link to="/statistics" className="nav-link">
                                <FiBarChart2 /> Statistics
                            </Link>
                        </>
                    )}
                </div>

                <div className="navbar-actions">
                    <button
                        onClick={toggleDarkMode}
                        className="theme-toggle"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDarkMode ? <FiSun /> : <FiMoon />}
                    </button>
                    <Link to="/profile" className="nav-link profile-link">
                        <FiUser />
                        <span>{user.name}</span>
                    </Link>
                    <button onClick={handleLogout} className="btn btn-outline logout-btn">
                        <FiLogOut /> Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
