const fs = require('fs');
const path = require('path');
const PDF = require('pdf-parse');

/**
 * Rule-Based Resume Scoring System (No AI/ML)
 * Analyzes resume based on keywords, structure, and company requirements
 */

// Common technical skills by category
const SKILL_CATEGORIES = {
    programming: ['javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript', 'php', 'swift', 'kotlin'],
    web: ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'asp.net', 'html', 'css', 'bootstrap', 'tailwind'],
    database: ['mongodb', 'mysql', 'postgresql', 'redis', 'oracle', 'sql', 'nosql', 'firebase', 'dynamodb'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'devops'],
    mobile: ['android', 'ios', 'react native', 'flutter', 'xamarin'],
    dataScience: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'data analysis'],
    tools: ['git', 'github', 'gitlab', 'jira', 'agile', 'scrum', 'linux', 'bash']
};

// Job role to required skills mapping
const ROLE_SKILLS = {
    'software engineer': ['programming', 'web', 'database', 'tools'],
    'full stack developer': ['programming', 'web', 'database', 'tools'],
    'frontend developer': ['web', 'programming', 'tools'],
    'backend developer': ['programming', 'database', 'web', 'tools'],
    'data scientist': ['dataScience', 'programming', 'database'],
    'data analyst': ['dataScience', 'database', 'tools'],
    'devops engineer': ['cloud', 'tools', 'programming'],
    'mobile developer': ['mobile', 'programming', 'tools'],
    'security analyst': ['tools', 'programming', 'cloud'],
    'default': ['programming', 'tools']
};

// Important resume sections
const RESUME_SECTIONS = [
    'experience', 'work experience', 'internship', 'projects',
    'education', 'skills', 'technical skills', 'achievements',
    'certifications', 'awards'
];

/**
 * Extract text from PDF resume
 */
async function extractTextFromPDF(resumePath) {
    try {
        console.log('Extracting text from PDF:', resumePath);
        const dataBuffer = fs.readFileSync(resumePath);
        console.log('PDF file size:', dataBuffer.length, 'bytes');

        const data = await PDF(dataBuffer);
        console.log('PDF parsed successfully. Text length:', data.text.length);

        if (!data.text || data.text.trim().length === 0) {
            throw new Error('PDF appears to be empty or contains only images');
        }

        return data.text.toLowerCase();
    } catch (error) {
        console.error('PDF extraction error:', error.message);
        throw new Error(`Failed to parse resume PDF: ${error.message}`);
    }
}

/**
 * Count skill matches in resume text
 */
function countSkillMatches(resumeText, requiredCategories) {
    let totalSkills = 0;
    let matchedSkills = 0;
    const foundSkills = [];

    requiredCategories.forEach(category => {
        const skills = SKILL_CATEGORIES[category] || [];
        skills.forEach(skill => {
            totalSkills++;
            if (resumeText.includes(skill)) {
                matchedSkills++;
                foundSkills.push(skill);
            }
        });
    });

    return { matchedSkills, totalSkills, foundSkills };
}

/**
 * Check for important resume sections
 */
function checkResumeSections(resumeText) {
    const foundSections = [];
    RESUME_SECTIONS.forEach(section => {
        if (resumeText.includes(section)) {
            foundSections.push(section);
        }
    });
    return foundSections;
}

/**
 * Check for contact information
 */
function checkContactInfo(resumeText) {
    const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText);
    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
    const hasLinkedIn = resumeText.includes('linkedin');
    const hasGitHub = resumeText.includes('github');

    return { hasEmail, hasPhone, hasLinkedIn, hasGitHub };
}

/**
 * Check for quantifiable achievements (numbers in resume)
 */
function checkQuantifiableAchievements(resumeText) {
    // Look for patterns like "increased by 50%", "managed 10 projects", etc.
    const percentagePattern = /\d+%/g;
    const numberPattern = /\b\d+\+?\b/g;

    const percentages = resumeText.match(percentagePattern) || [];
    const numbers = resumeText.match(numberPattern) || [];

    return percentages.length + numbers.length;
}

/**
 * Check resume length (ideal: 1-2 pages = 500-1500 words)
 */
function checkResumeLength(resumeText) {
    const words = resumeText.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    if (wordCount < 300) return { score: 0, feedback: 'Too short' };
    if (wordCount >= 300 && wordCount <= 1500) return { score: 1, feedback: 'Good length' };
    if (wordCount > 1500) return { score: 0.5, feedback: 'Too long' };
}

/**
 * Main scoring function
 */
async function scoreResume(resumePath, jobRole, companyName) {
    try {
        // Extract text from PDF
        const resumeText = await extractTextFromPDF(resumePath);

        // Determine required skill categories based on job role
        const normalizedRole = jobRole.toLowerCase();
        let requiredCategories = ROLE_SKILLS['default'];

        for (const [role, categories] of Object.entries(ROLE_SKILLS)) {
            if (normalizedRole.includes(role)) {
                requiredCategories = categories;
                break;
            }
        }

        // Scoring components (total = 10 points)
        let score = 0;
        const breakdown = {};

        // 1. Skills Match (4 points)
        const { matchedSkills, totalSkills, foundSkills } = countSkillMatches(resumeText, requiredCategories);
        const skillScore = Math.min(4, (matchedSkills / Math.max(totalSkills * 0.3, 1)) * 4);
        score += skillScore;
        breakdown.skills = {
            score: skillScore.toFixed(1),
            matched: matchedSkills,
            total: totalSkills,
            foundSkills: foundSkills.slice(0, 10) // Top 10 skills
        };

        // 2. Resume Structure (2 points)
        const sections = checkResumeSections(resumeText);
        const structureScore = Math.min(2, (sections.length / 5) * 2);
        score += structureScore;
        breakdown.structure = {
            score: structureScore.toFixed(1),
            foundSections: sections
        };

        // 3. Contact Information (1 point)
        const contactInfo = checkContactInfo(resumeText);
        let contactScore = 0;
        if (contactInfo.hasEmail) contactScore += 0.3;
        if (contactInfo.hasPhone) contactScore += 0.3;
        if (contactInfo.hasLinkedIn) contactScore += 0.2;
        if (contactInfo.hasGitHub) contactScore += 0.2;
        score += contactScore;
        breakdown.contact = {
            score: contactScore.toFixed(1),
            ...contactInfo
        };

        // 4. Quantifiable Achievements (1.5 points)
        const achievements = checkQuantifiableAchievements(resumeText);
        const achievementScore = Math.min(1.5, (achievements / 10) * 1.5);
        score += achievementScore;
        breakdown.achievements = {
            score: achievementScore.toFixed(1),
            count: achievements
        };

        // 5. Resume Length (1 point)
        const lengthCheck = checkResumeLength(resumeText);
        score += lengthCheck.score;
        breakdown.length = {
            score: lengthCheck.score.toFixed(1),
            feedback: lengthCheck.feedback
        };

        // 6. Company-specific keywords (0.5 points)
        const companyKeywords = companyName.toLowerCase().split(/\s+/);
        let companyScore = 0;
        companyKeywords.forEach(keyword => {
            if (keyword.length > 3 && resumeText.includes(keyword)) {
                companyScore += 0.2;
            }
        });
        companyScore = Math.min(0.5, companyScore);
        score += companyScore;
        breakdown.companyMatch = {
            score: companyScore.toFixed(1),
            hasCompanyMention: companyScore > 0
        };

        // Round final score to 1 decimal place
        score = Math.min(10, Math.round(score * 10) / 10);

        // Generate feedback
        const feedback = generateFeedback(score, breakdown);

        return {
            score,
            breakdown,
            feedback,
            jobRole,
            companyName
        };

    } catch (error) {
        console.error('Resume scoring error:', error);
        throw error;
    }
}

/**
 * Generate human-readable feedback
 */
function generateFeedback(score, breakdown) {
    const feedback = [];

    if (score >= 8) {
        feedback.push('✅ Excellent resume! Strong match for this role.');
    } else if (score >= 6) {
        feedback.push('✅ Good resume with room for improvement.');
    } else if (score >= 4) {
        feedback.push('⚠️ Average resume. Consider improvements below.');
    } else {
        feedback.push('❌ Resume needs significant improvements.');
    }

    // Specific suggestions
    if (parseFloat(breakdown.skills.score) < 2) {
        feedback.push('💡 Add more relevant technical skills for this role.');
    }

    if (parseFloat(breakdown.structure.score) < 1) {
        feedback.push('💡 Include key sections: Experience, Projects, Skills, Education.');
    }

    if (parseFloat(breakdown.contact.score) < 0.8) {
        feedback.push('💡 Add complete contact info: Email, Phone, LinkedIn, GitHub.');
    }

    if (parseFloat(breakdown.achievements.score) < 0.8) {
        feedback.push('💡 Add quantifiable achievements (numbers, percentages, metrics).');
    }

    if (breakdown.length.feedback !== 'Good length') {
        feedback.push(`💡 Resume length: ${breakdown.length.feedback}. Aim for 1-2 pages.`);
    }

    if (parseFloat(breakdown.companyMatch.score) === 0) {
        feedback.push('💡 Research the company and tailor your resume accordingly.');
    }

    return feedback;
}

module.exports = {
    scoreResume,
    extractTextFromPDF
};
