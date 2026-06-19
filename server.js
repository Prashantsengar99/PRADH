const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ADMIN LOGIN ROUTE ---
app.post('/admin-login', (req, res) => {
    console.log("Login request mili:", req.body);
    const { username, password } = req.body;

    if (username === "pradh" && password === "1234") {
        console.log("Admin login success!");
        res.status(200).send("OK");
    } else {
        console.log("Login fail: Galat credentials");
        res.status(401).send("Galat Username ya Password!");
    }
});

// --- ORDER SAVING ROUTE ---
app.post('/api/orders', (req, res) => {
    console.log("Naya order aaya:", req.body);
    const newOrder = {
        id: Date.now(),
        ...req.body,
        date: new Date().toLocaleString()
    };

    let orders = [];
    if (fs.existsSync(ORDERS_FILE)) {
        try {
            const data = fs.readFileSync(ORDERS_FILE, 'utf8');
            orders = JSON.parse(data || '[]');
        } catch (e) {
            orders = [];
        }
    }
    
    orders.push(newOrder);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    res.status(201).json({ message: "Order saved!", order: newOrder });
});

// --- SERVE STATIC FILES ---
app.use(express.static(__dirname));

// Server Start
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
});