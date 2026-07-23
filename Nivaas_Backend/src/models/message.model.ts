import { Schema, model, Types } from 'mongoose';

const messageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    accommodationId: {
      type: Schema.Types.ObjectId,
      ref: 'Accommodation',
      required: false,
      index: true,
    },
    experienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Experience',
      required: false,
      index: true,
    },
    readByRecipient: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, createdAt: -1 });

export interface IMessageDocument {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  text: string;
  accommodationId?: Types.ObjectId;
  experienceId?: Types.ObjectId;
  readByRecipient: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const MessageModel = model('Message', messageSchema);
