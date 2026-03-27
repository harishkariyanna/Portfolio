const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const Admin = require('../models/Admin.model');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB');

    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@portfolio.com' });
    if (existingAdmin) {
      console.log('Admin user already exists. Skipping seed.');
      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);

    const admin = await Admin.create({
      email: process.env.ADMIN_EMAIL || 'admin@portfolio.com',
      password: hashedPassword,
      name: 'Portfolio Admin',
      role: 'superadmin'
    });

    console.log(`Admin created: ${admin.email}`);
    await mongoose.connection.close();
    console.log('Seed complete. Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
