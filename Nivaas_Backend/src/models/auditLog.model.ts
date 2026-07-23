import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: string;
  action: string;
  category: 'auth' | 'profile' | 'booking' | 'payment' | 'admin' | 'data';
  details: string;
  ip: string;
  userAgent: string;
  success: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: String,
      required: false,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'login_failed',
        'logout',
        'register',
        'password_change',
        'password_reset',
        'password_reset_request',
        'profile_update',
        'email_change',
        'phone_change',
        'booking_created',
        'booking_cancelled',
        'booking_confirmed',
        'payment_initiated',
        'payment_success',
        'payment_failed',
        'admin_user_create',
        'admin_user_update',
        'admin_user_delete',
        'admin_host_approve',
        'admin_host_reject',
        'admin_report_resolve',
        'data_export',
        'data_import',
        'mfa_enroll',
        'mfa_verify',
        'account_locked',
        'account_unlocked',
      ],
    },
    category: {
      type: String,
      required: true,
      enum: ['auth', 'profile', 'booking', 'payment', 'admin', 'data'],
      index: true,
    },
    details: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    success: {
      type: Boolean,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Index for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });

export const AuditLogModel = model<IAuditLog>('AuditLog', auditLogSchema);
