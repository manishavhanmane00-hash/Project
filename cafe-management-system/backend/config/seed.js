/**
 * Seed Script
 * Run: node config/seed.js
 * Seeds admin user and initial menu items into MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const connectDB = require('./db');

const menuData = [
  {
    category: 'Pizza',
    icon: '🍕',
    description: 'Freshly baked pizzas with premium toppings',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    subItems: [
      { name: 'Paneer Pizza', description: 'Loaded with fresh paneer and bell peppers', price: 249, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300' },
      { name: 'Veg Pizza', description: 'Classic veggie delight with mixed vegetables', price: 199, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' },
      { name: 'Cheese Pizza', description: 'Double cheese with rich tomato sauce', price: 229, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300' },
      { name: 'Corn Pizza', description: 'Sweet corn and cheese on crispy base', price: 219, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300' },
      { name: 'Veg Cheese Pizza', description: 'Vegetables with extra cheese blend', price: 259, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' },
    ],
  },
  {
    category: 'Burger',
    icon: '🍔',
    description: 'Juicy burgers stacked to perfection',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    subItems: [
      { name: 'Veg Burger', description: 'Crispy veggie patty with fresh lettuce', price: 129, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
      { name: 'Paneer Burger', description: 'Spiced paneer patty with mayo sauce', price: 149, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300' },
      { name: 'Aloo Tikki Burger', description: 'Classic street-style aloo tikki burger', price: 99, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
      { name: 'Cheese Burger', description: 'Double cheese slice with crunchy patty', price: 159, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300' },
    ],
  },
  {
    category: 'Coffee',
    icon: '☕',
    description: 'Freshly brewed coffees from premium beans',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    subItems: [
      { name: 'Espresso', description: 'Strong and bold single shot espresso', price: 79, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300' },
      { name: 'Cappuccino', description: 'Equal parts espresso, steamed milk, and foam', price: 119, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300' },
      { name: 'Cold Coffee', description: 'Chilled blend of coffee and cream', price: 139, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300' },
      { name: 'Latte', description: 'Smooth espresso with velvety steamed milk', price: 129, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300' },
      { name: 'Mocha', description: 'Rich chocolate-coffee fusion with whipped cream', price: 149, image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=300' },
    ],
  },
  {
    category: 'Beverages',
    icon: '🥤',
    description: 'Refreshing drinks for every mood',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
    subItems: [
      { name: 'Fresh Lime Soda', description: 'Sparkling lime with mint and salt', price: 69, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300' },
      { name: 'Mango Lassi', description: 'Thick mango yogurt drink', price: 89, image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=300' },
      { name: 'Masala Chai', description: 'Traditional spiced Indian tea', price: 49, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300' },
      { name: 'Strawberry Shake', description: 'Creamy fresh strawberry milkshake', price: 129, image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300' },
      { name: 'Virgin Mojito', description: 'Mint, lime, and soda refresher', price: 99, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300' },
    ],
  },
  {
    category: 'Snacks',
    icon: '🍟',
    description: 'Light bites and crunchy snacks',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    subItems: [
      { name: 'French Fries', description: 'Golden crispy fries with ketchup', price: 89, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300' },
      { name: 'Garlic Bread', description: 'Toasted garlic butter bread with herbs', price: 79, image: 'https://images.unsplash.com/photo-1588161082870-4c26e7c73e94?w=300' },
      { name: 'Nachos', description: 'Crispy nachos with salsa and cheese dip', price: 119, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300' },
      { name: 'Spring Rolls', description: 'Crispy vegetable spring rolls with sauce', price: 99, image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300' },
      { name: 'Peri Peri Wings', description: 'Spicy peri peri glazed chicken wings', price: 159, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=300' },
    ],
  },
  {
    category: 'Desserts',
    icon: '🍰',
    description: 'Sweet treats to end your meal',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400',
    subItems: [
      { name: 'Chocolate Brownie', description: 'Warm fudgy brownie with vanilla ice cream', price: 129, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300' },
      { name: 'Gulab Jamun', description: 'Soft milk solids soaked in rose syrup', price: 79, image: 'https://images.unsplash.com/photo-1601303516534-bf84f6e6f41c?w=300' },
      { name: 'Ice Cream (2 scoops)', description: 'Choice of vanilla, chocolate, or strawberry', price: 99, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300' },
      { name: 'Cheesecake Slice', description: 'Creamy New York style cheesecake', price: 149, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300' },
    ],
  },
];

const seedDB = async () => {
  try {
    await connectDB();

    // --- Seed Admin User ---
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!existingAdmin) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Cafe Admin',
        email: process.env.ADMIN_EMAIL || 'admin@cafe.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'admin',
      });
      console.log('✅ Admin user created:', process.env.ADMIN_EMAIL);
    } else {
      console.log('ℹ️  Admin user already exists, skipping.');
    }

    // --- Seed Menu Items ---
    await MenuItem.deleteMany({}); // Clear existing menu
    await MenuItem.insertMany(menuData);
    console.log(`✅ Menu seeded with ${menuData.length} categories`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('📧 Admin Email:', process.env.ADMIN_EMAIL || 'admin@cafe.com');
    console.log('🔑 Admin Password:', process.env.ADMIN_PASSWORD || 'Admin@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    process.exit(1);
  }
};

seedDB();
