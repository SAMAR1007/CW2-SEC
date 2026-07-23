import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from '../controller/notification.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', listNotificationsController);
router.patch('/:id/read', markNotificationReadController);
router.patch('/read-all', markAllNotificationsReadController);

export default router;
