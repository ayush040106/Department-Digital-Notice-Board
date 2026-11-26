process.env.NODE_ENV = 'test';
process.env.ENABLE_MEMORY_DB_FALLBACK = 'true';
process.env.MONGO_URI = 'mongodb://127.0.0.1:29999/test_fallback_force';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const app = require('../app');
const { seedDatabase } = require('../seed/seedData');
const Department = require('../models/Department');
const Notice = require('../models/Notice');

let memServer;
let adminToken;
let facultyCseToken;
let studentCseToken;
let studentEceToken;
let cseDeptId;
let eceDeptId;

const samplePdfBuffer = Buffer.from(
  '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [] /Count 0 >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
  'utf8'
);

describe('Department-Wise Digital Notice Board API', () => {
  before(async () => {
    memServer = await MongoMemoryServer.create();
    await mongoose.connect(memServer.getUri());
    await seedDatabase({ force: true });

    const cse = await Department.findOne({ code: 'CSE' });
    const ece = await Department.findOne({ code: 'ECE' });
    cseDeptId = String(cse._id);
    eceDeptId = String(ece._id);

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'Admin@123' });
    adminToken = adminLogin.body.data.token;

    const facLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty.cse@college.edu', password: 'Faculty@123' });
    facultyCseToken = facLogin.body.data.token;

    const stuCseLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student.cse@college.edu', password: 'Student@123' });
    studentCseToken = stuCseLogin.body.data.token;

    const stuEceLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student.ece@college.edu', password: 'Student@123' });
    studentEceToken = stuEceLogin.body.data.token;
  });

  after(async () => {
    await mongoose.disconnect();
    if (memServer) {
      await memServer.stop();
    }
  });

  it('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('Student registration enforces student role and logs in new student', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Student',
      email: 'new.student@college.edu',
      password: 'Password@123',
      role: 'admin',
      department: cseDeptId,
      enrollmentOrEmployeeId: '2026CSE999',
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, 'student');
    assert.ok(res.body.data.token);

    const dup = await request(app).post('/api/auth/register').send({
      name: 'Dup Student',
      email: 'new.student@college.edu',
      password: 'Password@123',
      department: cseDeptId,
    });
    assert.equal(dup.status, 409);
  });

  it('Admin can create, update, and delete an empty department', async () => {
    const createRes = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Biotechnology',
        code: 'BT',
        headOfDepartment: 'Dr. R. Sen',
        description: 'Bioengineering research department',
      });
    assert.equal(createRes.status, 201);
    const deptId = createRes.body.data._id;

    const updateRes = await request(app)
      .put(`/api/departments/${deptId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ headOfDepartment: 'Dr. R. Sen Sharma' });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.headOfDepartment, 'Dr. R. Sen Sharma');

    const delRes = await request(app)
      .delete(`/api/departments/${deptId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(delRes.status, 200);
  });

  it('Students cannot access admin/faculty routes', async () => {
    const deptCreate = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${studentCseToken}`)
      .send({ name: 'Hack Dept', code: 'HCK' });
    assert.equal(deptCreate.status, 403);

    const usersList = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${studentCseToken}`);
    assert.equal(usersList.status, 403);

    const noticeCreate = await request(app)
      .post('/api/notices')
      .set('Authorization', `Bearer ${studentCseToken}`)
      .send({
        title: 'Unauthorized Notice',
        description: 'Students should never be allowed to publish notices',
        department: cseDeptId,
        expiryDate: '2027-01-01',
      });
    assert.equal(noticeCreate.status, 403);
  });

  it('Students only see notices belonging to their own department and can filter by category/date', async () => {
    const cseRes = await request(app)
      .get('/api/notices')
      .set('Authorization', `Bearer ${studentCseToken}`);
    assert.equal(cseRes.status, 200);
    assert.ok(cseRes.body.data.notices.length > 0);
    for (const notice of cseRes.body.data.notices) {
      assert.equal(notice.department.code, 'CSE');
    }

    const eceRes = await request(app)
      .get('/api/notices?category=Workshop')
      .set('Authorization', `Bearer ${studentEceToken}`);
    assert.equal(eceRes.status, 200);
    assert.ok(eceRes.body.data.notices.length >= 1);
    for (const notice of eceRes.body.data.notices) {
      assert.equal(notice.department.code, 'ECE');
      assert.equal(notice.category, 'Workshop');
    }

    // CSE student cannot view an ECE notice by ID
    const eceNotice = await Notice.findOne({ department: eceDeptId });
    const crossDeptRes = await request(app)
      .get(`/api/notices/${eceNotice._id}`)
      .set('Authorization', `Bearer ${studentCseToken}`);
    assert.equal(crossDeptRes.status, 403);
  });

  it('Faculty can publish, edit, download PDF, and delete their own department notice, but cannot touch other depts or admin notices', async () => {
    // Reject publishing to another department
    const wrongDept = await request(app)
      .post('/api/notices')
      .set('Authorization', `Bearer ${facultyCseToken}`)
      .field('title', 'Cross Dept Attempt')
      .field('description', 'Should fail because ECE is not faculty assigned department')
      .field('department', eceDeptId)
      .field('category', 'Academic')
      .field('expiryDate', '2027-02-01');
    assert.equal(wrongDept.status, 403);

    // Reject non-PDF attachment
    const badFile = await request(app)
      .post('/api/notices')
      .set('Authorization', `Bearer ${facultyCseToken}`)
      .field('title', 'Bad File Notice')
      .field('description', 'Uploading a text file should fail PDF validation')
      .field('department', cseDeptId)
      .field('category', 'Circular')
      .field('expiryDate', '2027-02-01')
      .attach('attachment', Buffer.from('hello world'), 'notes.txt');
    assert.equal(badFile.status, 400);

    // Create valid notice with PDF attachment
    const created = await request(app)
      .post('/api/notices')
      .set('Authorization', `Bearer ${facultyCseToken}`)
      .field('title', 'CSE Lab Viva Schedule')
      .field('description', 'All final year CSE students must attend viva in Lab 3.')
      .field('department', cseDeptId)
      .field('category', 'Examination')
      .field('priority', 'Urgent')
      .field('publishedDate', '2026-11-26')
      .field('expiryDate', '2027-02-15')
      .attach('attachment', samplePdfBuffer, 'viva-schedule.pdf');

    assert.equal(created.status, 201);
    const createdId = created.body.data._id;
    assert.equal(created.body.data.attachment.originalName, 'viva-schedule.pdf');

    // CSE student can download the PDF attachment
    const dlRes = await request(app)
      .get(`/api/notices/${createdId}/attachment`)
      .set('Authorization', `Bearer ${studentCseToken}`);
    assert.equal(dlRes.status, 200);
    assert.match(dlRes.headers['content-type'], /application\/pdf/);

    // ECE student cannot download CSE notice attachment
    const dlBlocked = await request(app)
      .get(`/api/notices/${createdId}/attachment`)
      .set('Authorization', `Bearer ${studentEceToken}`);
    assert.equal(dlBlocked.status, 403);

    // Faculty cannot edit an admin-authored CSE notice
    const adminCseNotice = await Notice.findOne({
      department: cseDeptId,
      createdBy: { $ne: created.body.data.createdBy._id },
    });
    const editOther = await request(app)
      .put(`/api/notices/${adminCseNotice._id}`)
      .set('Authorization', `Bearer ${facultyCseToken}`)
      .send({ title: 'Attempted Hijack' });
    assert.equal(editOther.status, 403);

    // Faculty can update and delete their own notice
    const updateOwn = await request(app)
      .put(`/api/notices/${createdId}`)
      .set('Authorization', `Bearer ${facultyCseToken}`)
      .send({ title: 'Updated CSE Lab Viva Schedule' });
    assert.equal(updateOwn.status, 200);
    assert.equal(updateOwn.body.data.title, 'Updated CSE Lab Viva Schedule');

    const deleteOwn = await request(app)
      .delete(`/api/notices/${createdId}`)
      .set('Authorization', `Bearer ${facultyCseToken}`);
    assert.equal(deleteOwn.status, 200);
  });

  it('Admin can manage user accounts and view dashboard stats', async () => {
    const createFac = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Prof. Test Faculty',
        email: 'test.faculty@college.edu',
        password: 'Password@123',
        role: 'faculty',
        department: eceDeptId,
        enrollmentOrEmployeeId: 'FAC-ECE-900',
      });
    assert.equal(createFac.status, 201);
    const facId = createFac.body.data._id;

    const delFac = await request(app)
      .delete(`/api/users/${facId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(delFac.status, 200);

    const statsRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(statsRes.status, 200);
    assert.ok(statsRes.body.data.summary.totalNotices >= 1);
    assert.ok(statsRes.body.data.departmentBreakdown.length >= 5);
  });
});
