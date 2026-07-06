const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const ResearchEntry = require('../../src/models/ResearchEntry');

describe('General Research Lifecycle Integration Tests', () => {
    let studentToken;
    let createdResearchId;

    beforeAll(async () => {
        // Wait for database connection to be ready
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
            await ResearchEntry.findByIdAndDelete(createdResearchId);
        }
        await mongoose.connection.close();
    });

    describe('Phase 1: Create General Research (Proposed Status)', () => {
        it('should succeed to create research entry with metadata and proposal PDF', async () => {
            const res = await request(app)
                .post('/api/v1/research')
                .set('Authorization', `Bearer ${studentToken}`)
                .field('title', 'Advanced Quantum Computing Algorithms')
                .field('description', 'This is a detailed description of the quantum research project. It should be at least twenty characters to pass validation.')
                .field('year', 2026)
                .field('tags', JSON.stringify(['quantum', 'algorithms']))
                .attach('proposal', Buffer.from('%PDF-1.4 ... mock pdf content'), 'quantum_proposal.pdf');

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.entry.status).toEqual('Proposed');
            expect(res.body.data.entry.proposalFile.originalName).toEqual('quantum_proposal.pdf');
            expect(res.body.data.entry.proposalFile.filePath).toBeDefined();
            expect(res.body.data.entry.finalReportFile?.filePath).toBeUndefined();
            expect(res.body.data.entry.githubLink).toBeUndefined();
            expect(res.body.data.entry.files).toHaveLength(0);

            createdResearchId = res.body.data.entry._id;
        });
    });

    describe('Phase 2: Finalize General Research (Completed Status)', () => {
        it('should successfully finalize general research with GitHub link, Final Report PDF, and supplementary files', async () => {
            const res = await request(app)
                .put(`/api/v1/research/${createdResearchId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .field('githubLink', 'https://github.com/quantum/algorithms')
                .attach('finalReport', Buffer.from('%PDF-1.4 ... final report pdf content'), 'quantum_final_report.pdf')
                .attach('files', Buffer.from('mock audio content'), 'audio_presentation.mp3')
                .attach('files', Buffer.from('mock video content'), 'video_presentation.mp4');

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            // Fetch the updated entry directly to inspect database state
            const updated = await ResearchEntry.findById(createdResearchId);
            expect(updated.status).toEqual('Completed');
            expect(updated.githubLink).toEqual('https://github.com/quantum/algorithms');
            expect(updated.finalReportFile).toBeDefined();
            expect(updated.finalReportFile.originalName).toEqual('quantum_final_report.pdf');
            
            // Check that the proposal is still present and unchanged
            expect(updated.proposalFile).toBeDefined();
            expect(updated.proposalFile.originalName).toEqual('quantum_proposal.pdf');

            // Verify supplementary media files were successfully appended
            expect(updated.files).toHaveLength(2);
            expect(updated.files[0].originalName).toEqual('audio_presentation.mp3');
            expect(updated.files[0].category).toEqual('audio');
            expect(updated.files[1].originalName).toEqual('video_presentation.mp4');
            expect(updated.files[1].category).toEqual('video');
        });

        it('should successfully finalize research without a GitHub link', async () => {
            // Create a temporary research entry
            const createRes = await request(app)
                .post('/api/v1/research')
                .set('Authorization', `Bearer ${studentToken}`)
                .field('title', 'Quantum Crypto without Git Link')
                .field('description', 'This is a description for testing completion without a github link present.')
                .field('year', 2026)
                .attach('proposal', Buffer.from('%PDF-1.4 ... proposal'), 'proposal_temp.pdf');

            const tempId = createRes.body.data.entry._id;

            const res = await request(app)
                .put(`/api/v1/research/${tempId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('finalReport', Buffer.from('%PDF-1.4 ... final report'), 'report_temp.pdf');

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            const updated = await ResearchEntry.findById(tempId);
            expect(updated.status).toEqual('Completed');
            expect(updated.githubLink).toBeUndefined();
            expect(updated.finalReportFile.originalName).toEqual('report_temp.pdf');

            // Cleanup
            await ResearchEntry.findByIdAndDelete(tempId);
        });
    });
});
