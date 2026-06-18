const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8000; // Render ke liye dynamic port

// Middleware
app.use(cors());
app.options('*', cors()); // Yeh browsers ki "Preflight" check ko pass kar dega
app.use(express.json());

const DATA_FILE = './data.json';
// Middleware ke turant baad ye daal do
app.options('*', cors());

// Root Route
app.get('/', (req, res) => {
    res.send('PRADH Backend is Live and Running!');
});

// 1. Saare orders dekhne ke liye API
app.get('/api/orders', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: "Error reading data" });
        res.json(JSON.parse(data || '[]'));
    });
});

// 2. Naya order save karne ke liye API
app.post('/api/orders', (req, res) => {
    console.log("Server ko request mili!", req.body);
    const { name, phone, address, pincode, payment, cart, totalAmount } = req.body;

    if (!name || !phone || !address || !pincode) {
        return res.status(400).json({ message: "Bhai saari details bharna zaroori hai!" });
    }

    // --- DATA SAVE LOGIC ---
    const newOrder = {
        id: Date.now(), // Unique ID
        name, phone, address, pincode, payment, cart, totalAmount,
        date: new Date().toLocaleString()
    };

    // Yahan hum file mein save kar rahe hain (ya array mein)
    // Agar tum "orders.json" use kar rahe ho toh:
    const orders = JSON.parse(fs.readFileSync('orders.json', 'utf8') || '[]');
    orders.push(newOrder);
    fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));

    res.status(201).json({ message: "Order saved!", order: newOrder });
});

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        let orders = [];
        try {
            if (!err && data) orders = JSON.parse(data);
        } catch (e) {
            orders = [];
        }
        
        orders.push(newOrder);

        fs.writeFile(DATA_FILE, JSON.stringify(orders, null, 2), (err) => {
            if (err) return res.status(500).json({ message: "Error saving order" });
            res.status(201).json({ message: "Order data saved successfully!", order: newOrder });
        });
    });
;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pradh Desi Fuel server running on port ${PORT}`);
});