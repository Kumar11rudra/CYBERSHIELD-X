const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/cybershield', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const coll = mongoose.connection.collection('users');
    const res = await coll.updateMany({}, { $set: { role: 'admin' } });
    console.log(`Updated ${res.modifiedCount} users to 'admin' role.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
