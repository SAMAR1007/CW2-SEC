import { UserModel } from '../models/user.model';
import { IUser } from '../types/user.type';

export const findUserByEmail = (email: string) => {
  return UserModel.findOne({ email });
};

export const findUserByPhone = (phoneNumber: string) => {
  return UserModel.findOne({ phoneNumber });
};

export const findUserById = (id: string) => {
  return UserModel.findById(id);
};

export const findAllUsers = () => {
  return UserModel.find().select('-password');
};

export const findUsersPaginated = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return Promise.all([
    UserModel.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    UserModel.countDocuments(),
  ]);
};

export const createUser = (data: IUser) => {
  return UserModel.create(data);
};

export const updateUserById = (id: string, data: Partial<IUser>) => {
  return UserModel.findByIdAndUpdate(id, data, { new: true }).select('-password');
};

export const deleteUserById = (id: string) => {
  return UserModel.findByIdAndDelete(id);
};
