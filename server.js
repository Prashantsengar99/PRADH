require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

// ============================================
// DATABASE HELPERS
// ============================================
function readDB(filename) {
    try {
        if (fs.existsSync(filename)) {
            const data = fs.readFileSync(filename, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (e) {
        console.error(`Error reading ${filename}:`, e);
        return [];
    }
}

function writeDB(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error(`Error writing ${filename}:`, e);
        return false;
    }
}

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
// PRODUCT ROUTES
// ============================================
app.get('/api/products', (req, res) => {
    const products = readDB('products.json');
    res.json(products);
});

app.get('/api/admin/products', (req, res) => {
    const products = readDB('products.json');
    res.json({ success: true, products });
});

app.post('/api/admin/products', (req, res) => {
    try {
        const { name, price, description, category, image, stock } = req.body;
        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Name and price are required' });
        }
        const products = readDB('products.json');
        const newProduct = {
            id: 'PROD' + Date.now().toString().slice(-6),
            name,
            price: parseFloat(price),
            description: description || '',
            category: category || 'General',
            image: image || 'product.jpeg',
            stock: parseInt(stock) || 0,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        products.push(newProduct);
        writeDB('products.json', products);
        console.log('✅ Product added:', newProduct.name);
        res.json({ success: true, message: 'Product added successfully!', product: newProduct });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/admin/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        let products = readDB('products.json');
        const filtered = products.filter(p => p.id !== id);
        if (filtered.length === products.length) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        writeDB('products.json', filtered);
        console.log('✅ Product deleted:', id);
        res.json({ success: true, message: 'Product deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ORDER ROUTES
// ============================================
app.get('/get-orders', (req, res) => {
    const orders = readDB('orders.json');
    res.json({ success: true, orders });
});

app.put('/api/orders/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancellation_reason, cancelled_at } = req.body;
        let orders = readDB('orders.json');
        const index = orders.findIndex(o => o.id === id || o.order_id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        if (status) orders[index].status = status;
        if (cancellation_reason) orders[index].cancellation_reason = cancellation_reason;
        if (cancelled_at) orders[index].cancelled_at = cancelled_at;
        writeDB('orders.json', orders);
        console.log(`✅ Order ${id} status updated to: ${status}`);
        res.json({ success: true, message: 'Order updated!', order: orders[index] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// USER ROUTES
// ============================================
app.get('/api/users', (req, res) => {
    const users = readDB('users.json');
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
});

app.get('/api/user/:username', (req, res) => {
    const users = readDB('users.json');
    const user = users.find(u => u.username === req.params.username);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...safeUser } = user;
    res.json(safeUser);
});

app.post('/api/signup', (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).send('All fields required');
        }
        let users = readDB('users.json');
        if (users.find(u => u.username === username || u.email === email)) {
            return res.status(400).send('Username or email already exists');
        }
        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            phone: '',
            createdAt: new Date().toISOString(),
            rewards: 0,
            level: 'Bronze'
        };
        users.push(newUser);
        writeDB('users.json', users);
        console.log(`✅ New user signed up: ${username}`);
        res.status(201).send('Signup successful! Please login.');
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const users = readDB('users.json');
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            return res.status(401).send('Invalid username or password');
        }
        console.log(`✅ User logged in: ${username}`);
        res.status(200).send('Login successful');
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// ============================================
// COUPON ROUTES
// ============================================
app.get('/api/coupons', (req, res) => {
    const coupons = readDB('coupons.json');
    res.json({ success: true, coupons });
});

app.post('/api/coupons', (req, res) => {
    try {
        const { code, discount, expiry } = req.body;
        if (!code || !discount) {
            return res.status(400).json({ success: false, error: 'Code and discount required' });
        }
        let coupons = readDB('coupons.json');
        if (coupons.find(c => c.code === code.toUpperCase())) {
            return res.status(400).json({ success: false, error: 'Coupon already exists' });
        }
        const newCoupon = {
            id: Date.now(),
            code: code.toUpperCase(),
            discount: parseInt(discount),
            expiry: expiry || null,
            createdAt: new Date().toISOString()
        };
        coupons.push(newCoupon);
        writeDB('coupons.json', coupons);
        console.log('✅ Coupon created:', newCoupon.code);
        res.json({ success: true, message: 'Coupon created!', coupon: newCoupon });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/coupons/validate', (req, res) => {
    try {
        const { code, amount } = req.body;
        const coupons = readDB('coupons.json');
        const coupon = coupons.find(c => c.code === code.toUpperCase());
        if (!coupon) {
            return res.json({ valid: false, message: 'Invalid coupon' });
        }
        if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
            return res.json({ valid: false, message: 'Coupon expired' });
        }
        const discountAmount = amount ? (amount * (coupon.discount / 100)) : 0;
        res.json({
            valid: true,
            coupon,
            discount: coupon.discount,
            discountAmount,
            message: `${coupon.discount}% off applied!`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/coupons/:code', (req, res) => {
    try {
        const { code } = req.params;
        let coupons = readDB('coupons.json');
        const filtered = coupons.filter(c => c.code !== code.toUpperCase());
        if (filtered.length === coupons.length) {
            return res.status(404).json({ success: false, error: 'Coupon not found' });
        }
        writeDB('coupons.json', filtered);
        console.log('✅ Coupon deleted:', code);
        res.json({ success: true, message: 'Coupon deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// REVIEW ROUTES
// ============================================
app.get('/api/reviews', (req, res) => {
    const reviews = readDB('reviews.json');
    res.json({ success: true, reviews });
});

app.post('/api/reviews', (req, res) => {
    try {
        const { productId, productName, rating, comment, userName } = req.body;
        if (!productId || !rating || !comment) {
            return res.status(400).json({ success: false, error: 'Product ID, rating and comment required' });
        }
        let reviews = readDB('reviews.json');
        const newReview = {
            id: 'REV' + Date.now().toString().slice(-8),
            productId,
            productName: productName || 'Product',
            rating: parseInt(rating),
            comment,
            userName: userName || 'Anonymous',
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        reviews.push(newReview);
        writeDB('reviews.json', reviews);
        console.log('✅ New review submitted');
        res.json({ success: true, message: 'Review submitted! Waiting for approval.', review: newReview });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/reviews/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment, rating } = req.body;
        let reviews = readDB('reviews.json');
        const index = reviews.findIndex(r => r.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        if (status) reviews[index].status = status;
        if (comment) reviews[index].comment = comment;
        if (rating) reviews[index].rating = parseInt(rating);
        reviews[index].updatedAt = new Date().toISOString();
        writeDB('reviews.json', reviews);
        res.json({ success: true, message: 'Review updated!', review: reviews[index] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/reviews/:id', (req, res) => {
    try {
        const { id } = req.params;
        let reviews = readDB('reviews.json');
        const filtered = reviews.filter(r => r.id !== id);
        if (filtered.length === reviews.length) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        writeDB('reviews.json', filtered);
        console.log('✅ Review deleted:', id);
        res.json({ success: true, message: 'Review deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/reviews/stats/:productId', (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = readDB('reviews.json');
        const productReviews = reviews.filter(r => r.productId === productId && r.status === 'approved');
        const stats = {
            total: productReviews.length,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        if (productReviews.length > 0) {
            const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
            stats.averageRating = (totalRating / productReviews.length).toFixed(1);
            productReviews.forEach(r => {
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
// INVOICE PDF GENERATION - CLEAN VERSION
// ============================================

app.get('/api/invoice/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const orders = readDB('orders.json');
        const order = orders.find(o => o.id === orderId || o.order_id === orderId);
        
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

        // === Colors ===
        const gold = '#facc15';
        const dark = '#0f172a';
        const gray = '#64748b';
        const lightGray = '#f8fafc';
        const border = '#e2e8f0';
        const success = '#22c55e';
        const danger = '#ef4444';

        let y = 40;

        // === HEADER ===
        doc.fontSize(26)
           .font('Helvetica-Bold')
           .fillColor(gold)
           .text('PRADH DESI FUEL', 50, y, { align: 'center' });
        y += 30;

        doc.fontSize(12)
           .font('Helvetica')
           .fillColor(gray)
           .text('Pure Desi Protein Fuel', 50, y, { align: 'center' });
        y += 25;

        doc.fontSize(22)
           .font('Helvetica-Bold')
           .fillColor(dark)
           .text('INVOICE', 50, y, { align: 'center' });
        y += 15;

        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(gray)
           .text(`Invoice #: ${order.id}`, 50, y, { align: 'center' });
        y += 25;

        // === DIVIDER ===
        doc.moveTo(50, y).lineTo(550, y).strokeColor(gold).lineWidth(2).stroke();
        y += 20;

        // === ORDER INFO ===
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(dark)
           .text('ORDER DETAILS', 50, y);
        y += 15;

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor(gray);
        const infoLines = [
            `Order Date: ${new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
            `Payment ID: ${order.payment_id || 'N/A'}`,
            `Payment Method: ${order.customer?.paymentMethod || 'N/A'}`,
            `Status: ${(order.status || 'Pending').toUpperCase()}`
        ];
        infoLines.forEach(line => {
            doc.text(line, 50, y);
            y += 16;
        });

        // === CUSTOMER INFO ===
        y += 5;
        doc.font('Helvetica-Bold')
           .fontSize(11)
           .fillColor(dark)
           .text('BILL TO', 350, y - 25);
        y -= 10;

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor(gray);
        const cust = order.customer || {};
        const custLines = [
            cust.name || 'Guest',
            cust.address || 'N/A',
            `${cust.city || ''} ${cust.pincode || ''}`,
            `Phone: ${cust.phone || 'N/A'}`,
            `Email: ${cust.email || 'N/A'}`
        ];
        custLines.forEach(line => {
            if (line.trim()) {
                doc.text(line, 350, y);
                y += 16;
            }
        });

        y += 10;

        // === DIVIDER ===
        doc.moveTo(50, y).lineTo(550, y).strokeColor(border).lineWidth(1).stroke();
        y += 15;

        // === ITEMS TABLE ===
        const tableX = 50;
        const col1 = 60;
        const col2 = 280;
        const col3 = 380;
        const col4 = 460;

        // Table Header
        doc.fillColor(lightGray)
           .rect(tableX, y, 500, 20)
           .fill();
        doc.fillColor(dark)
           .font('Helvetica-Bold')
           .fontSize(9);
        doc.text('Product', col1, y + 5);
        doc.text('Qty', col2, y + 5);
        doc.text('Price', col3, y + 5);
        doc.text('Total', col4, y + 5);
        y += 20;

        // Table Rows
        let subtotal = 0;
        order.items?.forEach((item, idx) => {
            const total = item.price * item.quantity;
            subtotal += total;

            if (idx % 2 === 0) {
                doc.fillColor('#fafafa').rect(tableX, y, 500, 18).fill();
            }
            doc.fillColor(dark)
               .font('Helvetica')
               .fontSize(9);
            const name = item.name.length > 25 ? item.name.substring(0, 23) + '...' : item.name;
            doc.text(name || 'Product', col1, y + 3);
            doc.text(item.quantity || 1, col2, y + 3);
            doc.text(`₹${item.price.toFixed(0)}`, col3, y + 3);
            doc.text(`₹${total.toFixed(0)}`, col4, y + 3);
            y += 18;
        });

        // Table Bottom Line
        doc.moveTo(50, y).lineTo(550, y).strokeColor(border).lineWidth(1).stroke();
        y += 20;

        // === TOTALS ===
        const deliveryCharge = order.deliveryCharge || 0;
        const discount = order.discount || 0;
        const grandTotal = subtotal + deliveryCharge - discount;

        const totalX = 450;
        const labelX = 350;

        doc.font('Helvetica')
           .fontSize(10);
        
        // Subtotal
        doc.fillColor(gray).text('Subtotal:', labelX, y, { align: 'right' });
        doc.fillColor(dark).text(`₹${subtotal.toFixed(0)}`, totalX, y, { align: 'right' });
        y += 20;

        // Delivery
        doc.fillColor(gray).text('Delivery:', labelX, y, { align: 'right' });
        doc.fillColor(deliveryCharge === 0 ? success : dark)
           .text(deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(0)}`, totalX, y, { align: 'right' });
        y += 20;

        // Discount
        if (order.coupon) {
            doc.fillColor(gray).text(`Discount (${order.coupon}):`, labelX, y, { align: 'right' });
            doc.fillColor(success).text(`-₹${discount.toFixed(0)}`, totalX, y, { align: 'right' });
            y += 20;
        }

        // Grand Total
        doc.moveTo(300, y).lineTo(550, y).strokeColor(gold).lineWidth(1.5).stroke();
        y += 15;

        doc.font('Helvetica-Bold')
           .fontSize(16)
           .fillColor(gold)
           .text('Grand Total:', labelX - 20, y, { align: 'right' })
           .text(`₹${grandTotal.toFixed(0)}`, totalX - 10, y, { align: 'right' });
        y += 40;

        // === COUPON BADGE ===
        if (order.coupon) {
            doc.fillColor(success)
               .font('Helvetica')
               .fontSize(9)
               .text(`🎉 Coupon Applied: ${order.coupon} (${order.discount || 0}% off)`, 50, y);
            y += 20;
        }

        // === CANCELLATION REASON ===
        if (order.cancellation_reason) {
            doc.fillColor(danger)
               .font('Helvetica-Bold')
               .fontSize(9)
               .text('⚠️ Cancellation Reason:', 50, y);
            doc.fillColor(gray)
               .font('Helvetica')
               .fontSize(9)
               .text(order.cancellation_reason, 50, y + 14);
            y += 35;
        }

        // === STATUS BADGE ===
        const statusColors = { pending: '#facc15', paid: '#22c55e', shipped: '#3b82f6', delivered: '#8b5cf6', cancelled: '#ef4444' };
        const statusColor = statusColors[order.status] || gray;
        doc.fillColor(statusColor)
           .roundedRect(50, y, 130, 22, 4)
           .fill();
        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(`STATUS: ${(order.status || 'Pending').toUpperCase()}`, 58, y + 5);
        y += 35;

        // === FOOTER ===
        const footerY = 760;
        doc.moveTo(50, footerY).lineTo(550, footerY).strokeColor(gold).lineWidth(1).stroke();

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(gray)
           .text('💪 Thank you for choosing PRADH Desi Fuel!', 50, footerY + 12, { align: 'center' })
           .text('📞 +91 8979993655  |  📧 support@pradh.com', 50, footerY + 26, { align: 'center' })
           .text(`Generated: ${new Date().toLocaleString()}`, 50, footerY + 40, { align: 'center' });

        doc.end();
        console.log(`✅ Invoice generated: ${orderId}`);

    } catch (error) {
        console.error('Error generating invoice:', error);
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

app.post('/verify-payment', (req, res) => {
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

        let orders = readDB('orders.json');
        const orderId = 'ORD' + Date.now().toString().slice(-8);
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
        writeDB('orders.json', orders);
        console.log('✅ Order saved:', orderId);
        res.json({ success: true, message: 'Payment verified!', order: newOrder });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// SERVE HTML FILES
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Products: ${readDB('products.json').length}`);
    console.log(`📋 Orders: ${readDB('orders.json').length}`);
    console.log(`👤 Users: ${readDB('users.json').length}`);
    console.log(`🎟️ Coupons: ${readDB('coupons.json').length}`);
    console.log(`⭐ Reviews: ${readDB('reviews.json').length}`);
    console.log(`\n✅ Server is ready!\n`);
});

// ============================================
// ORDER TRACKING API
// ============================================

// Get tracking status for an order
app.get('/api/track/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        const orders = readDB('orders.json');
        const order = orders.find(o => o.id === orderId || o.order_id === orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        // Generate tracking timeline based on order status
        const trackingSteps = [
            {
                status: 'Order Placed',
                icon: '📦',
                completed: true,
                date: order.date || new Date().toISOString(),
                description: 'Your order has been placed successfully'
            },
            {
                status: 'Payment Confirmed',
                icon: '✅',
                completed: order.status !== 'pending',
                date: order.status !== 'pending' ? order.date : null,
                description: 'Payment has been confirmed'
            },
            {
                status: 'Processing',
                icon: '⚙️',
                completed: order.status === 'shipped' || order.status === 'delivered',
                date: order.status === 'shipped' || order.status === 'delivered' ? order.date : null,
                description: 'Your order is being processed'
            },
            {
                status: 'Shipped',
                icon: '🚚',
                completed: order.status === 'shipped' || order.status === 'delivered',
                date: order.status === 'shipped' || order.status === 'delivered' ? order.date : null,
                description: 'Your order has been shipped'
            },
            {
                status: 'Delivered',
                icon: '🏠',
                completed: order.status === 'delivered',
                date: order.status === 'delivered' ? order.date : null,
                description: 'Your order has been delivered successfully'
            }
        ];
        
        // For cancelled orders
        if (order.status === 'cancelled') {
            trackingSteps.push({
                status: 'Cancelled',
                icon: '❌',
                completed: true,
                date: order.cancelled_at || new Date().toISOString(),
                description: order.cancellation_reason || 'Order was cancelled'
            });
        }
        
        res.json({
            success: true,
            order: order,
            tracking: trackingSteps,
            currentStatus: order.status
        });
        
    } catch (error) {
        console.error('Error tracking order:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// INVOICE PDF GENERATION
// ============================================
const path = require('path');

// Generate Invoice PDF
app.get('/api/invoice/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Find the order
        const orders = readDB('orders.json');
        const order = orders.find(o => o.id === orderId || o.order_id === orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `Invoice #${order.id}`,
                Author: 'PRADH Desi Fuel',
                Subject: 'Order Invoice'
            }
        });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);
        
        // Pipe PDF to response
        doc.pipe(res);
        
        // ============================================
        // PDF CONTENT
        // ============================================
        
        // Header with Logo and Company Name
        doc.fontSize(24)
           .fillColor('#facc15')
           .text('PRADH DESI FUEL', { align: 'center' });
        
        doc.fontSize(12)
           .fillColor('#64748b')
           .text('💪 Pure Desi Protein Fuel', { align: 'center' });
        
        doc.moveDown();
        
        // Invoice Title
        doc.fontSize(20)
           .fillColor('#0f172a')
           .text('INVOICE', { align: 'center' });
        
        doc.moveDown();
        
        // Invoice Details
        doc.fontSize(12)
           .fillColor('#333333');
        
        // Invoice Info
        doc.text(`Invoice Number: #${order.id}`, 50, 150);
        doc.text(`Order Date: ${new Date(order.date).toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, 50, 170);
        doc.text(`Payment ID: ${order.payment_id || 'N/A'}`, 50, 190);
        doc.text(`Payment Method: ${order.customer?.paymentMethod || 'N/A'}`, 50, 210);
        
        // Customer Details - Right Side
        doc.text('Bill To:', 350, 150);
        doc.text(order.customer?.name || 'Guest', 350, 170);
        doc.text(order.customer?.address || 'N/A', 350, 190);
        doc.text(`${order.customer?.city || ''} ${order.customer?.pincode || ''}`, 350, 210);
        doc.text(`Phone: ${order.customer?.phone || 'N/A'}`, 350, 230);
        doc.text(`Email: ${order.customer?.email || 'N/A'}`, 350, 250);
        
        doc.moveDown(2);
        
        // Table Header
        const tableTop = 300;
        const col1 = 50;
        const col2 = 250;
        const col3 = 400;
        const col4 = 480;
        
        doc.fontSize(11)
           .fillColor('#ffffff')
           .rect(col1, tableTop, 500, 30)
           .fill('#facc15');
        
        doc.fillColor('#0f172a')
           .text('Product', col1 + 10, tableTop + 8)
           .text('Qty', col2 + 10, tableTop + 8)
           .text('Price', col3 + 10, tableTop + 8)
           .text('Total', col4 + 10, tableTop + 8);
        
        // Table Rows
        let y = tableTop + 40;
        let subtotal = 0;
        
        order.items?.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            // Alternating row colors
            if (index % 2 === 0) {
                doc.fillColor('#f8f9fa')
                   .rect(col1, y - 5, 500, 25)
                   .fill();
            }
            
            doc.fillColor('#333333')
               .fontSize(10)
               .text(item.name || 'Product', col1 + 10, y)
               .text(item.quantity || 1, col2 + 10, y)
               .text(`₹${item.price.toFixed(2)}`, col3 + 10, y)
               .text(`₹${itemTotal.toFixed(2)}`, col4 + 10, y);
            
            y += 25;
        });
        
        // Total Section
        y += 20;
        
        // Draw a line
        doc.strokeColor('#cccccc')
           .lineWidth(1)
           .moveTo(col1, y)
           .lineTo(col1 + 500, y)
           .stroke();
        
        y += 15;
        
        // Calculate totals
        const deliveryCharge = order.deliveryCharge || 0;
        const discount = order.discount || 0;
        const grandTotal = subtotal + deliveryCharge - discount;
        
        // Subtotal
        doc.fontSize(11)
           .fillColor('#333333')
           .text('Subtotal:', 350, y, { align: 'right' })
           .text(`₹${subtotal.toFixed(2)}`, 480, y, { align: 'right' });
        
        y += 25;
        
        // Delivery Charge
        doc.text('Delivery:', 350, y, { align: 'right' })
           .text(deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`, 480, y, { align: 'right' });
        
        y += 25;
        
        // Discount (if any)
        if (order.coupon) {
            doc.fillColor('#22c55e')
               .text(`Discount (${order.coupon}):`, 350, y, { align: 'right' })
               .text(`-₹${discount.toFixed(2)}`, 480, y, { align: 'right' });
            y += 25;
        }
        
        // Grand Total
        doc.fillColor('#facc15')
           .fontSize(16)
           .text('Grand Total:', 330, y, { align: 'right' })
           .text(`₹${grandTotal.toFixed(2)}`, 460, y, { align: 'right' });
        
        y += 40;
        
        // Order Status
        doc.fontSize(11)
           .fillColor('#333333')
           .text('Order Status:', 50, y);
        
        const statusColors = {
            'pending': '#facc15',
            'paid': '#22c55e',
            'shipped': '#3b82f6',
            'delivered': '#8b5cf6',
            'cancelled': '#ef4444'
        };
        
        doc.fillColor(statusColors[order.status] || '#64748b')
           .text((order.status || 'Pending').toUpperCase(), 160, y);
        
        y += 30;
        
        // Coupon Applied
        if (order.coupon) {
            doc.fillColor('#22c55e')
               .text(`🎉 Coupon Applied: ${order.coupon}`, 50, y);
            y += 20;
        }
        
        // Footer
        const footerY = 700;
        doc.fontSize(10)
           .fillColor('#94a3b8')
           .text('Thank you for choosing PRADH Desi Fuel!', 50, footerY, { align: 'center' })
           .text('📞 For any queries, contact us at: +91 8979993655', 50, footerY + 20, { align: 'center' })
           .text('📧 Email: support@pradh.com', 50, footerY + 40, { align: 'center' })
           .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 60, { align: 'center' });
        
        // Footer line
        doc.strokeColor('#facc15')
           .lineWidth(2)
           .moveTo(50, footerY - 10)
           .lineTo(550, footerY - 10)
           .stroke();
        
        // Finalize PDF
        doc.end();
        
        console.log(`✅ Invoice generated for order: ${orderId}`);
        
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate invoice'
        });
    }
});

// Download invoice from admin panel
app.get('/api/admin/invoice/:orderId', (req, res) => {
    // Redirect to the public invoice endpoint
    res.redirect(`/api/invoice/${req.params.orderId}`);
});
