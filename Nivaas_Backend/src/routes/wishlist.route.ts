import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { UserModel } from '../models/user.model';

const router = Router();

router.use(authMiddleware);

// GET /api/wishlist — return the user's wishlist array
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const user = await UserModel.findById(userId).select('wishlist');
    res.status(200).json({ data: user?.wishlist ?? [] });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/wishlist/toggle — add or remove an item from the wishlist
router.post('/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { itemId } = req.body as { itemId: string };
    if (!itemId) {
      res.status(400).json({ message: 'itemId is required' });
      return;
    }

    const user = await UserModel.findById(userId).select('wishlist');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const wishlist: string[] = user.wishlist ?? [];
    const index = wishlist.indexOf(itemId);
    if (index === -1) {
      wishlist.push(itemId);
    } else {
      wishlist.splice(index, 1);
    }

    user.wishlist = wishlist;
    await user.save();

    res.status(200).json({ data: wishlist, added: index === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
