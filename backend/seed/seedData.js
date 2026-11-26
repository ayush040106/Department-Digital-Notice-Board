const fs = require('fs');
const path = require('path');
const { connectDB, disconnectDB } = require('../config/db');
const Department = require('../models/Department');
const User = require('../models/User');
const Notice = require('../models/Notice');
const { uploadsDir } = require('../middleware/uploadMiddleware');

const buildMinimalPdf = (title, subtitle) => {
  const safeTitle = String(title).replace(/[()\\]/g, '');
  const safeSub = String(subtitle).replace(/[()\\]/g, '');
  const streamContent = `BT\n/F1 16 Tf\n50 740 Td\n(${safeTitle}) Tj\n0 -28 Td\n/F1 11 Tf\n(${safeSub}) Tj\n0 -24 Td\n(Published via College Department-Wise Digital Notice Board.) Tj\nET`;

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
};

const createSamplePdf = (fileName, originalName, title, subtitle) => {
  fs.mkdirSync(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, fileName);
  const buffer = buildMinimalPdf(title, subtitle);
  fs.writeFileSync(filePath, buffer);
  return {
    originalName,
    fileName,
    filePath: `/uploads/${fileName}`,
    mimeType: 'application/pdf',
    size: buffer.length,
  };
};

const daysFromNow = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
};

const seedDatabase = async ({ force = false } = {}) => {
  if (!force) {
    const [deptCount, userCount] = await Promise.all([
      Department.countDocuments(),
      User.countDocuments(),
    ]);
    if (deptCount > 0 || userCount > 0) {
      return { seeded: false, reason: 'Database already contains data' };
    }
  } else {
    await Promise.all([Notice.deleteMany({}), User.deleteMany({}), Department.deleteMany({})]);
  }

  const departments = await Department.insertMany([
    {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      headOfDepartment: 'Dr. Vikramaditya Rao',
      description: 'Undergraduate and postgraduate programs in computing, AI, and software systems.',
      isActive: true,
    },
    {
      name: 'Electronics & Communication',
      code: 'ECE',
      headOfDepartment: 'Dr. Nandini Iyer',
      description: 'VLSI design, embedded systems, telecommunications, and signal processing.',
      isActive: true,
    },
    {
      name: 'Mechanical Engineering',
      code: 'ME',
      headOfDepartment: 'Dr. Harish Deshmukh',
      description: 'Thermal engineering, robotics, CAD/CAM, and manufacturing systems.',
      isActive: true,
    },
    {
      name: 'Civil Engineering',
      code: 'CE',
      headOfDepartment: 'Dr. Kavita Menon',
      description: 'Structural design, geotechnical engineering, and sustainable infrastructure.',
      isActive: true,
    },
    {
      name: 'Business Administration',
      code: 'MBA',
      headOfDepartment: 'Dr. Siddharth Malhotra',
      description: 'Finance, marketing, operations, and organizational leadership studies.',
      isActive: true,
    },
  ]);

  const deptByCode = Object.fromEntries(departments.map((d) => [d.code, d]));

  const usersToCreate = [
    {
      name: 'Dr. Arvind Kulkarni',
      email: 'admin@college.edu',
      password: 'Admin@123',
      role: 'admin',
      department: null,
      enrollmentOrEmployeeId: 'ADM-1001',
    },
    {
      name: 'Prof. Sneha Sharma',
      email: 'faculty.cse@college.edu',
      password: 'Faculty@123',
      role: 'faculty',
      department: deptByCode.CSE._id,
      enrollmentOrEmployeeId: 'FAC-CSE-201',
    },
    {
      name: 'Prof. Rajesh Verma',
      email: 'faculty.ece@college.edu',
      password: 'Faculty@123',
      role: 'faculty',
      department: deptByCode.ECE._id,
      enrollmentOrEmployeeId: 'FAC-ECE-204',
    },
    {
      name: 'Prof. Meera Nair',
      email: 'faculty.me@college.edu',
      password: 'Faculty@123',
      role: 'faculty',
      department: deptByCode.ME._id,
      enrollmentOrEmployeeId: 'FAC-ME-209',
    },
    {
      name: 'Aarav Patel',
      email: 'student.cse@college.edu',
      password: 'Student@123',
      role: 'student',
      department: deptByCode.CSE._id,
      enrollmentOrEmployeeId: '2026CSE045',
    },
    {
      name: 'Priya Singh',
      email: 'student.ece@college.edu',
      password: 'Student@123',
      role: 'student',
      department: deptByCode.ECE._id,
      enrollmentOrEmployeeId: '2026ECE018',
    },
    {
      name: 'Rohan Joshi',
      email: 'student.me@college.edu',
      password: 'Student@123',
      role: 'student',
      department: deptByCode.ME._id,
      enrollmentOrEmployeeId: '2026ME032',
    },
  ];

  const createdUsers = [];
  for (const u of usersToCreate) {
    const user = new User(u);
    await user.save();
    createdUsers.push(user);
  }

  const userByEmail = Object.fromEntries(createdUsers.map((u) => [u.email, u]));

  const examSchedulePdf = createSamplePdf(
    'sample-cse-midsem-schedule.pdf',
    'CSE_MidSem_Exam_Schedule_2026.pdf',
    'CSE Mid-Semester Examination Schedule',
    'Department of Computer Science and Engineering'
  );
  const placementPdf = createSamplePdf(
    'sample-cse-placement-drive.pdf',
    'Campus_Placement_Guidelines_2026.pdf',
    'Campus Placement Drive Circular',
    'Training and Placement Cell - CSE Department'
  );
  const eceLabPdf = createSamplePdf(
    'sample-ece-vlsi-workshop.pdf',
    'ECE_VLSI_Workshop_Brochure.pdf',
    'Hands-on VLSI Design Workshop',
    'Department of Electronics and Communication'
  );

  await Notice.insertMany([
    {
      title: 'Mid-Semester Examination Timetable (Semester V & VII)',
      description:
        'All CSE students of Semester V and VII are hereby informed that the Mid-Semester examinations will commence from next Monday in Block A, Halls 201-208. Students must carry their college ID cards and arrive 15 minutes prior to the scheduled exam slot. Refer to the attached PDF for the subject-wise seating plan and timings.',
      department: deptByCode.CSE._id,
      category: 'Examination',
      priority: 'Urgent',
      publishedDate: daysFromNow(-2),
      expiryDate: daysFromNow(25),
      attachment: examSchedulePdf,
      createdBy: userByEmail['faculty.cse@college.edu']._id,
      isPinned: true,
    },
    {
      title: 'Cloud & AI Software Engineer Campus Placement Drive',
      description:
        'Final-year B.Tech CSE students with a minimum CGPA of 7.0 and no active backlogs are eligible to register for the upcoming campus recruitment drive. Pre-placement talk starts at 10:00 AM in the Main Auditorium. Please download the attached eligibility & preparation checklist.',
      department: deptByCode.CSE._id,
      category: 'Placement',
      priority: 'Important',
      publishedDate: daysFromNow(-1),
      expiryDate: daysFromNow(18),
      attachment: placementPdf,
      createdBy: userByEmail['faculty.cse@college.edu']._id,
      isPinned: true,
    },
    {
      title: 'Capstone Project Phase-I Synopsis Submission Deadline',
      description:
        'Project batches in the Department of Computer Science & Engineering must submit their signed Phase-I synopsis and SRS document to their respective faculty mentors before 4:00 PM on Friday. Late submissions will incur grade penalties as per academic regulations.',
      department: deptByCode.CSE._id,
      category: 'Academic',
      priority: 'Important',
      publishedDate: daysFromNow(-3),
      expiryDate: daysFromNow(14),
      createdBy: userByEmail['admin@college.edu']._id,
      isPinned: false,
    },
    {
      title: 'Annual Coding Hackathon — CodeSprint 2026 Registrations Open',
      description:
        'Teams of 2 to 4 students from CSE are invited to register for the 24-hour department hackathon focused on EdTech, FinTech, and Sustainable AI. Exciting prizes and internship interviews await the top 3 teams.',
      department: deptByCode.CSE._id,
      category: 'Events',
      priority: 'Normal',
      publishedDate: daysFromNow(-4),
      expiryDate: daysFromNow(20),
      createdBy: userByEmail['faculty.cse@college.edu']._id,
      isPinned: false,
    },
    {
      title: 'Merit-cum-Means Scholarship Renewal Forms (Archived)',
      description:
        'Students availing the state merit scholarship must verify their attendance records and submit renewal documentation at the Academic Office.',
      department: deptByCode.CSE._id,
      category: 'Scholarship',
      priority: 'Normal',
      publishedDate: daysFromNow(-30),
      expiryDate: daysFromNow(-5),
      createdBy: userByEmail['admin@college.edu']._id,
      isPinned: false,
    },
    {
      title: '3-Day Hands-On VLSI & FPGA Design Workshop',
      description:
        'The Department of Electronics & Communication is organizing an intensive 3-day workshop on RTL design and FPGA synthesis in the Embedded Systems Lab. Seats are limited to 40 participants; download the brochure for registration details.',
      department: deptByCode.ECE._id,
      category: 'Workshop',
      priority: 'Important',
      publishedDate: daysFromNow(-1),
      expiryDate: daysFromNow(22),
      attachment: eceLabPdf,
      createdBy: userByEmail['faculty.ece@college.edu']._id,
      isPinned: true,
    },
    {
      title: 'ECE Signal Processing Lab Internal Assessment Schedule',
      description:
        'Practical viva-voce and MATLAB simulation evaluations for Semester V ECE batches A1 and A2 will be conducted next week during regular lab hours. Lab journals must be duly signed beforehand.',
      department: deptByCode.ECE._id,
      category: 'Examination',
      priority: 'Urgent',
      publishedDate: daysFromNow(-2),
      expiryDate: daysFromNow(12),
      createdBy: userByEmail['faculty.ece@college.edu']._id,
      isPinned: false,
    },
    {
      title: 'Industrial Visit to Bharat Heavy Electricals Manufacturing Plant',
      description:
        'Mechanical Engineering 3rd-year students are scheduled for an industrial study visit next month. Consent letters and safety shoe requirements must be submitted to the department coordinator.',
      department: deptByCode.ME._id,
      category: 'Events',
      priority: 'Normal',
      publishedDate: daysFromNow(-2),
      expiryDate: daysFromNow(30),
      createdBy: userByEmail['faculty.me@college.edu']._id,
      isPinned: true,
    },
    {
      title: 'Surveying Field Camp Guidelines & Equipment Issue',
      description:
        'Civil Engineering Semester IV students must collect total-station and leveling kits from the Surveying Lab between 9:00 AM and 11:00 AM prior to departing for the field camp.',
      department: deptByCode.CE._id,
      category: 'Circular',
      priority: 'Normal',
      publishedDate: daysFromNow(-1),
      expiryDate: daysFromNow(16),
      createdBy: userByEmail['admin@college.edu']._id,
      isPinned: false,
    },
    {
      title: 'Corporate Case Study Competition — FinStrat 2026',
      description:
        'MBA students interested in participating in the inter-collegiate financial strategy case competition are requested to submit team rosters to the MBA department desk by Wednesday.',
      department: deptByCode.MBA._id,
      category: 'Events',
      priority: 'Normal',
      publishedDate: daysFromNow(0),
      expiryDate: daysFromNow(21),
      createdBy: userByEmail['admin@college.edu']._id,
      isPinned: false,
    },
  ]);

  console.log('Seed data created successfully.');
  return { seeded: true };
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase({ force: true });
      await disconnectDB();
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error);
      await disconnectDB();
      process.exit(1);
    }
  })();
}

module.exports = { seedDatabase };
