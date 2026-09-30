const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Company = require('./models/Company');
const Application = require('./models/Application');

const seedData = async () => {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Company.deleteMany({});
        await Application.deleteMany({});
        console.log('✅ Existing data cleared\n');

        // Create Admin User
        console.log('👤 Creating admin user...');
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@placement.com',
            password: adminPassword,
            role: 'admin'
        });
        console.log('✅ Admin created: admin@placement.com / admin123\n');

        // Helper function for future dates
        const futureDate = (days) => {
            const date = new Date();
            date.setDate(date.getDate() + days);
            return date;
        };

        // Create Sample Companies
        console.log('🏢 Creating 10 sample companies...');

        const companies = await Company.insertMany([
            {
                name: 'Google',
                description: 'A multinational technology company specializing in Internet-related services and products.',
                jobRole: 'Software Engineer',
                jobDescription: 'Develop and maintain scalable web applications using modern technologies.',
                package: 18.5,
                location: 'Bangalore',
                industry: 'Technology',
                totalPositions: 10,
                applicationDeadline: futureDate(5),
                visitDate: futureDate(12),
                status: 'ongoing',
                eligibilityCriteria: {
                    minCGPA: 7.5,
                    graduationYear: 2026,
                    allowedDepartments: ['Computer Science', 'Information Technology'],
                    backlogs: 0
                },
                appliedStudents: [],
                selectedStudents: [],
                createdBy: admin._id
            },
            {
                name: 'TCS',
                description: 'Leading IT services, consulting and business solutions organization.',
                jobRole: 'Assistant Systems Engineer',
                jobDescription: 'Develop and support enterprise applications.',
                package: 7.5,
                location: 'Multiple Locations',
                industry: 'IT Services',
                totalPositions: 50,
                applicationDeadline: futureDate(15),
                visitDate: futureDate(22),
                status: 'ongoing',
                eligibilityCriteria: {
                    minCGPA: 6.0,
                    graduationYear: 2026,
                    allowedDepartments: [],
                    backlogs: 2
                },
                appliedStudents: [],
                selectedStudents: [],
                createdBy: admin._id
            },
            {
                name: 'Wipro',
                description: 'Leading global information technology, consulting and business process services company.',
                jobRole: 'Project Engineer',
                jobDescription: 'Contribute to innovative technology solutions.',
                package: 7.0,
                location: 'Bangalore',
                industry: 'IT Services',
                totalPositions: 35,
                applicationDeadline: futureDate(18),
                visitDate: futureDate(25),
                status: 'ongoing',
                eligibilityCriteria: {
                    minCGPA: 6.5,
                    graduationYear: 2026,
                    allowedDepartments: ['Computer Science', 'Information Technology'],
                    backlogs: 2
                },
                appliedStudents: [],
                selectedStudents: [],
                createdBy: admin._id
            },
            {
                name: 'Infosys',
                description: 'Global leader in next-generation digital services and consulting.',
                jobRole: 'Systems Engineer',
                jobDescription: 'Work on diverse projects across various domains.',
                package: 8.0,
                location: 'Pune',
                industry: 'IT Services',
                totalPositions: 40,
                applicationDeadline: futureDate(20),
                visitDate: futureDate(27),
                status: 'ongoing',
                eligibilityCriteria: {
                    minCGPA: 6.5,
                    graduationYear: 2026,
                    allowedDepartments: [],
                    backlogs: 1
                },
                appliedStudents: [],
                selectedStudents: [],
                createdBy: admin._id
            },
            {
                name: 'Apperfect',
                description: 'Software testing and quality assurance solutions provider.',
                jobRole: 'QA Engineer',
                jobDescription: 'Test and ensure quality of software products.',
                package: 6.5,
                location: 'Noida',
                industry: 'Software Testing',
                totalPositions: 15,
                applicationDeadline: futureDate(10),
                visitDate: futureDate(17),
                status: 'ongoing',
                eligibilityCriteria: {
                    minCGPA: 6.0,
                    graduationYear: 2026,
                    allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics'],
                    backlogs: 3
                },
                appliedStudents: [],
                selectedStudents: [],
                createdBy: admin._id
            },
            {
                name: 'SecureMeter',
                description: 'Cybersecurity and network security solutions company.',
                jobRole: 'Security Analyst',
                jobDescription: 'Monitor and analyze security threats and vulnerabilities.',
                package: 9.0,
                location: 'Bangalore',
                industry: 'Cybersecurity',
                totalPositions: 8,
                applicationDeadline: futureDate(12),
                visitDate: futureDate(19),
                status: 'ongoing',
                eligibilityCriteria: {
                    minCGPA: 7.0,
                    graduationYear: 2026,
                    allowedDepartments: ['Computer Science', 'Information Technology'],
                    backlogs: 1
                },
                appliedStudents: [],
                selectedStudents: [],
                createdBy: admin._id
            },
            {
                name: 'redBus',
                description: 'India\'s largest online bus ticketing platform.',
                jobRole: 'Software Developer',
                jobDescription: 'Build and maintain bus booking platform features.',
                package: 10.5,
                location: 'Bangalore',
                industry: 'Travel Tech',
                totalPositions: 12,
                applicationDeadline: futureDate(8),
                visitDate: futureDate(15),
                status: 'ongoing',
                eligibilityCriteria: {
                    minCGPA: 7.0,
                    graduationYear: 2026,
                    allowedDepartments: ['Computer Science', 'Information Technology'],
                    backlogs: 1
                },
                appliedStudents: [],
                selectedStudents: [],
                createdBy: admin._id
            },
            {
                name: 'Goibibo',
                description: 'Leading online travel booking platform in India.',
                jobRole: 'Full Stack Developer',
                jobDescription: 'Develop end-to-end travel booking solutions.',
                package: 11.0,
                location: 'Gurgaon',
                industry: 'Travel Tech',
                totalPositions: 10,
                applicationDeadline: futureDate(7),
                visitDate: futureDate(14),
                status: 'ongoing',
                eligibilityCriteria: {
                    minCGPA: 7.5,
                    graduationYear: 2026,
                    allowedDepartments: ['Computer Science', 'Information Technology'],
                    backlogs: 0
                },
                appliedStudents: [],
                selectedStudents: [],
                createdBy: admin._id
            },
            {
                name: 'Amazon',
                description: 'Global e-commerce and cloud computing leader.',
                jobRole: 'SDE-1',
                jobDescription: 'Build and optimize large-scale distributed systems.',
                package: 17.5,
                location: 'Bangalore',
                industry: 'E-commerce',
                totalPositions: 12,
                applicationDeadline: futureDate(6),
                visitDate: futureDate(13),
                status: 'ongoing',
                eligibilityCriteria: {
                    minCGPA: 7.0,
                    graduationYear: 2026,
                    allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics'],
                    backlogs: 1
                },
                appliedStudents: [],
                selectedStudents: [],
                createdBy: admin._id
            },
            {
                name: 'Microsoft',
                description: 'Leading technology corporation developing software, hardware, and cloud services.',
                jobRole: 'SDE',
                jobDescription: 'Work on cutting-edge cloud technologies and enterprise solutions.',
                package: 20.0,
                location: 'Hyderabad',
                industry: 'Technology',
                totalPositions: 8,
                applicationDeadline: futureDate(4),
                visitDate: futureDate(11),
                status: 'ongoing',
                eligibilityCriteria: {
                    minCGPA: 8.0,
                    graduationYear: 2026,
                    allowedDepartments: ['Computer Science', 'Information Technology'],
                    backlogs: 0
                },
                appliedStudents: [],
                selectedStudents: [],
                createdBy: admin._id
            }
        ]);

        console.log(`✅ Created ${companies.length} companies\n`);

        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 DATABASE SEEDED SUCCESSFULLY!\n');
        console.log('📊 Summary:');
        console.log(`   • 1 Admin user`);
        console.log(`   • 0 Students (Register your own)`);
        console.log(`   • ${companies.length} Companies\n`);

        console.log('🔐 Login Credentials:');
        console.log('   ┌─────────────────────────────────────────┐');
        console.log('   │ ADMIN                                   │');
        console.log('   │ Email: admin@placement.com              │');
        console.log('   │ Password: admin123                      │');
        console.log('   └─────────────────────────────────────────┘\n');

        console.log('📋 Companies Created:');
        companies.forEach((company, index) => {
            console.log(`   ${index + 1}. ${company.name.padEnd(15)} - ₹${company.package.toString().padEnd(5)} LPA - ${company.location}`);
        });
        console.log('');

        console.log('💡 Next Steps:');
        console.log('   1. Start backend: cd backend && node server.js');
        console.log('   2. Start frontend: cd frontend && npm start');
        console.log('   3. Go to http://localhost:3000');
        console.log('   4. Login as admin or register as student\n');

        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
};

// Run the seed script
seedData();
