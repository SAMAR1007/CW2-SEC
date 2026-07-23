import { Types } from 'mongoose';
import { ApiError } from '../exceptions/api.error';
import { MessageModel } from '../models/message.model';
import { UserModel } from '../models/user.model';
import { HostProfileModel } from '../models/hostProfile.model';
import { AccommodationModel } from '../models/accommodation.model';
import { ExperienceModel } from '../models/experience.model';
import { createNotificationService } from './notification.service';

type ConversationMode = 'travelling' | 'host';

const toObjectId = (value: string, fieldName: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(`Invalid ${fieldName}`, 400);
  }
  return new Types.ObjectId(value);
};

export const sendMessageService = async (payload: {
  senderId: string;
  recipientId: string;
  text: string;
  accommodationId?: string | undefined;
  experienceId?: string | undefined;
}) => {
  const { senderId, recipientId, text, accommodationId, experienceId } = payload;

  if (!text?.trim()) {
    throw new ApiError('Message text is required', 400);
  }
  if (senderId === recipientId) {
    throw new ApiError('You cannot message yourself', 400);
  }

  const senderObjectId = toObjectId(senderId, 'senderId');
  const recipientObjectId = toObjectId(recipientId, 'recipientId');

  const [sender, recipient] = await Promise.all([
    UserModel.findById(senderObjectId),
    UserModel.findById(recipientObjectId),
  ]);

  if (!sender || !recipient) {
    throw new ApiError('Sender or recipient not found', 404);
  }

  if (accommodationId && experienceId) {
    throw new ApiError('Provide only one of accommodationId or experienceId', 400);
  }

  const message = await MessageModel.create({
    senderId: senderObjectId,
    recipientId: recipientObjectId,
    text: text.trim(),
    ...(accommodationId ? { accommodationId: toObjectId(accommodationId, 'accommodationId') } : {}),
    ...(experienceId ? { experienceId: toObjectId(experienceId, 'experienceId') } : {}),
  });

  try {
    let targetPage = 'messages';

    if (accommodationId) {
      const accommodation = await AccommodationModel.findById(accommodationId).select('hostId').lean();
      if (accommodation) {
        const hostProfile = await HostProfileModel.findById(accommodation.hostId).select('userId').lean();
        if (hostProfile && String(hostProfile.userId) === recipientId) {
          targetPage = 'hostMessages';
        }
      }
    }

    if (experienceId) {
      const experience = await ExperienceModel.findById(experienceId).select('hostId').lean();
      if (experience) {
        const hostProfile = await HostProfileModel.findById(experience.hostId).select('userId').lean();
        if (hostProfile && String(hostProfile.userId) === recipientId) {
          targetPage = 'hostMessages';
        }
      }
    }

    await createNotificationService({
      userId: recipientId,
      type: 'message_received',
      title: `New message from ${sender.name || 'User'}`,
      message: text.trim().slice(0, 120),
      targetPage,
      metadata: {
        senderId,
        accommodationId,
        experienceId,
        messageId: String(message._id),
      },
    });
  } catch (error) {
    console.error('Failed to create message notification:', error);
  }

  return message;
};

export const getConversationListService = async (payload: {
  userId: string;
  mode: ConversationMode;
}) => {
  const { userId } = payload;
  const userObjectId = toObjectId(userId, 'userId');

  const messages = await MessageModel.find({
    $or: [{ senderId: userObjectId }, { recipientId: userObjectId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const grouped = new Map<
    string,
    {
      counterpartId: string;
      accommodationId: string | undefined;
      experienceId: string | undefined;
      lastMessage: string;
      lastAt: Date;
      lastSenderId: string;
      unreadCount: number;
      lastSeenAt?: Date;
    }
  >();

  for (const item of messages) {
    const senderId = String(item.senderId);
    const recipientId = String(item.recipientId);
    const isCurrentSender = senderId === userId;
    const counterpartId = isCurrentSender ? recipientId : senderId;

    const accommodationId = item.accommodationId ? String(item.accommodationId) : undefined;
    const experienceId = item.experienceId ? String(item.experienceId) : undefined;
    const key = counterpartId;

    if (!grouped.has(key)) {
      grouped.set(key, {
        counterpartId,
        accommodationId,
        experienceId,
        lastMessage: item.text,
        lastAt: item.createdAt,
        lastSenderId: senderId,
        unreadCount: 0,
      });
    }

    const bucket = grouped.get(key);
    if (bucket) {
      if (recipientId === userId && !item.readByRecipient) {
        bucket.unreadCount += 1;
      }

      if (senderId === counterpartId && item.readByRecipient) {
        if (!bucket.lastSeenAt || new Date(item.createdAt).getTime() > new Date(bucket.lastSeenAt).getTime()) {
          bucket.lastSeenAt = item.createdAt;
        }
      }
    }
  }

  const conversationList = Array.from(grouped.values());
  const counterpartIds = [...new Set(conversationList.map((item) => item.counterpartId))];

  const users = counterpartIds.length
    ? await UserModel.find({ _id: { $in: counterpartIds.map((id) => new Types.ObjectId(id)) } })
        .select('_id name image')
        .lean()
    : [];

  const usersById = new Map(users.map((user) => [String(user._id), user]));

  const accommodationIds = [...new Set(conversationList.map((item) => item.accommodationId).filter(Boolean) as string[])];
  const experienceIds = [...new Set(conversationList.map((item) => item.experienceId).filter(Boolean) as string[])];

  const [accommodations, experiences] = await Promise.all([
    accommodationIds.length
      ? AccommodationModel.find({ _id: { $in: accommodationIds.map((id) => new Types.ObjectId(id)) } }).select('_id title').lean()
      : Promise.resolve([]),
    experienceIds.length
      ? ExperienceModel.find({ _id: { $in: experienceIds.map((id) => new Types.ObjectId(id)) } }).select('_id title').lean()
      : Promise.resolve([]),
  ]);

  const accommodationMap = new Map(accommodations.map((item) => [String(item._id), item.title]));
  const experienceMap = new Map(experiences.map((item) => [String(item._id), item.title]));

  return conversationList
    .map((item) => {
      const counterpart = usersById.get(item.counterpartId);
      return {
        counterpart: {
          _id: item.counterpartId,
          name: counterpart?.name || 'User',
          image: counterpart?.image || '',
        },
        accommodationId: item.accommodationId,
        experienceId: item.experienceId,
        contextTitle: item.accommodationId
          ? accommodationMap.get(item.accommodationId) || 'Stay'
          : item.experienceId
            ? experienceMap.get(item.experienceId) || 'Experience'
            : 'Chat',
        lastMessage: item.lastMessage,
        lastAt: item.lastAt,
        lastSenderId: item.lastSenderId,
        unreadCount: item.unreadCount,
        lastSeenAt: item.lastSeenAt,
      };
    })
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
};

export const getThreadMessagesService = async (payload: {
  userId: string;
  counterpartId: string;
  accommodationId?: string | undefined;
  experienceId?: string | undefined;
}) => {
  const { userId, counterpartId, accommodationId, experienceId } = payload;
  const userObjectId = toObjectId(userId, 'userId');
  const counterpartObjectId = toObjectId(counterpartId, 'counterpartId');

  if (accommodationId && experienceId) {
    throw new ApiError('Provide only one of accommodationId or experienceId', 400);
  }

  await MessageModel.updateMany(
    {
      senderId: counterpartObjectId,
      recipientId: userObjectId,
      readByRecipient: false,
      ...(accommodationId ? { accommodationId: toObjectId(accommodationId, 'accommodationId') } : {}),
      ...(experienceId ? { experienceId: toObjectId(experienceId, 'experienceId') } : {}),
    },
    {
      $set: {
        readByRecipient: true,
        readAt: new Date(),
      },
    }
  );

  const messages = await MessageModel.find({
    $or: [
      { senderId: userObjectId, recipientId: counterpartObjectId },
      { senderId: counterpartObjectId, recipientId: userObjectId },
    ],
    ...(accommodationId ? { accommodationId: toObjectId(accommodationId, 'accommodationId') } : {}),
    ...(experienceId ? { experienceId: toObjectId(experienceId, 'experienceId') } : {}),
  })
    .sort({ createdAt: 1 })
    .populate('senderId', 'name image')
    .populate('recipientId', 'name image')
    .lean();

  return messages;
};
