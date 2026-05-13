const mongoose = require('mongoose');
const User = require('./server/models/User');

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/cybershield', { useNewUrlParser: true, useUnifiedTopology: true });
    const users = await User.find({});
    console.log('Total Users:', users.length);
    users.forEach(u => {
      console.log(`User: ${u.username}, Email: ${u.email}, Mobile: ${u.mobileNumber}, Role: ${u.role}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
