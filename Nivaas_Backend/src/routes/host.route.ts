import { Router } from 'express';
import { 
  apply, 
  getMe, 
  createListingController, 
  getMyListingsController,
  getMyListingByIdController,
  updateMyListingController,
  createExperienceController,
  getMyExperiencesController,
  getMyExperienceByIdController,
  updateMyExperienceController,
  getHostReservationsController,
} from '../controller/host.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { hostDocumentUpload, listingImagesUpload } from '../config/multer';

const router = Router();

router.use(authMiddleware);

router.get('/me', getMe);
router.post('/apply', hostDocumentUpload.single('idDocument'), apply);
router.post('/listings', listingImagesUpload.array('images', 10), createListingController);
router.get('/listings', getMyListingsController);
router.get('/listings/:id', getMyListingByIdController);
router.put('/listings/:id', listingImagesUpload.array('images', 10), updateMyListingController);
router.post('/experiences', listingImagesUpload.array('images', 10), createExperienceController);
router.get('/experiences', getMyExperiencesController);
router.get('/experiences/:id', getMyExperienceByIdController);
router.put('/experiences/:id', listingImagesUpload.array('images', 10), updateMyExperienceController);
router.get('/reservations', getHostReservationsController);

export default router;
