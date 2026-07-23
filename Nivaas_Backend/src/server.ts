import dotenv from 'dotenv';
import app from './index';
import { connectDB } from './config/db';
import { cleanupStalePendingBookings } from './services/payment.service';
import os from 'os';

dotenv.config();

connectDB();

const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  const interfaces = os.networkInterfaces();
  const localIps: string[] = [];
  for (const values of Object.values(interfaces)) {
    for (const info of values || []) {
      if (info.family === 'IPv4' && !info.internal) {
        localIps.push(info.address);
      }
    }
  }

  console.log(`Server running on ${host}:${port}`);
  console.log(`Local:   http://localhost:${port}`);
  for (const ip of localIps) {
    console.log(`LAN:     http://${ip}:${port}`);
  }

  // Clean up stale pending bookings every 5 minutes
  setInterval(() => {
    cleanupStalePendingBookings();
  }, 5 * 60 * 1000);

  // Also run once on startup (after a short delay for DB connection)
  setTimeout(() => cleanupStalePendingBookings(), 5000);
});
