import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import app from '../index';
import { UserModel } from '../models/user.model';
import { hashPassword } from '../utils/hash.util';
import { generateToken } from '../lib/jwt';
import { v4 as uuidv4 } from 'uuid';

describe('Auth Integration Tests', () => {
  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it('registers a user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: `User ${uuidv4()}`,
      email: 'user1@example.com',
      phoneNumber: '9000000001',
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered successfully');
  });

  it('prevents duplicate email on register', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'dup@example.com',
      phoneNumber: '9000000002',
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'dup@example.com',
      phoneNumber: '9000000003',
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });

    expect(res.status).toBe(409);
  });

  it('prevents duplicate phone on register', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'phone1@example.com',
      phoneNumber: '9000000004',
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'phone2@example.com',
      phoneNumber: '9000000004',
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });

    expect(res.status).toBe(409);
  });

  it('rejects register with mismatched password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'User C',
      email: 'mismatch@example.com',
      phoneNumber: '9000000005',
      password: 'Password@123',
      confirmPassword: 'Password@124',
    });

    expect(res.status).toBe(400);
  });

  it('logs in successfully', async () => {
    const password = await hashPassword('Password@123');
    await UserModel.create({
      name: 'Login User',
      email: 'login@example.com',
      phoneNumber: '9000000006',
      password,
      role: 'user',
      passwordChangedAt: new Date(),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Password@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data?.token).toBeTruthy();
  });

  it('rejects login with wrong password', async () => {
    const password = await hashPassword('Password@123');
    await UserModel.create({
      name: 'Login User',
      email: 'login2@example.com',
      phoneNumber: '9000000007',
      password,
      role: 'user',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login2@example.com',
      password: 'WrongPass',
    });

    expect(res.status).toBe(401);
  });

  it('rejects login with unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'unknown@example.com',
      password: 'Password@123',
    });

    expect(res.status).toBe(401);
  });

  it('verifies token via cookie', async () => {
    const user = await UserModel.create({
      name: 'Verify User',
      email: 'verify@example.com',
      phoneNumber: '9000000008',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const token = generateToken({ id: user._id, role: user.role });

    const res = await request(app)
      .get('/api/auth/verify')
      .set('Cookie', `auth-token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user?.email).toBe('verify@example.com');
  });

  it('rejects verify without token', async () => {
    const res = await request(app).get('/api/auth/verify');
    expect(res.status).toBe(401);
  });

  it('sends OTP for forgot password', async () => {
    await UserModel.create({
      name: 'Forgot User',
      email: 'forgot@example.com',
      phoneNumber: '9000000009',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'forgot@example.com',
    });

    expect(res.status).toBe(200);
  });

  it('rejects forgot password without email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });

  it('rejects forgot password for non-existent user', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'missing@example.com',
    });
    // Returns 200 with generic message to prevent email enumeration
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('If an account exists');
  });

  it('resets password with valid OTP', async () => {
    const user = await UserModel.create({
      name: 'Reset User',
      email: 'reset@example.com',
      phoneNumber: '9000000010',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const otp = '123456';
    user.resetPasswordOtp = await hashPassword(otp);
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'reset@example.com',
      otp,
      password: 'NewPassword@123',
      confirmPassword: 'NewPassword@123',
    });

    expect(res.status).toBe(200);
  });

  it('rejects reset password with invalid OTP', async () => {
    const user = await UserModel.create({
      name: 'Reset User',
      email: 'reset2@example.com',
      phoneNumber: '9000000011',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    user.resetPasswordOtp = await hashPassword('123456');
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'reset2@example.com',
      otp: '000000',
      password: 'NewPassword@123',
      confirmPassword: 'NewPassword@123',
    });

    expect(res.status).toBe(400);
  });

  it('rejects reset password with expired OTP', async () => {
    const user = await UserModel.create({
      name: 'Reset User',
      email: 'reset3@example.com',
      phoneNumber: '9000000012',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    user.resetPasswordOtp = await hashPassword('123456');
    user.resetPasswordOtpExpires = new Date(Date.now() - 60 * 1000);
    await user.save();

    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'reset3@example.com',
      otp: '123456',
      password: 'NewPassword@123',
      confirmPassword: 'NewPassword@123',
    });

    expect(res.status).toBe(400);
  });

  it('rejects reset password with missing fields', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'reset4@example.com',
    });

    expect(res.status).toBe(400);
  });

  it('updates profile when authorized', async () => {
    const user = await UserModel.create({
      name: 'Profile User',
      email: 'profile@example.com',
      phoneNumber: '9000000013',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const token = generateToken({ id: user._id, role: user.role });

    const res = await request(app)
      .put(`/api/auth/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.user?.name).toBe('Updated Name');
  });

  it('rejects profile update without token', async () => {
    const user = await UserModel.create({
      name: 'Profile User',
      email: 'profile2@example.com',
      phoneNumber: '9000000014',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const res = await request(app)
      .put(`/api/auth/${user._id}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(401);
  });

  it('rejects profile update with email conflict', async () => {
    const user1 = await UserModel.create({
      name: 'User 1',
      email: 'conflict1@example.com',
      phoneNumber: '9000000015',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const user2 = await UserModel.create({
      name: 'User 2',
      email: 'conflict2@example.com',
      phoneNumber: '9000000016',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const token = generateToken({ id: user2._id, role: user2.role });

    const res = await request(app)
      .put(`/api/auth/${user2._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: user1.email });

    expect(res.status).toBe(409);
  });

  it('rejects update profile with invalid user id', async () => {
    const token = generateToken({ id: new mongoose.Types.ObjectId(), role: 'user' });
    const res = await request(app)
      .put(`/api/auth/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(404);
  });
});
