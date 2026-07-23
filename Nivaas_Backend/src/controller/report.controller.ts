import { Response } from 'express';
import { ApiError } from '../exceptions/api.error';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  createReportService,
  listReportsForAdminService,
  updateReportStatusForAdminService,
} from '../services/report.service';

const isValidReportType = (value: unknown): value is 'stay' | 'experience' | 'host' =>
  value === 'stay' || value === 'experience' || value === 'host';

export const createReportController = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user?.id;
    const reporterRole = req.user?.role;
    if (!reporterId || !reporterRole) throw new ApiError('Unauthorized', 401);

    const reportType = req.body?.reportType;
    const hostName = req.body?.hostName?.toString().trim() || '';
    const location = req.body?.location?.toString().trim() || '';
    const problem = req.body?.problem?.toString().trim() || '';
    const itemId = req.body?.itemId?.toString().trim() || undefined;
    const itemTitle = req.body?.itemTitle?.toString().trim() || undefined;
    const rawSourcePlatform = req.body?.sourcePlatform;
    const sourcePlatform =
      rawSourcePlatform === 'web' || rawSourcePlatform === 'mobile'
        ? rawSourcePlatform
        : 'unknown';

    if (!isValidReportType(reportType)) {
      throw new ApiError('reportType must be one of stay, experience, or host', 400);
    }
    if (!hostName || !location || !problem) {
      throw new ApiError('hostName, location, and problem are required', 400);
    }

    const report = await createReportService({
      reporterId,
      reporterRole,
      reportType,
      itemId,
      itemTitle,
      hostName,
      location,
      problem,
      sourcePlatform,
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      data: report,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateReportStatusForAdminController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      throw new ApiError('Access denied. Admin privileges required.', 403);
    }

    const reportId = req.params.id;
    const status = req.body?.status;

    if (!reportId) {
      throw new ApiError('reportId is required', 400);
    }

    if (status !== 'open' && status !== 'resolved') {
      throw new ApiError('status must be one of open or resolved', 400);
    }

    const data = await updateReportStatusForAdminService({
      reportId,
      status,
    });

    res.status(200).json({
      message: 'Report status updated successfully',
      data,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listReportsForAdminController = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      throw new ApiError('Access denied. Admin privileges required.', 403);
    }

    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const data = await listReportsForAdminService(
      typeof limit === 'number' ? { limit } : undefined
    );

    res.status(200).json({
      message: 'Reports fetched successfully',
      data,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
