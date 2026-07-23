import { Response } from 'express';
import { ApiError } from '../exceptions/api.error';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  getConversationListService,
  getThreadMessagesService,
  sendMessageService,
} from '../services/message.service';

export const sendMessageController = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user?.id;
    if (!senderId) throw new ApiError('Unauthorized', 401);

    const { recipientId, text, accommodationId, experienceId } = req.body as {
      recipientId?: string;
      text?: string;
      accommodationId?: string | undefined;
      experienceId?: string | undefined;
    };

    if (!recipientId || !text) {
      throw new ApiError('recipientId and text are required', 400);
    }

    const data = await sendMessageService({
      senderId,
      recipientId,
      text,
      accommodationId,
      experienceId,
    });

    res.status(201).json({ message: 'Message sent', data });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listConversationsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Unauthorized', 401);

    const modeRaw = String(req.query.mode || 'travelling');
    const mode = modeRaw === 'host' ? 'host' : 'travelling';

    const data = await getConversationListService({ userId, mode });
    res.status(200).json({ message: 'Conversations fetched successfully', data });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getThreadMessagesController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Unauthorized', 401);

    const counterpartId = typeof req.query.counterpartId === 'string' ? req.query.counterpartId : '';
    const accommodationId = typeof req.query.accommodationId === 'string' ? req.query.accommodationId : undefined;
    const experienceId = typeof req.query.experienceId === 'string' ? req.query.experienceId : undefined;

    if (!counterpartId) {
      throw new ApiError('counterpartId is required', 400);
    }

    const data = await getThreadMessagesService({
      userId,
      counterpartId,
      accommodationId,
      experienceId,
    });

    res.status(200).json({ message: 'Messages fetched successfully', data });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
