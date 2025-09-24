const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Employee = require('./models/Employee');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyEmployee = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Employee verification');

    // Find the employee
    const employee = await Employee.findOne({ email: 'modi.g@crmb.com' });
    
    if (employee) {
      console.log('Employee found successfully!');
      console.log('=====================================');
      console.log('ID:', employee._id);
      console.log('Employee ID:', employee.employeeId);
      console.log('Full Name:', employee.fullName);
      console.log('Email:', employee.email);
      console.log('Phone:', employee.phone);
      console.log('Department:', employee.department);
      console.log('Position:', employee.position);
      console.log('Salary:', employee.salary);
      console.log('Performance Rating:', employee.performanceRating);
      console.log('Total Sales:', employee.totalSales);
      console.log('Total Customers:', employee.totalCustomers);
      console.log('Is Active:', employee.isActive);
      console.log('Is Staff:', employee.isStaff);
      console.log('Role:', employee.role);
      console.log('Email Verified:', employee.isEmailVerified);
      console.log('Notes:', employee.notes);
      console.log('Emergency Contact:', employee.emergencyContact);
      console.log('Hire Date:', employee.hireDate);
      console.log('Created At:', employee.createdAt);
      console.log('Updated At:', employee.updatedAt);
      console.log('=====================================');
    } else {
      console.log('Employee not found');
    }

    // Count total employees
    const totalEmployees = await Employee.countDocuments();
    console.log('Total employees in database:', totalEmployees);

    process.exit(0);
  } catch (error) {
    console.error('Error verifying employee:', error);
    process.exit(1);
  }
};

verifyEmployee();