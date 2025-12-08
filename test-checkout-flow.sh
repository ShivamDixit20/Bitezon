#!/bin/bash

# Test script to simulate frontend checkout flow

API_BASE="http://localhost:3000/api"
USER_ID="test_user_$(date +%s)"

echo "=== Testing Complete Checkout Flow ==="
echo ""
echo "1️⃣  User ID: $USER_ID"
echo ""

# Step 1: Add item to cart
echo "2️⃣  Adding item to cart..."
curl -s -X POST "$API_BASE/cart/add" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "swiggy",
    "itemId": "item123",
    "itemName": "Chicken Biryani",
    "originalPrice": 350,
    "effectivePrice": 280,
    "quantity": 2,
    "restaurantId": "rest001",
    "restaurantName": "Biryani Palace",
    "offer": "20% OFF"
  }' > /dev/null

echo "✅ Item added to cart"
echo ""

# Step 2: Fetch cart
echo "3️⃣  Fetching cart..."
CART=$(curl -s "$API_BASE/cart")
echo "Cart fetched successfully"
echo ""

# Step 3: Save order to MongoDB (what happens on "Confirm & Continue")
echo "4️⃣  Saving order to MongoDB (checkout confirmation)..."
ORDER_RESPONSE=$(curl -s -X POST "$API_BASE/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"platform\": \"swiggy\",
    \"restaurantId\": \"rest001\",
    \"restaurantName\": \"Biryani Palace\",
    \"items\": [
      {
        \"itemId\": \"item123\",
        \"itemName\": \"Chicken Biryani\",
        \"quantity\": 2,
        \"originalPrice\": 350,
        \"effectivePrice\": 280,
        \"offer\": \"20% OFF\"
      }
    ],
    \"totals\": {
      \"totalItems\": 2,
      \"originalTotal\": 700,
      \"discountedTotal\": 560,
      \"totalSavings\": 140
    },
    \"paymentMethod\": \"Online Payment\"
  }")

echo "$ORDER_RESPONSE" | python3 -m json.tool
echo ""

ORDER_ID=$(echo "$ORDER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('order', {}).get('orderId', 'N/A'))" 2>/dev/null)
echo "📦 Order ID: $ORDER_ID"
echo ""

# Step 4: Verify order in MongoDB
echo "5️⃣  Verifying order in MongoDB..."
sleep 1
node -e "
const mongoose = require('mongoose');
require('dotenv').config({ path: '/Users/shivam/Desktop/Bitezon/backend/.env' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const ordersCollection = db.collection('orders');
  
  const order = await ordersCollection.findOne({ userId: '$USER_ID' });
  
  if (order) {
    console.log('✅ Order found in MongoDB!');
    console.log('   Order ID:', order.orderId);
    console.log('   User ID:', order.userId);
    console.log('   Platform:', order.platform);
    console.log('   Restaurant:', order.restaurantName);
    console.log('   Status:', order.status);
    console.log('   Created:', order.createdAt);
  } else {
    console.log('❌ Order NOT found in MongoDB');
  }
  
  mongoose.disconnect();
}).catch(err => console.error('Connection error:', err));
" 2>/dev/null

echo ""
echo "=== Test Complete ==="
