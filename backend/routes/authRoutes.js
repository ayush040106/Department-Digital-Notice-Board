const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { handleValidation } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('department').isMongoId().withMessage('Please select a valid department'),
    body('enrollmentOrEmployeeId').optional().trim().isLength({ max: 40 }),
    handleValidation,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidation,
  ],
  login
);

router.get('/me', protect, getMe);

router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('department').optional().isMongoId().withMessage('Invalid department ID'),
    body('enrollmentOrEmployeeId').optional().trim().isLength({ max: 40 }),
    body('newPassword')
      .optional({ values: 'falsy' })
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    handleValidation,
  ],
  updateProfile
);

module.exports = router;
