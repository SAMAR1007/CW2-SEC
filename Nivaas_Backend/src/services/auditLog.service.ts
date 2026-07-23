import { AuditLogModel } from '../models/auditLog.model';
import { Request } from 'express';

interface AuditLogPayload {
  userId?: string;
  action: string;
  category: 'auth' | 'profile' | 'booking' | 'payment' | 'admin' | 'data';
  details: string;
  req?: Request;
  success?: boolean;
  metadata?: Record<string, unknown>;
}

export const createAuditLog = async (payload: AuditLogPayload) => {
  const ip = payload.req
    ? (payload.req.ip || payload.req.socket.remoteAddress || 'unknown')
    : 'system';
  const userAgent = payload.req
    ? (payload.req.headers['user-agent'] || '')
    : '';

  try {
    await AuditLogModel.create({
      userId: payload.userId || undefined,
      action: payload.action,
      category: payload.category,
      details: payload.details,
      ip,
      userAgent: typeof userAgent === 'string' ? userAgent : '',
      success: payload.success !== undefined ? payload.success : true,
      metadata: payload.metadata || {},
    });
  } catch (error) {
    // Don't let audit logging failures break the main operation
    console.error('Audit log creation failed:', error);
  }
};

export const listAuditLogs = async (params: {
  limit?: number;
  userId?: string;
  category?: string;
  action?: string;
  skip?: number;
}) => {
  const limit = Math.min(Math.max(params.limit || 50, 1), 200);
  const skip = params.skip || 0;

  const query: Record<string, unknown> = {};
  if (params.userId) query.userId = params.userId;
  if (params.category) query.category = params.category;
  if (params.action) query.action = params.action;

  const [logs, total] = await Promise.all([
    AuditLogModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLogModel.countDocuments(query),
  ]);

  return { logs, total, limit, skip };
};

export const getAuditLogStats = async () => {
  const [totalLogs, categoryCounts, recentActions] = await Promise.all([
    AuditLogModel.countDocuments(),
    AuditLogModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AuditLogModel.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  return { totalLogs, categoryCounts, recentActions };
};
