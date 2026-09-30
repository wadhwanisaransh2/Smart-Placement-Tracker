import React from 'react';
import { FiCheckCircle, FiClock, FiXCircle, FiCode, FiStar, FiCalendar } from 'react-icons/fi';
import './ApplicationTimeline.css';

const ApplicationTimeline = ({ application }) => {
    const statusConfig = {
        applied: {
            icon: FiClock,
            color: '#3b82f6',
            label: 'Applied',
            description: 'Application submitted'
        },
        oa: {
            icon: FiCode,
            color: '#8b5cf6',
            label: 'Online Assessment',
            description: 'OA round'
        },
        shortlisted: {
            icon: FiStar,
            color: '#f59e0b',
            label: 'Shortlisted',
            description: 'Shortlisted for interview'
        },
        'interview-scheduled': {
            icon: FiCalendar,
            color: '#10b981',
            label: 'Interview Scheduled',
            description: 'Interview date set'
        },
        selected: {
            icon: FiCheckCircle,
            color: '#22c55e',
            label: 'Selected',
            description: 'Congratulations!'
        },
        rejected: {
            icon: FiXCircle,
            color: '#ef4444',
            label: 'Rejected',
            description: 'Not selected'
        }
    };

    const statusOrder = ['applied', 'oa', 'shortlisted', 'interview-scheduled', 'selected'];
    const currentStatus = application.status;
    const statusHistory = application.statusHistory || [];

    // Get the index of current status
    const currentIndex = statusOrder.indexOf(currentStatus);
    const isRejected = currentStatus === 'rejected';

    // Build timeline items
    const timelineItems = statusOrder.map((status, index) => {
        const config = statusConfig[status];
        const Icon = config.icon;

        // Check if this status is in history
        const historyItem = statusHistory.find(h => h.status === status);
        const isCompleted = index <= currentIndex && !isRejected;
        const isCurrent = status === currentStatus && !isRejected;
        const isPending = index > currentIndex && !isRejected;

        return {
            status,
            config,
            Icon,
            isCompleted,
            isCurrent,
            isPending,
            date: historyItem?.changedAt,
            index
        };
    });

    // Add rejected status if applicable
    if (isRejected) {
        const rejectedHistory = statusHistory.find(h => h.status === 'rejected');
        timelineItems.push({
            status: 'rejected',
            config: statusConfig.rejected,
            Icon: statusConfig.rejected.icon,
            isCompleted: false,
            isCurrent: true,
            isPending: false,
            date: rejectedHistory?.changedAt,
            index: statusOrder.length
        });
    }

    return (
        <div className="application-timeline">
            <h3 className="timeline-title">Application Progress</h3>

            <div className="timeline-container">
                {timelineItems.map((item, idx) => {
                    // Don't show rejected in the main flow
                    if (item.status === 'rejected' && idx < timelineItems.length - 1) {
                        return null;
                    }

                    return (
                        <div
                            key={item.status}
                            className={`timeline-item ${item.isCompleted ? 'completed' : ''} ${item.isCurrent ? 'current' : ''} ${item.isPending ? 'pending' : ''}`}
                        >
                            <div className="timeline-marker" style={{ borderColor: item.config.color }}>
                                <div className="timeline-icon" style={{ background: item.config.color }}>
                                    <item.Icon />
                                </div>
                            </div>

                            <div className="timeline-content">
                                <div className="timeline-header">
                                    <h4 style={{ color: item.config.color }}>{item.config.label}</h4>
                                    {item.date && (
                                        <span className="timeline-date">
                                            {new Date(item.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    )}
                                </div>
                                <p className="timeline-description">{item.config.description}</p>

                                {item.isCurrent && !isRejected && (
                                    <div className="timeline-badge current-badge">Current Stage</div>
                                )}

                                {item.status === 'rejected' && (
                                    <div className="timeline-badge rejected-badge">Application Closed</div>
                                )}
                            </div>

                            {idx < timelineItems.length - 1 && item.status !== 'rejected' && (
                                <div className={`timeline-connector ${item.isCompleted ? 'completed' : ''}`}></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {application.interviewDate && currentStatus === 'interview-scheduled' && (
                <div className="interview-details">
                    <h4>Interview Details</h4>
                    <div className="interview-info">
                        <div className="info-row">
                            <FiCalendar />
                            <span>Date: {new Date(application.interviewDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                        {application.interviewMode && (
                            <div className="info-row">
                                <span>Mode: {application.interviewMode}</span>
                            </div>
                        )}
                        {application.interviewLocation && (
                            <div className="info-row">
                                <span>Location: {application.interviewLocation}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {application.notes && (
                <div className="timeline-notes">
                    <h4>Notes</h4>
                    <p>{application.notes}</p>
                </div>
            )}
        </div>
    );
};

export default ApplicationTimeline;
