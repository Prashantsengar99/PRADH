require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Log all requests
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

// ============================================
// CHECK ENVIRONMENT
// ============================================
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ ERROR: Razorpay keys not found in .env file');
    console.log('Please create .env file with:');
    console.log('RAZORPAY_KEY_ID=your_key_id');
    console.log('RAZORPAY_KEY_SECRET=your_key_secret');
    process.exit(1);
}

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('✅ Razorpay initialized');
console.log(`📌 Key ID: ${process.env.RAZORPAY_KEY_ID.substring(0, 10)}...`);

// ============================================
// COUPON FUNCTIONS
// ============================================
function getCoupons() {
    try {
        if (fs.existsSync('coupons.json')) {
            const data = fs.readFileSync('coupons.json', 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (e) {
        console.error('Error reading coupons:', e);
        return [];
    }
}

function saveCoupons(coupons) {
    try {
        fs.writeFileSync('coupons.json', JSON.stringify(coupons, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving coupons:', e);
        return false;
    }
}

// ============================================
// COUPON ROUTES
// ============================================

// GET all coupons
app.get('/api/coupons', (req, res) => {
    try {
        console.log('📋 GET /api/coupons');
        const coupons = getCoupons();
        res.json({ success: true, coupons: coupons });
    } catch (error) {
        console.error('Error in GET /api/coupons:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create coupon
app.post('/api/coupons', (req, res) => {
    try {
        console.log('📝 POST /api/coupons', req.body);
        
        const { code, discount, expiry } = req.body;
        
        if (!code || !discount) {
            return res.status(400).json({
                success: false,
                error: 'Code and discount are required'
            });
        }
        
        let coupons = getCoupons();
        
        // Check if coupon exists
        const existing = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Coupon code already exists'
            });
        }
        
        const newCoupon = {
            id: Date.now(),
            code: code.toUpperCase(),
            discount: parseInt(discount),
            expiry: expiry || null,
            createdAt: new Date().toISOString()
        };
        
        coupons.push(newCoupon);
        saveCoupons(coupons);
        
        console.log('✅ Coupon created:', newCoupon.code);
        res.json({
            success: true,
            message: 'Coupon created successfully',
            coupon: newCoupon
        });
    } catch (error) {
        console.error('Error in POST /api/coupons:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE coupon
app.delete('/api/coupons/:code', (req, res) => {
    try {
        const { code } = req.params;
        console.log('🗑️ DELETE /api/coupons/', code);
        
        let coupons = getCoupons();
        const filtered = coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
        
        if (filtered.length === coupons.length) {
            return res.status(404).json({
                success: false,
                error: 'Coupon not found'
            });
        }
        
        saveCoupons(filtered);
        console.log('✅ Coupon deleted:', code);
        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        console.error('Error in DELETE /api/coupons:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST validate coupon
app.post('/api/coupons/validate', (req, res) => {
    try {
        const { code, amount } = req.body;
        console.log('🔍 POST /api/coupons/validate', { code, amount });
        
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Coupon code is required'
            });
        }
        
        const coupons = getCoupons();
        const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
        
        if (!coupon) {
            return res.json({
                valid: false,
                message: 'Invalid coupon code'
            });
        }
        
        // Check expiry
        if (coupon.expiry) {
            const expiryDate = new Date(coupon.expiry);
            const today = new Date();
            if (expiryDate < today) {
                return res.json({
                    valid: false,
                    message: 'Coupon has expired'
                });
            }
        }
        
        const discountAmount = amount ? (amount * (coupon.discount / 100)) : 0;
        
        res.json({
            valid: true,
            coupon: coupon,
            discount: coupon.discount,
            discountAmount: discountAmount,
            message: `Coupon applied! ${coupon.discount}% off`
        });
    } catch (error) {
        console.error('Error in POST /api/coupons/validate:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ORDER ROUTES
// ============================================

// Create order
app.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount'
            });
        }

        const options = {
            amount: Math.round(amount * 100),
            currency: currency,
            receipt: receipt || 'order_' + Date.now(),
            payment_capture: 1
        };

        console.log('Creating order:', options);
        
        const order = await razorpay.orders.create(options);
        
        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create order'
        });
    }
});

// Verify payment
app.post('/verify-payment', (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderDetails
        } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Save order
        let orders = [];
        try {
            if (fs.existsSync('orders.json')) {
                const data = fs.readFileSync('orders.json', 'utf8');
                orders = JSON.parse(data);
            }
        } catch (e) {
            orders = [];
        }

        const orderId = 'PRADH' + Date.now().toString().slice(-8);
        const newOrder = {
            id: orderId,
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            status: 'paid',
            date: new Date().toISOString(),
            items: orderDetails?.items || [],
            total: orderDetails?.total || 0,
            deliveryCharge: orderDetails?.deliveryCharge || 0,
            coupon: orderDetails?.coupon || null,
            discount: orderDetails?.discount || 0,
            customer: orderDetails?.customer || {}
        };

        orders.push(newOrder);
        fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));

        console.log('✅ Order saved:', orderId);

        res.json({
            success: true,
            message: 'Payment verified successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get orders
app.get('/get-orders', (req, res) => {
    try {
        let orders = [];
        if (fs.existsSync('orders.json')) {
            const data = fs.readFileSync('orders.json', 'utf8');
            orders = JSON.parse(data);
        }
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// PRODUCT ROUTES
// ============================================
app.get('/api/products', (req, res) => {
    try {
        if (fs.existsSync('data.json')) {
            const data = fs.readFileSync('data.json', 'utf8');
            const products = JSON.parse(data);
            res.json(products);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SERVE HTML FILES
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// 404 HANDLER
// ============================================
app.use('/api/*', (req, res) => {
    console.log('❌ API not found:', req.url);
    res.status(404).json({
        success: false,
        error: 'API endpoint not found'
    });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Test payment at http://localhost:${PORT}/payment.html`);
    console.log(`📦 View orders at http://localhost:${PORT}/order.html`);
    console.log(`🎟️ Coupon API at http://localhost:${PORT}/api/coupons`);
    console.log(`📋 Admin panel at http://localhost:${PORT}/admin.html`);
    console.log(`✅ Server is ready!`);
});
