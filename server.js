const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const cors = require('cors');


// Middleware - Sirf ek baar
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---

// Login Route
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === "pradh" && password === "1234") {
        res.status(200).send("OK");
    } else {
        res.status(401).send("Galat Username ya Password!");
    }
});

// GET Orders Route (Data fetch karne ke liye)
app.get('/api/orders', (req, res) => {
    const filePath = path.join(__dirname, 'orders.json');
    if (!fs.existsSync(filePath)) return res.json([]);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json([]);
        res.json(JSON.parse(data || '[]'));
    });
});

// POST Orders Route (Data save karne ke liye)
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

// Static Files & Server Start
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});