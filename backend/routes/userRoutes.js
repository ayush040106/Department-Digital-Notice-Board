const express = require('express');
const { body } = require('express-validator');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { handleValidation } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', getUsers);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'faculty', 'student']).withMessage('Invalid user role'),
    body('department').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid department ID'),
    body('enrollmentOrEmployeeId').optional().trim().isLength({ max: 40 }),
    handleValidation,
  ],
  createUser
);

router.put(
  '/:id',
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .optional({ values: 'falsy' })
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'faculty', 'student']).withMessage('Invalid user role'),
    body('department').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid department ID'),
    body('enrollmentOrEmployeeId').optional().trim().isLength({ max: 40 }),
    body('isActive').optional().isBoolean(),
    handleValidation,
  ],
  updateUser
);

router.delete('/:id', deleteUser);

module.exports = router;
