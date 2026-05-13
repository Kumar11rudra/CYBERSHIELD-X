const mongoose = require('mongoose');
const User = require('./server/models/User');

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/cybershield', { useNewUrlParser: true, useUnifiedTopology: true });
    const email = 'test@example.com'; // Change to a real email from your DB
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      process.exit(0);
    }
    console.log('Found user:', user.username);
    user.lastLoginAt = new Date();
    await user.save();
    console.log('User saved successfully');
    process.exit(0);
  } catch (err) {
    console.error('ERROR SAVING USER:', err.message);
    if (err.name === 'MongoServerError' && err.code === 11000) {
      console.error('Duplicate key error details:', err.keyPattern);
    }
    process.exit(1);
  }
}
run();
