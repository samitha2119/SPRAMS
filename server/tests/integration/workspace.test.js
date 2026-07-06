const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const { WorkspaceStudent, WorkspaceProject, WorkspaceProjectGroup, WorkspaceSubmission, WorkspaceEvaluation } = require('../../src/models/Workspace');

describe('Student Workspace API Integration Tests', () => {
    let studentToken;
    let studentId;
    let projectDbId;
    let submissionId;

    beforeAll(async () => {
        // Wait for connection to be ready
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve) => {
                const check = setInterval(() => {
                    if (mongoose.connection.readyState === 1) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
            });
        }

        // Login as student
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'student@archive.edu',
                password: 'student123'
            });
        
        studentToken = loginRes.body.data.accessToken;
        expect(studentToken).toBeDefined();

        // Get student record
        const student = await WorkspaceStudent.findOne({ studentID: 'STU1001' });
        expect(student).toBeDefined();
        studentId = student._id;

        const group = await WorkspaceProjectGroup.findOne({ students: studentId }).populate('projectID');
        expect(group).toBeDefined();
        projectDbId = group.projectID._id;
    });

    afterAll(async () => {
        // Clean up any test submissions created during this test
        if (submissionId) {
            await WorkspaceSubmission.deleteOne({ submissionID: submissionId });
        }
        await mongoose.connection.close();
    });

    describe('GET /api/v1/workspace', () => {
        it('should successfully load student workspace metadata', async () => {
            const res = await request(app)
                .get('/api/v1/workspace')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.project).toBeDefined();
            expect(res.body.data.project.title).toEqual('AI-Powered Crop Disease Detection System');
            expect(res.body.data.groupMembers).toHaveLength(3);
            expect(res.body.data.submissions).toBeDefined();
            expect(res.body.data.evaluations).toHaveLength(2);
        });
    });

    describe('POST /api/v1/workspace/submissions', () => {
        it('should successfully upload a deliverable and auto-increment version', async () => {
            const res = await request(app)
                .post('/api/v1/workspace/submissions')
                .set('Authorization', `Bearer ${studentToken}`)
                .field('projectID', projectDbId.toString())
                .field('submissionType', 'Progress Report')
                .attach('file', Buffer.from('mock report content'), 'progress_v2.pdf');

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.submissionType).toEqual('Progress Report');
            // The seed file has 1 progress report, so this should be v2
            expect(res.body.data.versionNumber).toEqual(2);
            expect(res.body.data.originalName).toEqual('progress_v2.pdf');

            submissionId = res.body.data.submissionID;
        });
    });

    describe('GET /api/v1/workspace/download/:submissionId', () => {
        it('should successfully download the uploaded submission file', async () => {
            const res = await request(app)
                .get(`/api/v1/workspace/download/${submissionId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.header['content-disposition']).toContain('attachment');
            expect(res.header['content-disposition']).toContain('progress_v2.pdf');
        });
    });
});
