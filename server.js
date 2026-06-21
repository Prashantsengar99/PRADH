const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const cors = require('cors');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROUTES ---

// 1. Admin Login
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === "pradh" && password === "1234") {
        res.status(200).send("OK");
    } else {
        res.status(401).send("Galat Username ya Password!");
    }
});

// 2. Signup
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    const filePath = path.join(__dirname, 'users.json');
    let users = [];
    if (fs.existsSync(filePath)) {
        users = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
    }
    if (users.find(u => u.username === username)) {
        return res.status(400).send("User pehle se exist karta hai!");
    }
    users.push({ username, password });
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    res.status(201).send("Signup Successful!");
});

// 3. User Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const filePath = path.join(__dirname, 'users.json');
    if (!fs.existsSync(filePath)) return res.status(401).send("User nahi mila!");
    
    const users = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.status(200).json({ message: "Login Successful" });
    } else {
        res.status(401).send("Galat Username ya Password!");
    }
});

// 4. Get Orders
app.get('/api/orders', (req, res) => {
    const filePath = path.join(__dirname, 'orders.json');
    if (!fs.existsSync(filePath)) return res.json([]);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json([]);
        res.json(JSON.parse(data || '[]'));
    });
});

// 5. Post Orders
app.post('/api/orders', (req, res) => {
    const newOrder = { id: Date.now(), ...req.body, date: new Date().toLocaleString() };
    const filePath = path.join(__dirname, 'orders.json');
    let orders = [];
    if (fs.existsSync(filePath)) {
        try { orders = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]'); } catch (e) { orders = []; }
    }
    orders.push(newOrder);
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
    res.status(201).json({ message: "Order saved!", order: newOrder });
});

// --- RENDER CONFIGURATION ---

app.use(express.static(path.join(__dirname)));

// Express 5 compatible catch-all route
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Server binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});