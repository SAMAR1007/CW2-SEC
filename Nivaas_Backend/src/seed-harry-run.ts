import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { seedHarry } from './seed-harry';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    await seedHarry();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
};

run();
