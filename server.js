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

// ============================================
// USER FUNCTIONS
// ============================================
function getUsers() {
    try {
        if (fs.existsSync('users.json')) {
            const data = fs.readFileSync('users.json', 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (e) {
        console.error('Error reading users:', e);
        return [];
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving users:', e);
        return false;
    }
}

// ============================================
// USER AUTHENTICATION ROUTES
// ============================================

// SIGNUP endpoint
app.post('/api/signup', (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log('📝 Signup attempt:', { username, email });
        
        // Validation
        if (!username || !email || !password) {
            return res.status(400).send('All fields are required');
        }
        
        if (username.length < 3) {
            return res.status(400).send('Username must be at least 3 characters');
        }
        
        if (password.length < 4) {
            return res.status(400).send('Password must be at least 4 characters');
        }
        
        // Get existing users
        let users = getUsers();
        
        // Check if user already exists
        const existingUser = users.find(u => u.username === username || u.email === email);
        if (existingUser) {
            return res.status(400).send('Username or email already exists');
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            username: username,
            email: email,
            password: password,
            createdAt: new Date().toISOString(),
            orders: [],
            rewards: 0,
            level: 'Bronze',
            phone: ''
        };
        
        users.push(newUser);
        saveUsers(users);
        
        console.log(`✅ New user signed up: ${username}`);
        res.status(201).send('Signup successful! Please login.');
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).send('Server error during signup');
    }
});

// LOGIN endpoint
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('🔑 Login attempt:', { username });
        
        if (!username || !password) {
            return res.status(400).send('Username and password are required');
        }
        
        // Get users
        const users = getUsers();
        console.log('📋 Users found:', users.length);
        
        // Find user
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            console.log('❌ Invalid login attempt for:', username);
            return res.status(401).send('Invalid username or password');
        }
        
        console.log(`✅ User logged in: ${username}`);
        res.status(200).send('Login successful');
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Server error during login');
    }
});

// Get user profile
app.get('/api/user/:username', (req, res) => {
    try {
        const { username } = req.params;
        console.log('👤 Fetching user:', username);
        
        const users = getUsers();
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Don't send password
        const { password, ...userData } = user;
        res.json(userData);
        
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
app.put('/api/user/:username', (req, res) => {
    try {
        const { username } = req.params;
        const { email, password, phone, rewards, level } = req.body;
        
        let users = getUsers();
        const index = users.findIndex(u => u.username === username);
        
        if (index === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update user data
        if (email) users[index].email = email;
        if (password) users[index].password = password;
        if (phone) users[index].phone = phone;
        if (rewards !== undefined) users[index].rewards = rewards;
        if (level) users[index].level = level;
        
        saveUsers(users);
        
        console.log(`✅ User updated: ${username}`);
        res.json({ success: true, message: 'User updated successfully' });
        
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users (admin)
app.get('/api/users', (req, res) => {
    try {
        const users = getUsers();
        const safeUsers = users.map(({ password, ...user }) => user);
        res.json(safeUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// PRODUCT FUNCTIONS
// ============================================
function getProducts() {
    try {
        if (fs.existsSync('products.json')) {
            const data = fs.readFileSync('products.json', 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (e) {
        console.error('Error reading products:', e);
        return [];
    }
}

function saveProducts(products) {
    try {
        fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving products:', e);
        return false;
    }
}

// ============================================
// PRODUCT ROUTES
// ============================================

// GET all products (admin)
app.get('/api/admin/products', (req, res) => {
    try {
        console.log('📋 GET /api/admin/products');
        const products = getProducts();
        res.json({ success: true, products: products });
    } catch (error) {
        console.error('Error in GET /api/admin/products:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create product
app.post('/api/admin/products', (req, res) => {
    try {
        console.log('📝 POST /api/admin/products', req.body);
        
        const { name, price, description, category, image, stock } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({
                success: false,
                error: 'Name and price are required'
            });
        }
        
        const products = getProducts();
        
        const newProduct = {
            id: 'PROD' + Date.now().toString().slice(-8),
            name: name,
            price: parseFloat(price),
            description: description || '',
            category: category || 'General',
            image: image || 'product.jpeg',
            stock: parseInt(stock) || 0,
            sku: 'SKU-' + Date.now().toString().slice(-6),
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        products.push(newProduct);
        saveProducts(products);
        
        console.log('✅ Product added:', newProduct.name);
        res.json({
            success: true,
            message: 'Product added successfully',
            product: newProduct
        });
    } catch (error) {
        console.error('Error in POST /api/admin/products:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update product
app.put('/api/admin/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        console.log('✏️ PUT /api/admin/products/', id, req.body);
        
        const { name, price, description, category, image, stock } = req.body;
        
        let products = getProducts();
        const index = products.findIndex(p => p.id === id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        products[index] = {
            ...products[index],
            name: name || products[index].name,
            price: price ? parseFloat(price) : products[index].price,
            description: description || products[index].description,
            category: category || products[index].category,
            image: image || products[index].image,
            stock: stock !== undefined ? parseInt(stock) : products[index].stock,
            updatedAt: new Date().toISOString()
        };
        
        saveProducts(products);
        
        console.log('✅ Product updated:', products[index].name);
        res.json({
            success: true,
            message: 'Product updated successfully',
            product: products[index]
        });
    } catch (error) {
        console.error('Error in PUT /api/admin/products:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE product
app.delete('/api/admin/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ DELETE /api/admin/products/', id);
        
        let products = getProducts();
        const filtered = products.filter(p => p.id !== id);
        
        if (filtered.length === products.length) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        saveProducts(filtered);
        
        console.log('✅ Product deleted:', id);
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error in DELETE /api/admin/products:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET public products
app.get('/api/products', (req, res) => {
    try {
        const products = getProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: error.message });
    }
});

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

// Update order status
app.put('/api/orders/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updatedOrder = req.body;
        
        let orders = [];
        if (fs.existsSync('orders.json')) {
            const data = fs.readFileSync('orders.json', 'utf8');
            orders = JSON.parse(data);
        }
        
        const index = orders.findIndex(o => o.id === id || o.order_id === id);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        orders[index] = { ...orders[index], ...updatedOrder };
        fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
        
        console.log(`✅ Order ${id} status updated to:`, orders[index].status);
        res.json({
            success: true,
            message: 'Order updated successfully',
            order: orders[index]
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete order
app.delete('/api/orders/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        let orders = [];
        if (fs.existsSync('orders.json')) {
            const data = fs.readFileSync('orders.json', 'utf8');
            orders = JSON.parse(data);
        }
        
        const filtered = orders.filter(o => o.id !== id && o.order_id !== id);
        
        if (filtered.length === orders.length) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        fs.writeFileSync('orders.json', JSON.stringify(filtered, null, 2));
        
        console.log(`✅ Order ${id} deleted successfully`);
        res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Bulk update orders
app.post('/api/orders/update', (req, res) => {
    try {
        const orders = req.body;
        
        if (!Array.isArray(orders)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid data format'
            });
        }
        
        fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
        
        console.log(`✅ All orders updated (${orders.length} orders)`);
        res.json({
            success: true,
            message: 'All orders updated successfully'
        });
    } catch (error) {
        console.error('Error updating orders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// SERVE HTML FILES
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/userlogin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'userlogin.html'));
});

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/user-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'user-dashboard.html'));
});

// ============================================
// 404 HANDLER FOR API
// ============================================
app.use('/api/*', (req, res) => {
    console.log('❌ API not found:', req.url);
    res.status(404).json({
        success: false,
        error: `API endpoint not found: ${req.url}`
    });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Test payment at http://localhost:${PORT}/payment.html`);
    console.log(`📦 View orders at http://localhost:${PORT}/order.html`);
    console.log(`🎟️ Coupon API at http://localhost:${PORT}/api/coupons`);
    console.log(`📋 Admin panel at http://localhost:${PORT}/admin.html`);
    console.log(`📦 Product API at http://localhost:${PORT}/api/admin/products`);
    console.log(`👤 User login at http://localhost:${PORT}/userlogin.html`);
    console.log(`📝 User signup at http://localhost:${PORT}/signup.html`);
    console.log(`✅ Server is ready!\n`);
});
