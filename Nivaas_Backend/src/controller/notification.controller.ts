import { Response } from 'express';
import { ApiError } from '../exceptions/api.error';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  listNotificationsService,
  markAllNotificationsReadService,
  markNotificationReadService,
} from '../services/notification.service';

export const listNotificationsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Unauthorized', 401);

    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const mode = req.query.mode === 'host' || req.query.mode === 'travelling'
      ? (req.query.mode as 'host' | 'travelling')
      : undefined;
    const data = await listNotificationsService(
      typeof limit === 'number'
        ? { userId, limit, ...(mode ? { mode } : {}) }
        : { userId, ...(mode ? { mode } : {}) }
    );

    res.status(200).json({ message: 'Notifications fetched successfully', data });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markNotificationReadController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Unauthorized', 401);

    const notificationId = req.params.id;
    if (!notificationId) throw new ApiError('Notification ID is required', 400);

    const data = await markNotificationReadService({ userId, notificationId });
    res.status(200).json({ message: 'Notification marked as read', data });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markAllNotificationsReadController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Unauthorized', 401);

    const data = await markAllNotificationsReadService({ userId });
    res.status(200).json({ message: 'All notifications marked as read', data });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
