import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  webauthnRegisterOptions,
  webauthnRegisterVerify,
  webauthnAuthOptions,
  webauthnAuthVerify,
  webauthnCredentials,
  webauthnRemoveCredential,
} from '../controller/webauthn.controller';

const router = Router();

// Public: initiate password-less login
router.post('/auth/options', webauthnAuthOptions);
router.post('/auth/verify', webauthnAuthVerify);

// Authenticated: manage credentials
router.post('/register/options', authMiddleware, webauthnRegisterOptions);
router.post('/register/verify', authMiddleware, webauthnRegisterVerify);
router.get('/credentials', authMiddleware, webauthnCredentials);
router.delete('/credentials/:credentialId', authMiddleware, webauthnRemoveCredential);

export default router;
