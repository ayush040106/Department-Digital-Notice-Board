const express = require('express');
const { body } = require('express-validator');
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { handleValidation } = require('../middleware/validateMiddleware');

const router = express.Router();

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Department name must be 2-100 characters'),
    body('code').trim().isLength({ min: 2, max: 15 }).withMessage('Department code must be 2-15 characters'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('headOfDepartment').optional().trim().isLength({ max: 100 }),
    body('isActive').optional().isBoolean(),
    handleValidation,
  ],
  createDepartment
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Department name must be 2-100 characters'),
    body('code').optional().trim().isLength({ min: 2, max: 15 }).withMessage('Department code must be 2-15 characters'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('headOfDepartment').optional().trim().isLength({ max: 100 }),
    body('isActive').optional().isBoolean(),
    handleValidation,
  ],
  updateDepartment
);

router.delete('/:id', protect, authorize('admin'), deleteDepartment);

module.exports = router;
