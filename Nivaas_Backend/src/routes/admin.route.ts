import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllHosts,
  getPendingHosts,
  approveHost,
  rejectHost,
} from '../controller/admin.controller';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { upload } from '../config/multer';

const router = Router();

// All routes require admin authentication
router.use(adminMiddleware);

router.post('/users', upload.single('image'), createUser);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', upload.single('image'), updateUser);
router.delete('/users/:id', deleteUser);

router.get('/hosts', getAllHosts);
router.get('/hosts/pending', getPendingHosts);
router.post('/hosts/:id/approve', approveHost);
router.post('/hosts/:id/reject', rejectHost);

export default router;
