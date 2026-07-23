import { HostProfileModel, IHostProfileDocument } from '../models/hostProfile.model';
import { Types } from 'mongoose';

export const findHostProfileByUserId = (userId: string) => {
  return HostProfileModel.findOne({ userId: new Types.ObjectId(userId) });
};

export const createHostProfile = (data: {
  userId: Types.ObjectId;
  legalName: string;
  phoneNumber: string;
  address: string;
  governmentId?: string;
  idDocument?: string;
}) => {
  return HostProfileModel.create({
    ...data,
    verificationStatus: 'pending',
    rejectionReason: '',
  });
};

export const updateHostProfileByUserId = (
  userId: string,
  data: Partial<Pick<IHostProfileDocument, 'legalName' | 'phoneNumber' | 'address' | 'governmentId' | 'idDocument' | 'verificationStatus' | 'rejectionReason'>>
) => {
  return HostProfileModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    data,
    { new: true }
  );
};

export const findPendingHostProfiles = () => {
  return HostProfileModel.find({ verificationStatus: 'pending' })
    .populate('userId', 'name email phoneNumber')
    .sort({ createdAt: -1 });
};

export const findAllHostProfiles = () => {
  return HostProfileModel.find()
    .populate('userId', 'name email phoneNumber')
    .sort({ createdAt: -1 });
};

export const findHostProfileById = (id: string) => {
  return HostProfileModel.findById(id).populate('userId', 'name email phoneNumber');
};
