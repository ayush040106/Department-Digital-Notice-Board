const User = require('../models/User');
const Department = require('../models/Department');
const { generateToken } = require('../utils/token');

const sanitizeUser = (userDoc) => ({
  _id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
  department: userDoc.department,
  enrollmentOrEmployeeId: userDoc.enrollmentOrEmployeeId,
  isActive: userDoc.isActive,
  createdAt: userDoc.createdAt,
});

// @desc    Register a new student account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, department, enrollmentOrEmployeeId } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const deptDoc = await Department.findById(department);
    if (!deptDoc || !deptDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected department does not exist or is inactive.',
      });
    }

    // Public registration is strictly limited to student accounts
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      department: deptDoc._id,
      enrollmentOrEmployeeId: enrollmentOrEmployeeId || '',
    });

    const populatedUser = await User.findById(user._id).populate('department', 'name code');
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Student registration successful.',
      data: {
        token,
        user: sanitizeUser(populatedUser),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('department', 'name code');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact the administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(req.user),
    },
  });
};

// @desc    Update own profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, department, enrollmentOrEmployeeId, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (name) user.name = name;
    if (enrollmentOrEmployeeId !== undefined) {
      user.enrollmentOrEmployeeId = enrollmentOrEmployeeId;
    }

    // Students may select/change their department; faculty department is managed by admin
    if (department && user.role === 'student') {
      const deptDoc = await Department.findById(department);
      if (!deptDoc || !deptDoc.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Selected department is invalid or inactive.',
        });
      }
      user.department = deptDoc._id;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }
      user.password = newPassword;
    }

    await user.save();
    const updatedUser = await User.findById(user._id).populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: sanitizeUser(updatedUser),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile };
