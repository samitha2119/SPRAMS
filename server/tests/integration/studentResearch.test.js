const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const StudentResearch = require('../../src/models/StudentResearch');

describe('Student Research Lifecycle Integration Tests', () => {
    let studentToken;
    let createdResearchId;

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
    });

    afterAll(async () => {
        // Clean up created research entries
        if (createdResearchId) {
            await StudentResearch.findByIdAndDelete(createdResearchId);
        }
        await mongoose.connection.close();
    });

    describe('Phase 1: Create Student Research (Proposed Status)', () => {
        it('should fail if proposal PDF is missing', async () => {
            const res = await request(app)
                .post('/api/v1/student-research')
                .set('Authorization', `Bearer ${studentToken}`)
                .field('title', 'Novel AI Architecture for Edge Devices')
                .field('abstract', 'This is a long abstract for my research work. It must be at least fifty characters long to pass validation.')
                .field('department', 'Computer Science')
                .field('academicYear', '2023/2024')
                .field('supervisor', 'Dr. Jane Doe')
                .field('keywords', JSON.stringify(['AI', 'Edge']));

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('proposal');
        });

        it('should succeed to create research entry with only proposal PDF', async () => {
            const res = await request(app)
                .post('/api/v1/student-research')
                .set('Authorization', `Bearer ${studentToken}`)
                .field('title', 'Novel AI Architecture for Edge Devices')
                .field('abstract', 'This is a long abstract for my research work. It must be at least fifty characters long to pass validation.')
                .field('department', 'Computer Science')
                .field('academicYear', '2023/2024')
                .field('supervisor', 'Dr. Jane Doe')
                .field('keywords', JSON.stringify(['AI', 'Edge']))
                .attach('proposal', Buffer.from('%PDF-1.4 ... mock pdf content'), 'proposal.pdf');

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.entry.status).toEqual('Proposed');
            expect(res.body.data.entry.proposalFile.originalName).toEqual('proposal.pdf');
            expect(res.body.data.entry.proposalFile.filePath).toBeDefined();
            expect(res.body.data.entry.finalReportFile.filePath).toBeUndefined();
            expect(res.body.data.entry.githubLink).toBeUndefined();
            expect(res.body.data.entry.files).toHaveLength(0);

            createdResearchId = res.body.data.entry._id;
        });
    });

    describe('Phase 2: Finalize Student Research (Completed Status)', () => {
        it('should successfully finalize research with GitHub link, Final Report PDF, and supplementary files', async () => {
            const res = await request(app)
                .put(`/api/v1/student-research/${createdResearchId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .field('githubLink', 'https://github.com/student/edge-ai-project')
                .attach('finalReport', Buffer.from('%PDF-1.4 ... final report pdf content'), 'final_report.pdf')
                .attach('files', Buffer.from('mock audio content'), 'audio_demo.mp3')
                .attach('files', Buffer.from('mock video content'), 'video_demo.mp4');

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            // Fetch the updated entry directly to inspect
            const updated = await StudentResearch.findById(createdResearchId);
            expect(updated.status).toEqual('Completed');
            expect(updated.githubLink).toEqual('https://github.com/student/edge-ai-project');
            expect(updated.finalReportFile).toBeDefined();
            expect(updated.finalReportFile.originalName).toEqual('final_report.pdf');
            
            // Check that the proposal is still present and unchanged
            expect(updated.proposalFile).toBeDefined();
            expect(updated.proposalFile.originalName).toEqual('proposal.pdf');

            // Verify supplementary media files were successfully appended
            expect(updated.files).toHaveLength(2);
            expect(updated.files[0].originalName).toEqual('audio_demo.mp3');
            expect(updated.files[0].category).toEqual('audio');
            expect(updated.files[1].originalName).toEqual('video_demo.mp4');
            expect(updated.files[1].category).toEqual('video');
        });
    });
});
