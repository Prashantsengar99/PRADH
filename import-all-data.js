require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas
const productSchema = new mongoose.Schema({
    id: String, name: String, price: Number,
    description: String, category: String,
    image: String, stock: Number, status: String,
    createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
    username: String, email: String, password: String,
    phone: String, createdAt: { type: Date, default: Date.now },
    rewards: Number, level: String
});
const User = mongoose.model('User', userSchema);

const couponSchema = new mongoose.Schema({
    code: String, discount: Number, expiry: Date,
    createdAt: { type: Date, default: Date.now }
});
const Coupon = mongoose.model('Coupon', couponSchema);

async function importData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Clear existing data
        await Product.deleteMany({});
        await User.deleteMany({});
        await Coupon.deleteMany({});
        console.log('✅ Cleared existing data\n');

        // Products
        const products = [
            {
                id: 'PROD001',
                name: 'PRADH Desi Fuel (250g)',
                price: 349,
                description: 'Perfect trial size package. High-protein roasted mix.',
                category: 'Desi Fuel',
                image: 'product1.jpeg',
                stock: 50,
                status: 'active'
            },
            {
                id: 'PROD002',
                name: 'PRADH Desi Fuel (500g)',
                price: 599,
                description: 'Standard balanced nutritional pack.',
                category: 'Desi Fuel',
                image: 'product1.jpeg',
                stock: 30,
                status: 'active'
            },
            {
                id: 'PROD003',
                name: 'PRADH Desi Fuel (1 KG)',
                price: 1099,
                description: 'Maximum value health pack.',
                category: 'Desi Fuel',
                image: 'product1.jpeg',
                stock: 75,
                status: 'active'
            }
        ];
        await Product.insertMany(products);
        console.log(`✅ Products: ${products.length} added`);

        // Users
        const users = [
            {
                username: 'rahul',
                email: 'rahul@gmail.com',
                password: '1234',
                phone: '9876543210',
                rewards: 250,
                level: 'Silver'
            },
            {
                username: 'priya',
                email: 'priya@gmail.com',
                password: '1234',
                phone: '9876543211',
                rewards: 500,
                level: 'Gold'
            },
            {
                username: 'testuser',
                email: 'test@gmail.com',
                password: '1234',
                phone: '9876543215',
                rewards: 100,
                level: 'Bronze'
            }
        ];
        await User.insertMany(users);
        console.log(`✅ Users: ${users.length} added`);

        // Coupons
        const coupons = [
            { code: 'DESIFUEL10', discount: 10, expiry: new Date('2026-12-31') },
            { code: 'WELCOME20', discount: 20, expiry: new Date('2026-12-31') }
        ];
        await Coupon.insertMany(coupons);
        console.log(`✅ Coupons: ${coupons.length} added`);

        console.log('\n✅ All data imported successfully!');
        console.log('\n📊 MongoDB Atlas Collections:');
        console.log('   📁 products: 3 documents');
        console.log('   📁 users: 3 documents');
        console.log('   📁 coupons: 2 documents');
        console.log('   📁 orders: 0 documents (created on order)');
        console.log('   📁 reviews: 0 documents (created on review)');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

importData();
