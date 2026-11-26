const User = require('../models/User');
const Department = require('../models/Department');
const Notice = require('../models/Notice');

// @desc    List all users (faculty, students, admins) with filtering
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { search, role, department, status, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (department && department !== 'all') {
      filter.department = department;
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { enrollmentOrEmployeeId: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
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

// @desc    Create a user account (faculty, student, or admin)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, enrollmentOrEmployeeId, isActive } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    let departmentId = null;
    if (role !== 'admin') {
      const deptDoc = await Department.findById(department);
      if (!deptDoc) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid department for faculty or student.',
        });
      }
      departmentId = deptDoc._id;
    } else if (department) {
      departmentId = department;
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department: departmentId,
      enrollmentOrEmployeeId: enrollmentOrEmployeeId || '',
      isActive: isActive !== undefined ? isActive : true,
    });

    const populated = await User.findById(user._id).populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user account
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const { name, email, password, role, department, enrollmentOrEmployeeId, isActive } = req.body;

    if (String(user._id) === String(req.user._id)) {
      if (isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'You cannot deactivate your own admin account.',
        });
      }
      if (role && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'You cannot change your own admin role.',
        });
      }
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (role !== undefined) user.role = role;
    if (enrollmentOrEmployeeId !== undefined) {
      user.enrollmentOrEmployeeId = enrollmentOrEmployeeId;
    }
    if (isActive !== undefined) user.isActive = isActive;

    if (user.role === 'admin') {
      user.department = department || null;
    } else if (department !== undefined) {
      const deptDoc = await Department.findById(department);
      if (!deptDoc) {
        return res.status(400).json({
          success: false,
          message: 'Selected department does not exist.',
        });
      }
      user.department = deptDoc._id;
    }

    if (password && password.trim().length > 0) {
      user.password = password;
    }

    await user.save();
    const updated = await User.findById(user._id).populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user account
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    const noticeCount = await Notice.countDocuments({ createdBy: user._id });
    if (noticeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user because they authored ${noticeCount} notice(s). Deactivate the account instead.`,
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
