## Order API Documentation

The Order API has been updated to use MongoDB for persistent storage of all orders.

### Order Model Schema

```javascript
{
  orderId: String (unique),
  userId: ObjectId (reference to User),
  platform: String (enum: 'swiggy', 'zomato'),
  restaurantId: String,
  restaurantName: String,
  items: [
    {
      itemId: String,
      itemName: String,
      quantity: Number,
      originalPrice: Number,
      effectivePrice: Number,
      offer: String
    }
  ],
  totals: {
    totalItems: Number,
    originalTotal: Number,
    discountedTotal: Number,
    totalSavings: Number
  },
  paymentMethod: String (default: 'Not specified'),
  status: String (enum: 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'),
  orderDate: Date (auto),
  estimatedDelivery: Date,
  deliveredAt: Date (optional),
  notes: String,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Endpoints

#### 1. Save Order (Create)
**POST** `/api/orders`

Save a new order to the database when checkout is confirmed.

**Request Body:**
```json
{
  "userId": "user_id_from_token",
  "platform": "swiggy" or "zomato",
  "restaurantId": "restaurant_id",
  "restaurantName": "Restaurant Name",
  "items": [
    {
      "itemId": "item_id",
      "itemName": "Item Name",
      "quantity": 2,
      "originalPrice": 150,
      "effectivePrice": 120,
      "offer": "20% OFF"
    }
  ],
  "totals": {
    "totalItems": 2,
    "originalTotal": 300,
    "discountedTotal": 240,
    "totalSavings": 60
  },
  "paymentMethod": "Online Payment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order saved to history",
  "order": {
    "_id": "mongo_object_id",
    "orderId": "unique_order_id",
    "userId": "user_id",
    "platform": "swiggy",
    "restaurantId": "rest_id",
    "restaurantName": "Restaurant Name",
    "items": [...],
    "totals": {...},
    "status": "confirmed",
    "orderDate": "2024-12-08T12:34:56Z",
    "estimatedDelivery": "2024-12-08T13:09:56Z",
    "createdAt": "2024-12-08T12:34:56Z",
    "updatedAt": "2024-12-08T12:34:56Z"
  }
}
```

#### 2. Get Order History
**GET** `/api/orders?userId=user_id&platform=swiggy&limit=50`

Fetch all orders for a specific user with optional filtering.

**Query Parameters:**
- `userId` (required): User ID from authentication token
- `platform` (optional): Filter by 'swiggy' or 'zomato'
- `limit` (optional): Number of orders to fetch (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "totalOrders": 5,
  "orders": [
    {
      "_id": "mongo_id",
      "orderId": "order_id",
      "userId": "user_id",
      "platform": "swiggy",
      "restaurantName": "Restaurant",
      "status": "confirmed",
      "orderDate": "2024-12-08T12:34:56Z",
      "totals": {...},
      "items": [...]
    }
  ]
}
```

#### 3. Get Specific Order
**GET** `/api/orders/:orderId`

Fetch details of a specific order by its ID.

**Response:**
```json
{
  "success": true,
  "order": {
    "_id": "mongo_id",
    "orderId": "order_id",
    "userId": "user_id",
    "platform": "swiggy",
    "restaurantName": "Restaurant",
    "status": "confirmed",
    "orderDate": "2024-12-08T12:34:56Z",
    "estimatedDelivery": "2024-12-08T13:09:56Z",
    "totals": {...},
    "items": [...]
  }
}
```

#### 4. Update Order Status
**PATCH** `/api/orders/:orderId/status`

Update the status of an order (for order tracking).

**Request Body:**
```json
{
  "status": "preparing"
}
```

**Valid Statuses:**
- `confirmed` - Order confirmed
- `preparing` - Being prepared
- `out-for-delivery` - Out for delivery
- `delivered` - Delivered
- `cancelled` - Cancelled

**Response:**
```json
{
  "success": true,
  "message": "Order status updated to preparing",
  "order": {
    "_id": "mongo_id",
    "orderId": "order_id",
    "status": "preparing",
    "updatedAt": "2024-12-08T12:40:00Z",
    "deliveredAt": null
  }
}
```

#### 5. Delete Order
**DELETE** `/api/orders/:orderId`

Delete an order from the database.

**Response:**
```json
{
  "success": true,
  "message": "Order deleted successfully",
  "order": {
    "_id": "mongo_id",
    "orderId": "order_id",
    "restaurantName": "Restaurant",
    "platform": "swiggy"
  }
}
```

### Checkout with Order Saving
**POST** `/api/cart/checkout`

**Request Body:**
```json
{
  "platform": "swiggy",
  "userId": "user_id",
  "saveOrder": true
}
```

If `saveOrder` is `true`, the order will automatically be saved to MongoDB when checkout is processed.

**Response:**
```json
{
  "success": true,
  "message": "Redirecting to swiggy for payment",
  "checkout": {
    "platform": "swiggy",
    "redirectUrl": "swiggy://restaurant/123",
    "webUrl": "https://www.swiggy.com/restaurants/123",
    "appScheme": "swiggy://",
    "orderSummary": {
      "platform": "swiggy",
      "restaurant": {...},
      "items": [...],
      "totals": {...},
      "createdAt": "2024-12-08T12:34:56Z"
    }
  },
  "savedOrder": {
    "_id": "mongo_id",
    "orderId": "unique_order_id",
    "status": "confirmed",
    ...
  }
}
```

### Error Responses

**Missing Required Fields:**
```json
{
  "success": false,
  "message": "User ID is required"
}
```

**Order Not Found:**
```json
{
  "success": false,
  "message": "Order not found"
}
```

**Invalid Status:**
```json
{
  "success": false,
  "message": "Invalid status. Must be one of: confirmed, preparing, out-for-delivery, delivered, cancelled"
}
```

### Integration with Frontend

When user confirms an order in the checkout flow:

1. Call `/api/cart/checkout` with `saveOrder: true` and valid `userId`
2. The order is automatically saved to MongoDB
3. Clear the cart after successful checkout
4. Redirect user to order history to view saved orders

**Example Frontend Integration:**

```javascript
const handleCheckout = async (platform) => {
  const response = await fetch('http://localhost:3000/api/cart/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform,
      userId: user._id,
      saveOrder: true
    })
  });
  
  const result = await response.json();
  
  if (result.success && result.savedOrder) {
    console.log('Order saved:', result.savedOrder);
    // Redirect to order history
  }
};
```

### Database Indexes

The Order model has the following indexes for optimal query performance:

- `orderId` (unique): For fetching specific orders
- `userId` (indexed): For user's order history queries
- `userId + orderDate` (compound): For sorting user's orders by date
- `platform + orderDate` (compound): For filtering orders by platform and date

### Notes

- All timestamps are stored in UTC (ISO 8601 format)
- Order IDs are generated using nanoid (12 characters)
- Estimated delivery time is set to 35 minutes from order confirmation
- Orders are soft-deleted (can be physically deleted if needed)
- User authentication token is required for all operations via userId
