const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');

describe('API Integration Smoke Tests', () => {
    beforeAll(async () => {
        // Wait for connection to be ready if it's already connecting
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
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('GET /api/health', () => {
        it('should return 200 OK and UP status', async () => {
            const res = await request(app).get('/api/health');
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.status).toBe('UP');
            expect(res.body.database).toBe('connected');
        });
    });

    describe('GET /api/v1/auth/me (Unauthenticated)', () => {
        it('should return 401 Unauthorized', async () => {
            const res = await request(app).get('/api/v1/auth/me');
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/api/v1/unknown-route');
            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });
    });
});
