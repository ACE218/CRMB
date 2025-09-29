const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Generate JWT Token
const generateEmployeeToken = (employee) => {
  return jwt.sign(
    { 
      id: employee._id,
      type: 'employee',
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role
    }, 
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// Middleware to protect employee routes
const protectEmployee = async (req, res, next) => {
  try {
    // Check for token in headers
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Get token from header
    const token = req.headers.authorization.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's an employee token
    if (decoded.type !== 'employee') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token type'
      });
    }

    // Get employee from token
    const employee = await Employee.findById(decoded.id).select('-password');

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but employee not found'
      });
    }

    if (!employee.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add employee to request object
    req.employee = employee;

    next();
  } catch (error) {
    console.error('Employee token verification error:', error);
    return res.status(401).json({
      success: false,
      message: error.name === 'JsonWebTokenError' ? 'Invalid token' : 'Not authorized, token failed'
    });
  }
};

// Middleware to check if employee has required role
const authorizeEmployee = (...roles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.employee.role)) {
      return res.status(403).json({
        success: false,
        message: `Employee role '${req.employee.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = {
  generateEmployeeToken,
  protectEmployee,
  authorizeEmployee
};