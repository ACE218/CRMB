const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Customer = require('./models/Customer');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if demo user already exists
    const existingUser = await Customer.findOne({ email: 'admin@crmb.com' });
    if (existingUser) {
      console.log('Demo user already exists');
      process.exit(0);
    }

    // Create demo user
    const demoUser = new Customer({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@crmb.com',
      phone: '1234567890',
      password: 'admin123',
      address: {
        street: '123 Demo Street',
        city: 'Demo City',
        state: 'Demo State',
        zipCode: '123456'
      },
      customerType: 'vip',
      membershipNumber: 'DEMO001',
      loyaltyPoints: 1000,
      totalSpent: 50000,
      isStaff: true, // Add this if needed for authorization
      isActive: true
    });

    await demoUser.save();
    console.log('Demo user created successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();