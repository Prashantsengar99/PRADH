#!/bin/bash

echo "🚀 Setting up MongoDB Atlas..."

# Install mongoose
npm install mongoose

# Create .env file
cat > .env << 'ENV'
# Razorpay Keys
RAZORPAY_KEY_ID=rzp_live_T4HPQRHmf5mAUo
RAZORPAY_KEY_SECRET=OBQO4KNOf52s1UhbA7eANbIo

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://thakurprashant9720_db_user:XuMMABvnGjaDAtR1@cluster0.6iy4h4f.mongodb.net/pradh_db?retryWrites=true&w=majority
ENV

echo "✅ .env file created"

# Test connection
echo "🔍 Testing connection..."
node test-mongodb.js

echo "✅ Setup complete!"
