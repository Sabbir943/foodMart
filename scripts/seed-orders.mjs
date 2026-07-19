import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";

// Basic .env file parser to run standalone on Node
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      process.env[key] = val;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not set in .env");
  process.exit(1);
}

async function seed() {
  try {
    console.log("Connecting to database at:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    // 1. Clean existing seed data to prevent duplicate keys/bloat
    console.log("Cleaning old seed records...");
    const customerEmail = "john.doe@example.com";
    const vendorEmail = "vendor@pizzahouse.com";
    const riderEmail = "rider@foodmart.com";
    const adminEmail = "admin@foodmart.com";

    const customerUser = await User.findOne({ email: customerEmail });
    if (customerUser) {
      await Order.deleteMany({ customerId: customerUser._id });
      await Review.deleteMany({ customerId: customerUser._id });
      await User.deleteOne({ _id: customerUser._id });
    }

    const vendorUser = await User.findOne({ email: vendorEmail });
    if (vendorUser) {
      const rest = await Restaurant.findOne({ ownerId: vendorUser._id });
      if (rest) {
        await MenuItem.deleteMany({ restaurantId: rest._id });
        await Restaurant.deleteOne({ _id: rest._id });
      }
      await User.deleteOne({ _id: vendorUser._id });
    }

    const riderUser = await User.findOne({ email: riderEmail });
    if (riderUser) {
      const Rider = (await import("../models/Rider.js")).default;
      await Rider.deleteMany({ userId: riderUser._id });
      await User.deleteOne({ _id: riderUser._id });
    }

    await User.deleteOne({ email: adminEmail });

    const Coupon = (await import("../models/Coupon.js")).default;
    await Coupon.deleteMany({ code: { $in: ["SAVE10", "PIZZA20"] } });

    // 2. Create customer user
    console.log("Creating customer user...");
    const customer = await User.create({
      name: "John Doe",
      email: customerEmail,
      phone: "+1234567890",
      passwordHash: "$2b$10$mockedpasswordhashval",
      role: "customer",
      addresses: [
        {
          label: "Home",
          street: "123 Main Street",
          city: "Dhaka",
          district: "Dhaka",
          postalCode: "1212",
          instructions: "Leave at front door",
        },
        {
          label: "Office",
          street: "456 Corporate Boulevard",
          city: "Dhaka",
          district: "Dhaka",
          postalCode: "1208",
          instructions: "Give to reception on 4th floor",
        },
      ],
    });

    // 3. Create vendor user
    console.log("Creating vendor user...");
    const vendor = await User.create({
      name: "Pizza House Owner",
      email: vendorEmail,
      phone: "+1987654321",
      passwordHash: "$2b$10$mockedpasswordhashval",
      role: "vendor",
    });

    // 3b. Create rider user and profile
    console.log("Creating rider user...");
    const rider = await User.create({
      name: "Fast Rider",
      email: riderEmail,
      phone: "+1555555555",
      passwordHash: "$2b$10$mockedpasswordhashval",
      role: "rider",
    });
    
    const RiderModel = (await import("../models/Rider.js")).default;
    await RiderModel.create({
      userId: rider._id,
      vehicleType: "motorcycle",
      isAvailable: true,
      currentLocation: {
        type: "Point",
        coordinates: [90.4125, 23.8103],
      },
      rating: 4.8,
    });

    // 3c. Create admin user
    console.log("Creating admin user...");
    await User.create({
      name: "System Admin",
      email: adminEmail,
      phone: "+18005550199",
      passwordHash: "$2b$10$mockedpasswordhashval",
      role: "admin",
      isBlocked: false,
    });

    // 3d. Create Coupons
    console.log("Creating coupons...");
    await Coupon.create([
      {
        code: "SAVE10",
        discountType: "flat",
        discountValue: 10,
        minOrderAmount: 30,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
      },
      {
        code: "PIZZA20",
        discountType: "percent",
        discountValue: 20,
        minOrderAmount: 20,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
      }
    ]);

    // 4. Create Restaurant
    console.log("Creating restaurant...");
    const restaurant = await Restaurant.create({
      name: "Pizza House",
      ownerId: vendor._id,
      description: "Authentic wood-fired pizzas and fresh Italian pasta.",
      logoUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&h=150&fit=crop",
      category: "Italian",
      address: {
        street: "79 Gulshan Avenue",
        city: "Dhaka",
        district: "Dhaka",
        postalCode: "1212",
      },
      location: {
        type: "Point",
        coordinates: [90.4152, 23.7936], // [longitude, latitude]
      },
      operatingHours: [
        { day: "mon", open: "10:00", close: "23:00" },
        { day: "tue", open: "10:00", close: "23:00" },
        { day: "wed", open: "10:00", close: "23:00" },
        { day: "thu", open: "10:00", close: "23:00" },
        { day: "fri", open: "11:00", close: "23:30" },
        { day: "sat", open: "10:00", close: "23:30" },
        { day: "sun", open: "10:00", close: "23:00" },
      ],
      isApproved: true,
      isOpen: true,
      rating: 4.5,
    });

    // 5. Create Menu Items
    console.log("Creating menu items...");
    const item1 = await MenuItem.create({
      restaurantId: restaurant._id,
      name: "Margherita Pizza",
      description: "Simple beauty: tomato sauce, fresh mozzarella, fresh basil, extra virgin olive oil.",
      price: 12.99,
      imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
      category: "Pizza",
      isAvailable: true,
      variants: [
        { name: "Regular 9\"", priceModifier: 0, isAvailable: true },
        { name: "Large 12\"", priceModifier: 5.0, isAvailable: true },
      ],
    });

    const item2 = await MenuItem.create({
      restaurantId: restaurant._id,
      name: "Spicy Pepperoni Pizza",
      description: "Loaded with double pepperoni, jalapenos, chili flakes, and hot honey drizzle.",
      price: 15.49,
      imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop",
      category: "Pizza",
      isAvailable: true,
      variants: [
        { name: "Regular 9\"", priceModifier: 0, isAvailable: true },
        { name: "Large 12\"", priceModifier: 6.0, isAvailable: true },
      ],
    });

    const item3 = await MenuItem.create({
      restaurantId: restaurant._id,
      name: "Cheesy Garlic Bread",
      description: "Freshly baked artisan bread brushed with garlic butter and melted mozzarella.",
      price: 5.99,
      imageUrl: "https://images.unsplash.com/photo-1544982503-9f984c14501a?w=400&h=300&fit=crop",
      category: "Sides",
      isAvailable: true,
    });

    // 6. Create Dummy Orders
    console.log("Creating dummy orders...");

    // Order 1: Active Order (Preparing)
    await Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      items: [
        {
          menuItemId: item1._id,
          qty: 1,
          price: 12.99,
          variant: 'Large 12"',
        },
        {
          menuItemId: item3._id,
          qty: 2,
          price: 5.99,
        },
      ],
      status: "preparing",
      totalAmount: 29.97, // simple total
      deliveryAddress: customer.addresses[0], // Home
      paymentStatus: "pending",
      paymentMethod: "cash",
      statusTimestamps: {
        placed: new Date(Date.now() - 30 * 60000), // 30 mins ago
        confirmed: new Date(Date.now() - 25 * 60000), // 25 mins ago
        preparing: new Date(Date.now() - 20 * 60000), // 20 mins ago
      },
    });

    // Order 2: Completed Order (Delivered, not yet reviewed)
    await Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      items: [
        {
          menuItemId: item2._id,
          qty: 2,
          price: 15.49,
          variant: 'Regular 9"',
        },
      ],
      status: "delivered",
      totalAmount: 35.98,
      deliveryAddress: customer.addresses[1], // Office
      paymentStatus: "paid",
      paymentMethod: "card",
      statusTimestamps: {
        placed: new Date(Date.now() - 120 * 60000),
        confirmed: new Date(Date.now() - 115 * 60000),
        preparing: new Date(Date.now() - 100 * 60000),
        out_for_delivery: new Date(Date.now() - 80 * 60000),
        delivered: new Date(Date.now() - 60 * 60000),
      },
    });

    // Order 3: Cancelled Order
    await Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      items: [
        {
          menuItemId: item3._id,
          qty: 1,
          price: 5.99,
        },
      ],
      status: "cancelled",
      totalAmount: 10.99,
      deliveryAddress: customer.addresses[0],
      paymentStatus: "failed",
      paymentMethod: "mobile_banking",
      statusTimestamps: {
        placed: new Date(Date.now() - 180 * 60000),
        cancelled: new Date(Date.now() - 175 * 60000),
      },
    });

    console.log("Successfully seeded database with dummy orders!");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

seed();
