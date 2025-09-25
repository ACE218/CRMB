const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedEmployeeDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Employee seeding');

    console.log('Employee seeding completed - no demo employees created');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding employee database:', error);
    process.exit(1);
  }
};

seedEmployeeDatabase();