// seed/seed.js — run with: npm run seed
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Location = require('../models/Location');

const sampleLocations = [
  { name: 'Dr. Ravi Kumar Sharma', type: 'faculty', room: 'A-204', floor: '2nd Floor', block: 'A Block', department: 'Computer Science & Engineering', keywords: ['ravi','kumar','sharma','cse','computer science','hod','professor'], description: 'HOD of Computer Science Department. Office hours: Mon-Fri 10AM-12PM' },
  { name: 'Prof. Sunita Mehra',    type: 'faculty', room: 'B-112', floor: '1st Floor', block: 'B Block', department: 'Electronics & Communication Engineering', keywords: ['sunita','mehra','ece','electronics','vlsi','professor'], description: 'Associate Professor, ECE Dept. Specialization: VLSI Design' },
  { name: 'Dr. Anil Verma',        type: 'faculty', room: 'C-305', floor: '3rd Floor', block: 'C Block', department: 'Mathematics', keywords: ['anil','verma','maths','mathematics','calculus','professor'], description: 'Professor of Mathematics. Research: Applied Mathematics & Statistics' },
  { name: 'CSE Computer Lab',      type: 'lab',     room: 'A-105', floor: 'Ground Floor', block: 'A Block', department: 'Computer Science & Engineering', keywords: ['cse lab','computer lab','programming lab','coding lab','it lab'], description: '60 systems. Open Mon-Sat 9AM-6PM. Linux, Windows, Dev tools' },
  { name: 'Electronics & Circuits Lab', type: 'lab', room: 'B-G01', floor: 'Ground Floor', block: 'B Block', department: 'Electronics & Communication Engineering', keywords: ['ece lab','electronics lab','circuits','oscilloscope','hardware'], description: 'Oscilloscopes, signal generators, soldering stations' },
  { name: 'Main College Canteen',  type: 'facility', room: 'GF-01', floor: 'Ground Floor', block: 'Main Building', department: '', keywords: ['canteen','food','cafeteria','dining','lunch','breakfast','snacks'], description: 'Open 8AM-7PM. Breakfast, lunch, snacks, beverages. 200+ seats' },
  { name: 'HOD Office — CSE',      type: 'office',  room: 'A-201', floor: '2nd Floor', block: 'A Block', department: 'Computer Science & Engineering', keywords: ['hod','head of department','hod office','cse office','department head'], description: 'For academic queries, admissions, and complaints' },
  { name: 'Central Library',       type: 'facility', room: 'LIB-GF', floor: 'Ground Floor', block: 'Library Block', department: '', keywords: ['library','books','reading room','study','reference'], description: '50,000+ books, e-resources, silent zone. Open 8AM-9PM' },
  { name: 'Examination Control Room', type: 'office', room: 'ADMIN-102', floor: '1st Floor', block: 'Administrative Block', department: '', keywords: ['exam','examination','hall ticket','result','re-evaluation'], description: 'Exam forms, hall tickets, result queries, re-evaluation requests' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college_navigation');
  console.log('✅ Connected');
  await Location.deleteMany({});
  const inserted = await Location.insertMany(sampleLocations);
  console.log(`✅ Seeded ${inserted.length} locations`);
  process.exit(0);
})();
