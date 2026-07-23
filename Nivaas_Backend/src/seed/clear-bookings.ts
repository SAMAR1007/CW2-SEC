import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { BookingModel } from '../models/booking.model';
import { PaymentModel } from '../models/payment.model';

dotenv.config();

const clearBookings = async () => {
  const bookingCount = await BookingModel.countDocuments();
  const paymentCount = await PaymentModel.countDocuments();

  console.log(`\n🗑️  Clearing reservation data...`);
  console.log(`   Bookings to delete: ${bookingCount}`);
  console.log(`   Payments to delete: ${paymentCount}`);

  await BookingModel.deleteMany({});
  await PaymentModel.deleteMany({});

  console.log(`✅ All bookings and payments cleared!`);
  console.log(`   Bookings deleted: ${bookingCount}`);
  console.log(`   Payments deleted: ${paymentCount}\n`);
};

const run = async () => {
  try {
    await connectDB();
    await clearBookings();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear bookings:', error);
    process.exit(1);
  }
};

run();
