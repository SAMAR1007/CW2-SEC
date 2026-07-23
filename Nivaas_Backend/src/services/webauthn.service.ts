/**
 * WebAuthn (FIDO2) Password-less Authentication Service.
 *
 * COURSEWORK NOTE: This service implements the core structure for WebAuthn
 * password-less authentication. In production, use a library like
 * '@simplewebauthn/server' for proper attestation verification.
 *
 * WebAuthn allows users to register and authenticate using:
 * - Platform authenticators (fingerprint, Face ID, Windows Hello)
 * - Roaming authenticators (YubiKey, Google Titan, etc.)
 * - Passkeys synced via iCloud Keychain / Google Password Manager
 */

import crypto from 'crypto';
import { UserModel } from '../models/user.model';
import { ApiError } from '../exceptions/api.error';
import { createAuditLog } from './auditLog.service';

const RP_NAME = 'homecomf';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

interface WebAuthnCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  createdAt: Date;
}

interface RegistrationOptions {
  challenge: string;
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: 'public-key'; alg: number }[];
  timeout: number;
  attestation: 'none' | 'direct' | 'indirect';
  authenticatorSelection: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    residentKey: 'preferred' | 'required' | 'discouraged';
    userVerification: 'preferred' | 'required' | 'discouraged';
  };
}

interface AuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: {
    type: 'public-key';
    id: string;
    transports?: string[];
  }[];
  userVerification: 'preferred' | 'required' | 'discouraged';
}

// Generate a random challenge (base64url encoded)
const generateChallenge = (): string => {
  return crypto.randomBytes(32).toString('base64url');
};

// Generate WebAuthn registration options for a user
export const generateRegistrationOptions = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const challenge = generateChallenge();
  const existingCredentials = (user as any).webauthnCredentials || [];

  const options: RegistrationOptions = {
    challenge,
    rp: { name: RP_NAME, id: RP_ID },
    user: {
      id: Buffer.from(user._id.toString()).toString('base64url'),
      name: user.email,
      displayName: user.name,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  };

  // Exclude existing credentials
  if (existingCredentials.length > 0) {
    (options as any).excludeCredentials = existingCredentials.map(
      (cred: WebAuthnCredential) => ({
        type: 'public-key' as const,
        id: cred.credentialId,
        transports: cred.transports || ['internal'],
      })
    );
  }

  // Store challenge temporarily for verification
  await UserModel.findByIdAndUpdate(userId, {
    $set: { webauthnChallenge: challenge },
  });

  return options;
};

// Verify WebAuthn registration response
export const verifyRegistration = async (
  userId: string,
  registrationResponse: {
    id: string;
    rawId: string;
    response: { clientDataJSON: string; attestationObject: string };
    type: string;
  }
) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // COURSEWORK NOTE: In production, use @simplewebauthn/server to:
  // 1. Verify the attestation object
  // 2. Verify the client data JSON contains the original challenge
  // 3. Verify the RP ID and origin
  // 4. Extract and store the credential public key
  //
  // For demonstration, we simulate a successful verification
  // and store the credential reference.

  const newCredential: WebAuthnCredential = {
    credentialId: registrationResponse.id,
    publicKey: 'simulated-public-key-' + crypto.randomBytes(16).toString('hex'),
    counter: 0,
    transports: ['internal'],
    createdAt: new Date(),
  };

  const existingCreds = (user as any).webauthnCredentials || [];
  existingCreds.push(newCredential);

  await UserModel.findByIdAndUpdate(userId, {
    $set: {
      webauthnCredentials: existingCreds,
      webauthnChallenge: null,
    },
  });

  await createAuditLog({
    userId,
    action: 'mfa_enroll',
    category: 'auth',
    details: 'WebAuthn credential registered for password-less authentication',
    success: true,
  });

  return { verified: true, credential: newCredential };
};

// Generate authentication options for a user (for login)
export const generateAuthenticationOptions = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const challenge = generateChallenge();
  const credentials = (user as any).webauthnCredentials || [];

  if (credentials.length === 0) {
    // No WebAuthn credentials registered, fall back to password
    return { available: false };
  }

  const options: AuthenticationOptions = {
    challenge,
    timeout: 60000,
    rpId: RP_ID,
    allowCredentials: credentials.map((cred: WebAuthnCredential) => ({
      type: 'public-key' as const,
      id: cred.credentialId,
      transports: cred.transports || ['internal'],
    })),
    userVerification: 'preferred',
  };

  // Store challenge
  await UserModel.findByIdAndUpdate(user._id, {
    $set: { webauthnChallenge: challenge },
  });

  return { available: true, options };
};

// Verify WebAuthn authentication response (for login)
export const verifyAuthentication = async (
  email: string,
  authResponse: {
    id: string;
    rawId: string;
    response: { clientDataJSON: string; authenticatorData: string; signature: string };
    type: string;
  }
) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const credentials = (user as any).webauthnCredentials || [];
  const credential = credentials.find(
    (c: WebAuthnCredential) => c.credentialId === authResponse.id
  );

  if (!credential) {
    throw new ApiError('Credential not found', 404);
  }

  // COURSEWORK NOTE: In production, use @simplewebauthn/server to:
  // 1. Verify the authenticator data
  // 2. Verify the signature using the stored public key
  // 3. Verify the client data JSON contains the original challenge
  // 4. Update the credential counter
  //
  // For demonstration, we simulate successful verification.

  // Clear challenge
  await UserModel.findByIdAndUpdate(user._id, {
    $set: { webauthnChallenge: null },
  });

  await createAuditLog({
    userId: user._id.toString(),
    action: 'login',
    category: 'auth',
    details: 'Password-less login via WebAuthn',
    success: true,
  });

  return { verified: true, userId: user._id.toString(), role: user.role, name: user.name };
};

// List registered credentials for a user
export const listCredentials = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const credentials = (user as any).webauthnCredentials || [];
  return credentials.map((cred: WebAuthnCredential) => ({
    id: cred.credentialId,
    createdAt: cred.createdAt,
    transports: cred.transports,
  }));
};

// Remove a credential
export const removeCredential = async (userId: string, credentialId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const credentials = (user as any).webauthnCredentials || [];
  const filtered = credentials.filter(
    (c: WebAuthnCredential) => c.credentialId !== credentialId
  );

  if (filtered.length === credentials.length) {
    throw new ApiError('Credential not found', 404);
  }

  await UserModel.findByIdAndUpdate(userId, {
    $set: { webauthnCredentials: filtered },
  });

  return { message: 'Credential removed successfully' };
};
