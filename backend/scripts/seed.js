/**
 * Database Seed Script
 * Populates MongoDB with restaurant and menu data for both Swiggy and Zomato
 * 
 * Usage: node scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// Import static data
const swiggyRestaurants = require('../data/restaurant');
const swiggyMenu = require('../data/menu');
const zomatoRestaurants = require('../data/zomatoRestaurant');
const zomatoMenu = require('../data/zomatoMenu');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://biteUser:xX8Lvf37Fl7tR39q@cluster0.tpgtmxh.mongodb.net/bitezon';

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('✅ Cleared existing restaurants and menu items');

    // Seed Swiggy Restaurants
    console.log('\n🟧 Seeding Swiggy restaurants...');
    const swiggyRestaurantDocs = swiggyRestaurants.map(r => ({
      restaurantId: r.id,
      platform: 'swiggy',
      name: r.name,
      city: r.city,
      rating: r.rating,
      deliveryTime: r.deliveryTime,
      cuisines: r.cuisines,
      image: r.image,
      isVeg: r.isVeg,
      offers: r.offers,
      costForTwo: r.costForTwo || 300,
      promoted: r.promoted || false
    }));
    await Restaurant.insertMany(swiggyRestaurantDocs);
    console.log(`✅ Inserted ${swiggyRestaurantDocs.length} Swiggy restaurants`);

    // Seed Zomato Restaurants
    console.log('\n🔴 Seeding Zomato restaurants...');
    const zomatoRestaurantDocs = zomatoRestaurants.map(r => ({
      restaurantId: r.id,
      platform: 'zomato',
      name: r.name,
      city: r.city,
      rating: r.rating,
      deliveryTime: r.deliveryTime,
      cuisines: r.cuisines,
      image: r.image,
      isVeg: r.isVeg,
      offers: r.offers,
      costForTwo: r.costForTwo || 300,
      promoted: r.promoted || false
    }));
    await Restaurant.insertMany(zomatoRestaurantDocs);
    console.log(`✅ Inserted ${zomatoRestaurantDocs.length} Zomato restaurants`);

    // Seed Swiggy Menu Items
    console.log('\n🟧 Seeding Swiggy menu items...');
    const swiggyMenuDocs = swiggyMenu.map(m => ({
      itemId: m.id,
      platform: 'swiggy',
      restaurantId: m.restaurantId,
      itemName: m.itemName,
      price: m.price,
      category: m.category,
      isVeg: m.isVeg,
      image: m.image,
      description: m.description || '',
      available: true
    }));
    await MenuItem.insertMany(swiggyMenuDocs);
    console.log(`✅ Inserted ${swiggyMenuDocs.length} Swiggy menu items`);

    // Seed Zomato Menu Items
    console.log('\n🔴 Seeding Zomato menu items...');
    const zomatoMenuDocs = zomatoMenu.map(m => ({
      itemId: m.id,
      platform: 'zomato',
      restaurantId: m.restaurantId,
      itemName: m.itemName,
      price: m.price,
      category: m.category,
      isVeg: m.isVeg,
      image: m.image,
      description: m.description || '',
      available: true
    }));
    await MenuItem.insertMany(zomatoMenuDocs);
    console.log(`✅ Inserted ${zomatoMenuDocs.length} Zomato menu items`);

    // Summary
    console.log('\n📊 Seed Summary:');
    console.log('━'.repeat(40));
    const totalRestaurants = await Restaurant.countDocuments();
    const totalMenuItems = await MenuItem.countDocuments();
    const swiggyRestaurantCount = await Restaurant.countDocuments({ platform: 'swiggy' });
    const zomatoRestaurantCount = await Restaurant.countDocuments({ platform: 'zomato' });
    const swiggyMenuCount = await MenuItem.countDocuments({ platform: 'swiggy' });
    const zomatoMenuCount = await MenuItem.countDocuments({ platform: 'zomato' });

    console.log(`Total Restaurants: ${totalRestaurants}`);
    console.log(`  - Swiggy: ${swiggyRestaurantCount}`);
    console.log(`  - Zomato: ${zomatoRestaurantCount}`);
    console.log(`Total Menu Items: ${totalMenuItems}`);
    console.log(`  - Swiggy: ${swiggyMenuCount}`);
    console.log(`  - Zomato: ${zomatoMenuCount}`);
    console.log('━'.repeat(40));
    console.log('\n✅ Database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
