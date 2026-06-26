require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
const PDFDocument = require('pdfkit');

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
    console.error('❌ MongoDB Connection Error:', err.message);
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
// PRODUCT ROUTES
// ============================================
app.get('/api/admin/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, products });
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
        res.json({ success: true, message: 'Product added!', product });
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
        res.json({ success: true, message: 'Product updated!', product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Product.deleteOne({ id });
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
// REVIEW ROUTES
// ============================================
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find();
        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

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
        res.json({ success: true, message: 'Review submitted!', review });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment, rating } = req.body;
        const review = await Review.findOne({ id: id });
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        if (status !== undefined) review.status = status;
        if (comment !== undefined) review.comment = comment;
        if (rating !== undefined) review.rating = parseInt(rating);
        review.updatedAt = new Date();
        await review.save();
        res.json({ success: true, message: 'Review updated!', review });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Review.deleteOne({ id });
        res.json({ success: true, message: 'Review deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

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
// INVOICE PDF GENERATION - FIXED OVERLAPPING
// ============================================
app.get('/api/invoice/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('📄 Generating invoice for order:', orderId);
        
        const order = await Order.findOne({ id: orderId });
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 50,
            bufferPages: true
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);
        doc.pipe(res);

        // Colors
        const gold = '#facc15';
        const dark = '#0f172a';
        const gray = '#64748b';
        const lightGray = '#f8fafc';
        const border = '#e2e8f0';

        let y = 50;

        // ===== HEADER =====
        // Company Name
        doc.fontSize(28)
           .font('Helvetica-Bold')
           .fillColor(gold)
           .text('PRADH DESI FUEL', 50, y, { align: 'center' });
        y += 35;

        doc.fontSize(12)
           .font('Helvetica')
           .fillColor(gray)
           .text('💪 Pure Desi Protein Fuel', 50, y, { align: 'center' });
        y += 30;

        // Invoice Title
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor(dark)
           .text('INVOICE', 50, y, { align: 'center' });
        y += 20;

        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(gray)
           .text(`Invoice #: ${order.id}`, 50, y, { align: 'center' });
        y += 30;

        // Divider
        doc.moveTo(50, y).lineTo(550, y).strokeColor(gold).lineWidth(2).stroke();
        y += 25;

        // ===== TWO COLUMN LAYOUT =====
        const leftX = 50;
        const rightX = 320;
        const lineHeight = 20;

        // Left: Order Details
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(dark)
           .text('ORDER DETAILS', leftX, y);
        y += 18;

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor(gray);
        
        const orderInfo = [
            ['Order Date:', new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
            ['Payment ID:', order.payment_id || 'N/A'],
            ['Payment Method:', order.customer?.paymentMethod || 'N/A'],
            ['Status:', (order.status || 'Pending').toUpperCase()]
        ];
        
        let orderY = y;
        orderInfo.forEach(([label, value]) => {
            doc.text(label, leftX, orderY);
            doc.text(value, leftX + 100, orderY);
            orderY += lineHeight;
        });

        // Right: Customer Info
        let custY = y;
        doc.font('Helvetica-Bold')
           .fontSize(11)
           .fillColor(dark)
           .text('BILL TO', rightX, custY);
        custY += 18;

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor(gray);
        
        const cust = order.customer || {};
        const customerLines = [
            cust.name || 'Guest',
            cust.address || 'N/A',
            `${cust.city || ''} ${cust.pincode || ''}`,
            `Phone: ${cust.phone || 'N/A'}`,
            `Email: ${cust.email || 'N/A'}`
        ];
        
        customerLines.forEach(line => {
            if (line.trim()) {
                doc.text(line, rightX, custY);
                custY += lineHeight;
            }
        });

        // Set y to max of both columns
        y = Math.max(orderY, custY) + 15;

        // ===== DIVIDER =====
        doc.moveTo(50, y).lineTo(550, y).strokeColor(border).lineWidth(1).stroke();
        y += 20;

        // ===== ITEMS TABLE =====
        const tableX = 50;
        const col1 = 60;
        const col2 = 280;
        const col3 = 380;
        const col4 = 460;

        // Table Header
        doc.fillColor(lightGray)
           .rect(tableX, y, 500, 22)
           .fill();
        doc.fillColor(dark)
           .font('Helvetica-Bold')
           .fontSize(9);
        doc.text('Product', col1, y + 5);
        doc.text('Qty', col2, y + 5);
        doc.text('Price', col3, y + 5);
        doc.text('Total', col4, y + 5);
        y += 22;

        // Table Rows
        let subtotal = 0;
        order.items?.forEach((item, idx) => {
            const total = item.price * item.quantity;
            subtotal += total;

            if (idx % 2 === 0) {
                doc.fillColor('#fafafa').rect(tableX, y, 500, 20).fill();
            }
            doc.fillColor(dark)
               .font('Helvetica')
               .fontSize(9);
            const name = item.name.length > 28 ? item.name.substring(0, 25) + '...' : item.name;
            doc.text(name || 'Product', col1, y + 4);
            doc.text(item.quantity || 1, col2, y + 4);
            doc.text(`₹${item.price.toFixed(0)}`, col3, y + 4);
            doc.text(`₹${total.toFixed(0)}`, col4, y + 4);
            y += 20;
        });

        // Table Bottom Line
        doc.moveTo(50, y).lineTo(550, y).strokeColor(border).lineWidth(1).stroke();
        y += 15;

        // ===== TOTALS =====
        const deliveryCharge = order.deliveryCharge || 0;
        const discount = order.discount || 0;
        const grandTotal = subtotal + deliveryCharge - discount;

        const totalX = 500;
        const labelX = 400;

        doc.font('Helvetica')
           .fontSize(10);
        
        // Subtotal
        doc.fillColor(gray).text('Subtotal:', labelX, y, { align: 'right' });
        doc.fillColor(dark).text(`₹${subtotal.toFixed(0)}`, totalX, y, { align: 'right' });
        y += 22;

        // Delivery
        doc.fillColor(gray).text('Delivery:', labelX, y, { align: 'right' });
        doc.fillColor(deliveryCharge === 0 ? '#22c55e' : dark)
           .text(deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(0)}`, totalX, y, { align: 'right' });
        y += 22;

        // Discount
        if (order.coupon) {
            doc.fillColor(gray).text(`Discount (${order.coupon}):`, labelX, y, { align: 'right' });
            doc.fillColor('#22c55e').text(`-₹${discount.toFixed(0)}`, totalX, y, { align: 'right' });
            y += 22;
        }

        // Grand Total - with more spacing
        y += 8;
        doc.moveTo(300, y).lineTo(550, y).strokeColor(gold).lineWidth(1.5).stroke();
        y += 10;

        doc.font('Helvetica-Bold')
           .fontSize(16)
           .fillColor(gold)
           .text('Grand Total:', labelX + 400, y, { align: 'right' })
           .text(`₹${grandTotal.toFixed(0)}`, totalX + 400, y, { align: 'right' });
        y += 30;

        // ===== COUPON BADGE =====
        if (order.coupon) {
            doc.fillColor('#22c55e')
               .font('Helvetica')
               .fontSize(9)
               .text(`🎉 Coupon Applied: ${order.coupon} (${order.discount || 0}% off)`, 50, y);
            y += 20;
        }

        // ===== CANCELLATION REASON =====
        if (order.cancellation_reason) {
            doc.fillColor('#ef4444')
               .font('Helvetica-Bold')
               .fontSize(9)
               .text('⚠️ Cancellation Reason:', 50, y);
            doc.fillColor(gray)
               .font('Helvetica')
               .fontSize(9)
               .text(order.cancellation_reason, 50, y + 14);
            y += 40;
        }

        // ===== STATUS BADGE =====
        const statusColors = { 
            pending: '#facc15', 
            paid: '#22c55e', 
            shipped: '#3b82f6', 
            delivered: '#8b5cf6', 
            cancelled: '#ef4444' 
        };
        const statusColor = statusColors[order.status] || gray;
        doc.fillColor(statusColor)
           .roundedRect(50, y, 130, 22, 4)
           .fill();
        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(`STATUS: ${(order.status || 'Pending').toUpperCase()}`, 58, y + 5);
        y += 35;

        // ===== FOOTER =====
        const footerY = 770;
        doc.moveTo(50, footerY).lineTo(550, footerY).strokeColor(gold).lineWidth(1).stroke();

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(gray)
           .text('💪 Thank you for choosing PRADH Desi Fuel!', 50, footerY + 12, { align: 'center' })
           .text('📞 +91 8979993655  |  📧 support@pradh.com', 50, footerY + 26, { align: 'center' })
           .text(`Generated: ${new Date().toLocaleString()}`, 50, footerY + 40, { align: 'center' });

        doc.end();
        console.log('✅ Invoice generated:', orderId);

    } catch (error) {
        console.error('❌ Error generating invoice:', error);
        res.status(500).json({ success: false, error: 'Failed to generate invoice' });
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
