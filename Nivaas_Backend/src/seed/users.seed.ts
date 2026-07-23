import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { UserModel } from '../models/user.model';
import { hashPassword } from '../utils/hash.util';

dotenv.config();

const makeUsers = async () => {
  const timestamp = Date.now();
  const password = await hashPassword('Password@123');

  const users = Array.from({ length: 20 }).map((_, index) => {
    const suffix = `${timestamp}-${index + 1}`;
    return {
      name: `Demo User ${index + 1}`,
      email: `demo.user.${suffix}@example.com`,
      phoneNumber: `90000${(10000 + index).toString()}`,
      password,
      role: 'user' as const,
    };
  });

  await UserModel.insertMany(users);
  return users.length;
};

const run = async () => {
  try {
    await connectDB();
    const inserted = await makeUsers();
    console.log(`Inserted ${inserted} demo users`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed users', error);
    process.exit(1);
  }
};

run();
