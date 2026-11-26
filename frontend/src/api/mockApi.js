import {
  INITIAL_DEPARTMENTS,
  INITIAL_USERS,
  INITIAL_NOTICES,
  buildSamplePdfBlob,
} from '../data/mockData.js';

const DB_STORAGE_KEY = 'campuspulse_mock_db_v1';
const TOKEN_PREFIX = 'mock_jwt_';

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = (val) => JSON.parse(JSON.stringify(val));

const loadDb = () => {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.departments && parsed.users && parsed.notices) {
        return parsed;
      }
    }
  } catch {
    // fallback to initial seed
  }
  const seeded = {
    departments: clone(INITIAL_DEPARTMENTS),
    users: clone(INITIAL_USERS),
    notices: clone(INITIAL_NOTICES),
  };
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

const saveDb = (db) => {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
};

export const resetDemoData = () => {
  const seeded = {
    departments: clone(INITIAL_DEPARTMENTS),
    users: clone(INITIAL_USERS),
    notices: clone(INITIAL_NOTICES),
  };
  saveDb(seeded);
  return seeded;
};

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.response = {
    status,
    data: { success: false, message },
  };
  return err;
};

const getCurrentUserFromToken = (db) => {
  const token = localStorage.getItem('noticeboard_token');
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    throw createHttpError(401, 'Authentication required. Please log in.');
  }
  const userId = token.slice(TOKEN_PREFIX.length);
  const user = db.users.find((u) => u._id === userId);
  if (!user) {
    throw createHttpError(401, 'User account no longer exists.');
  }
  if (!user.isActive) {
    throw createHttpError(403, 'Your account has been deactivated. Contact the administrator.');
  }
  return user;
};

const populateUser = (user, departments) => {
  const dept = user.department
    ? departments.find((d) => d._id === user.department) || null
    : null;
  const { password: _, ...safe } = user;
  return {
    ...safe,
    department: dept ? { _id: dept._id, name: dept.name, code: dept.code } : null,
  };
};

const populateNotice = (notice, departments, users) => {
  const dept = departments.find((d) => d._id === notice.department) || null;
  const author = users.find((u) => u._id === notice.createdBy) || null;
  return {
    ...notice,
    department: dept ? { _id: dept._id, name: dept.name, code: dept.code } : null,
    createdBy: author
      ? {
          _id: author._id,
          name: author.name,
          email: author.email,
          role: author.role,
          enrollmentOrEmployeeId: author.enrollmentOrEmployeeId,
        }
      : { name: 'College Faculty', role: 'faculty' },
  };
};

const isExpiredDate = (expiryDate) => {
  const end = new Date(expiryDate);
  end.setHours(23, 59, 59, 999);
  return end < new Date();
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsDataURL(file);
  });

const parseFormOrJson = async (body) => {
  if (!(body instanceof FormData)) return { fields: body || {}, file: null };
  const fields = {};
  let file = null;
  for (const [key, value] of body.entries()) {
    if (key === 'attachment' && value instanceof File) {
      file = value;
    } else {
      fields[key] = value;
    }
  }
  return { fields, file };
};

const parseUrl = (rawUrl, params = {}) => {
  const [pathname, queryString] = rawUrl.split('?');
  const searchParams = new URLSearchParams(queryString || '');
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) searchParams.set(k, String(v));
  });
  return { pathname, query: Object.fromEntries(searchParams.entries()) };
};

export const handleMockRequest = async (method, url, body = null, config = {}) => {
  await delay();
  const db = loadDb();
  const { pathname, query } = parseUrl(url, config.params);
  const upperMethod = method.toUpperCase();

  // AUTH ROUTES
  if (pathname === '/auth/login' && upperMethod === 'POST') {
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || user.password !== password) {
      throw createHttpError(401, 'Invalid email or password.');
    }
    if (!user.isActive) {
      throw createHttpError(403, 'Your account has been deactivated. Contact the administrator.');
    }
    return {
      data: {
        success: true,
        message: 'Login successful.',
        data: {
          token: `${TOKEN_PREFIX}${user._id}`,
          user: populateUser(user, db.departments),
        },
      },
    };
  }

  if (pathname === '/auth/register' && upperMethod === 'POST') {
    const email = String(body?.email || '').trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw createHttpError(409, 'An account with this email already exists.');
    }
    const dept = db.departments.find((d) => d._id === body?.department && d.isActive);
    if (!dept) {
      throw createHttpError(400, 'Selected department does not exist or is inactive.');
    }
    const newUser = {
      _id: `user-${Date.now()}`,
      name: String(body?.name || '').trim(),
      email,
      password: String(body?.password || ''),
      role: 'student',
      department: dept._id,
      enrollmentOrEmployeeId: String(body?.enrollmentOrEmployeeId || '').trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDb(db);
    return {
      data: {
        success: true,
        message: 'Student registration successful.',
        data: {
          token: `${TOKEN_PREFIX}${newUser._id}`,
          user: populateUser(newUser, db.departments),
        },
      },
    };
  }

  if (pathname === '/auth/me' && upperMethod === 'GET') {
    const user = getCurrentUserFromToken(db);
    return {
      data: {
        success: true,
        data: { user: populateUser(user, db.departments) },
      },
    };
  }

  if (pathname === '/auth/profile' && upperMethod === 'PUT') {
    const current = getCurrentUserFromToken(db);
    const idx = db.users.findIndex((u) => u._id === current._id);
    const target = db.users[idx];

    if (body?.name) target.name = String(body.name).trim();
    if (body?.enrollmentOrEmployeeId !== undefined) {
      target.enrollmentOrEmployeeId = String(body.enrollmentOrEmployeeId).trim();
    }
    if (body?.department && target.role === 'student') {
      const dept = db.departments.find((d) => d._id === body.department && d.isActive);
      if (!dept) throw createHttpError(400, 'Selected department is invalid or inactive.');
      target.department = dept._id;
    }
    if (body?.newPassword) {
      if (!body.currentPassword || body.currentPassword !== target.password) {
        throw createHttpError(400, 'Current password is incorrect.');
      }
      target.password = body.newPassword;
    }
    saveDb(db);
    return {
      data: {
        success: true,
        message: 'Profile updated successfully.',
        data: { user: populateUser(target, db.departments) },
      },
    };
  }

  // DEPARTMENTS
  if (pathname === '/departments' && upperMethod === 'GET') {
    const includeInactive = query.includeInactive === 'true';
    const list = db.departments
      .filter((d) => (includeInactive ? true : d.isActive))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((dept) => {
        const deptNotices = db.notices.filter((n) => n.department === dept._id);
        const activeNotices = deptNotices.filter((n) => !isExpiredDate(n.expiryDate)).length;
        const facultyCount = db.users.filter(
          (u) => u.department === dept._id && u.role === 'faculty'
        ).length;
        const studentCount = db.users.filter(
          (u) => u.department === dept._id && u.role === 'student'
        ).length;
        return {
          ...dept,
          totalNotices: deptNotices.length,
          activeNotices,
          facultyCount,
          studentCount,
        };
      });
    return { data: { success: true, count: list.length, data: list } };
  }

  if (pathname === '/departments' && upperMethod === 'POST') {
    const current = getCurrentUserFromToken(db);
    if (current.role !== 'admin') throw createHttpError(403, 'Access denied. Admin only.');
    const name = String(body?.name || '').trim();
    const code = String(body?.code || '').trim().toUpperCase();
    if (
      db.departments.some(
        (d) => d.name.toLowerCase() === name.toLowerCase() || d.code === code
      )
    ) {
      throw createHttpError(409, 'A department with this name or code already exists.');
    }
    const newDept = {
      _id: `dept-${Date.now()}`,
      name,
      code,
      description: String(body?.description || '').trim(),
      headOfDepartment: String(body?.headOfDepartment || '').trim(),
      isActive: body?.isActive !== undefined ? Boolean(body.isActive) : true,
      createdAt: new Date().toISOString(),
    };
    db.departments.push(newDept);
    saveDb(db);
    return { data: { success: true, data: newDept } };
  }

  if (pathname.startsWith('/departments/') && upperMethod === 'PUT') {
    const current = getCurrentUserFromToken(db);
    if (current.role !== 'admin') throw createHttpError(403, 'Access denied. Admin only.');
    const deptId = pathname.split('/')[2];
    const dept = db.departments.find((d) => d._id === deptId);
    if (!dept) throw createHttpError(404, 'Department not found.');

    if (body?.name !== undefined) dept.name = String(body.name).trim();
    if (body?.code !== undefined) dept.code = String(body.code).trim().toUpperCase();
    if (body?.description !== undefined) dept.description = String(body.description).trim();
    if (body?.headOfDepartment !== undefined) {
      dept.headOfDepartment = String(body.headOfDepartment).trim();
    }
    if (body?.isActive !== undefined) dept.isActive = Boolean(body.isActive);
    saveDb(db);
    return { data: { success: true, data: dept } };
  }

  if (pathname.startsWith('/departments/') && upperMethod === 'DELETE') {
    const current = getCurrentUserFromToken(db);
    if (current.role !== 'admin') throw createHttpError(403, 'Access denied. Admin only.');
    const deptId = pathname.split('/')[2];
    const idx = db.departments.findIndex((d) => d._id === deptId);
    if (idx === -1) throw createHttpError(404, 'Department not found.');

    const linkedNotices = db.notices.filter((n) => n.department === deptId).length;
    const linkedUsers = db.users.filter((u) => u.department === deptId).length;
    if (linkedNotices > 0 || linkedUsers > 0) {
      throw createHttpError(
        400,
        `Cannot delete department with ${linkedUsers} assigned user(s) and ${linkedNotices} notice(s).`
      );
    }
    db.departments.splice(idx, 1);
    saveDb(db);
    return { data: { success: true, message: 'Department deleted successfully.' } };
  }

  // DASHBOARD STATS
  if (pathname === '/dashboard/stats' && upperMethod === 'GET') {
    const current = getCurrentUserFromToken(db);
    const scopedNotices =
      current.role === 'admin'
        ? db.notices
        : db.notices.filter((n) => n.department === current.department);

    const activeNotices = scopedNotices.filter((n) => !isExpiredDate(n.expiryDate));
    const expiredNotices = scopedNotices.filter((n) => isExpiredDate(n.expiryDate));
    const urgentNotices = activeNotices.filter((n) => n.priority === 'Urgent');

    const catCounts = {};
    scopedNotices.forEach((n) => {
      catCounts[n.category] = (catCounts[n.category] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(catCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const departmentBreakdown =
      current.role === 'admin'
        ? db.departments
            .map((d) => {
              const deptN = db.notices.filter((n) => n.department === d._id);
              return {
                _id: d._id,
                name: d.name,
                code: d.code,
                isActive: d.isActive,
                totalNotices: deptN.length,
                activeNotices: deptN.filter((n) => !isExpiredDate(n.expiryDate)).length,
              };
            })
            .sort((a, b) => b.totalNotices - a.totalNotices || a.name.localeCompare(b.name))
        : [];

    const totalFaculty =
      current.role === 'admin'
        ? db.users.filter((u) => u.role === 'faculty').length
        : db.users.filter((u) => u.role === 'faculty' && u.department === current.department)
            .length;
    const totalStudents =
      current.role === 'admin'
        ? db.users.filter((u) => u.role === 'student').length
        : db.users.filter((u) => u.role === 'student' && u.department === current.department)
            .length;

    return {
      data: {
        success: true,
        data: {
          summary: {
            totalNotices: scopedNotices.length,
            activeNotices: activeNotices.length,
            expiredNotices: expiredNotices.length,
            urgentNotices: urgentNotices.length,
            myNotices: db.notices.filter((n) => n.createdBy === current._id).length,
            totalDepartments: db.departments.length,
            activeDepartments: db.departments.filter((d) => d.isActive).length,
            totalFaculty,
            totalStudents,
          },
          departmentBreakdown,
          categoryBreakdown,
          recentNotices: scopedNotices
            .slice()
            .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
            .slice(0, 5)
            .map((n) => populateNotice(n, db.departments, db.users)),
        },
      },
    };
  }

  // NOTICES
  if (pathname === '/notices/latest' && upperMethod === 'GET') {
    const current = getCurrentUserFromToken(db);
    const limitNum = parseInt(query.limit, 10) || 5;
    const list = db.notices
      .filter((n) => !isExpiredDate(n.expiryDate))
      .filter((n) =>
        current.role === 'admin' ? true : n.department === current.department
      )
      .sort((a, b) => {
        if (Boolean(b.isPinned) !== Boolean(a.isPinned)) return b.isPinned ? 1 : -1;
        return new Date(b.publishedDate) - new Date(a.publishedDate);
      })
      .slice(0, limitNum)
      .map((n) => populateNotice(n, db.departments, db.users));

    return { data: { success: true, data: list } };
  }

  if (pathname === '/notices' && upperMethod === 'GET') {
    const current = getCurrentUserFromToken(db);
    let filtered = db.notices.slice();

    if (current.role === 'student' || current.role === 'faculty') {
      filtered = filtered.filter((n) => n.department === current.department);
    } else if (query.department && query.department !== 'all') {
      filtered = filtered.filter((n) => n.department === query.department);
    }

    if (current.role === 'faculty' && query.mine === 'true') {
      filtered = filtered.filter((n) => n.createdBy === current._id);
    }

    if (query.category && query.category !== 'all') {
      filtered = filtered.filter((n) => n.category === query.category);
    }

    if (query.status === 'active') {
      filtered = filtered.filter((n) => !isExpiredDate(n.expiryDate));
    } else if (query.status === 'expired') {
      filtered = filtered.filter((n) => isExpiredDate(n.expiryDate));
    }

    if (query.startDate) {
      const start = new Date(query.startDate);
      filtered = filtered.filter((n) => new Date(n.publishedDate) >= start);
    }

    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((n) => new Date(n.publishedDate) <= end);
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      if (Boolean(b.isPinned) !== Boolean(a.isPinned)) return b.isPinned ? 1 : -1;
      return new Date(b.publishedDate) - new Date(a.publishedDate);
    });

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 9);
    const total = filtered.length;
    const pages = Math.ceil(total / limit) || 1;
    const paginated = filtered
      .slice((page - 1) * limit, page * limit)
      .map((n) => populateNotice(n, db.departments, db.users));

    return {
      data: {
        success: true,
        data: {
          notices: paginated,
          pagination: { total, page, limit, pages },
        },
      },
    };
  }

  if (pathname === '/notices' && upperMethod === 'POST') {
    const current = getCurrentUserFromToken(db);
    if (current.role === 'student') {
      throw createHttpError(403, 'Students cannot publish notices.');
    }
    const { fields, file } = await parseFormOrJson(body);
    const targetDeptId =
      current.role === 'faculty' ? current.department : fields.department;

    if (
      current.role === 'faculty' &&
      fields.department &&
      fields.department !== current.department
    ) {
      throw createHttpError(
        403,
        'Faculty can only publish notices for their assigned department.'
      );
    }

    let attachment = null;
    if (file) {
      const dataUrl = file.size <= 1.5 * 1024 * 1024 ? await fileToDataUrl(file) : null;
      attachment = {
        originalName: file.name,
        fileName: file.name,
        mimeType: 'application/pdf',
        size: file.size,
        dataUrl,
      };
    }

    const newNotice = {
      _id: `notice-${Date.now()}`,
      title: String(fields.title || '').trim(),
      description: String(fields.description || '').trim(),
      department: targetDeptId,
      category: fields.category || 'General',
      priority: fields.priority || 'Normal',
      publishedDate: fields.publishedDate
        ? new Date(fields.publishedDate).toISOString()
        : new Date().toISOString(),
      expiryDate: new Date(fields.expiryDate).toISOString(),
      attachment,
      createdBy: current._id,
      isPinned: fields.isPinned === 'true' || fields.isPinned === true,
      createdAt: new Date().toISOString(),
    };
    db.notices.unshift(newNotice);
    saveDb(db);
    return {
      data: {
        success: true,
        message: 'Notice published successfully.',
        data: populateNotice(newNotice, db.departments, db.users),
      },
    };
  }

  if (pathname.match(/^\/notices\/[^/]+\/attachment$/) && upperMethod === 'GET') {
    const current = getCurrentUserFromToken(db);
    const noticeId = pathname.split('/')[2];
    const notice = db.notices.find((n) => n._id === noticeId);
    if (!notice || !notice.attachment) {
      throw createHttpError(404, 'Attachment not found.');
    }
    if (current.role !== 'admin' && notice.department !== current.department) {
      throw createHttpError(403, 'Not authorized to download attachments from another department.');
    }
    if (notice.attachment.dataUrl) {
      const res = await fetch(notice.attachment.dataUrl);
      const blob = await res.blob();
      return { data: blob };
    }
    const dept = db.departments.find((d) => d._id === notice.department);
    const blob = buildSamplePdfBlob(notice.title, dept?.name || 'Department Notice');
    return { data: blob };
  }

  if (pathname.startsWith('/notices/') && upperMethod === 'PUT') {
    const current = getCurrentUserFromToken(db);
    if (current.role === 'student') {
      throw createHttpError(403, 'Students cannot edit notices.');
    }
    const noticeId = pathname.split('/')[2];
    const notice = db.notices.find((n) => n._id === noticeId);
    if (!notice) throw createHttpError(404, 'Notice not found.');

    if (
      current.role === 'faculty' &&
      (notice.createdBy !== current._id || notice.department !== current.department)
    ) {
      throw createHttpError(
        403,
        'Faculty can only edit their own notices in their assigned department.'
      );
    }

    const { fields, file } = await parseFormOrJson(body);
    if (fields.title !== undefined) notice.title = String(fields.title).trim();
    if (fields.description !== undefined) {
      notice.description = String(fields.description).trim();
    }
    if (fields.department !== undefined && current.role === 'admin') {
      notice.department = fields.department;
    }
    if (fields.category !== undefined) notice.category = fields.category;
    if (fields.priority !== undefined) notice.priority = fields.priority;
    if (fields.publishedDate !== undefined) {
      notice.publishedDate = new Date(fields.publishedDate).toISOString();
    }
    if (fields.expiryDate !== undefined) {
      notice.expiryDate = new Date(fields.expiryDate).toISOString();
    }
    if (fields.isPinned !== undefined) {
      notice.isPinned = fields.isPinned === 'true' || fields.isPinned === true;
    }

    if (file) {
      const dataUrl = file.size <= 1.5 * 1024 * 1024 ? await fileToDataUrl(file) : null;
      notice.attachment = {
        originalName: file.name,
        fileName: file.name,
        mimeType: 'application/pdf',
        size: file.size,
        dataUrl,
      };
    } else if (fields.removeAttachment === 'true') {
      notice.attachment = null;
    }

    saveDb(db);
    return {
      data: {
        success: true,
        message: 'Notice updated successfully.',
        data: populateNotice(notice, db.departments, db.users),
      },
    };
  }

  if (pathname.startsWith('/notices/') && upperMethod === 'DELETE') {
    const current = getCurrentUserFromToken(db);
    if (current.role === 'student') {
      throw createHttpError(403, 'Students cannot delete notices.');
    }
    const noticeId = pathname.split('/')[2];
    const idx = db.notices.findIndex((n) => n._id === noticeId);
    if (idx === -1) throw createHttpError(404, 'Notice not found.');

    const notice = db.notices[idx];
    if (
      current.role === 'faculty' &&
      (notice.createdBy !== current._id || notice.department !== current.department)
    ) {
      throw createHttpError(
        403,
        'Faculty can only delete their own notices in their assigned department.'
      );
    }

    db.notices.splice(idx, 1);
    saveDb(db);
    return { data: { success: true, message: 'Notice deleted successfully.' } };
  }

  // USERS (ADMIN ONLY)
  if (pathname === '/users' && upperMethod === 'GET') {
    const current = getCurrentUserFromToken(db);
    if (current.role !== 'admin') throw createHttpError(403, 'Access denied. Admin only.');

    let filtered = db.users.slice();
    if (query.role && query.role !== 'all') {
      filtered = filtered.filter((u) => u.role === query.role);
    }
    if (query.department && query.department !== 'all') {
      filtered = filtered.filter((u) => u.department === query.department);
    }
    if (query.status === 'active') {
      filtered = filtered.filter((u) => u.isActive);
    } else if (query.status === 'inactive') {
      filtered = filtered.filter((u) => !u.isActive);
    }
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.enrollmentOrEmployeeId || '').toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 15);
    const total = filtered.length;
    const pages = Math.ceil(total / limit) || 1;
    const users = filtered
      .slice((page - 1) * limit, page * limit)
      .map((u) => populateUser(u, db.departments));

    return {
      data: {
        success: true,
        data: {
          users,
          pagination: { total, page, limit, pages },
        },
      },
    };
  }

  if (pathname === '/users' && upperMethod === 'POST') {
    const current = getCurrentUserFromToken(db);
    if (current.role !== 'admin') throw createHttpError(403, 'Access denied. Admin only.');
    const email = String(body?.email || '').trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw createHttpError(409, 'A user with this email already exists.');
    }
    const newUser = {
      _id: `user-${Date.now()}`,
      name: String(body?.name || '').trim(),
      email,
      password: String(body?.password || ''),
      role: body?.role || 'student',
      department: body?.role === 'admin' ? null : body?.department,
      enrollmentOrEmployeeId: String(body?.enrollmentOrEmployeeId || '').trim(),
      isActive: body?.isActive !== undefined ? Boolean(body.isActive) : true,
      createdAt: new Date().toISOString(),
    };
    db.users.unshift(newUser);
    saveDb(db);
    return {
      data: {
        success: true,
        data: populateUser(newUser, db.departments),
      },
    };
  }

  if (pathname.startsWith('/users/') && upperMethod === 'PUT') {
    const current = getCurrentUserFromToken(db);
    if (current.role !== 'admin') throw createHttpError(403, 'Access denied. Admin only.');
    const userId = pathname.split('/')[2];
    const target = db.users.find((u) => u._id === userId);
    if (!target) throw createHttpError(404, 'User not found.');

    if (target._id === current._id) {
      if (body?.isActive === false) {
        throw createHttpError(400, 'You cannot deactivate your own admin account.');
      }
      if (body?.role && body.role !== 'admin') {
        throw createHttpError(400, 'You cannot change your own admin role.');
      }
    }

    if (body?.name !== undefined) target.name = String(body.name).trim();
    if (body?.email !== undefined) target.email = String(body.email).trim().toLowerCase();
    if (body?.role !== undefined) target.role = body.role;
    if (body?.department !== undefined) {
      target.department = target.role === 'admin' ? null : body.department;
    }
    if (body?.enrollmentOrEmployeeId !== undefined) {
      target.enrollmentOrEmployeeId = String(body.enrollmentOrEmployeeId).trim();
    }
    if (body?.isActive !== undefined) target.isActive = Boolean(body.isActive);
    if (body?.password && body.password.trim()) {
      target.password = body.password;
    }
    saveDb(db);
    return {
      data: {
        success: true,
        data: populateUser(target, db.departments),
      },
    };
  }

  if (pathname.startsWith('/users/') && upperMethod === 'DELETE') {
    const current = getCurrentUserFromToken(db);
    if (current.role !== 'admin') throw createHttpError(403, 'Access denied. Admin only.');
    const userId = pathname.split('/')[2];
    if (userId === current._id) {
      throw createHttpError(400, 'You cannot delete your own account.');
    }
    const noticeCount = db.notices.filter((n) => n.createdBy === userId).length;
    if (noticeCount > 0) {
      throw createHttpError(
        400,
        `Cannot delete user because they authored ${noticeCount} notice(s). Deactivate the account instead.`
      );
    }
    const idx = db.users.findIndex((u) => u._id === userId);
    if (idx === -1) throw createHttpError(404, 'User not found.');
    db.users.splice(idx, 1);
    saveDb(db);
    return { data: { success: true, message: 'User deleted successfully.' } };
  }

  throw createHttpError(404, `Mock route not found: ${upperMethod} ${pathname}`);
};
