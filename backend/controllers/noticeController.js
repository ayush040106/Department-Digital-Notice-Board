const fs = require('fs');
const path = require('path');
const Notice = require('../models/Notice');
const Department = require('../models/Department');
const { uploadsDir } = require('../middleware/uploadMiddleware');

const removeStoredAttachment = (attachment) => {
  if (!attachment || !attachment.fileName) return;
  const fullPath = path.join(uploadsDir, path.basename(attachment.fileName));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

const getStartOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// @desc    Get notices with role-based scoping, search, and filters
// @route   GET /api/notices
// @access  Private
const getNotices = async (req, res, next) => {
  try {
    const {
      search,
      department,
      category,
      priority,
      status = 'all',
      startDate,
      endDate,
      mine,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    // Role-based department scoping
    if (req.user.role === 'student') {
      if (!req.user.department) {
        return res.status(400).json({
          success: false,
          message: 'Student account is not assigned to any department.',
        });
      }
      filter.department = req.user.department._id;
    } else if (req.user.role === 'faculty') {
      // Faculty primarily manage & view notices for their assigned department
      if (mine === 'true') {
        filter.createdBy = req.user._id;
      }
      if (department && department !== String(req.user.department?._id)) {
        return res.status(403).json({
          success: false,
          message: 'Faculty can only access notices for their assigned department.',
        });
      }
      filter.department = req.user.department._id;
    } else if (department && department !== 'all') {
      filter.department = department;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    const startOfToday = getStartOfToday();
    if (status === 'active') {
      filter.expiryDate = { $gte: startOfToday };
    } else if (status === 'expired') {
      filter.expiryDate = { $lt: startOfToday };
    }

    if (startDate || endDate) {
      filter.publishedDate = {};
      if (startDate) {
        filter.publishedDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.publishedDate.$lte = end;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [notices, total] = await Promise.all([
      Notice.find(filter)
        .populate('department', 'name code')
        .populate('createdBy', 'name email role enrollmentOrEmployeeId')
        .sort({ isPinned: -1, publishedDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notices,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest active announcements for user's scope
// @route   GET /api/notices/latest
// @access  Private
const getLatestNotices = async (req, res, next) => {
  try {
    const startOfToday = getStartOfToday();
    const filter = { expiryDate: { $gte: startOfToday } };

    if (req.user.role === 'student' || req.user.role === 'faculty') {
      if (!req.user.department) {
        return res.status(200).json({ success: true, data: [] });
      }
      filter.department = req.user.department._id;
    }

    const limitNum = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 5));

    const notices = await Notice.find(filter)
      .populate('department', 'name code')
      .populate('createdBy', 'name role')
      .sort({ isPinned: -1, publishedDate: -1, createdAt: -1 })
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: notices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single notice by ID
// @route   GET /api/notices/:id
// @access  Private
const getNoticeById = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('department', 'name code')
      .populate('createdBy', 'name email role enrollmentOrEmployeeId');

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found.',
      });
    }

    if (
      (req.user.role === 'student' || req.user.role === 'faculty') &&
      String(notice.department._id) !== String(req.user.department?._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view notices from another department.',
      });
    }

    res.status(200).json({
      success: true,
      data: notice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new notice
// @route   POST /api/notices
// @access  Private (Admin, Faculty)
const createNotice = async (req, res, next) => {
  try {
    const {
      title,
      description,
      department,
      category,
      priority,
      publishedDate,
      expiryDate,
      isPinned,
    } = req.body;

    let targetDepartmentId = department;

    if (req.user.role === 'faculty') {
      if (!req.user.department) {
        if (req.file) removeStoredAttachment({ fileName: req.file.filename });
        return res.status(400).json({
          success: false,
          message: 'Faculty account is not assigned to any department.',
        });
      }
      if (department && String(department) !== String(req.user.department._id)) {
        if (req.file) removeStoredAttachment({ fileName: req.file.filename });
        return res.status(403).json({
          success: false,
          message: 'Faculty can only publish notices for their assigned department.',
        });
      }
      targetDepartmentId = req.user.department._id;
    }

    const deptDoc = await Department.findById(targetDepartmentId);
    if (!deptDoc || !deptDoc.isActive) {
      if (req.file) removeStoredAttachment({ fileName: req.file.filename });
      return res.status(400).json({
        success: false,
        message: 'Selected department does not exist or is inactive.',
      });
    }

    const pubDate = publishedDate ? new Date(publishedDate) : new Date();
    const expDate = new Date(expiryDate);
    if (expDate < pubDate) {
      if (req.file) removeStoredAttachment({ fileName: req.file.filename });
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be on or after the published date.',
      });
    }

    const attachment = req.file
      ? {
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: `/uploads/${req.file.filename}`,
          mimeType: req.file.mimetype,
          size: req.file.size,
        }
      : {
          originalName: null,
          fileName: null,
          filePath: null,
          mimeType: null,
          size: null,
        };

    const notice = await Notice.create({
      title,
      description,
      department: deptDoc._id,
      category: category || 'General',
      priority: priority || 'Normal',
      publishedDate: pubDate,
      expiryDate: expDate,
      attachment,
      createdBy: req.user._id,
      isPinned: isPinned === true || isPinned === 'true',
    });

    const populated = await Notice.findById(notice._id)
      .populate('department', 'name code')
      .populate('createdBy', 'name email role enrollmentOrEmployeeId');

    res.status(201).json({
      success: true,
      message: 'Notice published successfully.',
      data: populated,
    });
  } catch (error) {
    if (req.file) removeStoredAttachment({ fileName: req.file.filename });
    next(error);
  }
};

// @desc    Update an existing notice
// @route   PUT /api/notices/:id
// @access  Private (Admin, Faculty owner)
const updateNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      if (req.file) removeStoredAttachment({ fileName: req.file.filename });
      return res.status(404).json({
        success: false,
        message: 'Notice not found.',
      });
    }

    if (req.user.role === 'faculty') {
      const isOwner = String(notice.createdBy) === String(req.user._id);
      const isSameDept = String(notice.department) === String(req.user.department?._id);

      if (!isOwner || !isSameDept) {
        if (req.file) removeStoredAttachment({ fileName: req.file.filename });
        return res.status(403).json({
          success: false,
          message: 'Faculty can only edit their own notices in their assigned department.',
        });
      }

      if (req.body.department && String(req.body.department) !== String(req.user.department._id)) {
        if (req.file) removeStoredAttachment({ fileName: req.file.filename });
        return res.status(403).json({
          success: false,
          message: 'Faculty cannot move notices to another department.',
        });
      }
    }

    const {
      title,
      description,
      department,
      category,
      priority,
      publishedDate,
      expiryDate,
      isPinned,
      removeAttachment,
    } = req.body;

    if (department && req.user.role === 'admin') {
      const deptDoc = await Department.findById(department);
      if (!deptDoc || !deptDoc.isActive) {
        if (req.file) removeStoredAttachment({ fileName: req.file.filename });
        return res.status(400).json({
          success: false,
          message: 'Selected department is invalid or inactive.',
        });
      }
      notice.department = deptDoc._id;
    }

    if (title !== undefined) notice.title = title;
    if (description !== undefined) notice.description = description;
    if (category !== undefined) notice.category = category;
    if (priority !== undefined) notice.priority = priority;
    if (publishedDate !== undefined) notice.publishedDate = new Date(publishedDate);
    if (expiryDate !== undefined) notice.expiryDate = new Date(expiryDate);
    if (isPinned !== undefined) notice.isPinned = isPinned === true || isPinned === 'true';

    if (notice.expiryDate < notice.publishedDate) {
      if (req.file) removeStoredAttachment({ fileName: req.file.filename });
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be on or after the published date.',
      });
    }

    if (req.file) {
      removeStoredAttachment(notice.attachment);
      notice.attachment = {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
    } else if (removeAttachment === 'true' || removeAttachment === true) {
      removeStoredAttachment(notice.attachment);
      notice.attachment = {
        originalName: null,
        fileName: null,
        filePath: null,
        mimeType: null,
        size: null,
      };
    }

    await notice.save();

    const updated = await Notice.findById(notice._id)
      .populate('department', 'name code')
      .populate('createdBy', 'name email role enrollmentOrEmployeeId');

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully.',
      data: updated,
    });
  } catch (error) {
    if (req.file) removeStoredAttachment({ fileName: req.file.filename });
    next(error);
  }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin, Faculty owner)
const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found.',
      });
    }

    if (req.user.role === 'faculty') {
      const isOwner = String(notice.createdBy) === String(req.user._id);
      const isSameDept = String(notice.department) === String(req.user.department?._id);

      if (!isOwner || !isSameDept) {
        return res.status(403).json({
          success: false,
          message: 'Faculty can only delete their own notices in their assigned department.',
        });
      }
    }

    removeStoredAttachment(notice.attachment);
    await notice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download notice PDF attachment
// @route   GET /api/notices/:id/attachment
// @access  Private
const downloadAttachment = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice || !notice.attachment || !notice.attachment.fileName) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found for this notice.',
      });
    }

    if (
      (req.user.role === 'student' || req.user.role === 'faculty') &&
      String(notice.department) !== String(req.user.department?._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to download attachments from another department.',
      });
    }

    const filePath = path.join(uploadsDir, path.basename(notice.attachment.fileName));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Attachment file is missing on server.',
      });
    }

    res.download(filePath, notice.attachment.originalName || 'notice-attachment.pdf');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotices,
  getLatestNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  downloadAttachment,
};
