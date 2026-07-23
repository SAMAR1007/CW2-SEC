import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  handleEsewaFailure,
  handleEsewaSuccess,
  initiateEsewaPayment,
  cancelPendingBooking,
} from '../controller/payment.controller';

const router = Router();

router.post('/esewa/initiate', authMiddleware, initiateEsewaPayment);
router.post('/cancel-booking', authMiddleware, cancelPendingBooking);
router.get('/esewa/success', handleEsewaSuccess);
router.get('/esewa/failure', handleEsewaFailure);

export default router;
