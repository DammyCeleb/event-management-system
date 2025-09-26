require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventhub';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixAdmin = async () => {
  try {
    await connectDB();
    
    // Delete existing admin if any
    await User.deleteOne({ email: 'admin@eventhub.com' });
    
    // Create new admin with proper password
    const admin = new User({
      name: 'Admin User',
      email: 'admin@eventhub.com',
      password: 'admin123',
      role: 'admin'
    });
    
    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@eventhub.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin:', error);
    process.exit(1);
  }
};

fixAdmin();