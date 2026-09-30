/**
 * Quick Test Script for Multi-Role Feature
 * 
 * Usage:
 * 1. Make sure backend server is running
 * 2. Update the AUTH_TOKEN below with your admin token
 * 3. Run: node test-multi-role.js
 */

const axios = require('axios');

// ⚠️ UPDATE THIS with your actual admin auth token
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
    }
});

// Test data: Company with multiple job roles
const testCompany = {
    name: "Google India - Test",
    description: "Leading technology company",
    website: "https://www.google.com",
    industry: "Technology",
    location: "Bangalore",
    visitDate: "2026-03-15",
    status: "upcoming",
    jobOpenings: [
        {
            role: "Software Engineer",
            description: "Backend development with Go and Python",
            package: 18,
            totalPositions: 5,
            applicationDeadline: "2026-03-01T23:59:59.000Z",
            eligibilityCriteria: {
                minCGPA: 7.5,
                allowedDepartments: ["Computer Science", "IT"],
                graduationYear: 2026,
                backlogs: 0
            }
        },
        {
            role: "Data Analyst",
            description: "Data analysis and visualization",
            package: 12,
            totalPositions: 3,
            applicationDeadline: "2026-03-05T23:59:59.000Z",
            eligibilityCriteria: {
                minCGPA: 7.0,
                allowedDepartments: ["Computer Science", "IT", "Mathematics"],
                graduationYear: 2026,
                backlogs: 1
            }
        },
        {
            role: "UI/UX Designer",
            description: "Design user interfaces",
            package: 10,
            totalPositions: 2,
            applicationDeadline: "2026-03-10T23:59:59.000Z",
            eligibilityCriteria: {
                minCGPA: 6.5,
                allowedDepartments: [],
                graduationYear: 2026,
                backlogs: 2
            }
        }
    ]
};

// Test: Create company with multiple roles
async function testCreateMultiRoleCompany() {
    console.log('\n🧪 TEST 1: Creating company with multiple job roles...\n');

    try {
        const response = await api.post('/companies', testCompany);

        console.log('✅ SUCCESS! Company created with multiple roles\n');
        console.log('Company ID:', response.data.company._id);
        console.log('Company Name:', response.data.company.name);
        console.log('Number of Job Openings:', response.data.company.jobOpenings.length);
        console.log('\nJob Roles:');

        response.data.company.jobOpenings.forEach((job, index) => {
            console.log(`\n  ${index + 1}. ${job.role}`);
            console.log(`     Package: ₹${job.package} LPA`);
            console.log(`     Positions: ${job.totalPositions}`);
            console.log(`     Min CGPA: ${job.eligibilityCriteria.minCGPA}`);
            console.log(`     Departments: ${job.eligibilityCriteria.allowedDepartments.length > 0 ? job.eligibilityCriteria.allowedDepartments.join(', ') : 'All'}`);
            console.log(`     Job Opening ID: ${job._id}`);
        });

        return response.data.company._id;
    } catch (error) {
        console.error('❌ FAILED!');
        if (error.response) {
            console.error('Error:', error.response.data.message || error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        return null;
    }
}

// Test: Get company details
async function testGetCompanyDetails(companyId) {
    console.log('\n\n🧪 TEST 2: Fetching company details...\n');

    try {
        const response = await api.get(`/companies/${companyId}`);

        console.log('✅ SUCCESS! Company details retrieved\n');
        console.log('Company:', response.data.company.name);
        console.log('Status:', response.data.company.status);
        console.log('Location:', response.data.company.location);
        console.log('Job Openings:', response.data.company.jobOpenings.length);

        return true;
    } catch (error) {
        console.error('❌ FAILED!');
        console.error('Error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test: Create legacy single-role company (backward compatibility)
async function testLegacyFormat() {
    console.log('\n\n🧪 TEST 3: Testing backward compatibility (legacy single-role format)...\n');

    const legacyCompany = {
        name: "Infosys - Legacy Test",
        description: "IT services company",
        location: "Pune",
        industry: "IT Services",
        jobRole: "Systems Engineer",
        jobDescription: "Software development and maintenance",
        package: 8,
        totalPositions: 20,
        applicationDeadline: "2026-03-15T23:59:59.000Z",
        visitDate: "2026-04-01",
        status: "upcoming",
        eligibilityCriteria: {
            minCGPA: 6.0,
            allowedDepartments: [],
            graduationYear: 2026,
            backlogs: 2
        }
    };

    try {
        const response = await api.post('/companies', legacyCompany);

        console.log('✅ SUCCESS! Legacy format converted to multi-role\n');
        console.log('Company ID:', response.data.company._id);
        console.log('Company Name:', response.data.company.name);
        console.log('Converted to jobOpenings array:', response.data.company.jobOpenings ? 'Yes' : 'No');

        if (response.data.company.jobOpenings && response.data.company.jobOpenings.length > 0) {
            console.log('\nConverted Job Opening:');
            const job = response.data.company.jobOpenings[0];
            console.log(`  Role: ${job.role}`);
            console.log(`  Package: ₹${job.package} LPA`);
            console.log(`  Positions: ${job.totalPositions}`);
        }

        return true;
    } catch (error) {
        console.error('❌ FAILED!');
        console.error('Error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test: List all companies
async function testListCompanies() {
    console.log('\n\n🧪 TEST 4: Listing all companies...\n');

    try {
        const response = await api.get('/companies');

        console.log('✅ SUCCESS! Companies retrieved\n');
        console.log(`Total Companies: ${response.data.companies.length}\n`);

        response.data.companies.slice(0, 5).forEach((company, index) => {
            console.log(`${index + 1}. ${company.name}`);
            console.log(`   Job Openings: ${company.jobOpenings?.length || 0}`);
            if (company.jobOpenings && company.jobOpenings.length > 0) {
                company.jobOpenings.forEach(job => {
                    console.log(`   - ${job.role} (₹${job.package} LPA)`);
                });
            }
            console.log('');
        });

        return true;
    } catch (error) {
        console.error('❌ FAILED!');
        console.error('Error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('═══════════════════════════════════════════════════');
    console.log('   MULTI-ROLE FEATURE TEST SUITE');
    console.log('═══════════════════════════════════════════════════');

    if (AUTH_TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
        console.error('\n❌ ERROR: Please update AUTH_TOKEN in the script with your actual admin token!\n');
        console.log('To get your token:');
        console.log('1. Login to the app as admin');
        console.log('2. Open browser console');
        console.log('3. Run: localStorage.getItem("token")');
        console.log('4. Copy the token and paste it in this script\n');
        return;
    }

    try {
        // Test 1: Create multi-role company
        const companyId = await testCreateMultiRoleCompany();

        if (companyId) {
            // Test 2: Get company details
            await testGetCompanyDetails(companyId);
        }

        // Test 3: Legacy format
        await testLegacyFormat();

        // Test 4: List companies
        await testListCompanies();

        console.log('\n═══════════════════════════════════════════════════');
        console.log('   ALL TESTS COMPLETED!');
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
    }
}

// Run the tests
runTests();
