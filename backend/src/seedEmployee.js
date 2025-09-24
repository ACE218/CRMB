const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Employee = require('./models/Employee');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedEmployeeDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Employee seeding');

    // Check if demo employee already exists
    const existingEmployee = await Employee.findOne({ email: 'modi.g@crmb.com' });
    if (existingEmployee) {
      console.log('Demo employee already exists');
      process.exit(0);
    }

    // Create demo employee with the provided data
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
      password: 'admin123', // This will be hashed automatically by the pre-save middleware
      isEmailVerified: false,
      role: 'staff',
      permissions: [], // Empty array as provided
      notes: 'Experienced sales manager',
      emergencyContact: {
        name: 'Giorgia Meloni',
        phone: '6666666666',
        relationship: 'Wife'
      },
      employeeId: 'EMP0002', // This will be used, or auto-generated if not provided
      hireDate: new Date('2025-09-24T14:40:29.170Z')
    });

    await demoEmployee.save();
    console.log('Demo employee created successfully');
    console.log('Employee ID:', demoEmployee.employeeId);
    console.log('Employee Email:', demoEmployee.email);
    console.log('Employee Full Name:', demoEmployee.fullName);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding employee database:', error);
    process.exit(1);
  }
};

seedEmployeeDatabase();