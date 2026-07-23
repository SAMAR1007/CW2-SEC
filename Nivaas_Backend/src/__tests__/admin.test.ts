import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import app from '../index';
import { UserModel } from '../models/user.model';
import { hashPassword } from '../utils/hash.util';
import { generateToken } from '../lib/jwt';
import { v4 as uuidv4 } from 'uuid';

const createAdminToken = async () => {
  const admin = await UserModel.create({
    name: `Admin ${uuidv4()}`,
    email: `admin-${Date.now()}@example.com`,
    phoneNumber: `90100${Math.floor(Math.random() * 9000 + 1000)}`,
    password: await hashPassword('Password@123'),
    role: 'admin',
  });

  return generateToken({ id: admin._id, role: admin.role });
};

describe('Admin user management integration tests', () => {
  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it('rejects admin users list without token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('rejects admin users list for non-admin role', async () => {
    const user = await UserModel.create({
      name: 'User',
      email: 'user-role@example.com',
      phoneNumber: '9020000001',
      password: await hashPassword('Password@123'),
      role: 'user',
    });
    const token = generateToken({ id: user._id, role: user.role });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns paginated users list', async () => {
    const token = await createAdminToken();
    await UserModel.insertMany(
      Array.from({ length: 6 }).map((_, index) => ({
        name: `User ${index + 1}`,
        email: `list${index + 1}@example.com`,
        phoneNumber: `90300000${index + 1}`,
        password: 'hashed',
        role: 'user',
      }))
    );

    const res = await request(app)
      .get('/api/admin/users?limit=5&page=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination?.limit).toBe(5);
    expect(res.body.users.length).toBe(5);
  });

  it('gets user by id', async () => {
    const token = await createAdminToken();
    const user = await UserModel.create({
      name: 'User Detail',
      email: 'detail@example.com',
      phoneNumber: '9040000001',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const res = await request(app)
      .get(`/api/admin/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user?.email).toBe('detail@example.com');
  });

  it('returns 404 for missing user by id', async () => {
    const token = await createAdminToken();
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .get(`/api/admin/users/${missingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('creates user successfully', async () => {
    const token = await createAdminToken();

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New User',
        email: 'newuser@example.com',
        phoneNumber: '9050000001',
        password: 'Password@123',
        role: 'user',
      });

    expect(res.status).toBe(201);
    expect(res.body.user?.email).toBe('newuser@example.com');
  });

  it('rejects duplicate email on admin create', async () => {
    const token = await createAdminToken();

    await UserModel.create({
      name: 'Existing',
      email: 'dupadmin@example.com',
      phoneNumber: '9050000002',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New User',
        email: 'dupadmin@example.com',
        phoneNumber: '9050000003',
        password: 'Password@123',
        role: 'user',
      });

    expect(res.status).toBe(409);
  });

  it('updates user successfully', async () => {
    const token = await createAdminToken();
    const user = await UserModel.create({
      name: 'Update User',
      email: 'update@example.com',
      phoneNumber: '9060000001',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const res = await request(app)
      .put(`/api/admin/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated User' });

    expect(res.status).toBe(200);
    expect(res.body.user?.name).toBe('Updated User');
  });

  it('returns 404 when updating non-existent user', async () => {
    const token = await createAdminToken();
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .put(`/api/admin/users/${missingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated User' });

    expect(res.status).toBe(404);
  });

  it('deletes user successfully', async () => {
    const token = await createAdminToken();
    const user = await UserModel.create({
      name: 'Delete User',
      email: 'delete@example.com',
      phoneNumber: '9070000001',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const res = await request(app)
      .delete(`/api/admin/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User deleted successfully');
  });

  it('returns 404 when deleting non-existent user', async () => {
    const token = await createAdminToken();
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete(`/api/admin/users/${missingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('creates user with image upload (multer)', async () => {
    const token = await createAdminToken();

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Image User')
      .field('email', 'imageuser@example.com')
      .field('phoneNumber', '9080000001')
      .field('password', 'Password@123')
      .field('role', 'user')
      .attach('image', Buffer.from([137, 80, 78, 71]), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(201);
    expect(res.body.user?.image).toContain('/uploads/users/');
  });

  it('updates user with image upload (multer)', async () => {
    const token = await createAdminToken();
    const user = await UserModel.create({
      name: 'Image Update',
      email: 'imageupdate@example.com',
      phoneNumber: '9080000002',
      password: await hashPassword('Password@123'),
      role: 'user',
    });

    const res = await request(app)
      .put(`/api/admin/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Image Updated')
      .attach('image', Buffer.from([137, 80, 78, 71]), {
        filename: 'avatar2.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(200);
    expect(res.body.user?.name).toBe('Image Updated');
  });
});
