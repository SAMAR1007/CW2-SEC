import { Response } from 'express';
import { AuthRequest } from '../middlewares/admin.middleware';
import {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  deleteUserService,
  getAllHostsService,
  getPendingHostsService,
  approveHostService,
  rejectHostService,
} from '../services/admin.service';
import { ApiError } from '../exceptions/api.error';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, parseInt((req.query.limit as string) || '5', 10));
    const result = await getAllUsersService(page, limit);

    if (Array.isArray(result)) {
      res.status(200).json({
        message: 'Users retrieved successfully',
        users: result,
      });
      return;
    }

    res.status(200).json({
      message: 'Users retrieved successfully',
      users: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    const user = await getUserByIdService(userId);
    res.status(200).json({
      message: 'User retrieved successfully',
      user,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const imagePath = req.file ? `/uploads/users/${req.file.filename}` : undefined;
    const user = await createUserService(req.body, imagePath);
    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    const imagePath = req.file ? `/uploads/users/${req.file.filename}` : undefined;
    const user = await updateUserService(userId, req.body, imagePath);
    res.status(200).json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    const result = await deleteUserService(userId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
};

export const getPendingHosts = async (req: AuthRequest, res: Response) => {
  try {
    const hosts = await getPendingHostsService();
    res.status(200).json({
      message: 'Pending host applications retrieved',
      hosts,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getAllHosts = async (req: AuthRequest, res: Response) => {
  try {
    const hosts = await getAllHostsService();
    res.status(200).json({
      message: 'Host applications retrieved',
      hosts,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const approveHost = async (req: AuthRequest, res: Response) => {
  try {
    const hostProfileId = req.params.id;
    if (!hostProfileId) {
      throw new ApiError('Host application ID is required', 400);
    }
    const hostProfile = await approveHostService(hostProfileId);
    res.status(200).json({
      message: 'Host application approved',
      hostProfile,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const rejectHost = async (req: AuthRequest, res: Response) => {
  try {
    const hostProfileId = req.params.id;
    const { reason } = req.body;
    if (!hostProfileId) {
      throw new ApiError('Host application ID is required', 400);
    }
    const hostProfile = await rejectHostService(hostProfileId, reason || '');
    res.status(200).json({
      message: 'Host application rejected',
      hostProfile,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
