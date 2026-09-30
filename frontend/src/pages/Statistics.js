import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { FiUsers, FiCheckCircle, FiClock, FiTrendingUp, FiPieChart, FiBarChart2, FiAward, FiArrowUpRight } from 'react-icons/fi';
import './Statistics.css';

const Statistics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!stats) {
        return <div className="statistics-container"><p>No statistics available</p></div>;
    }

    return (
        <div className="statistics-container">
            <div className="statistics-header fade-in">
                <h1>Placement Analytics</h1>
                <p className="text-muted">In-depth insights into cohort performance and recruitment trends</p>
            </div>

            <div className="analytics-grid fade-in">
                <div className="analytics-card">
                    <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                        <FiUsers />
                    </div>
                    <div className="analytics-info">
                        <h3>{stats.overview.totalStudents}</h3>
                        <p>Total Cohort</p>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        <FiCheckCircle />
                    </div>
                    <div className="analytics-info">
                        <h3>{stats.overview.placedStudents}</h3>
                        <p>Total Placed</p>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <FiClock />
                    </div>
                    <div className="analytics-info">
                        <h3>{stats.overview.unplacedStudents}</h3>
                        <p>Active Seekers</p>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
                        <FiTrendingUp />
                    </div>
                    <div className="analytics-info">
                        <h3>{stats.overview.placementPercentage}%</h3>
                        <p>Success Rate</p>
                    </div>
                </div>
            </div>

            <div className="viz-grid fade-in">
                {/* Department Statistics */}
                <div className="viz-card">
                    <h2><FiBarChart2 /> Department-wise Performance</h2>
                    <div className="dept-stats-list">
                        {stats.departmentStats?.map((dept, index) => {
                            const rate = dept.total > 0 ? ((dept.placed / dept.total) * 100) : 0;
                            return (
                                <div key={index} className="dept-stat-item">
                                    <div className="dept-info">
                                        <span className="dept-name">{dept._id || 'General'}</span>
                                        <span className="dept-count">{dept.placed}/{dept.total} Placed</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${rate}%` }}
                                        ></div>
                                    </div>
                                    <div className="dept-meta">
                                        <div className="dept-meta-item">
                                            <FiTrendingUp size={12} /> {rate.toFixed(1)}% Rate
                                        </div>
                                        {dept.avgPackage > 0 && (
                                            <div className="dept-meta-item">
                                                <FiAward size={12} /> ₹{dept.avgPackage.toFixed(2)} LPA Avg
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Mini Stats */}
                <div className="flex-column">
                    {/* Package Highlights */}
                    {stats.packageStats && (
                        <div className="viz-card">
                            <h2><FiPieChart /> Compensation Overview</h2>
                            <div className="package-stat-item">
                                <span className="label">Highest Package</span>
                                <span className="value" style={{ color: '#10b981' }}>₹{stats.packageStats.maxPackage} LPA</span>
                            </div>
                            <div className="package-stat-item">
                                <span className="label">Average Package</span>
                                <span className="value" style={{ color: '#3b82f6' }}>₹{stats.packageStats.avgPackage?.toFixed(2)} LPA</span>
                            </div>
                            <div className="package-stat-item">
                                <span className="label">Lowest Package</span>
                                <span className="value" style={{ color: '#64748b' }}>₹{stats.packageStats.minPackage} LPA</span>
                            </div>
                        </div>
                    )}

                    <div style={{ padding: 'var(--spacing-md) 0' }}></div>

                    {/* Top Companies */}
                    {stats.topCompanies && (
                        <div className="viz-card">
                            <h2><FiAward /> Top Recruiters</h2>
                            <div className="top-companies-list">
                                {stats.topCompanies.slice(0, 5).map((company, index) => (
                                    <div key={index} className="top-company-pill">
                                        <div className="flex-center gap-md">
                                            <span className="company-rank">{index + 1}</span>
                                            <span style={{ fontWeight: 600 }}>{company._id}</span>
                                        </div>
                                        <span className="badge badge-success" style={{ borderRadius: '8px' }}>
                                            {company.count} Hires
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Statistics;
