import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getThreadMessagesController,
  listConversationsController,
  sendMessageController,
} from '../controller/message.controller';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', listConversationsController);
router.get('/thread', getThreadMessagesController);
router.post('/', sendMessageController);

export default router;
