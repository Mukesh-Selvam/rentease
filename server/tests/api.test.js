import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';

describe('RentEase Express REST API Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rentease';
      await mongoose.connect(MONGODB_URI);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/auth/register should create customer user', async () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Customer',
      email: testEmail,
      password: 'TestPassword123!',
      role: 'CUSTOMER'
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/login and GET /api/auth/me return the authenticated user shape', async () => {
    const testEmail = `login_${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    await request(app).post('/api/auth/register').send({
      name: 'Login Customer',
      email: testEmail,
      password,
      role: 'CUSTOMER'
    }).expect(201);

    const login = await request(app).post('/api/auth/login').send({ email: testEmail, password });
    expect(login.status).toBe(200);
    expect(login.body.user?.email).toBe(testEmail);

    const currentUser = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(currentUser.status).toBe(200);
    expect(currentUser.body.user?.email).toBe(testEmail);
  });

  it('POST /api/auth/register should REJECT public ADMIN registration', async () => {
    const testEmail = `admin_hack_${Date.now()}@example.com`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Fake Admin',
      email: testEmail,
      password: 'TestPassword123!',
      role: 'ADMIN'
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Admin accounts cannot be created via public registration');
  });

  it('POST /api/auth/register with VENDOR role should set isVendorApproved to false', async () => {
    const testEmail = `vendor_${Date.now()}@example.com`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Vendor Partner',
      email: testEmail,
      password: 'TestPassword123!',
      role: 'VENDOR'
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('VENDOR');
    expect(res.body.user.isVendorApproved).toBe(false);
  });

  it('GET /api/products should return product catalog list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toBeDefined();
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('POST /api/coupons/validate should validate coupon code', async () => {
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'FIRSTRENT10',
      orderTotal: 2000
    });

    expect(res.status).toBe(200);
    expect(res.body.coupon).toBeDefined();
    expect(res.body.coupon.code).toBe('FIRSTRENT10');
  });

  it('POST /api/payment/verify without signature should reject', async () => {
    const res = await request(app).post('/api/payment/verify').send({
      orderId: '507f1f77bcf86cd799439011'
    });

    expect(res.status).toBe(401); // Unauthorized (no token)
  });
});
