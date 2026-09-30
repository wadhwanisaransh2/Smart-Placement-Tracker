import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { companyAPI, applicationAPI, userAPI, analyticsAPI } from '../services/api';
import { FiBriefcase, FiUsers, FiCheckCircle, FiTrendingUp, FiClock, FiZap, FiTarget, FiAlertCircle } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
    const { user, isAdmin, isStudent, updateUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentCompanies, setRecentCompanies] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [dailyRecommendation, setDailyRecommendation] = useState(null);
    const [dashboardSummary, setDashboardSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Fetching dashboard data...', { isAdmin, isStudent });

            if (isAdmin) {
                const [companiesRes, statsRes] = await Promise.all([
                    companyAPI.getAll().catch(err => {
                        console.error('Error fetching companies:', err);
                        return { data: { companies: [] } };
                    }),
                    userAPI.getStats().catch(err => {
                        console.error('Error fetching stats:', err);
                        return { data: null };
                    })
                ]);
                setRecentCompanies(companiesRes.data.companies?.slice(0, 5) || []);
                setStats(statsRes.data);
            } else if (isStudent) {
                const [companiesRes, applicationsRes, recommendationRes, summaryRes] = await Promise.all([
                    companyAPI.getAll().catch(err => {
                        console.error('Error fetching companies:', err);
                        return { data: { companies: [] } };
                    }),
                    applicationAPI.getAll().catch(err => {
                        console.error('Error fetching applications:', err);
                        return { data: { applications: [] } };
                    }),
                    analyticsAPI.getDailyRecommendation().catch(err => {
                        console.log('No daily recommendation available:', err.response?.status);
                        return { data: null };
                    }),
                    analyticsAPI.getDashboardSummary().catch(err => {
                        console.log('No dashboard summary available:', err.response?.status);
                        return { data: null };
                    })
                ]);

                console.log('Dashboard data loaded:', {
                    companies: companiesRes.data.companies?.length || 0,
                    applications: applicationsRes.data.applications?.length || 0,
                    hasRecommendation: !!recommendationRes.data,
                    hasSummary: !!summaryRes.data
                });

                setRecentCompanies(companiesRes.data.companies?.slice(0, 5) || []);
                setMyApplications(applicationsRes.data.applications?.slice(0, 5) || []);
                setDailyRecommendation(recommendationRes.data);
                setDashboardSummary(summaryRes.data);
            }
        } catch (error) {
            console.error('Critical error fetching dashboard data:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            // Don't throw - let the page render with empty data
        } finally {
            setLoading(false);
            console.log('Dashboard loading complete');
        }
    }, [isAdmin, isStudent]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

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

    const getAppCompanyName = (app) => app.company?.name || app.companyName || '—';
    const getAppRole = (app) => app.company?.jobRole || app.role || '—';

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p>Loading user data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header fade-in">
                <div>
                    <h1>Welcome, {user.name}</h1>
                    <p className="text-muted">
                        {isAdmin ? 'Operation Center • Manage your placement cell' : 'Your Journey • Track and optimize your placements'}
                    </p>
                </div>
            </div>

            {/* Admin Overview Section */}
            {isAdmin && stats && (
                <>
                    <div className="console-card fade-in">
                        <div className="console-info">
                            <h2>Management Console</h2>
                            <p>Quick access to core functions</p>
                        </div>
                        <div className="console-actions">
                            <a href="/companies" className="btn btn-primary btn-sm">
                                <FiBriefcase /> Post Drive
                            </a>
                            <a href="/students" className="btn btn-outline btn-sm">
                                <FiUsers /> Database
                            </a>
                            <a href="/statistics" className="btn btn-outline btn-sm">
                                <FiTrendingUp /> Analytics
                            </a>
                        </div>
                    </div>

                    <div className="stats-grid fade-in">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                <FiUsers />
                            </div>
                            <div className="stat-content">
                                <h3>{stats.overview.totalStudents}</h3>
                                <p>Total Students</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                                <FiCheckCircle />
                            </div>
                            <div className="stat-content">
                                <h3>{stats.overview.placedStudents}</h3>
                                <p>Placed</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                                <FiClock />
                            </div>
                            <div className="stat-content">
                                <h3>{stats.overview.unplacedStudents}</h3>
                                <p>Seeking</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fdf2f8', color: '#ec4899' }}>
                                <FiTrendingUp />
                            </div>
                            <div className="stat-content">
                                <h3>{stats.overview.placementPercentage}%</h3>
                                <p>Success Rate</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Student Overview Section */}
            {isStudent && (
                <>
                    {/* Profile Alert */}
                    {user && (user.cgpa === undefined || user.cgpa === null || !user.department) && (
                        <div className="alert alert-warning fade-in" style={{ borderRadius: '16px', border: '1px solid #f59e0b' }}>
                            <FiAlertCircle size={24} />
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Complete Your Academic Profile</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Fill in your CGPA and Department to unlock company applications and recommendations.</p>
                            </div>
                            <a href="/profile" className="btn btn-warning btn-sm">Update Now</a>
                        </div>
                    )}

                    <div className="stats-grid fade-in">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                <FiBriefcase />
                            </div>
                            <div className="stat-content">
                                <h3>{myApplications.length}</h3>
                                <p>Applications</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                                <FiCheckCircle />
                            </div>
                            <div className="stat-content">
                                <h3>{myApplications.filter(app => app.status === 'selected').length}</h3>
                                <p>Offers</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                                <FiClock />
                            </div>
                            <div className="stat-content">
                                <h3>{myApplications.filter(app => ['applied', 'oa', 'shortlisted', 'interview-scheduled'].includes(app.status)).length}</h3>
                                <p>In Progress</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: user.isPlaced ? '#ecfdf5' : '#f1f5f9', color: user.isPlaced ? '#10b981' : '#64748b' }}>
                                <FiTrendingUp />
                            </div>
                            <div className="stat-content">
                                <h3>{user.isPlaced ? 'Hired' : 'Searching'}</h3>
                                <p>Current Status</p>
                            </div>
                        </div>
                    </div>

                    {/* Greedy Recommendation */}
                    {dailyRecommendation && dailyRecommendation.recommendation && (
                        <div className="recommendation-banner fade-in" style={{ marginTop: 'var(--spacing-xl)' }}>
                            <div style={{ background: '#eff6ff', padding: '2rem', borderRadius: '16px', display: 'flex', alignItems: 'center' }}>
                                <FiZap size={48} color="#3b82f6" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯 Today's Strategic Focus</h2>
                                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                                    <div>
                                        <p className="text-muted" style={{ marginBottom: '4px' }}>Target Company</p>
                                        <h3 style={{ fontSize: '1.25rem' }}>{(!dailyRecommendation.recommendation.company || dailyRecommendation.recommendation.company === 'Unknown') ? 'Active Opportunity' : dailyRecommendation.recommendation.company}</h3>
                                    </div>
                                    <div>
                                        <p className="text-muted" style={{ marginBottom: '4px' }}>Priority Score</p>
                                        <h3 style={{ fontSize: '1.25rem', color: '#f59e0b' }}>{dailyRecommendation.recommendation.priorityScore?.toFixed(1) || '8.5'}</h3>
                                    </div>
                                    <div>
                                        <p className="text-muted" style={{ marginBottom: '4px' }}>Days Left</p>
                                        <h3 style={{ fontSize: '1.25rem', color: '#ef4444' }}>{dailyRecommendation.recommendation.daysRemaining} days</h3>
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>
                                        <FiTarget style={{ marginRight: '8px' }} />
                                        Greedy Advisor: {dailyRecommendation.recommendation.reasoning.action}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="grid grid-2 fade-in">
                {/* Active Projects / Companies */}
                <div className="dashboard-card">
                    <div className="flex-between mb-4">
                        <h2>{isAdmin ? 'Recruitment Drives' : 'Featured Opportunities'}</h2>
                        <a href="/companies" className="btn btn-outline btn-sm">View All</a>
                    </div>

                    <div className="item-list">
                        {recentCompanies.length === 0 ? (
                            <p className="text-muted text-center py-4">No active drives at the moment</p>
                        ) : (
                            recentCompanies.map((company) => (
                                <div key={company._id} className="list-item">
                                    <div className="item-main">
                                        <h4>{company.name}</h4>
                                        <p>{company.jobRole} • ₹{company.package} LPA</p>
                                    </div>
                                    <a href={`/companies/${company._id}`} className="btn btn-outline btn-sm">Details</a>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Application Activity */}
                {isStudent && (
                    <div className="dashboard-card">
                        <div className="flex-between mb-4">
                            <h2>Recent Activity</h2>
                            <a href="/my-applications" className="btn btn-outline btn-sm">History</a>
                        </div>
                        <div className="item-list">
                            {myApplications.length === 0 ? (
                                <p className="text-muted text-center py-4">No recent applications</p>
                            ) : (
                                myApplications.slice(0, 5).map((app) => (
                                    <div key={app._id} className="list-item">
                                        <div className="item-main">
                                            <h4>{getAppCompanyName(app)}</h4>
                                            <p>Applied {new Date(app.appliedDate).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`badge ${getStatusBadge(app.status)}`}>
                                            {app.status?.replace('-', ' ')}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
