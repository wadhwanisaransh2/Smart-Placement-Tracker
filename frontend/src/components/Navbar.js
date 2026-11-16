import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
                    <div className="brand-icon-wrapper">
                        <FiBriefcase className="brand-icon" />
                    </div>
                    <div className="brand-content">
                        <span className="brand-name">Placement<span className="brand-accent">Tracker</span></span>
                        <span className={`portal-badge ${user.role === 'admin' ? 'admin-badge' : 'student-badge'}`}>
                            {user.role === 'admin' ? <FiShield /> : <FiBookOpen />}
                            {user.role === 'admin' ? 'Admin Portal' : 'Student Portal'}
                        </span>
                    </div>
                </Link>

                <div className="navbar-menu">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <FiHome /> Dashboard
                    </NavLink>

                    <NavLink to="/companies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <FiBriefcase /> Companies
                    </NavLink>

                    {user.role === 'student' && (
                        <NavLink to="/my-applications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <FiBarChart2 /> My Applications
                        </NavLink>
                    )}

                    {user.role === 'admin' && (
                        <>
                            <NavLink to="/students" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <FiUsers /> Students
                            </NavLink>
                            <NavLink to="/statistics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <FiBarChart2 /> Statistics
                            </NavLink>
                        </>
                    )}
                </div>

                <div className="navbar-actions">
                    <button
                        onClick={toggleDarkMode}
                        className="theme-toggle"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle theme"
                    >
                        {isDarkMode ? <FiSun /> : <FiMoon />}
                    </button>
                    <NavLink to="/profile" className={({ isActive }) => `nav-link profile-link ${isActive ? 'active' : ''}`}>
                        <div className="profile-avatar-pill">
                            <FiUser />
                        </div>
                        <span className="profile-name-text">{user.name}</span>
                    </NavLink>
                    <button onClick={handleLogout} className="btn-logout-nav" title="Log out">
                        <FiLogOut /> <span>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
