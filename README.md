# CRMB - Customer Relationship Manager and Biller

A comprehensive supermarket management system that handles Customer Relationship Management (CRM) and billing operations.

## 🚀 Features

### Customer Relationship Manager (CRM)
- **Customer Database Management**: Add, update, delete customer profiles
- **Purchase History Tracking**: Log and analyze customer purchases
- **Offer Management**: Auto-suggest discounts based on customer behavior
- **Communication**: Email/SMS notifications for customers
- **Loyalty Points System**: Reward system based on spending history

### Billing System
- **Bill Generation**: Support for both online and offline purchases
- **Inventory Integration**: Real-time stock level updates
- **Payment Gateway**: UPI/Net banking/Credit card integration
- **Discount Application**: Automatic discount application via CRM logic
- **Invoice PDF Generation**: Printable and downloadable bills

## 🛠️ Tech Stack

### Frontend
- **React.js** with **Vite** - Modern, fast development experience
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Material-UI** or **Tailwind CSS** - UI components and styling
- **React Hook Form** - Form handling
- **React Query** - Server state management

### Backend
- **Node.js** with **Express.js** - Server framework
- **MongoDB** with **Mongoose** - Database and ODM
- **JWT** - Authentication and authorization
- **Nodemailer** - Email notifications
- **Multer** - File upload handling
- **Express Validator** - Input validation
- **Bcrypt** - Password hashing

### Additional Tools
- **PDF Generation**: PDFKit or jsPDF
- **SMS Service**: Twilio or similar
- **Payment Gateway**: Razorpay or Stripe
- **File Storage**: Local storage or cloud (AWS S3)

## 📁 Project Structure

```
CRMB/
├── frontend/                 # React.js + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── utils/          # Utility functions
│   │   ├── store/          # State management
│   │   └── styles/         # Global styles and themes
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── uploads/            # File uploads
│   └── package.json
├── docs/                   # Documentation
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CRMB
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Database Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the database connection string in backend/.env

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crmb
JWT_SECRET=your_jwt_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
SMS_API_KEY=your_sms_api_key
PAYMENT_GATEWAY_KEY=your_payment_gateway_key
```

## 📖 API Documentation

### Customer Endpoints
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Billing Endpoints
- `POST /api/bills` - Create new bill
- `GET /api/bills` - Get all bills
- `GET /api/bills/:id` - Get bill by ID
- `GET /api/bills/customer/:customerId` - Get bills by customer

### Inventory Endpoints
- `GET /api/inventory` - Get all products
- `POST /api/inventory` - Add new product
- `PUT /api/inventory/:id` - Update product
- `DELETE /api/inventory/:id` - Delete product

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@crmb.com or create an issue in this repository.

---

## 📚 Additional Documentation

- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Complete overview of the system architecture and implementation steps
- **[Quick Start Guide](QUICK_START.md)** - Get the application running in 5 minutes  
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with examples

## 🎯 Current Project Status

### ✅ Completed (Ready to Use):
- **Backend API**: Complete with all endpoints for customers, inventory, billing, offers, and analytics
- **Database Models**: Advanced schemas with relationships, validations, and business logic
- **Authentication System**: JWT-based with refresh tokens and role-based access
- **Frontend Structure**: React app with routing, state management, and Material-UI components
- **Security**: Helmet, CORS, rate limiting, input validation, and error handling

### 🚧 In Progress (Need Implementation):
- **Dashboard Page**: Connect to real analytics data and display charts
- **Customer Management**: Implement CRUD operations with data tables
- **Inventory Interface**: Product management with stock tracking
- **Billing System**: Real-time calculations and PDF generation
- **Data Visualization**: Charts and reports using Recharts

### 📋 Next Steps:
1. **Setup Environment** (Today): Configure MongoDB and start applications
2. **Implement Dashboard** (This Week): Real data integration with charts
3. **Customer CRUD** (This Week): Complete customer management interface  
4. **Inventory Management** (Next Week): Product listing and stock management
5. **Billing Interface** (Next Week): Bill creation with calculations and PDF

## 🚀 Getting Started

```bash
# 1. Setup MongoDB (choose one):
# - Local: Install MongoDB Community Server
# - Cloud: Create MongoDB Atlas account (recommended)

# 2. Configure environment
cd backend
cp .env.example .env
# Edit .env with your MongoDB connection string

# 3. Start applications
# Terminal 1 (Backend):
cd backend && npm install && npm start

# Terminal 2 (Frontend):  
cd frontend && npm install && npm run dev

# 4. Open browser: http://localhost:5173
```

**The foundation is complete! Focus on implementing one feature at a time starting with the dashboard. 🎉**
