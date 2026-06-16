// seed/createAdmin.js — run with: npm run create-admin
// Creates default admin accounts. CHANGE PASSWORDS before deploying to production!

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin    = require('../models/Admin');

const defaultAdmins = [
  {
    username:    'hod_cse',
    password:    'Admin@123',      // ← CHANGE THIS
    role:        'hod',
    displayName: 'HOD — CSE Dept',
  },
  {
    username:    'principal',
    password:    'Principal@456', // ← CHANGE THIS
    role:        'principal',
    displayName: 'College Principal',
  },
  {
    username:    'coordinator',
    password:    'Coord@789',     // ← CHANGE THIS
    role:        'coordinator',
    displayName: 'Campus Coordinator',
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college_navigation');
    console.log('✅ Connected to MongoDB\n');

    for (const adminData of defaultAdmins) {
      const exists = await Admin.findOne({ username: adminData.username });
      if (exists) {
        console.log(`⚠️  Admin "${adminData.username}" already exists — skipping`);
        continue;
      }
      // Password is hashed automatically by the pre-save hook in Admin.js
      const admin = await Admin.create(adminData);
      console.log(`✅ Created: ${admin.username} (${admin.role})`);
    }

    console.log('\n🎉 Admin accounts ready!');
    console.log('   Login credentials:');
    defaultAdmins.forEach(a => console.log(`   → ${a.username} / ${a.password}`));
    console.log('\n⚠️  CHANGE THESE PASSWORDS before going live!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
