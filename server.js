const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const DATA_FILE = './data.json';

// 1. Saare orders dekhne ke liye API
app.get('/api/orders', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: "Error reading data" });
        res.json(JSON.parse(data || '[]'));
    });
});

// 2. Naya order cart ke sath save karne ke liye API (Purane ko hata kar yeh naya rakha hai)
app.post('/api/orders', (req, res) => {
    const { name, phone, address, pincode, payment, cart, totalAmount } = req.body;

    if (!name || !phone || !address || !pincode) {
        return res.status(400).json({ message: "Bhai saari details bharna zaroori hai!" });
    }

    const newOrder = {
        id: Date.now(),
        name,
        phone,
        address,
        pincode,
        payment,
        cart,         // Isme poora cart ka array save hoga
        totalAmount,  // Isme total paise save honge
        date: new Date().toLocaleString()
    };

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        let orders = [];
        if (!err && data) orders = JSON.parse(data);
        orders.push(newOrder);

        fs.writeFile(DATA_FILE, JSON.stringify(orders, null, 2), (err) => {
            if (err) return res.status(500).json({ message: "Error saving order" });
            res.status(201).json({ message: "Order data saved successfully!", order: newOrder });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Pradh Desi Fuel server running on http://localhost:${PORT}`);
});