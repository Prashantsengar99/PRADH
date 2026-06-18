const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8000; // Render ke liye dynamic port

// Middleware
app.use(cors());
app.use(express.json());

const DATA_FILE = './data.json';

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
    const { name, phone, address, pincode, payment, cart, totalAmount } = req.body;

    if (!name || !phone || !address || !pincode) {
        return res.status(400).json({ message: "Bhai saari details bharna zaroori hai!" });
    }

    const newOrder = {
        id: Date.now(),
        name, phone, address, pincode, payment, cart, totalAmount,
        date: new Date().toLocaleString(),
        status: "Placed" // Default status
    };

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
});

app.listen(PORT, () => {
    console.log(`Pradh Desi Fuel server running on port ${PORT}`);
});