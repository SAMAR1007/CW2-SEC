import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  createReportController,
  listReportsForAdminController,
  updateReportStatusForAdminController,
} from '../controller/report.controller';

const router = Router();

router.use(authMiddleware);
router.post('/', createReportController);
router.get('/admin', listReportsForAdminController);
router.patch('/admin/:id/status', updateReportStatusForAdminController);

export default router;
