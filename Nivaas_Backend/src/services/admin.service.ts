import {
  findAllUsers,
  findUsersPaginated,
  findUserById,
  createUser,
  updateUserById,
  deleteUserById,
  findUserByEmail,
  findUserByPhone,
} from '../repositories/user.repository';
import {
  findAllHostProfiles,
  findPendingHostProfiles,
  findHostProfileById,
  updateHostProfileByUserId,
} from '../repositories/hostProfile.repository';
import { hashPassword } from '../utils/hash.util';
import { ApiError } from '../exceptions/api.error';
import { IUser } from '../types/user.type';
import { createNotificationService } from './notification.service';

export const getAllUsersService = async (page?: number, limit?: number) => {
  if (!page || !limit) {
    return await findAllUsers();
  }

  const [users, total] = await findUsersPaginated(page, limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getUserByIdService = async (id: string) => {
  const user = await findUserById(id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }
  // Remove password from response
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

export const createUserService = async (payload: any, imagePath?: string) => {
  const emailExists = await findUserByEmail(payload.email);
  if (emailExists) {
    throw new ApiError('Email already exists', 409);
  }

  const phoneExists = await findUserByPhone(payload.phoneNumber);
  if (phoneExists) {
    throw new ApiError('Phone number already exists', 409);
  }

  const hashedPassword = await hashPassword(payload.password);

  const userData: any = {
    name: payload.name,
    email: payload.email,
    phoneNumber: payload.phoneNumber,
    password: hashedPassword,
    role: payload.role || 'user',
  };

  if (imagePath) {
    userData.image = imagePath;
  }

  const user = await createUser(userData);
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

export const updateUserService = async (id: string, payload: any, imagePath?: string) => {
  const user = await findUserById(id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Check if email is being changed and if it already exists
  if (payload.email && payload.email !== user.email) {
    const emailExists = await findUserByEmail(payload.email);
    if (emailExists) {
      throw new ApiError('Email already exists', 409);
    }
  }

  // Check if phone is being changed and if it already exists
  if (payload.phoneNumber && payload.phoneNumber !== user.phoneNumber) {
    const phoneExists = await findUserByPhone(payload.phoneNumber);
    if (phoneExists) {
      throw new ApiError('Phone number already exists', 409);
    }
  }

  const updateData: any = { ...payload };

  // Hash password if being updated
  if (payload.password) {
    updateData.password = await hashPassword(payload.password);
  }

  // Update image if provided
  if (imagePath) {
    updateData.image = imagePath;
  }

  return await updateUserById(id, updateData);
};

export const deleteUserService = async (id: string) => {
  const user = await findUserById(id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  await deleteUserById(id);
  return { message: 'User deleted successfully' };
};

// Host verification (admin)
export const getPendingHostsService = async () => {
  return await findPendingHostProfiles();
};

export const getAllHostsService = async () => {
  return await findAllHostProfiles();
};

export const approveHostService = async (hostProfileId: string) => {
  const profile = await findHostProfileById(hostProfileId);
  if (!profile) {
    throw new ApiError('Host application not found', 404);
  }
  const userId = (profile.userId as any)?._id?.toString() || (profile.userId as any)?.toString();
  const previousStatus = profile.verificationStatus;
  await updateHostProfileByUserId(userId, {
    verificationStatus: 'verified',
    rejectionReason: '',
  });

  if (previousStatus !== 'verified') {
    await createNotificationService({
      userId,
      type: 'host_application_status',
      title: 'Host application approved',
      message: 'Congratulations! Your host application has been approved.',
      targetPage: 'hostVerification',
      metadata: {
        status: 'verified',
        hostProfileId,
      },
    });
  }

  return await findHostProfileById(hostProfileId);
};

export const rejectHostService = async (hostProfileId: string, reason: string) => {
  const profile = await findHostProfileById(hostProfileId);
  if (!profile) {
    throw new ApiError('Host application not found', 404);
  }
  const userId = (profile.userId as any)?._id?.toString() || (profile.userId as any)?.toString();
  const previousStatus = profile.verificationStatus;
  const rejectionReason = reason?.trim() || profile.rejectionReason || 'No reason provided';
  await updateHostProfileByUserId(userId, {
    verificationStatus: 'rejected',
    rejectionReason,
  });

  if (previousStatus !== 'rejected' || reason?.trim()) {
    await createNotificationService({
      userId,
      type: 'host_application_status',
      title: 'Host application rejected',
      message: `Your host application was not approved. ${reason?.trim() ? `Reason: ${reason.trim()}` : ''}`.trim(),
      targetPage: 'hostVerification',
      metadata: {
        status: 'rejected',
        hostProfileId,
        reason: rejectionReason,
      },
    });
  }

  return await findHostProfileById(hostProfileId);
};
