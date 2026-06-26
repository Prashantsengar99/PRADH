require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// ============================================
// MONGODB CONNECTION
// ============================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pradh_db';

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
});

// ============================================
// SCHEMAS
// ============================================
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    rewards: { type: Number, default: 0 },
    level: { type: String, default: 'Bronze' }
});

const productSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    category: String,
    image: String,
    stock: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    order_id: String,
    payment_id: String,
    status: { type: String, default: 'pending' },
    date: { type: Date, default: Date.now },
    items: [{ id: String, name: String, price: Number, quantity: Number }],
    total: Number,
    deliveryCharge: Number,
    coupon: String,
    discount: Number,
    customer: {
        name: String,
        phone: String,
        email: String,
        address: String,
        city: String,
        pincode: String,
        paymentMethod: String
    },
    cancellation_reason: String,
    cancelled_at: Date,
    createdAt: { type: Date, default: Date.now }
});

const couponSchema = new mongoose.Schema({
    code: { type: String, unique: true, required: true },
    discount: { type: Number, required: true },
    expiry: Date,
    createdAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    productId: { type: String, required: true },
    productName: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    userName: String,
    userEmail: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Review = mongoose.model('Review', reviewSchema);

// ============================================
// RAZORPAY SETUP
// ============================================
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ ERROR: Razorpay keys not found!');
    process.exit(1);
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('✅ Razorpay initialized');

// ============================================
// USER ROUTES
// ============================================
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).send('All fields required');
        }
        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.status(400).send('Username or email already exists');
        }
        const user = new User({ username, email, password });
        await user.save();
        console.log('✅ User created:', username);
        res.status(201).send('Signup successful! Please login.');
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).send('Server error');
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send('Username and password required');
        }
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).send('Invalid username or password');
        }
        console.log('✅ User logged in:', username);
        res.status(200).send('Login successful');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Server error');
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PRODUCT ROUTES - FULL CRUD
// ============================================
app.get('/api/admin/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/products', async (req, res) => {
    try {
        const { name, price, description, category, image, stock } = req.body;
        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Name and price are required' });
        }
        const product = new Product({
            id: 'PROD' + Date.now().toString().slice(-6),
            name,
            price: parseFloat(price),
            description: description || '',
            category: category || 'General',
            image: image || 'product.jpeg',
            stock: parseInt(stock) || 0,
            status: 'active'
        });
        await product.save();
        console.log('✅ Product added:', product.name);
        res.json({ success: true, message: 'Product added successfully!', product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/admin/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, category, image, stock, status } = req.body;
        const product = await Product.findOne({ id: id });
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        if (name) product.name = name;
        if (price) product.price = parseFloat(price);
        if (description) product.description = description;
        if (category) product.category = category;
        if (image) product.image = image;
        if (stock !== undefined) product.stock = parseInt(stock);
        if (status) product.status = status;
        product.updatedAt = new Date();
        await product.save();
        console.log('✅ Product updated:', product.name);
        res.json({ success: true, message: 'Product updated successfully!', product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Product.deleteOne({ id });
        console.log('✅ Product deleted:', id);
        res.json({ success: true, message: 'Product deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ORDER ROUTES
// ============================================
app.get('/get-orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancellation_reason } = req.body;
        const order = await Order.findOne({ id });
        if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
        if (status) order.status = status;
        if (cancellation_reason) order.cancellation_reason = cancellation_reason;
        await order.save();
        res.json({ success: true, message: 'Order updated!', order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// COUPON ROUTES
// ============================================
app.get('/api/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.json({ success: true, coupons });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/coupons', async (req, res) => {
    try {
        const { code, discount, expiry } = req.body;
        if (!code || !discount) return res.status(400).json({ success: false, error: 'Code and discount required' });
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ success: false, error: 'Coupon already exists' });
        const coupon = new Coupon({ code: code.toUpperCase(), discount: parseInt(discount), expiry: expiry || null });
        await coupon.save();
        res.json({ success: true, message: 'Coupon created!', coupon });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/coupons/validate', async (req, res) => {
    try {
        const { code, amount } = req.body;
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (!coupon) return res.json({ valid: false, message: 'Invalid coupon' });
        if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
            return res.json({ valid: false, message: 'Coupon expired' });
        }
        const discountAmount = amount ? (amount * (coupon.discount / 100)) : 0;
        res.json({ valid: true, coupon, discount: coupon.discount, discountAmount, message: `${coupon.discount}% off applied!` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/coupons/:code', async (req, res) => {
    try {
        const { code } = req.params;
        await Coupon.deleteOne({ code: code.toUpperCase() });
        res.json({ success: true, message: 'Coupon deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// REVIEW ROUTES - FULL CRUD WITH EDIT
// ============================================

// GET all reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find();
        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET review by ID
app.get('/api/reviews/:id', async (req, res) => {
    try {
        const review = await Review.findOne({ id: req.params.id });
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        res.json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET reviews by product
app.get('/api/reviews/product/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId, status: 'approved' });
        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// CREATE review (User)
app.post('/api/reviews', async (req, res) => {
    try {
        const { productId, productName, rating, comment, userName } = req.body;
        if (!productId || !rating || !comment) {
            return res.status(400).json({ success: false, error: 'Product ID, rating and comment required' });
        }
        const review = new Review({
            id: 'REV' + Date.now().toString().slice(-8),
            productId,
            productName: productName || 'Product',
            rating: parseInt(rating),
            comment,
            userName: userName || 'Anonymous',
            status: 'pending'
        });
        await review.save();
        console.log('✅ New review submitted');
        res.json({ success: true, message: 'Review submitted successfully! Waiting for admin approval.', review });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// UPDATE review - Admin can EDIT (FIXED)
app.put('/api/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment, rating } = req.body;
        
        console.log('✏️ Admin editing review:', id);
        console.log('📝 New data:', { status, comment, rating });
        
        const review = await Review.findOne({ id: id });
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        
        // Update fields
        if (status !== undefined) review.status = status;
        if (comment !== undefined) review.comment = comment;
        if (rating !== undefined) review.rating = parseInt(rating);
        review.updatedAt = new Date();
        
        await review.save();
        
        console.log('✅ Review updated:', review.id);
        res.json({ 
            success: true, 
            message: 'Review updated successfully!', 
            review: review 
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE review
app.delete('/api/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Review.deleteOne({ id });
        console.log('✅ Review deleted:', id);
        res.json({ success: true, message: 'Review deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET review stats
app.get('/api/reviews/stats/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId, status: 'approved' });
        const stats = {
            total: reviews.length,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            stats.averageRating = (totalRating / reviews.length).toFixed(1);
            reviews.forEach(r => {
                if (stats.ratingDistribution[r.rating]) {
                    stats.ratingDistribution[r.rating]++;
                }
            });
        }
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// RAZORPAY ROUTES
// ============================================
app.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid amount' });
        }
        const options = {
            amount: Math.round(amount * 100),
            currency: currency,
            receipt: 'order_' + Date.now(),
            payment_capture: 1
        };
        const order = await razorpay.orders.create(options);
        res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        const orderId = 'ORD' + Date.now().toString().slice(-8);
        const newOrder = new Order({
            id: orderId,
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            status: 'paid',
            date: new Date(),
            items: orderDetails?.items || [],
            total: orderDetails?.total || 0,
            deliveryCharge: orderDetails?.deliveryCharge || 0,
            coupon: orderDetails?.coupon || null,
            discount: orderDetails?.discount || 0,
            customer: orderDetails?.customer || {}
        });
        await newOrder.save();
        console.log('✅ Order saved:', orderId);
        res.json({ success: true, message: 'Payment verified!', order: newOrder });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// SERVE HTML
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Database: MongoDB Atlas`);
    console.log(`✅ Server is ready!\n`);
});
