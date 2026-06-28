require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pradh_db';

// Define Order Schema
const orderSchema = new mongoose.Schema({
    id: String,
    order_id: String,
    payment_id: String,
    status: String,
    date: Date,
    items: Array,
    total: Number,
    deliveryCharge: Number,
    coupon: String,
    discount: Number,
    customer: Object,
    cancellation_reason: String,
    cancelled_at: Date,
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

async function addSampleOrders() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Clear existing orders
        await Order.deleteMany({});
        console.log('✅ Cleared existing orders\n');

        const orders = [
            {
                id: 'ORD1001',
                order_id: 'order_1a2b3c4d',
                payment_id: 'pay_abcd1234',
                status: 'delivered',
                date: new Date('2026-06-18T10:30:00'),
                items: [
                    { id: 'PROD002', name: 'PRADH Desi Fuel (500g)', price: 599, quantity: 2 },
                    { id: 'PROD001', name: 'PRADH Desi Fuel (250g)', price: 349, quantity: 1 }
                ],
                total: 1547,
                deliveryCharge: 0,
                coupon: 'DESIFUEL10',
                discount: 10,
                customer: {
                    name: 'Rahul Sharma',
                    phone: '9876543210',
                    email: 'rahul@gmail.com',
                    address: '123, Main Street, Delhi',
                    city: 'Delhi',
                    pincode: '110001',
                    paymentMethod: 'card'
                },
                createdAt: new Date('2026-06-18T10:30:00')
            },
            {
                id: 'ORD1002',
                order_id: 'order_2b3c4d5e',
                payment_id: 'pay_bcde2345',
                status: 'shipped',
                date: new Date('2026-06-20T14:20:00'),
                items: [
                    { id: 'PROD003', name: 'PRADH Desi Fuel (1 KG)', price: 1099, quantity: 2 }
                ],
                total: 2198,
                deliveryCharge: 0,
                coupon: null,
                discount: 0,
                customer: {
                    name: 'Priya Singh',
                    phone: '9876543211',
                    email: 'priya@gmail.com',
                    address: '456, Park Avenue, Mumbai',
                    city: 'Mumbai',
                    pincode: '400001',
                    paymentMethod: 'upi'
                },
                createdAt: new Date('2026-06-20T14:20:00')
            },
            {
                id: 'ORD1003',
                order_id: 'order_3c4d5e6f',
                payment_id: 'pay_cdef3456',
                status: 'pending',
                date: new Date('2026-06-22T09:15:00'),
                items: [
                    { id: 'PROD001', name: 'PRADH Desi Fuel (250g)', price: 349, quantity: 3 }
                ],
                total: 1047,
                deliveryCharge: 49,
                coupon: 'WELCOME20',
                discount: 20,
                customer: {
                    name: 'Amit Verma',
                    phone: '9876543212',
                    email: 'amit@gmail.com',
                    address: '789, Lake Road, Bangalore',
                    city: 'Bangalore',
                    pincode: '560001',
                    paymentMethod: 'netbanking'
                },
                createdAt: new Date('2026-06-22T09:15:00')
            },
            {
                id: 'ORD1004',
                order_id: 'order_4d5e6f7g',
                payment_id: 'pay_defg4567',
                status: 'delivered',
                date: new Date('2026-06-23T16:45:00'),
                items: [
                    { id: 'PROD003', name: 'PRADH Desi Fuel (1 KG)', price: 1099, quantity: 1 },
                    { id: 'PROD002', name: 'PRADH Desi Fuel (500g)', price: 599, quantity: 1 }
                ],
                total: 1698,
                deliveryCharge: 0,
                coupon: null,
                discount: 0,
                customer: {
                    name: 'Neha Gupta',
                    phone: '9876543213',
                    email: 'neha@gmail.com',
                    address: '101, Green Park, Chennai',
                    city: 'Chennai',
                    pincode: '600001',
                    paymentMethod: 'card'
                },
                createdAt: new Date('2026-06-23T16:45:00')
            },
            {
                id: 'ORD1005',
                order_id: 'order_5e6f7g8h',
                payment_id: 'pay_efgh5678',
                status: 'cancelled',
                date: new Date('2026-06-24T11:30:00'),
                items: [
                    { id: 'PROD002', name: 'PRADH Desi Fuel (500g)', price: 599, quantity: 2 }
                ],
                total: 1198,
                deliveryCharge: 0,
                coupon: 'DESIFUEL10',
                discount: 10,
                customer: {
                    name: 'Vikram Singh',
                    phone: '9876543214',
                    email: 'vikram@gmail.com',
                    address: '202, Lake View, Hyderabad',
                    city: 'Hyderabad',
                    pincode: '500001',
                    paymentMethod: 'upi'
                },
                cancellation_reason: 'Customer requested cancellation - changed mind',
                cancelled_at: new Date('2026-06-24T12:00:00'),
                createdAt: new Date('2026-06-24T11:30:00')
            },
            {
                id: 'ORD1006',
                order_id: 'order_6f7g8h9i',
                payment_id: 'pay_fghi6789',
                status: 'paid',
                date: new Date('2026-06-25T08:00:00'),
                items: [
                    { id: 'PROD001', name: 'PRADH Desi Fuel (250g)', price: 349, quantity: 2 },
                    { id: 'PROD003', name: 'PRADH Desi Fuel (1 KG)', price: 1099, quantity: 1 }
                ],
                total: 1797,
                deliveryCharge: 0,
                coupon: null,
                discount: 0,
                customer: {
                    name: 'Pooja Mehta',
                    phone: '9876543215',
                    email: 'pooja@gmail.com',
                    address: '404, Park Street, Jaipur',
                    city: 'Jaipur',
                    pincode: '302001',
                    paymentMethod: 'card'
                },
                createdAt: new Date('2026-06-25T08:00:00')
            },
            {
                id: 'ORD1007',
                order_id: 'order_7g8h9i0j',
                payment_id: 'pay_ghij7890',
                status: 'shipped',
                date: new Date('2026-06-26T12:15:00'),
                items: [
                    { id: 'PROD002', name: 'PRADH Desi Fuel (500g)', price: 599, quantity: 3 }
                ],
                total: 1797,
                deliveryCharge: 0,
                coupon: 'WELCOME20',
                discount: 20,
                customer: {
                    name: 'Arjun Patel',
                    phone: '9876543216',
                    email: 'arjun@gmail.com',
                    address: '505, Stadium Road, Ahmedabad',
                    city: 'Ahmedabad',
                    pincode: '380001',
                    paymentMethod: 'netbanking'
                },
                createdAt: new Date('2026-06-26T12:15:00')
            }
        ];

        // Insert orders
        await Order.insertMany(orders);
        console.log(`✅ ${orders.length} sample orders added!\n`);

        // Show summary
        console.log('📋 Order Summary:');
        console.log('─────────────────────────────────');
        orders.forEach(o => {
            const emoji = {
                'delivered': '✅',
                'shipped': '📦',
                'pending': '⏳',
                'paid': '💳',
                'cancelled': '❌'
            };
            console.log(`${emoji[o.status] || '📋'} ${o.id} | ${o.customer.name} | ₹${o.total} | ${o.status}`);
        });

        console.log('\n📊 Status Summary:');
        const statusCount = {};
        orders.forEach(o => {
            statusCount[o.status] = (statusCount[o.status] || 0) + 1;
        });
        Object.keys(statusCount).forEach(s => {
            console.log(`   ${s}: ${statusCount[s]} orders`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addSampleOrders();
