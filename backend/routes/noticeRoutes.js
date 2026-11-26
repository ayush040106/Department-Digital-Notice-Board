const express = require('express');
const { body } = require('express-validator');
const Notice = require('../models/Notice');
const {
  getNotices,
  getLatestNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  downloadAttachment,
} = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadPdf } = require('../middleware/uploadMiddleware');
const { handleValidation } = require('../middleware/validateMiddleware');

const router = express.Router();

const noticeValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be 10-5000 characters'),
  body('category')
    .optional()
    .isIn(Notice.CATEGORIES)
    .withMessage(`Category must be one of: ${Notice.CATEGORIES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(Notice.PRIORITIES)
    .withMessage(`Priority must be one of: ${Notice.PRIORITIES.join(', ')}`),
  body('publishedDate').optional().isISO8601().withMessage('Valid published date is required'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
  handleValidation,
];

router.use(protect);

router.get('/', getNotices);
router.get('/latest', getLatestNotices);
router.get('/:id/attachment', downloadAttachment);
router.get('/:id', getNoticeById);

router.post(
  '/',
  authorize('admin', 'faculty'),
  uploadPdf.single('attachment'),
  noticeValidation,
  createNotice
);

router.put(
  '/:id',
  authorize('admin', 'faculty'),
  uploadPdf.single('attachment'),
  [
    body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Description must be 10-5000 characters'),
    body('category').optional().isIn(Notice.CATEGORIES).withMessage('Invalid notice category'),
    body('priority').optional().isIn(Notice.PRIORITIES).withMessage('Invalid notice priority'),
    body('publishedDate').optional().isISO8601().withMessage('Invalid published date'),
    body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date'),
    handleValidation,
  ],
  updateNotice
);

router.delete('/:id', authorize('admin', 'faculty'), deleteNotice);

module.exports = router;
