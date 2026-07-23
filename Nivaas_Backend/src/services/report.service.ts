import { Types } from 'mongoose';
import { ApiError } from '../exceptions/api.error';
import { ReportModel } from '../models/report.model';
import { UserModel } from '../models/user.model';
import { createNotificationService } from './notification.service';

const toObjectId = (value: string, fieldName: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(`Invalid ${fieldName}`, 400);
  }
  return new Types.ObjectId(value);
};

export const createReportService = async (payload: {
  reporterId: string;
  reporterRole: string;
  reportType: 'stay' | 'experience' | 'host';
  hostName: string;
  location: string;
  problem: string;
  itemId?: string;
  itemTitle?: string;
  sourcePlatform?: 'web' | 'mobile' | 'unknown';
}) => {
  const report = await ReportModel.create({
    reporterId: toObjectId(payload.reporterId, 'reporterId'),
    reporterRole: payload.reporterRole === 'admin' ? 'admin' : 'user',
    reportType: payload.reportType,
    itemId: payload.itemId?.trim() || null,
    itemTitle: payload.itemTitle?.trim() || null,
    hostName: payload.hostName.trim(),
    location: payload.location.trim(),
    problem: payload.problem.trim(),
    sourcePlatform: payload.sourcePlatform || 'unknown',
  });

  const admins = await UserModel.find({ role: 'admin' }).select('_id');

  await Promise.all(
    admins.map((admin) =>
      createNotificationService({
        userId: admin._id.toString(),
        type: 'report',
        title: 'New inconvenience report',
        message: `${payload.reportType.toUpperCase()} report for ${payload.hostName} at ${payload.location}`,
        targetPage: 'admin_reports',
        metadata: {
          reportId: report._id.toString(),
          reportType: payload.reportType,
        },
      })
    )
  );

  return report;
};

export const listReportsForAdminService = async (payload?: { limit?: number }) => {
  const limit = Math.min(Math.max(payload?.limit || 50, 1), 200);
  return ReportModel.find()
    .populate('reporterId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const updateReportStatusForAdminService = async (payload: {
  reportId: string;
  status: 'open' | 'resolved';
}) => {
  const reportId = toObjectId(payload.reportId, 'reportId');
  const updated = await ReportModel.findByIdAndUpdate(
    reportId,
    { status: payload.status },
    { new: true }
  )
    .populate('reporterId', 'name email role')
    .lean();

  if (!updated) {
    throw new ApiError('Report not found', 404);
  }

  return updated;
};
