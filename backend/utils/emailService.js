const nodemailer = require('nodemailer');

/**
 * Email Notification Service
 * Sends automated emails to students for various placement events
 */

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
    if (transporter) return transporter;

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email credentials not configured. Email notifications disabled.');
        console.warn('Add EMAIL_USER and EMAIL_PASS to .env file to enable emails.');
        return null;
    }

    try {
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        console.log('✅ Email service initialized successfully');
        return transporter;
    } catch (error) {
        console.error('❌ Failed to initialize email service:', error.message);
        return null;
    }
}

/**
 * Send email
 */
async function sendEmail(to, subject, html) {
    const emailTransporter = initializeTransporter();

    if (!emailTransporter) {
        console.log('📧 Email not sent (service not configured):', subject);
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const mailOptions = {
            from: `"Placement Tracker" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log('✅ Email sent:', subject, 'to', to);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        return { success: false, message: error.message };
    }
}

/**
 * Email Templates
 */

// 1. Application Status Update
function getStatusUpdateEmail(studentName, companyName, oldStatus, newStatus) {
    const statusEmojis = {
        applied: '📝',
        oa: '💻',
        shortlisted: '⭐',
        'interview-scheduled': '📅',
        selected: '🎉',
        rejected: '❌'
    };

    const statusColors = {
        applied: '#3b82f6',
        oa: '#8b5cf6',
        shortlisted: '#f59e0b',
        'interview-scheduled': '#10b981',
        selected: '#22c55e',
        rejected: '#ef4444'
    };

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .status-badge { display: inline-block; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📬 Application Status Update</h1>
                </div>
                <div class="content">
                    <p>Hi <strong>${studentName}</strong>,</p>
                    
                    <p>Your application status for <strong>${companyName}</strong> has been updated!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div class="status-badge" style="background-color: ${statusColors[oldStatus]}; color: white;">
                            ${statusEmojis[oldStatus]} ${oldStatus.toUpperCase()}
                        </div>
                        <div style="font-size: 24px; margin: 10px 0;">↓</div>
                        <div class="status-badge" style="background-color: ${statusColors[newStatus]}; color: white;">
                            ${statusEmojis[newStatus]} ${newStatus.toUpperCase()}
                        </div>
                    </div>
                    
                    ${newStatus === 'selected' ? `
                        <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                            <strong>🎉 Congratulations!</strong> You have been selected by ${companyName}!
                        </div>
                    ` : ''}
                    
                    ${newStatus === 'interview-scheduled' ? `
                        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                            <strong>📅 Interview Scheduled!</strong> Please check your dashboard for interview details.
                        </div>
                    ` : ''}
                    
                    <p>Login to your dashboard to view more details and track your application progress.</p>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:3000/my-applications" class="button">View My Applications</a>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated email from Placement Tracker System</p>
                    <p>© 2026 Placement Tracker. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// 2. New Company Posted
function getNewCompanyEmail(studentName, company) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .company-card { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 New Company Alert!</h1>
                </div>
                <div class="content">
                    <p>Hi <strong>${studentName}</strong>,</p>
                    
                    <p>A new company has been posted on the placement portal. Check if you're eligible and apply now!</p>
                    
                    <div class="company-card">
                        <h2 style="color: #667eea; margin-top: 0;">${company.name}</h2>
                        
                        <div class="detail-row">
                            <span><strong>Job Role:</strong></span>
                            <span>${company.jobRole}</span>
                        </div>
                        
                        <div class="detail-row">
                            <span><strong>Package:</strong></span>
                            <span>₹${company.package} LPA</span>
                        </div>
                        
                        <div class="detail-row">
                            <span><strong>Location:</strong></span>
                            <span>${company.location || 'Not specified'}</span>
                        </div>
                        
                        <div class="detail-row">
                            <span><strong>Deadline:</strong></span>
                            <span>${new Date(company.applicationDeadline).toLocaleDateString()}</span>
                        </div>
                        
                        <div class="detail-row" style="border-bottom: none;">
                            <span><strong>Min CGPA:</strong></span>
                            <span>${company.eligibilityCriteria?.minCGPA || 0}</span>
                        </div>
                    </div>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <strong>⏰ Don't miss out!</strong> Application deadline is ${new Date(company.applicationDeadline).toLocaleDateString()}
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:3000/companies/${company._id}" class="button">View Details & Apply</a>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated email from Placement Tracker System</p>
                    <p>© 2026 Placement Tracker. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// 3. Deadline Reminder
function getDeadlineReminderEmail(studentName, company, daysLeft) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .urgent-box { background: #fee2e2; border: 2px solid #ef4444; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Deadline Reminder!</h1>
                </div>
                <div class="content">
                    <p>Hi <strong>${studentName}</strong>,</p>
                    
                    <div class="urgent-box">
                        <h2 style="color: #ef4444; margin-top: 0;">⚠️ ${daysLeft} Day${daysLeft > 1 ? 's' : ''} Left!</h2>
                        <p style="font-size: 18px; margin: 10px 0;">Application deadline for <strong>${company.name}</strong> is approaching!</p>
                        <p style="font-size: 16px; color: #991b1b;">Deadline: ${new Date(company.applicationDeadline).toLocaleDateString()}</p>
                    </div>
                    
                    <p><strong>Company:</strong> ${company.name}</p>
                    <p><strong>Job Role:</strong> ${company.jobRole}</p>
                    <p><strong>Package:</strong> ₹${company.package} LPA</p>
                    
                    <p>Don't miss this opportunity! Apply now before the deadline.</p>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:3000/companies/${company._id}" class="button">Apply Now</a>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated email from Placement Tracker System</p>
                    <p>© 2026 Placement Tracker. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// 4. Welcome Email
function getWelcomeEmail(studentName, email) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .feature-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to Placement Tracker!</h1>
                </div>
                <div class="content">
                    <p>Hi <strong>${studentName}</strong>,</p>
                    
                    <p>Welcome to the Placement Tracker System! We're excited to help you in your placement journey.</p>
                    
                    <h3 style="color: #667eea;">🚀 Get Started:</h3>
                    
                    <div class="feature-box">
                        <strong>1. Complete Your Profile</strong>
                        <p>Add your CGPA, department, skills, and upload your resume</p>
                    </div>
                    
                    <div class="feature-box">
                        <strong>2. Browse Companies</strong>
                        <p>Check eligibility and apply to companies that match your profile</p>
                    </div>
                    
                    <div class="feature-box">
                        <strong>3. Score Your Resume</strong>
                        <p>Get instant feedback on how well your resume matches each job</p>
                    </div>
                    
                    <div class="feature-box">
                        <strong>4. Track Applications</strong>
                        <p>Monitor your application status and interview schedules</p>
                    </div>
                    
                    <p><strong>Your Login Email:</strong> ${email}</p>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:3000/profile" class="button">Complete Your Profile</a>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated email from Placement Tracker System</p>
                    <p>© 2026 Placement Tracker. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Public API Functions
 */

// Send application status update email
async function sendStatusUpdateEmail(studentEmail, studentName, companyName, oldStatus, newStatus) {
    const subject = `Application Status Update - ${companyName}`;
    const html = getStatusUpdateEmail(studentName, companyName, oldStatus, newStatus);
    return await sendEmail(studentEmail, subject, html);
}

// Send new company notification
async function sendNewCompanyEmail(studentEmail, studentName, company) {
    const subject = `🚀 New Company Posted - ${company.name}`;
    const html = getNewCompanyEmail(studentName, company);
    return await sendEmail(studentEmail, subject, html);
}

// Send deadline reminder
async function sendDeadlineReminderEmail(studentEmail, studentName, company, daysLeft) {
    const subject = `⏰ Deadline Reminder - ${company.name} (${daysLeft} day${daysLeft > 1 ? 's' : ''} left)`;
    const html = getDeadlineReminderEmail(studentName, company, daysLeft);
    return await sendEmail(studentEmail, subject, html);
}

// Send welcome email
async function sendWelcomeEmail(studentEmail, studentName) {
    const subject = '🎉 Welcome to Placement Tracker!';
    const html = getWelcomeEmail(studentName, studentEmail);
    return await sendEmail(studentEmail, subject, html);
}

module.exports = {
    sendStatusUpdateEmail,
    sendNewCompanyEmail,
    sendDeadlineReminderEmail,
    sendWelcomeEmail,
    sendEmail
};
