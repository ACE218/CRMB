const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Customer = require('./models/Customer');
const Employee = require('./models/Employee');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed Customer Data
    console.log('Seeding Customer data...');
    const existingUser = await Customer.findOne({ email: 'admin@crmb.com' });
    if (!existingUser) {
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
        isStaff: true,
        isActive: true
      });

      await demoUser.save();
      console.log('Demo customer created successfully');
    } else {
      console.log('Demo customer already exists');
    }

    // Seed Employee Data
    console.log('Seeding Employee data...');
    const existingEmployee = await Employee.findOne({ email: 'modi.g@crmb.com' });
    if (!existingEmployee) {
      const demoEmployee = new Employee({
        firstName: 'Narendra',
        lastName: 'Modi',
        email: 'modi.g@crmb.com',
        phone: '7777777777',
        address: {
          street: 'Jamnanagar',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '100001'
        },
        department: 'sales',
        position: 'Sales Manager',
        salary: 65000,
        totalSales: 0,
        totalCustomers: 0,
        performanceRating: 4.2,
        isActive: true,
        isStaff: true,
        password: 'admin123',
        isEmailVerified: false,
        role: 'staff',
        permissions: [],
        notes: 'Experienced sales manager',
        emergencyContact: {
          name: 'Giorgia Meloni',
          phone: '6666666666',
          relationship: 'Wife'
        },
        employeeId: 'EMP0002',
        hireDate: new Date('2025-09-24T14:40:29.170Z')
      });

      await demoEmployee.save();
      console.log('Demo employee created successfully');
      console.log('Employee ID:', demoEmployee.employeeId);
      console.log('Employee Email:', demoEmployee.email);
    } else {
      console.log('Demo employee already exists');
    }

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();