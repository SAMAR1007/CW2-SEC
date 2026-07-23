import { Types } from 'mongoose';
import { ApiError } from '../exceptions/api.error';
import { NotificationModel } from '../models/notification.model';

const toObjectId = (value: string, fieldName: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(`Invalid ${fieldName}`, 400);
  }
  return new Types.ObjectId(value);
};

export const createNotificationService = async (payload: {
  userId: string;
  type: string;
  title: string;
  message: string;
  targetPage?: string;
  metadata?: Record<string, unknown>;
}) => {
  const { userId, type, title, message, targetPage, metadata } = payload;

  return NotificationModel.create({
    userId: toObjectId(userId, 'userId'),
    type: type.trim(),
    title: title.trim(),
    message: message.trim(),
    targetPage: targetPage?.trim() || '',
    metadata: metadata || {},
  });
};

export const listNotificationsService = async (payload: {
  userId: string;
  limit?: number;
  mode?: 'host' | 'travelling';
}) => {
  const userObjectId = toObjectId(payload.userId, 'userId');
  const limit = Math.min(Math.max(payload.limit || 20, 1), 100);

  const hostScopeFilter = {
    $or: [
      { targetPage: { $regex: '^host', $options: 'i' } },
      { type: { $regex: '^host_', $options: 'i' } },
    ],
  } as const;

  const travellingScopeFilter = {
    $and: [
      { targetPage: { $not: { $regex: '^host', $options: 'i' } } },
      { type: { $not: { $regex: '^host_', $options: 'i' } } },
    ],
  } as const;

  const modeFilter = payload.mode === 'host'
    ? hostScopeFilter
    : payload.mode === 'travelling'
      ? travellingScopeFilter
      : {};

  const query = {
    userId: userObjectId,
    ...modeFilter,
  };

  const data = await NotificationModel.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await NotificationModel.countDocuments({ ...query, isRead: false });

  return {
    notifications: data,
    unreadCount,
  };
};

export const markNotificationReadService = async (payload: {
  userId: string;
  notificationId: string;
}) => {
  const userObjectId = toObjectId(payload.userId, 'userId');
  const notificationObjectId = toObjectId(payload.notificationId, 'notificationId');

  const updated = await NotificationModel.findOneAndUpdate(
    { _id: notificationObjectId, userId: userObjectId },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    throw new ApiError('Notification not found', 404);
  }

  return updated;
};

export const markAllNotificationsReadService = async (payload: {
  userId: string;
}) => {
  const userObjectId = toObjectId(payload.userId, 'userId');
  await NotificationModel.updateMany(
    { userId: userObjectId, isRead: false },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  return { success: true };
};
