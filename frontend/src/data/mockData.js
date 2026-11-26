const daysFromNow = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

export const INITIAL_DEPARTMENTS = [
  {
    _id: 'dept-cse',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    headOfDepartment: 'Dr. Vikramaditya Rao',
    description:
      'Undergraduate and postgraduate programs in computing, artificial intelligence, and software systems.',
    isActive: true,
    createdAt: daysFromNow(-120),
  },
  {
    _id: 'dept-ece',
    name: 'Electronics & Communication',
    code: 'ECE',
    headOfDepartment: 'Dr. Nandini Iyer',
    description:
      'VLSI design, embedded systems, telecommunications, and digital signal processing.',
    isActive: true,
    createdAt: daysFromNow(-120),
  },
  {
    _id: 'dept-me',
    name: 'Mechanical Engineering',
    code: 'ME',
    headOfDepartment: 'Dr. Harish Deshmukh',
    description:
      'Thermal engineering, robotics, CAD/CAM, and sustainable manufacturing systems.',
    isActive: true,
    createdAt: daysFromNow(-115),
  },
  {
    _id: 'dept-ce',
    name: 'Civil Engineering',
    code: 'CE',
    headOfDepartment: 'Dr. Kavita Menon',
    description:
      'Structural design, geotechnical engineering, transportation, and smart infrastructure.',
    isActive: true,
    createdAt: daysFromNow(-110),
  },
  {
    _id: 'dept-mba',
    name: 'Business Administration',
    code: 'MBA',
    headOfDepartment: 'Dr. Siddharth Malhotra',
    description:
      'Finance, marketing, operations analytics, and organizational leadership studies.',
    isActive: true,
    createdAt: daysFromNow(-100),
  },
];

export const INITIAL_USERS = [
  {
    _id: 'user-admin-1',
    name: 'Dr. Arvind Kulkarni',
    email: 'admin@college.edu',
    password: 'Admin@123',
    role: 'admin',
    department: null,
    enrollmentOrEmployeeId: 'ADM-1001',
    isActive: true,
    createdAt: daysFromNow(-120),
  },
  {
    _id: 'user-fac-cse',
    name: 'Prof. Sneha Sharma',
    email: 'faculty.cse@college.edu',
    password: 'Faculty@123',
    role: 'faculty',
    department: 'dept-cse',
    enrollmentOrEmployeeId: 'FAC-CSE-201',
    isActive: true,
    createdAt: daysFromNow(-100),
  },
  {
    _id: 'user-fac-ece',
    name: 'Prof. Rajesh Verma',
    email: 'faculty.ece@college.edu',
    password: 'Faculty@123',
    role: 'faculty',
    department: 'dept-ece',
    enrollmentOrEmployeeId: 'FAC-ECE-204',
    isActive: true,
    createdAt: daysFromNow(-95),
  },
  {
    _id: 'user-fac-me',
    name: 'Prof. Meera Nair',
    email: 'faculty.me@college.edu',
    password: 'Faculty@123',
    role: 'faculty',
    department: 'dept-me',
    enrollmentOrEmployeeId: 'FAC-ME-209',
    isActive: true,
    createdAt: daysFromNow(-90),
  },
  {
    _id: 'user-stu-cse',
    name: 'Aarav Patel',
    email: 'student.cse@college.edu',
    password: 'Student@123',
    role: 'student',
    department: 'dept-cse',
    enrollmentOrEmployeeId: '2026CSE045',
    isActive: true,
    createdAt: daysFromNow(-60),
  },
  {
    _id: 'user-stu-ece',
    name: 'Priya Singh',
    email: 'student.ece@college.edu',
    password: 'Student@123',
    role: 'student',
    department: 'dept-ece',
    enrollmentOrEmployeeId: '2026ECE018',
    isActive: true,
    createdAt: daysFromNow(-58),
  },
  {
    _id: 'user-stu-me',
    name: 'Rohan Joshi',
    email: 'student.me@college.edu',
    password: 'Student@123',
    role: 'student',
    department: 'dept-me',
    enrollmentOrEmployeeId: '2026ME032',
    isActive: true,
    createdAt: daysFromNow(-55),
  },
];

export const INITIAL_NOTICES = [
  {
    _id: 'notice-1',
    title: 'Mid-Semester Examination Timetable (Semester V & VII)',
    description:
      'All CSE students of Semester V and VII are hereby informed that the Mid-Semester examinations will commence from next Monday in Block A, Halls 201-208. Students must carry their college ID cards and arrive 15 minutes prior to the scheduled exam slot. Refer to the attached PDF for the subject-wise seating plan and timings.',
    department: 'dept-cse',
    category: 'Examination',
    priority: 'Urgent',
    publishedDate: daysFromNow(-2),
    expiryDate: daysFromNow(25),
    attachment: {
      originalName: 'CSE_MidSem_Exam_Schedule_2026.pdf',
      fileName: 'CSE_MidSem_Exam_Schedule_2026.pdf',
      mimeType: 'application/pdf',
      size: 48240,
      dataUrl: null,
    },
    createdBy: 'user-fac-cse',
    isPinned: true,
    createdAt: daysFromNow(-2),
  },
  {
    _id: 'notice-2',
    title: 'Cloud & AI Software Engineer Campus Placement Drive',
    description:
      'Final-year B.Tech CSE students with a minimum CGPA of 7.0 and no active backlogs are eligible to register for the upcoming campus recruitment drive. Pre-placement talk starts at 10:00 AM in the Main Auditorium. Please download the attached eligibility & preparation checklist.',
    department: 'dept-cse',
    category: 'Placement',
    priority: 'Important',
    publishedDate: daysFromNow(-1),
    expiryDate: daysFromNow(18),
    attachment: {
      originalName: 'Campus_Placement_Guidelines_2026.pdf',
      fileName: 'Campus_Placement_Guidelines_2026.pdf',
      mimeType: 'application/pdf',
      size: 62150,
      dataUrl: null,
    },
    createdBy: 'user-fac-cse',
    isPinned: true,
    createdAt: daysFromNow(-1),
  },
  {
    _id: 'notice-3',
    title: 'Capstone Project Phase-I Synopsis Submission Deadline',
    description:
      'Project batches in the Department of Computer Science & Engineering must submit their signed Phase-I synopsis and SRS document to their respective faculty mentors before 4:00 PM on Friday. Late submissions will incur grade penalties as per academic regulations.',
    department: 'dept-cse',
    category: 'Academic',
    priority: 'Important',
    publishedDate: daysFromNow(-3),
    expiryDate: daysFromNow(14),
    attachment: null,
    createdBy: 'user-admin-1',
    isPinned: false,
    createdAt: daysFromNow(-3),
  },
  {
    _id: 'notice-4',
    title: 'Annual Coding Hackathon — CodeSprint 2026 Registrations Open',
    description:
      'Teams of 2 to 4 students from CSE are invited to register for the 24-hour department hackathon focused on EdTech, FinTech, and Sustainable AI. Exciting prizes and internship interviews await the top 3 teams.',
    department: 'dept-cse',
    category: 'Events',
    priority: 'Normal',
    publishedDate: daysFromNow(-4),
    expiryDate: daysFromNow(20),
    attachment: null,
    createdBy: 'user-fac-cse',
    isPinned: false,
    createdAt: daysFromNow(-4),
  },
  {
    _id: 'notice-5',
    title: 'Merit-cum-Means Scholarship Renewal Forms (Archived)',
    description:
      'Students availing the state merit scholarship must verify their attendance records and submit renewal documentation at the Academic Office.',
    department: 'dept-cse',
    category: 'Scholarship',
    priority: 'Normal',
    publishedDate: daysFromNow(-30),
    expiryDate: daysFromNow(-5),
    attachment: null,
    createdBy: 'user-admin-1',
    isPinned: false,
    createdAt: daysFromNow(-30),
  },
  {
    _id: 'notice-6',
    title: '3-Day Hands-On VLSI & FPGA Design Workshop',
    description:
      'The Department of Electronics & Communication is organizing an intensive 3-day workshop on RTL design and FPGA synthesis in the Embedded Systems Lab. Seats are limited to 40 participants; download the brochure for registration details.',
    department: 'dept-ece',
    category: 'Workshop',
    priority: 'Important',
    publishedDate: daysFromNow(-1),
    expiryDate: daysFromNow(22),
    attachment: {
      originalName: 'ECE_VLSI_Workshop_Brochure.pdf',
      fileName: 'ECE_VLSI_Workshop_Brochure.pdf',
      mimeType: 'application/pdf',
      size: 51400,
      dataUrl: null,
    },
    createdBy: 'user-fac-ece',
    isPinned: true,
    createdAt: daysFromNow(-1),
  },
  {
    _id: 'notice-7',
    title: 'ECE Signal Processing Lab Internal Assessment Schedule',
    description:
      'Practical viva-voce and MATLAB simulation evaluations for Semester V ECE batches A1 and A2 will be conducted next week during regular lab hours. Lab journals must be duly signed beforehand.',
    department: 'dept-ece',
    category: 'Examination',
    priority: 'Urgent',
    publishedDate: daysFromNow(-2),
    expiryDate: daysFromNow(12),
    attachment: null,
    createdBy: 'user-fac-ece',
    isPinned: false,
    createdAt: daysFromNow(-2),
  },
  {
    _id: 'notice-8',
    title: 'Industrial Visit to Bharat Heavy Electricals Manufacturing Plant',
    description:
      'Mechanical Engineering 3rd-year students are scheduled for an industrial study visit next month. Consent letters and safety shoe requirements must be submitted to the department coordinator.',
    department: 'dept-me',
    category: 'Events',
    priority: 'Normal',
    publishedDate: daysFromNow(-2),
    expiryDate: daysFromNow(30),
    attachment: null,
    createdBy: 'user-fac-me',
    isPinned: true,
    createdAt: daysFromNow(-2),
  },
  {
    _id: 'notice-9',
    title: 'Surveying Field Camp Guidelines & Equipment Issue',
    description:
      'Civil Engineering Semester IV students must collect total-station and leveling kits from the Surveying Lab between 9:00 AM and 11:00 AM prior to departing for the field camp.',
    department: 'dept-ce',
    category: 'Circular',
    priority: 'Normal',
    publishedDate: daysFromNow(-1),
    expiryDate: daysFromNow(16),
    attachment: null,
    createdBy: 'user-admin-1',
    isPinned: false,
    createdAt: daysFromNow(-1),
  },
  {
    _id: 'notice-10',
    title: 'Corporate Case Study Competition — FinStrat 2026',
    description:
      'MBA students interested in participating in the inter-collegiate financial strategy case competition are requested to submit team rosters to the MBA department desk by Wednesday.',
    department: 'dept-mba',
    category: 'Events',
    priority: 'Normal',
    publishedDate: daysFromNow(0),
    expiryDate: daysFromNow(21),
    attachment: null,
    createdBy: 'user-admin-1',
    isPinned: false,
    createdAt: daysFromNow(0),
  },
];

export const buildSamplePdfBlob = (title, departmentName = 'College Department') => {
  const clean = (val) => String(val || '').replace(/[()\\]/g, '').slice(0, 80);
  const safeTitle = clean(title);
  const safeDept = clean(departmentName);
  const streamContent = `BT\n/F1 16 Tf\n50 740 Td\n(${safeTitle}) Tj\n0 -28 Td\n/F1 11 Tf\n(${safeDept}) Tj\n0 -24 Td\n(Official Circular - CampusPulse Department-Wise Digital Notice Board) Tj\nET`;

  const encoder = new TextEncoder();
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${encoder.encode(streamContent).length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += obj;
  }
  const xrefPos = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return new Blob([pdf], { type: 'application/pdf' });
};
