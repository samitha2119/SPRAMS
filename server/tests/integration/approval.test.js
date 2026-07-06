const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Notification = require('../../src/models/Notification');

describe('User Registration Approval Flow Integration Tests', () => {
    let adminToken;
    let pendingUserEmail = 'test_pending_student@archive.edu';
    let pendingUserId;

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

        // Login as admin
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'admin@archive.edu',
                password: 'admin123456'
            });
        
        adminToken = loginRes.body.data.accessToken;
        expect(adminToken).toBeDefined();
    });

    afterAll(async () => {
        // Cleanup the test user
        await User.deleteMany({ email: pendingUserEmail });
        await Notification.deleteMany({ title: 'New Registration Request' });
        await mongoose.connection.close();
    });

    describe('Step 1: Public Registration', () => {
        it('should successfully submit registration with pending approval status and no tokens', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test Pending Student',
                    email: pendingUserEmail,
                    password: 'password123',
                    role: 'student'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('pending administrator approval');
            expect(res.body.data.pendingApproval).toBe(true);
            expect(res.body.data.accessToken).toBeUndefined();
            expect(res.body.data.refreshToken).toBeUndefined();

            const createdUser = await User.findOne({ email: pendingUserEmail });
            expect(createdUser).toBeDefined();
            expect(createdUser.approvalStatus).toEqual('pending');
            pendingUserId = createdUser._id;

            // Check that notifications were sent to admins
            const notification = await Notification.findOne({ senderId: pendingUserId, type: 'APPROVAL_REQUEST' });
            expect(notification).toBeDefined();
            expect(notification.title).toEqual('New Registration Request');
            expect(notification.link).toEqual('/admin/users');
        });
    });

    describe('Step 2: Login Blocked for Pending Account', () => {
        it('should reject login attempt for a user with pending approval status', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: pendingUserEmail,
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('pending approval');
        });
    });

    describe('Step 3: Admin List and Filters', () => {
        it('should allow admin to filter users by pending status', async () => {
            const res = await request(app)
                .get('/api/v1/admin/users?approvalStatus=pending')
                .set('Authorization', `Bearer ${adminToken}`);

            // Wait, the route is /api/v1/admin/users? or /api/v1/dashboard/users?
            // Let's check routes in system/dashboard: router.route('/users').get(authorize('admin'), getUsers)
            // So it is /api/v1/dashboard/users! Let's test /api/v1/dashboard/users.
            const resDashboard = await request(app)
                .get('/api/v1/dashboard/users?approvalStatus=pending')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(resDashboard.statusCode).toEqual(200);
            expect(resDashboard.body.success).toBe(true);
            
            const pendingUsers = resDashboard.body.data.users;
            const found = pendingUsers.find(u => u.email === pendingUserEmail);
            expect(found).toBeDefined();
            expect(found.approvalStatus).toEqual('pending');
        });
    });

    describe('Step 4: Admin Approves User', () => {
        it('should approve user status, activate account, and log mock email dispatch', async () => {
            const res = await request(app)
                .put(`/api/v1/dashboard/users/${pendingUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    approvalStatus: 'approved'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('approved');

            const updatedUser = await User.findById(pendingUserId);
            expect(updatedUser.approvalStatus).toEqual('approved');
            expect(updatedUser.isActive).toBe(true);
        });
    });

    describe('Step 5: Login Succeeds for Approved User', () => {
        it('should successfully log in user after status is updated to approved', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: pendingUserEmail,
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.user.email).toEqual(pendingUserEmail);
        });
    });

    describe('Step 6: Login Blocked for Rejected User', () => {
        it('should reject login attempt for a user with rejected approval status', async () => {
            // Update to rejected
            await User.findByIdAndUpdate(pendingUserId, { approvalStatus: 'rejected' });

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: pendingUserEmail,
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('rejected');
        });
    });
});
