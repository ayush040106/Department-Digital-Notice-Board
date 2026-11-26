const mongoose = require('mongoose');

const NOTICE_CATEGORIES = [
  'Academic',
  'Examination',
  'Events',
  'Placement',
  'Scholarship',
  'Circular',
  'Workshop',
  'General',
];

const NOTICE_PRIORITIES = ['Normal', 'Important', 'Urgent'];

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Notice description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    category: {
      type: String,
      enum: {
        values: NOTICE_CATEGORIES,
        message: 'Invalid notice category',
      },
      default: 'General',
    },
    priority: {
      type: String,
      enum: {
        values: NOTICE_PRIORITIES,
        message: 'Invalid notice priority',
      },
      default: 'Normal',
    },
    publishedDate: {
      type: Date,
      required: [true, 'Published date is required'],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      validate: {
        validator: function (value) {
          if (!this.publishedDate || !value) return true;
          return new Date(value) >= new Date(this.publishedDate);
        },
        message: 'Expiry date must be on or after the published date',
      },
    },
    attachment: {
      originalName: { type: String, default: null },
      fileName: { type: String, default: null },
      filePath: { type: String, default: null },
      mimeType: { type: String, default: null },
      size: { type: Number, default: null },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notice author is required'],
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

noticeSchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  const endOfExpiry = new Date(this.expiryDate);
  endOfExpiry.setHours(23, 59, 59, 999);
  return endOfExpiry < new Date();
});

noticeSchema.virtual('status').get(function () {
  return this.isExpired ? 'Expired' : 'Active';
});

noticeSchema.index({ department: 1, category: 1, publishedDate: -1 });
noticeSchema.index({ expiryDate: 1 });
noticeSchema.index({ createdBy: 1 });

const Notice = mongoose.model('Notice', noticeSchema);
Notice.CATEGORIES = NOTICE_CATEGORIES;
Notice.PRIORITIES = NOTICE_PRIORITIES;

module.exports = Notice;
