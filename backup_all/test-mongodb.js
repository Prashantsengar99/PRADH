require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Testing MongoDB Atlas connection...');
console.log('📡 Connecting to MongoDB Atlas...\n');

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    console.log(`📊 Connection State: ${mongoose.connection.readyState}`);
    process.exit(0);
})
.catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify username and password');
    console.log('3. Check IP whitelist (0.0.0.0/0)');
    console.log('4. Verify cluster name in connection string');
    process.exit(1);
});
