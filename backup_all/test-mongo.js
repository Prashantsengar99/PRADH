const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/pradh_db')
  .then(() => {
    console.log('✅ MongoDB connected!');
    console.log('📦 Database:', mongoose.connection.db.databaseName);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
