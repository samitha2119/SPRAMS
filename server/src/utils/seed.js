require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../models/Project');
const ResearchEntry = require('../models/ResearchEntry');
const StudentResearch = require('../models/StudentResearch');
const LecturerResearch = require('../models/LecturerResearch');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const FormTemplate = require('../models/FormTemplate');
const Evaluation = require('../models/Evaluation');
const { WorkspaceStudent, WorkspaceProject, WorkspaceProjectGroup, WorkspaceSubmission, WorkspaceEvaluation } = require('../models/Workspace');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Project.deleteMany({});
        await ResearchEntry.deleteMany({});
        await StudentResearch.deleteMany({});
        await LecturerResearch.deleteMany({});
        await ActivityLog.deleteMany({});
        await Notification.deleteMany({});
        await FormTemplate.deleteMany({});
        await Evaluation.deleteMany({});
        await WorkspaceStudent.deleteMany({});
        await WorkspaceProject.deleteMany({});
        await WorkspaceProjectGroup.deleteMany({});
        await WorkspaceSubmission.deleteMany({});
        await WorkspaceEvaluation.deleteMany({});

        // Create admin user
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@archive.edu',
            passwordHash: 'admin123456',
            role: 'admin',
            approvalStatus: 'approved',
        });

        // Create lecturer
        const lecturer = await User.create({
            name: 'Dr. Jane Smith',
            email: 'lecturer@archive.edu',
            passwordHash: 'lecturer123',
            role: 'lecturer',
            approvalStatus: 'approved',
        });

        // Create student
        const student = await User.create({
            name: 'John Doe',
            email: 'student@archive.edu',
            passwordHash: 'student123',
            role: 'student',
            approvalStatus: 'approved',
        });

        // Create workspace student records
        const wsStudent = await WorkspaceStudent.create({
            _id: student._id,
            studentID: 'STU1001',
            registrationNumber: 'CS/2020/001',
            name: 'John Doe'
        });

        const wsAlice = await WorkspaceStudent.create({
            studentID: 'STU1002',
            registrationNumber: 'CS/2020/002',
            name: 'Alice Johnson'
        });

        const wsBob = await WorkspaceStudent.create({
            studentID: 'STU1003',
            registrationNumber: 'CS/2020/003',
            name: 'Bob Williams'
        });

        // Create workspace project
        const wsProject = await WorkspaceProject.create({
            projectID: 'PROJ1001',
            title: 'AI-Powered Crop Disease Detection System',
            status: 'Ongoing'
        });

        // Create workspace project group
        await WorkspaceProjectGroup.create({
            projectGroupID: 'GROUP1001',
            projectID: wsProject._id,
            students: [wsStudent._id, wsAlice._id, wsBob._id]
        });

        // Create dummy upload path folders
        if (!require('fs').existsSync('uploads/submissions/')) {
            require('fs').mkdirSync('uploads/submissions/', { recursive: true });
        }
        require('fs').writeFileSync('uploads/submissions/proposal_v1.pdf', 'Dummy PDF file content');
        require('fs').writeFileSync('uploads/submissions/proposal_v2.pdf', 'Dummy PDF file content');
        require('fs').writeFileSync('uploads/submissions/progress_report_v1.pdf', 'Dummy PDF file content');

        // Create workspace submissions (past versions)
        await WorkspaceSubmission.create({
            submissionID: 'SUB1001',
            projectID: wsProject._id,
            submissionType: 'Proposal',
            filePath: 'uploads/submissions/proposal_v1.pdf',
            originalName: 'Crop_Detection_Proposal_Draft.pdf',
            submittedBy: wsStudent._id,
            versionNumber: 1
        });

        await WorkspaceSubmission.create({
            submissionID: 'SUB1002',
            projectID: wsProject._id,
            submissionType: 'Proposal',
            filePath: 'uploads/submissions/proposal_v2.pdf',
            originalName: 'Crop_Detection_Proposal_Final.pdf',
            submittedBy: wsStudent._id,
            versionNumber: 2
        });

        await WorkspaceSubmission.create({
            submissionID: 'SUB1003',
            projectID: wsProject._id,
            submissionType: 'Progress Report',
            filePath: 'uploads/submissions/progress_report_v1.pdf',
            originalName: 'Mid_Term_Progress_Report.pdf',
            submittedBy: wsAlice._id,
            versionNumber: 1
        });

        // Create workspace evaluations
        await WorkspaceEvaluation.create({
            evaluationID: 'EVAL1001',
            projectID: wsProject._id,
            marks: 85,
            feedback: 'The crop disease detection proposal is well-written. Please ensure you detail the convolutional neural network architecture in your progress report. Keep up the good work.',
            gradedBy: 'Dr. Jane Smith'
        });

        await WorkspaceEvaluation.create({
            evaluationID: 'EVAL1002',
            projectID: wsProject._id,
            marks: 90,
            feedback: 'Progress report received. The prototype results look promising. Please optimize the model for execution speed in the next iteration.',
            gradedBy: 'Dr. Jane Smith'
        });

        // Create sample projects
        const projects = await Project.insertMany([
            {
                title: 'AI-Powered Crop Disease Detection System',
                department: 'IT',
                academicYear: '2023/2024',
                groupName: 'Team Alpha',
                supervisor: 'Dr. Jane Smith',
                abstract: 'This project develops an AI-powered system for early detection of crop diseases using computer vision and machine learning. The system analyzes images captured by smartphones to identify common crop diseases, providing farmers with actionable insights to improve yield and reduce economic losses.',
                members: [
                    { name: 'Alice Johnson', regNo: 'CS/2020/001' },
                    { name: 'Bob Williams', regNo: 'CS/2020/002' },
                    { name: 'Carol Davis', regNo: 'CS/2020/003' },
                ],
                createdBy: student._id,
                githubLink: 'https://github.com/teamalpha/crop-disease-detection',
                status: 'Completed',
                proposalFile: {
                    originalName: 'Crop_Disease_Detection_Proposal.pdf',
                    filePath: 'uploads/submissions/proposal_v1.pdf',
                    fileType: 'application/pdf',
                    fileSize: 1024
                },
                finalReportFile: {
                    originalName: 'Crop_Disease_Detection_Final_Report.pdf',
                    filePath: 'uploads/submissions/proposal_v2.pdf',
                    fileType: 'application/pdf',
                    fileSize: 2048
                },
                files: [
                    {
                        originalName: 'Disease_Dataset_Samples.zip',
                        filePath: 'uploads/submissions/proposal_v1.pdf',
                        fileType: 'application/zip',
                        fileSize: 5120,
                        category: 'dataset'
                    },
                    {
                        originalName: 'System_Architecture_Diagram.png',
                        filePath: 'uploads/submissions/proposal_v1.pdf',
                        fileType: 'image/png',
                        fileSize: 1536,
                        category: 'image'
                    }
                ]
            },
            {
                title: 'Smart Campus Energy Management System',
                department: 'BIO',
                academicYear: '2023/2024',
                groupName: 'EcoTech',
                supervisor: 'Prof. Michael Brown',
                abstract: 'A comprehensive IoT-based energy management system designed for university campuses. The system monitors power consumption in real-time, applies machine learning algorithms to predict energy demand, and automatically adjusts building systems to reduce energy waste by up to 30%.',
                members: [
                    { name: 'David Wilson', regNo: 'EE/2020/010' },
                    { name: 'Emma Martinez', regNo: 'EE/2020/011' },
                ],
                createdBy: admin._id,
                githubLink: 'https://github.com/ecotech/smart-energy-iot',
                status: 'Completed',
                proposalFile: {
                    originalName: 'Smart_Campus_Energy_Proposal.pdf',
                    filePath: 'uploads/submissions/proposal_v1.pdf',
                    fileType: 'application/pdf',
                    fileSize: 1200
                },
                finalReportFile: {
                    originalName: 'Smart_Campus_Energy_Final_Report.pdf',
                    filePath: 'uploads/submissions/proposal_v2.pdf',
                    fileType: 'application/pdf',
                    fileSize: 2450
                }
            },
            {
                title: 'Blockchain-Based Academic Credential Verification',
                department: 'IT',
                academicYear: '2022/2023',
                groupName: 'BlockEdu',
                supervisor: 'Dr. Sarah Lee',
                abstract: 'This project implements a blockchain-based system for storing, managing, and verifying academic credentials. Using distributed ledger technology, the system ensures tamper-proof storage of certificates and transcripts, enabling instant verification by employers and institutions worldwide.',
                members: [
                    { name: 'Frank Garcia', regNo: 'IT/2019/005' },
                    { name: 'Grace Taylor', regNo: 'IT/2019/006' },
                    { name: 'Henry Anderson', regNo: 'IT/2019/007' },
                    { name: 'Iris Thomas', regNo: 'IT/2019/008' },
                ],
                createdBy: admin._id,
                githubLink: 'https://github.com/blockedu/credential-verify-chain',
                status: 'Completed',
                proposalFile: {
                    originalName: 'Academic_Credential_Verification_Proposal.pdf',
                    filePath: 'uploads/submissions/proposal_v1.pdf',
                    fileType: 'application/pdf',
                    fileSize: 1100
                },
                finalReportFile: {
                    originalName: 'Academic_Credential_Verification_Final_Report.pdf',
                    filePath: 'uploads/submissions/proposal_v2.pdf',
                    fileType: 'application/pdf',
                    fileSize: 2150
                }
            },
        ]);

        // Create sample research entries
        await ResearchEntry.insertMany([
            {
                title: 'Deep Learning Approaches for Natural Language Processing in Low-Resource Languages',
                description: 'This research investigates transfer learning techniques and cross-lingual models for improving NLP performance in languages with limited training data. We evaluate BERT-based models fine-tuned on multilingual datasets and propose a novel domain adaptation approach that achieves state-of-the-art results on five low-resource languages.',
                authorId: lecturer._id,
                department: 'IT',
                year: 2024,
                tags: ['deep learning', 'NLP', 'low-resource languages', 'transfer learning', 'BERT'],
                files: [
                    {
                        originalName: 'NLP_Translation_Evaluation_Data.pdf',
                        filePath: 'uploads/submissions/proposal_v1.pdf',
                        fileType: 'application/pdf',
                        fileSize: 3120,
                        category: 'pdf'
                    }
                ],
                aiSummary: 'This research explores techniques to improve natural language processing in languages with limited training data. Using BERT-based models and cross-lingual transfer learning, the study achieves state-of-the-art results across five low-resource languages. The proposed domain adaptation approach shows significant promise for expanding AI capabilities to underserved linguistic communities.',
                status: 'Completed',
                proposalFile: {
                    originalName: 'NLP_Low_Resource_Languages_Proposal.pdf',
                    filePath: 'uploads/submissions/proposal_v1.pdf',
                    fileType: 'application/pdf',
                    fileSize: 1300
                },
                finalReportFile: {
                    originalName: 'NLP_Low_Resource_Languages_Final_Paper.pdf',
                    filePath: 'uploads/submissions/proposal_v2.pdf',
                    fileType: 'application/pdf',
                    fileSize: 2800
                }
            },
            {
                title: 'Sustainable Materials in Civil Engineering: A Systematic Review',
                description: 'A comprehensive systematic review of sustainable materials used in modern civil engineering projects from 2015 to 2024. This study analyzes 150+ peer-reviewed papers covering fly ash, recycled aggregates, bamboo, and bio-based composites. The review identifies key performance benchmarks and environmental impact metrics for each material category.',
                authorId: lecturer._id,
                department: 'AMC',
                year: 2023,
                tags: ['sustainable materials', 'civil engineering', 'systematic review', 'green building'],
                files: [],
                status: 'Completed',
                proposalFile: {
                    originalName: 'Sustainable_Materials_Civil_Engineering_Proposal.pdf',
                    filePath: 'uploads/submissions/proposal_v1.pdf',
                    fileType: 'application/pdf',
                    fileSize: 1400
                },
                finalReportFile: {
                    originalName: 'Sustainable_Materials_Civil_Engineering_Review_Paper.pdf',
                    filePath: 'uploads/submissions/proposal_v2.pdf',
                    fileType: 'application/pdf',
                    fileSize: 3200
                }
            },
        ]);

        // Create sample student research entries
        const studentResearches = await StudentResearch.insertMany([
            {
                title: 'Blockchain-Based Decentralized Voting System for Universities',
                abstract: 'This research proposes a secure, transparent, and decentralized voting system tailored for student union elections in universities. Utilizing Ethereum blockchain and smart contracts, the system guarantees voter privacy, prevents double voting, and eliminates the need for trusted third parties for tallying votes.',
                keywords: ['blockchain', 'smart contracts', 'voting system', 'decentralized', 'privacy'],
                department: 'IT',
                academicYear: '2023/2024',
                researchers: ['John Doe', 'Alice Johnson'],
                supervisor: 'Dr. Jane Smith',
                submittedBy: student._id,
                status: 'Completed',
                proposalFile: {
                    originalName: 'Voting_System_Proposal.pdf',
                    filePath: 'uploads/submissions/proposal_v1.pdf',
                    fileType: 'application/pdf',
                    fileSize: 1024
                },
                finalReportFile: {
                    originalName: 'Voting_System_Final_Report.pdf',
                    filePath: 'uploads/submissions/proposal_v2.pdf',
                    fileType: 'application/pdf',
                    fileSize: 2048
                }
            },
            {
                title: 'Machine Learning-Based Rainfall Prediction using Local Meteorology',
                abstract: 'Predicting rainfall with high accuracy is crucial for agricultural planning in regional areas. This paper presents a machine learning approach using Random Forest and XGBoost classifiers trained on historical weather datasets from local stations. The proposed model achieves 89% accuracy in predicting rainfall events 24 hours in advance.',
                keywords: ['machine learning', 'rainfall prediction', 'meteorology', 'random forest', 'xgboost'],
                department: 'AMC',
                academicYear: '2023/2024',
                researchers: ['John Doe'],
                supervisor: 'Prof. Michael Brown',
                submittedBy: student._id,
                status: 'Ongoing',
                proposalFile: {
                    originalName: 'Rainfall_Prediction_Proposal.pdf',
                    filePath: 'uploads/submissions/proposal_v1.pdf',
                    fileType: 'application/pdf',
                    fileSize: 1024
                }
            }
        ]);

        // Create sample lecturer research entries
        await LecturerResearch.insertMany([
            {
                title: 'Secure Consensus Algorithms in Highly Distributed Ledger Technologies',
                abstract: 'Consensus mechanisms are critical in maintaining state across trustless decentralized systems. This research evaluates PoW, PoS, and Raft consensus protocols, analyzing latency and throughput trade-offs under high network partition anomalies.',
                keywords: ['consensus', 'blockchain', 'distributed systems', 'raft'],
                coAuthors: ['Prof. Michael Brown', 'Dr. Sarah Lee'],
                department: 'IT',
                year: 2024,
                publicationTitle: 'IEEE Transactions on Distributed Systems',
                journalName: 'IEEE Distributed Systems Journal',
                volume: '15',
                issueNumber: '4',
                pages: '124-138',
                doi: '10.1109/TDS.2024.12345',
                publicationUrl: 'https://ieee.org/ledger-consensus',
                status: 'Published',
                uploadedBy: lecturer._id
            }
        ]);

        // Create dummy template folders and files
        if (!require('fs').existsSync('uploads/templates/')) {
            require('fs').mkdirSync('uploads/templates/', { recursive: true });
        }
        require('fs').writeFileSync('uploads/templates/srs_template.docx', 'Dummy DOCX template content');
        require('fs').writeFileSync('uploads/templates/proposal_guidelines.pdf', 'Dummy PDF guidelines content');
        require('fs').writeFileSync('uploads/templates/research_proposal_template.docx', 'Dummy Research Proposal template content');
        require('fs').writeFileSync('uploads/templates/progress_report_template.docx', 'Dummy Progress Report template content');
        require('fs').writeFileSync('uploads/templates/thesis_formatting_guidelines.pdf', 'Dummy Thesis Formatting guidelines content');
        require('fs').writeFileSync('uploads/templates/ethics_clearance_form.pdf', 'Dummy Ethics Clearance form content');

        // Create sample form templates
        await FormTemplate.insertMany([
            {
                name: 'SRS Template',
                description: 'Standard Software Requirements Specification template for final year projects.',
                category: 'Software Engineering',
                filePath: 'uploads/templates/srs_template.docx',
                originalName: 'SPRAMS_SRS_Template_v1.docx',
                fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                fileSize: 1024,
                uploadedBy: admin._id
            },
            {
                name: 'Proposal Guidelines',
                description: 'Academic project proposal format requirements and guidelines.',
                category: 'General Guidelines',
                filePath: 'uploads/templates/proposal_guidelines.pdf',
                originalName: 'Academic_Proposal_Guidelines_2024.pdf',
                fileType: 'application/pdf',
                fileSize: 2048,
                uploadedBy: admin._id
            },
            {
                name: 'Research Proposal Template',
                description: 'Standard format template for submitting student research proposals.',
                category: 'Research Templates',
                filePath: 'uploads/templates/research_proposal_template.docx',
                originalName: 'SPRAMS_Research_Proposal_Template.docx',
                fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                fileSize: 1536,
                uploadedBy: admin._id
            },
            {
                name: 'Mid-term Progress Report Template',
                description: 'Report template required for the mid-semester evaluation of ongoing projects and research.',
                category: 'Progress Reports',
                filePath: 'uploads/templates/progress_report_template.docx',
                originalName: 'MidTerm_Progress_Report_Format.docx',
                fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                fileSize: 1120,
                uploadedBy: admin._id
            },
            {
                name: 'Thesis Formatting Guidelines',
                description: 'Comprehensive formatting rules for final year thesis binding and submissions (font sizes, margins, citations).',
                category: 'General Guidelines',
                filePath: 'uploads/templates/thesis_formatting_guidelines.pdf',
                originalName: 'Thesis_Formatting_Manual_2024.pdf',
                fileType: 'application/pdf',
                fileSize: 3120,
                uploadedBy: admin._id
            },
            {
                name: 'Ethics Clearance Application',
                description: 'Mandatory ethical review application form for projects involving human trials, surveys, or sensitive datasets.',
                category: 'Ethics & Approvals',
                filePath: 'uploads/templates/ethics_clearance_form.pdf',
                originalName: 'Ethics_Clearance_Application_Form.pdf',
                fileType: 'application/pdf',
                fileSize: 4096,
                uploadedBy: admin._id
            }
        ]);

        // Create sample evaluations
        await Evaluation.insertMany([
            {
                submissionId: projects[0]._id,
                submissionType: 'Project',
                evaluatedBy: lecturer._id,
                approvalStatus: 'Approved',
                marks: 88,
                grade: 'A',
                feedback: 'Outstanding project proposal. The scope is well-defined and the implementation plan is clear. Please make sure the frontend architecture is modular.',
                evaluationDate: new Date()
            },
            {
                submissionId: studentResearches[0]._id,
                submissionType: 'StudentResearch',
                evaluatedBy: lecturer._id,
                approvalStatus: 'Approved',
                marks: 92,
                grade: 'A+',
                feedback: 'Excellent research on decentralized voting systems. The smart contract design is clean. I recommend publishing this to a conference soon.',
                evaluationDate: new Date()
            }
        ]);

        // Create sample activity logs
        await ActivityLog.insertMany([
            {
                userId: student._id,
                action: 'LOGIN',
                target: 'User: student@archive.edu',
                timestamp: new Date()
            },
            {
                userId: lecturer._id,
                action: 'LOGIN',
                target: 'User: lecturer@archive.edu',
                timestamp: new Date()
            }
        ]);

        // Create sample notifications
        await Notification.insertMany([
            {
                recipientId: student._id,
                senderId: admin._id,
                type: 'SYSTEM_ANNOUNCEMENT',
                title: 'Welcome to SPRAMS!',
                message: 'Welcome to the Student Project and Research Archive Management System.',
                link: '/workspace',
                isRead: false
            },
            {
                recipientId: lecturer._id,
                senderId: admin._id,
                type: 'SYSTEM_ANNOUNCEMENT',
                title: 'Portal Access Configured',
                message: 'Your lecturer credentials have been configured successfully.',
                link: '/lecturer-research',
                isRead: false
            }
        ]);

        console.log('✅ Database seeded successfully!');
        console.log('📧 Admin: admin@archive.edu / admin123456');
        console.log('📧 Lecturer: lecturer@archive.edu / lecturer123');
        console.log('📧 Student: student@archive.edu / student123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seed();
