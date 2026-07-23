import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ApiError } from '../exceptions/api.error';
import {
  generateRegistrationOptions,
  verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthentication,
  listCredentials,
  removeCredential,
} from '../services/webauthn.service';
import { UserModel } from '../models/user.model';
import { generateToken } from '../lib/jwt';
import { hashUserAgent } from '../middlewares/sessionBinding.middleware';
import { createAuditLog } from '../services/auditLog.service';

// Generate registration options (authenticated user adding a passkey)
export const webauthnRegisterOptions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Authentication required', 401);

    const options = await generateRegistrationOptions(userId);
    res.status(200).json({ options });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// Verify registration and save credential
export const webauthnRegisterVerify = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Authentication required', 401);

    const result = await verifyRegistration(userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// Generate authentication options (login with passkey)
export const webauthnAuthOptions = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError('Email is required', 400);

    const result = await generateAuthenticationOptions(email);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// Verify authentication and login with passkey
export const webauthnAuthVerify = async (req: Request, res: Response) => {
  try {
    const { email, ...authResponse } = req.body;
    if (!email) throw new ApiError('Email is required', 400);

    const result = await verifyAuthentication(email, authResponse);

    // Generate JWT token
    const uaHash = hashUserAgent(req.headers['user-agent'] || '');
    const tokenPayload: any = { id: result.userId, role: result.role };
    if (uaHash) tokenPayload.ua = uaHash;

    const token = generateToken(tokenPayload);

    res.status(200).json({
      message: 'Password-less login successful',
      token,
      user: { id: result.userId, name: result.name, role: result.role },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// List saved credentials
export const webauthnCredentials = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Authentication required', 401);

    const credentials = await listCredentials(userId);
    res.status(200).json({ credentials });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// Remove a credential
export const webauthnRemoveCredential = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Authentication required', 401);

    const { credentialId } = req.params;
    if (!credentialId) throw new ApiError('Credential ID is required', 400);

    const result = await removeCredential(userId, credentialId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
