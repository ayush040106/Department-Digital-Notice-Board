const Notice = require('../models/Notice');
const Department = require('../models/Department');
const User = require('../models/User');

// @desc    Get dashboard statistics tailored to user role
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const noticeScope = {};
    if (req.user.role !== 'admin') {
      if (!req.user.department) {
        return res.status(200).json({
          success: true,
          data: {
            summary: {
              totalNotices: 0,
              activeNotices: 0,
              expiredNotices: 0,
              urgentNotices: 0,
              myNotices: 0,
              totalDepartments: 0,
              totalFaculty: 0,
              totalStudents: 0,
            },
            departmentBreakdown: [],
            categoryBreakdown: [],
            recentNotices: [],
          },
        });
      }
      noticeScope.department = req.user.department._id;
    }

    const [
      totalNotices,
      activeNotices,
      expiredNotices,
      urgentNotices,
      myNotices,
      totalDepartments,
      activeDepartments,
      totalFaculty,
      totalStudents,
      categoryBreakdown,
      departmentBreakdown,
      recentNotices,
    ] = await Promise.all([
      Notice.countDocuments(noticeScope),
      Notice.countDocuments({ ...noticeScope, expiryDate: { $gte: startOfToday } }),
      Notice.countDocuments({ ...noticeScope, expiryDate: { $lt: startOfToday } }),
      Notice.countDocuments({
        ...noticeScope,
        priority: 'Urgent',
        expiryDate: { $gte: startOfToday },
      }),
      req.user.role === 'faculty' || req.user.role === 'admin'
        ? Notice.countDocuments({ createdBy: req.user._id })
        : Promise.resolve(0),
      Department.countDocuments(),
      Department.countDocuments({ isActive: true }),
      req.user.role === 'admin'
        ? User.countDocuments({ role: 'faculty' })
        : User.countDocuments({ role: 'faculty', department: req.user.department?._id }),
      req.user.role === 'admin'
        ? User.countDocuments({ role: 'student' })
        : User.countDocuments({ role: 'student', department: req.user.department?._id }),
      Notice.aggregate([
        { $match: noticeScope },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      req.user.role === 'admin'
        ? Department.aggregate([
            {
              $lookup: {
                from: 'notices',
                localField: '_id',
                foreignField: 'department',
                as: 'notices',
              },
            },
            {
              $project: {
                name: 1,
                code: 1,
                isActive: 1,
                totalNotices: { $size: '$notices' },
                activeNotices: {
                  $size: {
                    $filter: {
                      input: '$notices',
                      as: 'n',
                      cond: { $gte: ['$$n.expiryDate', startOfToday] },
                    },
                  },
                },
              },
            },
            { $sort: { totalNotices: -1, name: 1 } },
          ])
        : Promise.resolve([]),
      Notice.find(noticeScope)
        .populate('department', 'name code')
        .populate('createdBy', 'name role')
        .sort({ isPinned: -1, publishedDate: -1, createdAt: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalNotices,
          activeNotices,
          expiredNotices,
          urgentNotices,
          myNotices,
          totalDepartments,
          activeDepartments,
          totalFaculty,
          totalStudents,
        },
        departmentBreakdown,
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c._id,
          count: c.count,
        })),
        recentNotices,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
