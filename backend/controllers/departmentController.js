const Department = require('../models/Department');
const Notice = require('../models/Notice');
const User = require('../models/User');

// @desc    Get all departments (with optional counts)
// @route   GET /api/departments
// @access  Public (active only by default; admin can pass includeInactive=true)
const getDepartments = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const filter = includeInactive ? {} : { isActive: true };

    const departments = await Department.find(filter).sort({ name: 1 }).lean();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [noticeStats, userStats] = await Promise.all([
      Notice.aggregate([
        {
          $group: {
            _id: '$department',
            totalNotices: { $sum: 1 },
            activeNotices: {
              $sum: {
                $cond: [{ $gte: ['$expiryDate', startOfToday] }, 1, 0],
              },
            },
          },
        },
      ]),
      User.aggregate([
        { $match: { department: { $ne: null } } },
        {
          $group: {
            _id: '$department',
            facultyCount: {
              $sum: { $cond: [{ $eq: ['$role', 'faculty'] }, 1, 0] },
            },
            studentCount: {
              $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const noticeMap = new Map(noticeStats.map((item) => [String(item._id), item]));
    const userMap = new Map(userStats.map((item) => [String(item._id), item]));

    const enriched = departments.map((dept) => {
      const nStat = noticeMap.get(String(dept._id)) || { totalNotices: 0, activeNotices: 0 };
      const uStat = userMap.get(String(dept._id)) || { facultyCount: 0, studentCount: 0 };
      return {
        ...dept,
        totalNotices: nStat.totalNotices,
        activeNotices: nStat.activeNotices,
        facultyCount: uStat.facultyCount,
        studentCount: uStat.studentCount,
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Public
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }
    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (Admin)
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, headOfDepartment, isActive } = req.body;

    const existing = await Department.findOne({
      $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A department with this name or code already exists.',
      });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description: description || '',
      headOfDepartment: headOfDepartment || '',
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }

    const { name, code, description, headOfDepartment, isActive } = req.body;
    if (name !== undefined) department.name = name;
    if (code !== undefined) department.code = code.toUpperCase();
    if (description !== undefined) department.description = description;
    if (headOfDepartment !== undefined) department.headOfDepartment = headOfDepartment;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully.',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }

    const [linkedNotices, linkedUsers] = await Promise.all([
      Notice.countDocuments({ department: department._id }),
      User.countDocuments({ department: department._id }),
    ]);

    if (linkedNotices > 0 || linkedUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with ${linkedUsers} assigned user(s) and ${linkedNotices} notice(s). Reassign or remove them first, or deactivate the department instead.`,
      });
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
