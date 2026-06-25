require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Check if keys are set
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

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create order endpoint
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
            amount: Math.round(amount * 100), // Convert to paise
            currency: currency,
            receipt: receipt || 'order_' + Date.now(),
            payment_capture: 1
        };

        console.log('Creating order with options:', options);
        
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

// Verify payment endpoint
app.post('/verify-payment', (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            orderDetails 
        } = req.body;

        // Verify signature
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
            console.log('Creating new orders file');
            orders = [];
        }

        const newOrder = {
            id: Date.now(),
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            status: 'paid',
            date: new Date().toISOString(),
            items: orderDetails?.items || [],
            total: orderDetails?.total || 0,
            customer: orderDetails?.customer || {}
        };

        orders.push(newOrder);
        fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));

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

// Get orders endpoint
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

// Get products endpoint
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

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Test payment at http://localhost:${PORT}/payment.html`);
    console.log(`📦 View orders at http://localhost:${PORT}/order.html`);
});

// Add this endpoint for compatibility with your HTML form
app.post('/api/orders', (req, res) => {
    try {
        const orderData = req.body;
        
        // Read existing orders
        let orders = [];
        try {
            if (fs.existsSync('orders.json')) {
                const data = fs.readFileSync('orders.json', 'utf8');
                orders = JSON.parse(data);
            }
        } catch (e) {
            orders = [];
        }
        
        // Add new order
        const newOrder = {
            id: Date.now(),
            date: new Date().toISOString(),
            status: 'pending',
            ...orderData
        };
        
        orders.push(newOrder);
        fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Order saved successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
